import { SelectionStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { sendMenteeAllRejectedNotification, sendMentorRequestNotification } from '@/lib/notifications';

type SelectionStatusLike = SelectionStatus | 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;

export function hasAllSelectionsRejected(
    selections: Array<{ status: SelectionStatusLike }>
) {
    return selections.length > 0 && selections.every((selection) => selection.status === SelectionStatus.REJECTED);
}

export function isActionableSelection(selection: {
    rank: number;
    mentee: {
        preferencesSubmitted?: boolean | null;
        selections: Array<{ rank: number; status: SelectionStatusLike }>;
    };
}) {
    if (!selection.mentee.preferencesSubmitted) {
        return false;
    }

    const higherRankedSelections = selection.mentee.selections.filter((item) => item.rank < selection.rank);
    return higherRankedSelections.every((item) => item.status === SelectionStatus.REJECTED);
}

export async function notifyMentorForActionableSelection(
    selectionId: string,
    reason: 'rank_1' | 'promoted_after_rejection'
) {
    const selection = await db.selection.findUnique({
        where: { id: selectionId },
        include: {
            mentor: {
                include: {
                    user: true,
                },
            },
            mentee: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!selection?.mentor?.user?.email || !selection?.mentee?.user?.name) {
        return;
    }

    try {
        await sendMentorRequestNotification({
            mentorEmail: selection.mentor.user.email,
            mentorName: selection.mentor.user.name || 'Mentor',
            menteeName: selection.mentee.user.name || 'A mentee',
            reason,
        });
    } catch (error) {
        console.error('Failed to send mentor notification:', error);
    }
}

export async function notifyMenteeAllRejected(menteeId: string) {
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
            menteeName: mentee.user.name || 'there',
        });
    } catch (error) {
        console.error('Failed to send mentee rejection notification:', error);
    }
}

export async function mentorHasAvailableCapacity(mentorId: string) {
    const mentor = await db.mentorProfile.findUnique({
        where: { id: mentorId },
        include: {
            selections: {
                where: { status: SelectionStatus.ACCEPTED },
            },
        },
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

export async function findNextActionableSelectionId(menteeId: string) {
    const selections = await db.selection.findMany({
        where: { menteeId },
        orderBy: { rank: 'asc' },
    });

    for (const selection of selections) {
        if (selection.status !== SelectionStatus.PENDING) {
            continue;
        }

        const higherRankedSelections = selections.filter((item) => item.rank < selection.rank);
        const isActionable = higherRankedSelections.every((item) => item.status === SelectionStatus.REJECTED);
        if (!isActionable) {
            continue;
        }

        const hasCapacity = await mentorHasAvailableCapacity(selection.mentorId);
        if (!hasCapacity) {
            await db.selection.update({
                where: { id: selection.id },
                data: {
                    status: SelectionStatus.REJECTED,
                    rejectionNote: 'Automatically rejected because the mentor is already at full capacity.',
                },
            });
            selection.status = SelectionStatus.REJECTED;
            continue;
        }

        return selection.id;
    }

    return null;
}

export async function getActionablePendingSelectionsForMentor(mentorId: string) {
    const pendingSelections = await db.selection.findMany({
        where: {
            mentorId,
            status: SelectionStatus.PENDING,
        },
        include: {
            mentee: {
                include: {
                    user: true,
                    selections: true,
                },
            },
        },
        orderBy: { rank: 'asc' },
    });

    return pendingSelections.filter(isActionableSelection);
}

export async function autoRejectActionablePendingSelectionsForFullMentor(mentorId: string) {
    const mentor = await db.mentorProfile.findUnique({
        where: { id: mentorId },
        select: {
            preferredMentees: true,
        },
    });

    if (!mentor) {
        return 0;
    }

    const capacity = mentor.preferredMentees || 0;
    if (capacity <= 0) {
        return 0;
    }

    const acceptedCount = await db.selection.count({
        where: {
            mentorId,
            status: SelectionStatus.ACCEPTED,
        },
    });

    if (acceptedCount < capacity) {
        return 0;
    }

    const actionableSelections = await getActionablePendingSelectionsForMentor(mentorId);
    let rejectedCount = 0;

    for (const selection of actionableSelections) {
        const updateResult = await db.selection.updateMany({
            where: {
                id: selection.id,
                status: SelectionStatus.PENDING,
            },
            data: {
                status: SelectionStatus.REJECTED,
                rejectionNote: 'Automatically rejected because the mentor reached full capacity.',
            },
        });

        if (updateResult.count === 0) {
            continue;
        }

        rejectedCount += 1;

        const nextActionableSelectionId = await findNextActionableSelectionId(selection.menteeId);
        if (nextActionableSelectionId) {
            await notifyMentorForActionableSelection(nextActionableSelectionId, 'promoted_after_rejection');
        } else {
            await notifyMenteeAllRejected(selection.menteeId);
        }
    }

    return rejectedCount;
}
