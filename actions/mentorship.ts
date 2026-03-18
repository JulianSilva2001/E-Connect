
'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { sendMentorRequestNotification, sendMenteeAllRejectedNotification } from '@/lib/notifications';

import { SelectionStatus } from '@prisma/client';

function hasAllSelectionsRejected(
    selections: Array<{ status: SelectionStatus | string }>
) {
    return selections.length > 0 && selections.every((selection) => selection.status === SelectionStatus.REJECTED);
}

function isPreferenceOrderLocked(profile: {
    preferencesSubmitted?: boolean | null;
    selections?: Array<{ status: SelectionStatus | string }>;
}) {
    if (!profile?.preferencesSubmitted) {
        return false;
    }

    return !hasAllSelectionsRejected(profile.selections || []);
}

async function notifyMentorForActionableSelection(selectionId: string, reason: "rank_1" | "promoted_after_rejection") {
    const selection = await db.selection.findUnique({
        where: { id: selectionId },
        include: {
            mentor: {
                include: {
                    user: true
                }
            },
            mentee: {
                include: {
                    user: true
                }
            }
        }
    });

    if (!selection?.mentor?.user?.email || !selection?.mentee?.user?.name) {
        return;
    }

    try {
        await sendMentorRequestNotification({
            mentorEmail: selection.mentor.user.email,
            mentorName: selection.mentor.user.name || "Mentor",
            menteeName: selection.mentee.user.name || "A mentee",
            reason,
        });
    } catch (error) {
        console.error("Failed to send mentor notification:", error);
    }
}

async function notifyMenteeAllRejected(menteeId: string) {
    const mentee = await db.menteeProfile.findUnique({
        where: { id: menteeId },
        include: {
            user: true,
            selections: true,
        },
    });

    if (!mentee?.user?.email) {
        return;
    }

    if (!hasAllSelectionsRejected(mentee.selections)) {
        return;
    }

    try {
        await sendMenteeAllRejectedNotification({
            menteeEmail: mentee.user.email,
            menteeName: mentee.user.name || "there",
        });
    } catch (error) {
        console.error("Failed to send mentee rejection notification:", error);
    }
}

async function findNextActionableSelectionId(menteeId: string) {
    const selections = await db.selection.findMany({
        where: { menteeId },
        orderBy: { rank: 'asc' }
    });

    for (const selection of selections) {
        if (selection.status !== 'PENDING') {
            continue;
        }

        const higherRankedSelections = selections.filter(s => s.rank < selection.rank);
        const isActionable = higherRankedSelections.every(s => s.status === 'REJECTED');
        if (isActionable) {
            const hasCapacity = await mentorHasAvailableCapacity(selection.mentorId);
            if (!hasCapacity) {
                // Skip mentors who are already full so the request can move to the next ranked option.
                await db.selection.update({
                    where: { id: selection.id },
                    data: { status: SelectionStatus.REJECTED }
                });
                selection.status = SelectionStatus.REJECTED;
                continue;
            }

            return selection.id;
        }
    }

    return null;
}

async function mentorHasAvailableCapacity(mentorId: string) {
    const mentor = await db.mentorProfile.findUnique({
        where: { id: mentorId },
        include: {
            selections: {
                where: { status: SelectionStatus.ACCEPTED }
            }
        }
    });

    if (!mentor) {
        return false;
    }

    const capacity = mentor.preferredMentees || 0;
    if (capacity <= 0) {
        return true;
    }

    return mentor.selections.length < capacity;
}

export async function selectMentor(mentorId: string, rank: number) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
            menteeProfile: {
                include: {
                    selections: true
                }
            }
        },
    });

    if (!user || user.role !== 'MENTEE' || !user.menteeProfile) {
        return { error: "You must be a registered Mentee to select mentors." };
    }

    if (isPreferenceOrderLocked(user.menteeProfile as any)) {
        return { error: "Your mentor preference order has already been confirmed and can no longer be changed." };
    }

    const menteeId = user.menteeProfile.id;

    if (rank < 1 || rank > 5) {
        return { error: "Rank must be between 1 and 5." };
    }

    const hasCapacity = await mentorHasAvailableCapacity(mentorId);
    if (!hasCapacity) {
        return { error: "This mentor is already full and cannot receive new requests." };
    }

    try {
        if ((user.menteeProfile as any).preferencesSubmitted) {
            await db.menteeProfile.update({
                where: { id: menteeId },
                data: { preferencesSubmitted: false } as any
            });
        }

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
        return { success: "Preference saved as draft. Confirm your order to send requests." };

    } catch (error) {
        console.error("Failed to select mentor:", error);
        return { error: "Failed to save preference." };
    }
}

export async function addMentorToPreferences(mentorId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
            menteeProfile: {
                include: {
                    selections: {
                        orderBy: { rank: "asc" }
                    }
                }
            }
        },
    });

    if (!user || user.role !== "MENTEE" || !user.menteeProfile) {
        return { error: "You must be a registered Mentee to select mentors." };
    }

    if (isPreferenceOrderLocked(user.menteeProfile as any)) {
        return { error: "Your mentor preference order has already been confirmed and can no longer be changed." };
    }

    const existingSelection = user.menteeProfile.selections.find((selection) => selection.mentorId === mentorId);
    if (existingSelection) {
        return { success: "Mentor already added to your preference list." };
    }

    if (user.menteeProfile.selections.length >= 5) {
        return { error: "You can only keep up to 5 mentors in your preference list." };
    }

    const nextRank = [1, 2, 3, 4, 5].find(
        (candidateRank) => !user.menteeProfile?.selections.some((selection) => selection.rank === candidateRank)
    );

    if (!nextRank) {
        return { error: "No preference slot is available." };
    }

    const hasCapacity = await mentorHasAvailableCapacity(mentorId);
    if (!hasCapacity) {
        return { error: "This mentor is already full and cannot receive new requests." };
    }

    try {
        await db.$transaction(async (tx) => {
            if ((user.menteeProfile as any).preferencesSubmitted) {
                await tx.menteeProfile.update({
                    where: { id: user.menteeProfile!.id },
                    data: { preferencesSubmitted: false } as any
                });
            }

            await tx.selection.create({
                data: {
                    menteeId: user.menteeProfile!.id,
                    mentorId,
                    rank: nextRank,
                    status: SelectionStatus.PENDING,
                }
            });
        });

        revalidatePath('/dashboard');
        return { success: "Mentor added to your preference list." };
    } catch (error) {
        console.error("Failed to add mentor preference:", error);
        return { error: "Failed to add mentor preference." };
    }
}

export async function updateMentorPreferenceRank(mentorId: string, newRank: number) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
            menteeProfile: {
                include: {
                    selections: true
                }
            }
        },
    });

    if (!user || user.role !== "MENTEE" || !user.menteeProfile) {
        return { error: "You must be a registered Mentee to update mentor preferences." };
    }

    if (isPreferenceOrderLocked(user.menteeProfile as any)) {
        return { error: "Your mentor preference order has already been confirmed and can no longer be changed." };
    }

    if (newRank < 1 || newRank > 5) {
        return { error: "Rank must be between 1 and 5." };
    }

    const currentSelection = user.menteeProfile.selections.find((selection) => selection.mentorId === mentorId);
    if (!currentSelection) {
        return { error: "Preference not found." };
    }

    if (currentSelection.rank === newRank) {
        return { success: "Preference order updated." };
    }

    const conflictingSelection = user.menteeProfile.selections.find((selection) => selection.rank === newRank);

    try {
        await db.$transaction(async (tx) => {
            if ((user.menteeProfile as any).preferencesSubmitted) {
                await tx.menteeProfile.update({
                    where: { id: user.menteeProfile!.id },
                    data: { preferencesSubmitted: false } as any
                });
            }

            if (conflictingSelection) {
                await tx.selection.update({
                    where: { id: conflictingSelection.id },
                    data: { rank: 99 }
                });
            }

            await tx.selection.update({
                where: { id: currentSelection.id },
                data: { rank: newRank, status: SelectionStatus.PENDING }
            });

            if (conflictingSelection) {
                await tx.selection.update({
                    where: { id: conflictingSelection.id },
                    data: { rank: currentSelection.rank, status: SelectionStatus.PENDING }
                });
            }
        });

        revalidatePath('/dashboard');
        return { success: "Preference order updated." };
    } catch (error) {
        console.error("Failed to update mentor preference rank:", error);
        return { error: "Failed to update mentor preference order." };
    }
}

export async function removeMentorPreference(mentorId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
            menteeProfile: true
        },
    });

    if (!user || user.role !== "MENTEE" || !user.menteeProfile) {
        return { error: "You must be a registered Mentee to update mentor preferences." };
    }

    const menteeProfileWithSelections = {
        ...user.menteeProfile,
        selections: await db.selection.findMany({
            where: { menteeId: user.menteeProfile.id }
        })
    };

    if (isPreferenceOrderLocked(menteeProfileWithSelections as any)) {
        return { error: "Your mentor preference order has already been confirmed and can no longer be changed." };
    }

    try {
        await db.$transaction(async (tx) => {
            if ((user.menteeProfile as any).preferencesSubmitted) {
                await tx.menteeProfile.update({
                    where: { id: user.menteeProfile!.id },
                    data: { preferencesSubmitted: false } as any
                });
            }

            await tx.selection.deleteMany({
                where: {
                    menteeId: user.menteeProfile!.id,
                    mentorId,
                }
            });
        });

        revalidatePath('/dashboard');
        return { success: "Mentor removed from your preference list." };
    } catch (error) {
        console.error("Failed to remove mentor preference:", error);
        return { error: "Failed to remove mentor preference." };
    }
}

export async function confirmMentorPreferences() {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
            menteeProfile: {
                include: {
                    selections: {
                        orderBy: { rank: "asc" }
                    }
                }
            }
        },
    });

    if (!user || user.role !== "MENTEE" || !user.menteeProfile) {
        return { error: "You must be a registered Mentee to confirm preferences." };
    }

    if (user.menteeProfile.selections.length < 1) {
        return { error: "Please select at least one mentor before confirming your preference order." };
    }

    if (hasAllSelectionsRejected(user.menteeProfile.selections)) {
        return { error: "Your current list only contains rejected mentors. Add or update at least one mentor before confirming again." };
    }

    if ((user.menteeProfile as any).preferencesSubmitted) {
        return { error: "Your mentor preference order has already been confirmed." };
    }

    try {
        await db.menteeProfile.update({
            where: { id: user.menteeProfile.id },
            data: { preferencesSubmitted: true } as any
        });

        const actionableSelectionId = await findNextActionableSelectionId(user.menteeProfile.id);
        if (actionableSelectionId) {
            await notifyMentorForActionableSelection(actionableSelectionId, "rank_1");
            revalidatePath('/dashboard');
            return { success: "Preferences confirmed. Requests were sent to the current actionable mentor." };
        }

        revalidatePath('/dashboard');
        return { success: "Preferences confirmed. No request was sent because the remaining preferred mentors are already full or unavailable." };
    } catch (error) {
        console.error("Failed to confirm mentor preferences:", error);
        if (error instanceof Error) {
            if (error.message.includes("preferencesSubmitted") || error.message.includes("Unknown argument")) {
                return { error: "Failed to confirm mentor preferences. The database schema is not updated yet. Run `npx prisma db push` and `npx prisma generate`, then restart the dev server." };
            }

            return { error: `Failed to confirm mentor preferences. ${error.message}` };
        }

        return { error: "Failed to confirm mentor preferences." };
    }
}

export async function getMentors(options?: { includeUnavailable?: boolean }) {
    const includeUnavailable = options?.includeUnavailable ?? false;

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

        const mentor = {
            id: profile?.id,
            userId: m.id,
            name: m.name,
            role: profile?.jobTitle || "Mentor",
            organization: profile?.organization || "ENTC",
            graduationYear: profile?.graduationYear || 0,
            jobTitle: profile?.jobTitle || "",
            interests: profile?.expertise || [],
            bio: profile?.bio || "",
            email: m.email,
            linkedIn: profile?.linkedIn || undefined,
            expectations: profile?.expectations || undefined,
            // Availability logic:
            // If capacity is 0 (unlimited? or none?), allow. Assuming 0 means none or not set? 
            // If capacity > 0 and slots == 0 -> Full.
            availability: (capacity > 0 && availableSlots === 0) ? "Unavailable" :
                (availableSlots <= 2 && capacity > 0) ? "Limited" : "Available",
            availableSlots: availableSlots,
            capacity: capacity
        };

        return mentor;
    }).filter((mentor) => includeUnavailable || mentor.availability !== "Unavailable");
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
        if (!(selection.mentee as any).preferencesSubmitted) {
            return false;
        }
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

export async function processMentorshipRequest(selectionId: string, action: "ACCEPT" | "REJECT", rejectionNote?: string) {
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
            where: { id: selectionId },
            include: {
                mentee: {
                    include: {
                        user: true,
                    },
                },
            },
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
                data: { status: 'ACCEPTED', rejectionNote: null }
            });

        } else if (action === "REJECT") {
            const normalizedRejectionNote = rejectionNote?.trim() || undefined;
            await db.selection.update({
                where: { id: selectionId },
                data: { status: 'REJECTED', rejectionNote: normalizedRejectionNote }
            });

            const nextActionableSelectionId = await findNextActionableSelectionId(selection.menteeId);
            if (nextActionableSelectionId) {
                await notifyMentorForActionableSelection(nextActionableSelectionId, "promoted_after_rejection");
            } else {
                await notifyMenteeAllRejected(selection.menteeId);
            }
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

export async function getAcceptedMentors() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { menteeProfile: true }
    });

    if (!user || user.role !== 'MENTEE' || !user.menteeProfile) return [];

    const acceptedSelections = await db.selection.findMany({
        where: {
            menteeId: user.menteeProfile.id,
            status: 'ACCEPTED'
        },
        include: {
            mentor: {
                include: {
                    user: true
                }
            }
        }
    });

    return acceptedSelections.map(s => ({
        id: s.mentor.id,
        name: s.mentor.user.name,
        email: s.mentor.user.email,
        organization: s.mentor.organization,
        jobTitle: s.mentor.jobTitle,
        interests: s.mentor.expertise,
        bio: s.mentor.bio,
        linkedin: s.mentor.linkedIn,
        expectations: s.mentor.expectations,
    }));
}
