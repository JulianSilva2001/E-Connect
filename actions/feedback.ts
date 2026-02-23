'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Checks whether the logged-in user has at least one ACCEPTED mentorship
 * session — either as a mentor who accepted a mentee, or as a mentee whose
 * selection was accepted by a mentor.
 */
export async function hasAcceptedSession(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.email) return false;

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true, menteeProfile: true },
    });

    if (!user) return false;

    if (user.role === 'MENTOR' && user.mentorProfile) {
        const count = await db.selection.count({
            where: { mentorId: user.mentorProfile.id, status: 'ACCEPTED' },
        });
        return count > 0;
    }

    if (user.role === 'MENTEE' && user.menteeProfile) {
        const count = await db.selection.count({
            where: { menteeId: user.menteeProfile.id, status: 'ACCEPTED' },
        });
        return count > 0;
    }

    return false;
}

export async function getMyFeedbacks() {
    const session = await auth();
    if (!session?.user?.email) {
        return [];
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) return [];

    const feedbacks = await db.feedback.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, role: true } } },
    });

    return feedbacks;
}

export async function submitFeedback({
    content,
    rating,
}: {
    content: string;
    rating: number;
}) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: 'You must be logged in to submit feedback.' };
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return { error: 'User not found.' };
    }

    // Gate: user must have had at least one accepted session
    const sessionExists = await hasAcceptedSession();
    if (!sessionExists) {
        return { error: 'You can only submit feedback after completing a mentorship session.' };
    }

    if (!content.trim()) {
        return { error: 'Feedback content cannot be empty.' };
    }

    if (rating < 1 || rating > 5) {
        return { error: 'Rating must be between 1 and 5.' };
    }

    await db.feedback.create({
        data: {
            content: content.trim(),
            rating,
            authorId: user.id,
        },
    });

    revalidatePath('/dashboard');
    return { success: true };
}
