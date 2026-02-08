
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

import { SelectionStatus } from '@prisma/client';

export async function selectMentor(mentorId: string, rank: number) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { menteeProfile: true },
    });

    if (!user || user.role !== 'MENTEE' || !user.menteeProfile) {
        return { error: "You must be a registered Mentee to select mentors." };
    }

    const menteeId = user.menteeProfile.id;

    if (rank < 1 || rank > 5) {
        return { error: "Rank must be between 1 and 5." };
    }

    try {
        const existingSelection = await db.selection.findFirst({
            where: { menteeId, mentorId }
        });

        if (existingSelection) {
            await db.selection.update({
                where: { id: existingSelection.id },
                data: { rank, status: SelectionStatus.PENDING } // Reset status on rank change? Or keep it? Usually reset.
            });
        } else {
            // Check if we are overwriting another mentor at this rank
            // Upsert handles this logic by unique constraint
            await db.selection.upsert({
                where: {
                    menteeId_rank: { menteeId, rank }
                },
                update: {
                    mentorId,
                    status: SelectionStatus.PENDING
                },
                create: {
                    menteeId,
                    mentorId,
                    rank,
                    status: SelectionStatus.PENDING
                }
            });
        }

        revalidatePath('/dashboard');
        return { success: "Preference saved!" };

    } catch (error) {
        console.error("Failed to select mentor:", error);
        return { error: "Failed to save preference." };
    }
}

export async function getMentors() {
    const mentors = await db.user.findMany({
        where: { role: 'MENTOR' },
        include: {
            mentorProfile: {
                include: {
                    selections: {
                        where: { status: 'ACCEPTED' }
                    }
                }
            }
        }
    });

    return mentors.map(m => {
        const profile = m.mentorProfile;
        const acceptedCount = profile?.selections.length || 0;
        const capacity = profile?.preferredMentees || 0;
        const availableSlots = Math.max(0, capacity - acceptedCount);

        return {
            id: profile?.id,
            userId: m.id,
            name: m.name,
            role: "Mentor",
            organization: profile?.organization || "ENTC",
            jobTitle: profile?.jobTitle || "",
            interests: profile?.expertise || [],
            bio: profile?.bio || "",
            // Availability logic:
            // If capacity is 0 (unlimited? or none?), allow. Assuming 0 means none or not set? 
            // If capacity > 0 and slots == 0 -> Full.
            availability: (capacity > 0 && availableSlots === 0) ? "Unavailable" :
                (availableSlots <= 2 && capacity > 0) ? "Limited" : "Available",
            availableSlots: availableSlots,
            capacity: capacity
        };
    });
}

export async function getMentorRequests() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true }
    });

    if (!user || user.role !== 'MENTOR' || !user.mentorProfile) return [];

    const mentorId = user.mentorProfile.id;

    // Fetch all pending selections for this mentor
    const pendingSelections = await db.selection.findMany({
        where: {
            mentorId: mentorId,
            status: 'PENDING'
        },
        include: {
            mentee: {
                include: {
                    user: true,
                    selections: true // We need this to check higher ranks
                }
            }
        },
        orderBy: { rank: 'asc' }
    });

    // Filter selections: A request is valid ONLY IF all higher-ranked selections (rank < current) are REJECTED.
    const validRequests = pendingSelections.filter(selection => {
        const higherRankedSelections = selection.mentee.selections.filter(s => s.rank < selection.rank);
        // All higher ranked must be rejected
        return higherRankedSelections.every(s => s.status === 'REJECTED');
    });

    return validRequests.map(s => ({
        id: s.id,
        menteeName: s.mentee.user.name,
        menteeBatch: s.mentee.batch,
        menteeInterests: s.mentee.interests,
        rank: s.rank,
        status: s.status,
        // Added details
        bio: s.mentee.bio,
        motivation: s.mentee.motivation,
        goal: s.mentee.goal,
        portfolio: s.mentee.portfolio,
        cvLink: s.mentee.cvLink,
        github: s.mentee.github,
        linkedin: s.mentee.linkedin,
    }));
}

export async function processMentorshipRequest(selectionId: string, action: "ACCEPT" | "REJECT") {
    const session = await auth();
    if (!session?.user?.email) return { error: "Not authenticated" };

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true }
    });

    if (!user || user.role !== 'MENTOR' || !user.mentorProfile) {
        return { error: "Unauthorized: You do not have a mentor profile." };
    }

    try {
        const selection = await db.selection.findUnique({
            where: { id: selectionId }
        });

        if (!selection) return { error: "Request not found" };
        if (selection.mentorId !== user.mentorProfile.id) return { error: "Unauthorized" };

        if (action === "ACCEPT") {
            // Lazy migration: If preferredMentees is 0 (default/legacy), update it to 5
            if (user.mentorProfile.preferredMentees === 0) {
                await db.mentorProfile.update({
                    where: { id: user.mentorProfile.id },
                    data: { preferredMentees: 5 }
                });
                // Update local variable for checking
                user.mentorProfile.preferredMentees = 5;
            }

            // Check capacity
            const acceptedCount = await db.selection.count({
                where: {
                    mentorId: user.mentorProfile.id,
                    status: 'ACCEPTED'
                }
            });

            console.log(`[DEBUG] Mentor: ${user.name}, Capacity: ${user.mentorProfile.preferredMentees}, Accepted: ${acceptedCount}`);

            if (acceptedCount >= user.mentorProfile.preferredMentees) {
                console.log(`[DEBUG] Capacity Full!`);
                return { error: "Capacity full. Cannot accept more mentees." };
            }

            // Verify mentee hasn't been accepted elsewhere? 
            // Ideally, once accepted, other pending requests should be invalid or auto-cancelled?
            // For now, let's just update this one.
            await db.selection.update({
                where: { id: selectionId },
                data: { status: 'ACCEPTED' }
            });

        } else if (action === "REJECT") {
            await db.selection.update({
                where: { id: selectionId },
                data: { status: 'REJECTED' }
            });
        }

        revalidatePath('/dashboard');
        return { success: `Request ${action.toLowerCase()}ed` };
    } catch (e: any) {
        console.error(e);
        return { error: `Error: ${e.message || "Operation failed"}` };
    }
}

export async function getAcceptedMentees() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true }
    });

    if (!user || user.role !== 'MENTOR' || !user.mentorProfile) return [];

    const acceptedSelections = await db.selection.findMany({
        where: {
            mentorId: user.mentorProfile.id,
            status: 'ACCEPTED'
        },
        include: {
            mentee: {
                include: {
                    user: true
                }
            }
        }
    });

    return acceptedSelections.map(s => ({
        id: s.mentee.id,
        name: s.mentee.user.name,
        email: s.mentee.user.email,
        batch: s.mentee.batch,
        interests: s.mentee.interests,
        // Detailed info
        bio: s.mentee.bio,
        motivation: s.mentee.motivation,
        goal: s.mentee.goal,
        portfolio: s.mentee.portfolio,
        cvLink: s.mentee.cvLink,
        github: s.mentee.github,
        linkedin: s.mentee.linkedin,
    }));
}
