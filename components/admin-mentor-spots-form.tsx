"use client";

import { useState, useTransition } from "react";
import { updateMentorSpots } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminMentorSpotsForm({
  mentorId,
  initialSpots,
}: {
  mentorId: string;
  initialSpots: number;
}) {
  const [spots, setSpots] = useState(String(initialSpots || 1));
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const parsed = Number(spots);
    startTransition(async () => {
      const result = await updateMentorSpots(mentorId, parsed);
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      window.alert(result?.success || "Spots updated.");
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        max={50}
        value={spots}
        onChange={(event) => setSpots(event.target.value)}
        disabled={isPending}
        className="h-8 w-20"
      />
      <Button type="button" size="sm" variant="outline" onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
