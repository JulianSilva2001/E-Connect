"use client";

import { useTransition } from "react";
import { Ban } from "lucide-react";

import { adminRejectMentorshipRequest } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminRejectRequestButton({
  selectionId,
  menteeLabel,
  disabled = false,
}: {
  selectionId: string;
  menteeLabel: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleReject = () => {
    const confirmed = window.confirm(`Reject the request for ${menteeLabel}?`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await adminRejectMentorshipRequest(selectionId);
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      window.alert("Request rejected.");
    });
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={disabled || isPending}
      onClick={handleReject}
      className="whitespace-nowrap"
    >
      <Ban className="mr-1.5 h-4 w-4" />
      {isPending ? "Rejecting..." : "Reject"}
    </Button>
  );
}
