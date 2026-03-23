"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";

import { adminAcceptMentorshipRequest } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminAcceptRequestButton({
  selectionId,
  menteeLabel,
  disabled = false,
}: {
  selectionId: string;
  menteeLabel: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    const confirmed = window.confirm(`Accept the request for ${menteeLabel}?`);
    if (!confirmed) return;

    startTransition(async () => {
      const result = await adminAcceptMentorshipRequest(selectionId);
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      window.alert("Request accepted.");
    });
  };

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      disabled={disabled || isPending}
      onClick={handleAccept}
      className="whitespace-nowrap"
    >
      <Check className="mr-1.5 h-4 w-4" />
      {isPending ? "Accepting..." : "Accept"}
    </Button>
  );
}
