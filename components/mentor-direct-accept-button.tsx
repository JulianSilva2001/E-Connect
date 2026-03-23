"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { mentorAcceptMenteeWithoutRequest } from "@/actions/mentorship";
import { Button } from "@/components/ui/button";

export function MentorDirectAcceptButton({ menteeId }: { menteeId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    const confirmed = window.confirm(
      "Accept this mentee now? This is allowed only if the mentee does not have a mentor yet."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await mentorAcceptMenteeWithoutRequest(menteeId);
      if (result?.error) {
        window.alert(result.error);
        return;
      }

      window.alert(result?.success || "Mentee accepted.");
      window.location.reload();
    });
  };

  return (
    <Button type="button" onClick={handleAccept} disabled={isPending}>
      <Check className="mr-1.5 h-4 w-4" />
      {isPending ? "Accepting..." : "Accept Mentee"}
    </Button>
  );
}
