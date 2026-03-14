"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { addMentorToPreferences, removeMentorPreference, updateMentorPreferenceRank } from "@/actions/mentorship";
import { Input } from "@/components/ui/input";

type PreferenceItem = {
    mentorId: string;
    rank: number;
    mentorName: string;
    mentorRole?: string;
};

type MentorOption = {
    mentorId: string;
    mentorName: string;
    mentorRole?: string;
};

export function MentorPreferenceOrderEditor({
    selections,
    allMentors = [],
    preferencesLocked,
}: {
    selections: PreferenceItem[];
    allMentors?: MentorOption[];
    preferencesLocked: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState("");

    const selectedMentorIds = useMemo(
        () => new Set(selections.map((selection) => selection.mentorId)),
        [selections]
    );

    const availableMentors = useMemo(() => {
        const searchLower = searchQuery.trim().toLowerCase();
        const mentorOptions = Array.isArray(allMentors) ? allMentors : [];

        return mentorOptions.filter((mentor) => {
            if (selectedMentorIds.has(mentor.mentorId)) return false;
            if (!searchLower) return true;

            return (
                mentor.mentorName.toLowerCase().includes(searchLower) ||
                (mentor.mentorRole || "").toLowerCase().includes(searchLower)
            );
        });
    }, [allMentors, searchQuery, selectedMentorIds]);

    const handleAdd = (mentorId: string) => {
        startTransition(async () => {
            const result = await addMentorToPreferences(mentorId);
            if (result?.error) {
                window.alert(result.error);
                return;
            }
            window.location.reload();
        });
    };

    const handleRankChange = (mentorId: string, rank: string) => {
        startTransition(async () => {
            const result = await updateMentorPreferenceRank(mentorId, Number(rank));
            if (result?.error) {
                window.alert(result.error);
                return;
            }
            window.location.reload();
        });
    };

    const handleRemove = (mentorId: string) => {
        startTransition(async () => {
            const result = await removeMentorPreference(mentorId);
            if (result?.error) {
                window.alert(result.error);
                return;
            }
            window.location.reload();
        });
    };

    return (
        <div className="space-y-3">
            {!preferencesLocked ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search mentor by name"
                            className="pl-9"
                        />
                    </div>
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {availableMentors.length > 0 ? (
                            availableMentors.map((mentor) => (
                                <div key={mentor.mentorId} className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2">
                                    <div>
                                        <div className="font-medium text-gray-900">{mentor.mentorName}</div>
                                        {mentor.mentorRole ? (
                                            <div className="text-xs text-muted-foreground">{mentor.mentorRole}</div>
                                        ) : null}
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isPending || selections.length >= 5}
                                        onClick={() => handleAdd(mentor.mentorId)}
                                    >
                                        Add
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-lg border border-dashed bg-white p-3 text-sm text-muted-foreground">
                                No available mentors match your search.
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {selections.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    No mentors selected yet. Search and add mentors here, then set the order below.
                </div>
            ) : null}

            {selections
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((selection) => (
                    <div key={selection.mentorId} className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="font-semibold text-gray-900">{selection.mentorName}</div>
                            {selection.mentorRole ? (
                                <div className="text-sm text-muted-foreground">{selection.mentorRole}</div>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                            <Select
                                value={String(selection.rank)}
                                onValueChange={(value) => handleRankChange(selection.mentorId, value)}
                                disabled={preferencesLocked || isPending}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map((rank) => (
                                        <SelectItem key={rank} value={String(rank)}>
                                            Preference #{rank}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={preferencesLocked || isPending}
                                onClick={() => handleRemove(selection.mentorId)}
                            >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Remove
                            </Button>
                        </div>
                    </div>
                ))}
        </div>
    );
}
