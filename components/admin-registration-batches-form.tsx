"use client";

import { useState, useTransition } from "react";
import { updateRegistrationBatches } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminRegistrationBatchesForm({
    initialValue,
}: {
    initialValue: string;
}) {
    const [value, setValue] = useState(initialValue);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        startTransition(async () => {
            const result = await updateRegistrationBatches(value);
            if (result?.error) {
                window.alert(result.error);
                return;
            }

            window.alert(result?.success || "Registration batches updated.");
            window.location.reload();
        });
    };

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
                <div className="mb-2 text-sm font-medium text-gray-900">Allowed mentee batches</div>
                <Input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Batch 22, Batch 23, Batch 24"
                    disabled={isPending}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                    Enter comma-separated batch labels. The registration dropdown will show these values.
                </p>
            </div>
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Saving..." : "Save Batches"}
            </Button>
        </div>
    );
}
