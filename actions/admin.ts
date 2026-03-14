'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { isAdminEmail } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

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
