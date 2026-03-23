"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { processMentorshipRequest } from "@/actions/mentorship";
import { Button } from "@/components/ui/button";

export function MentorAcceptRequestButton({ selectionId }: { selectionId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    const confirmed = window.confirm("Accept this mentee request?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await processMentorshipRequest(selectionId, "ACCEPT");
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      window.alert(result?.success || "Request accepted.");
      window.location.reload();
    });
  };

  return (
    <Button type="button" onClick={handleAccept} disabled={isPending}>
      <Check className="mr-1.5 h-4 w-4" />
      {isPending ? "Accepting..." : "Accept Request"}
    </Button>
  );
}
