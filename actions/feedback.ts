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

// ─── Submit Feedback ─────────────────────────────────────────────────────────

export async function submitFeedback({
    content,
    rating,
    type = 'GENERAL',
    targetId,
}: {
    content: string;
    rating: number;
    type?: 'GENERAL' | 'MENTOR_ABOUT_MENTEE' | 'MENTEE_ABOUT_MENTOR';
    targetId?: string;
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

    // For targeted feedback, targetId is required
    if (type !== 'GENERAL' && !targetId) {
        return { error: 'Please select who this feedback is about.' };
    }

    // Validate role matches feedback type
    if (type === 'MENTOR_ABOUT_MENTEE' && user.role !== 'MENTOR') {
        return { error: 'Only mentors can submit mentee feedback.' };
    }
    if (type === 'MENTEE_ABOUT_MENTOR' && user.role !== 'MENTEE') {
        return { error: 'Only mentees can submit mentor reviews.' };
    }

    await db.feedback.create({
        data: {
            content: content.trim(),
            rating,
            type,
            targetId: targetId || null,
            authorId: user.id,
        },
    });

    revalidatePath('/dashboard');
    return { success: true };
}

// ─── Fetch General Feedbacks (for both dashboards) ───────────────────────────

export async function getGeneralFeedbacks() {
    const feedbacks = await db.feedback.findMany({
        where: { type: 'GENERAL' },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            content: true,
            rating: true,
            createdAt: true,
            // No author info — anonymous
        },
    });

    return feedbacks;
}

// ─── Fetch Mentor-about-Mentee feedbacks (mentor dashboard only) ─────────────

export async function getMentorAboutMenteeFeedbacks() {
    const feedbacks = await db.feedback.findMany({
        where: { type: 'MENTOR_ABOUT_MENTEE' },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            content: true,
            rating: true,
            targetId: true,
            createdAt: true,
        },
    });

    // Enrich with target mentee names
    const targetIds = [...new Set(feedbacks.filter(f => f.targetId).map(f => f.targetId!))];
    const targets = await db.user.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, name: true },
    });
    const targetMap = new Map(targets.map(t => [t.id, t.name]));

    return feedbacks.map(fb => ({
        ...fb,
        targetName: fb.targetId ? targetMap.get(fb.targetId) || 'Unknown' : null,
    }));
}

// ─── Fetch Mentee-about-Mentor feedbacks (mentee dashboard) ──────────────────

export async function getMenteeAboutMentorFeedbacks() {
    const feedbacks = await db.feedback.findMany({
        where: { type: 'MENTEE_ABOUT_MENTOR' },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            content: true,
            rating: true,
            targetId: true,
            createdAt: true,
        },
    });

    // Enrich with target mentor names
    const targetIds = [...new Set(feedbacks.filter(f => f.targetId).map(f => f.targetId!))];
    const targets = await db.user.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, name: true },
    });
    const targetMap = new Map(targets.map(t => [t.id, t.name]));

    return feedbacks.map(fb => ({
        ...fb,
        targetName: fb.targetId ? targetMap.get(fb.targetId) || 'Unknown' : null,
    }));
}

// ─── Get accepted mentors for a mentee (for the feedback dropdown) ───────────

export async function getAcceptedMentorsForMentee() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { menteeProfile: true },
    });

    if (!user || user.role !== 'MENTEE' || !user.menteeProfile) return [];

    const acceptedSelections = await db.selection.findMany({
        where: {
            menteeId: user.menteeProfile.id,
            status: 'ACCEPTED',
        },
        include: {
            mentor: {
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });

    return acceptedSelections.map(s => ({
        id: s.mentor.user.id,
        name: s.mentor.user.name,
    }));
}

// ─── Get accepted mentees for a mentor (for the feedback dropdown) ───────────

export async function getAcceptedMenteesForMentor() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { mentorProfile: true },
    });

    if (!user || user.role !== 'MENTOR' || !user.mentorProfile) return [];

    const acceptedSelections = await db.selection.findMany({
        where: {
            mentorId: user.mentorProfile.id,
            status: 'ACCEPTED',
        },
        include: {
            mentee: {
                include: { user: { select: { id: true, name: true } } },
            },
        },
    });

    return acceptedSelections.map(s => ({
        id: s.mentee.user.id,
        name: s.mentee.user.name,
    }));
}
