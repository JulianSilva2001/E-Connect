"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmMentorPreferences } from "@/actions/mentorship";

export function ConfirmMentorPreferencesButton({
    selectionCount,
    alreadySubmitted,
}: {
    selectionCount: number;
    alreadySubmitted: boolean;
}) {
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        startTransition(async () => {
            const result = await confirmMentorPreferences();
            if (result?.error) {
                window.alert(result.error);
                return;
            }

            window.alert(result.success || "Preferences confirmed.");
            window.location.reload();
        });
    };

    return (
        <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || alreadySubmitted || selectionCount < 1}
            className="w-full sm:w-auto"
        >
            {isPending
                ? "Confirming..."
                : alreadySubmitted
                    ? "Preference Order Confirmed"
                    : "Confirm Mentor Preference Order"}
        </Button>
    );
}
