'use server';

import { SelectionStatus } from '@prisma/client';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';
import { revalidatePath } from 'next/cache';
import { normalizeBatchList } from '@/lib/registration-batches';
import {
    findNextActionableSelectionId,
    notifyMenteeAllRejected,
    notifyMentorForActionableSelection,
} from '@/lib/mentor-request-capacity';

export async function deleteUserAccount(userId: string) {
    const session = await auth();

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return { error: 'Unauthorized' };
    }

    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            mentorProfile: true,
            menteeProfile: true,
        },
    });

    if (!user) {
        return { error: 'User not found' };
    }

    if (user.email === session.user.email) {
        return { error: 'You cannot delete your own admin account.' };
    }

    try {
        await db.$transaction(async (tx) => {
            await tx.feedback.deleteMany({
                where: {
                    OR: [
                        { authorId: user.id },
                        { targetId: user.id },
                    ],
                },
            });

            if (user.mentorProfile) {
                await tx.selection.deleteMany({
                    where: { mentorId: user.mentorProfile.id },
                });

                await tx.mentorProfile.delete({
                    where: { id: user.mentorProfile.id },
                });
            }

            if (user.menteeProfile) {
                await tx.selection.deleteMany({
                    where: { menteeId: user.menteeProfile.id },
                });

                await tx.menteeProfile.delete({
                    where: { id: user.menteeProfile.id },
                });
            }

            await tx.user.delete({
                where: { id: user.id },
            });
        });

        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: 'Account deleted.' };
    } catch (error) {
        console.error('Failed to delete account:', error);
        return { error: 'Failed to delete account.' };
    }
}

export async function updateRegistrationBatches(rawBatches: string) {
    const session = await auth();

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return { error: 'Unauthorized' };
    }

    const allowedMenteeBatches = normalizeBatchList(rawBatches.split(','));

    if (allowedMenteeBatches.length === 0) {
        return { error: 'Add at least one batch.' };
    }

    try {
        await db.registrationSettings.upsert({
            where: { singletonKey: 'registration' },
            update: { allowedMenteeBatches },
            create: {
                singletonKey: 'registration',
                allowedMenteeBatches,
            },
        });

        revalidatePath('/admin');
        revalidatePath('/register');
        return { success: 'Registration batches updated.' };
    } catch (error) {
        console.error('Failed to update registration batches:', error);
        return { error: 'Failed to update registration batches.' };
    }
}

export async function adminRejectMentorshipRequest(selectionId: string) {
    const session = await auth();

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return { error: 'Unauthorized' };
    }

    const selection = await db.selection.findUnique({
        where: { id: selectionId },
        include: {
            mentee: true,
            mentor: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    if (!selection) {
        return { error: 'Request not found.' };
    }

    if (selection.status === SelectionStatus.REJECTED) {
        return { error: 'This request is already rejected.' };
    }

    try {
        await db.selection.update({
            where: { id: selectionId },
            data: {
                status: SelectionStatus.REJECTED,
                rejectionNote: 'Rejected by admin.',
            },
        });

        const nextActionableSelectionId = await findNextActionableSelectionId(selection.menteeId);
        if (nextActionableSelectionId) {
            await notifyMentorForActionableSelection(nextActionableSelectionId, 'promoted_after_rejection');
        } else {
            await notifyMenteeAllRejected(selection.menteeId);
        }

        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: 'Request rejected.' };
    } catch (error) {
        console.error('Failed to reject mentorship request:', error);
        return { error: 'Failed to reject request.' };
    }
}
