"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DirectoryMentee = {
  id: string;
  name: string;
  email: string;
  batch?: string | null;
  indexNumber?: string | null;
  contactNumber?: string | null;
  interests: string[];
  bio?: string | null;
  motivation?: string | null;
  goal?: string | null;
  portfolio?: string | null;
  cvLink?: string | null;
  github?: string | null;
  linkedin?: string | null;
  assignedMentorName: string | null;
  selectedThisMentor: boolean;
};

export function MentorMenteeDirectory({ mentees }: { mentees: DirectoryMentee[] }) {
  const [search, setSearch] = useState("");
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [copyPending, setCopyPending] = useState(false);
  const [selectedOnly, setSelectedOnly] = useState(false);

  const filteredMentees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return mentees.filter((mentee) => {
      const matchesSearch = !term || mentee.name.toLowerCase().includes(term);
      const matchesSelectedOnly = !selectedOnly || mentee.selectedThisMentor;
      return matchesSearch && matchesSelectedOnly;
    });
  }, [mentees, search, selectedOnly]);
  const selectedMentee = useMemo(
    () => filteredMentees.find((mentee) => mentee.id === selectedMenteeId) || null,
    [filteredMentees, selectedMenteeId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search mentees by name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant={selectedOnly ? "default" : "outline"}
          onClick={() => setSelectedOnly((value) => !value)}
        >
          {selectedOnly ? "Showing: Selected This Mentor" : "Filter: Selected This Mentor"}
        </Button>
      </div>

      {filteredMentees.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-8 text-center text-muted-foreground">
          No mentees found for this name.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMentees.map((mentee) => (
            <Card
              key={mentee.id}
              className="cursor-pointer border shadow-sm transition hover:border-primary/40 hover:shadow-md"
              onClick={() => setSelectedMenteeId(mentee.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedMenteeId(mentee.id);
                }
              }}
            >
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{mentee.name}</p>
                    <p className="text-sm text-muted-foreground">{mentee.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Batch: {mentee.batch || "-"}</Badge>
                    {mentee.selectedThisMentor ? (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Selected This Mentor
                      </Badge>
                    ) : null}
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                      Mentor: {mentee.assignedMentorName || "No mentor yet"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selectedMenteeId)} onOpenChange={(open) => !open && setSelectedMenteeId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selectedMentee ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMentee.name}</DialogTitle>
                <DialogDescription>{selectedMentee.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={copyPending}
                    onClick={async () => {
                      try {
                        setCopyPending(true);
                        const url = `${window.location.origin}/mentee-profiles/${selectedMentee.id}`;
                        await navigator.clipboard.writeText(url);
                        window.alert("Profile link copied.");
                      } catch {
                        window.alert("Could not copy link.");
                      } finally {
                        setCopyPending(false);
                      }
                    }}
                  >
                    {copyPending ? "Copying..." : "Copy Profile Link"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" asChild>
                    <a href={`/mentee-profiles/${selectedMentee.id}`} target="_blank" rel="noopener noreferrer">
                      Open Full Profile
                    </a>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Batch: {selectedMentee.batch || "-"}</Badge>
                  <Badge variant="secondary">Index: {selectedMentee.indexNumber || "-"}</Badge>
                  <Badge variant="secondary">Contact: {selectedMentee.contactNumber || "-"}</Badge>
                  {selectedMentee.selectedThisMentor ? (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      Selected This Mentor
                    </Badge>
                  ) : null}
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                    Mentor: {selectedMentee.assignedMentorName || "No mentor yet"}
                  </Badge>
                </div>

                <Detail label="Interests" value={selectedMentee.interests.length ? selectedMentee.interests.join(", ") : "-"} multiline />
                <Detail label="About" value={selectedMentee.bio || "-"} multiline />
                <Detail label="Motivation" value={selectedMentee.motivation || "-"} multiline />
                <Detail label="Goal" value={selectedMentee.goal || "-"} multiline />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Links</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <ProfileLink label="LinkedIn" href={selectedMentee.linkedin} />
                    <ProfileLink label="GitHub" href={selectedMentee.github} />
                    <ProfileLink label="Portfolio" href={selectedMentee.portfolio} />
                    <ProfileLink label="CV" href={selectedMentee.cvLink} />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-gray-900 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</p>
    </div>
  );
}

function ProfileLink({ label, href }: { label: string; href?: string | null }) {
  if (!href) {
    return (
      <p className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
        {label}: -
      </p>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-between rounded-md border px-3 py-2 text-xs text-primary hover:bg-primary/5"
    >
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
