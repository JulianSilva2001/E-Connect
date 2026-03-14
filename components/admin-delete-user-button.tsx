"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAccount } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminDeleteUserButton({ userId, label }: { userId: string; label: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        const confirmed = window.confirm(`Delete ${label}? This will remove the user, profile, selections, and related feedback.`);
        if (!confirmed) return;

        startTransition(async () => {
            const result = await deleteUserAccount(userId);
            if (result?.error) {
                window.alert(result.error);
                return;
            }

            window.alert("Account deleted.");
        });
    };

    return (
        <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
            className="whitespace-nowrap"
        >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {isPending ? "Deleting..." : "Delete"}
        </Button>
    );
}
