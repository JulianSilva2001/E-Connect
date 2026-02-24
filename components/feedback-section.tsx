"use client";

import React, { useState, useTransition } from "react";
import { Star, Send, MessageSquare, Users, UserCheck } from "lucide-react";
import { submitFeedback } from "@/actions/feedback";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

type GeneralFeedbackItem = {
    id: string;
    content: string;
    rating: number;
    createdAt: Date;
};

type TargetedFeedbackItem = GeneralFeedbackItem & {
    targetId: string | null;
    targetName: string | null;
};

type PersonOption = {
    id: string;
    name: string | null;
};

interface FeedbackSectionProps {
    role: "MENTOR" | "MENTEE";
    hasSession: boolean;
    generalFeedbacks: GeneralFeedbackItem[];
    targetedFeedbacks: TargetedFeedbackItem[];
    targetOptions: PersonOption[]; // mentees for mentors, mentors for mentees
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({
    value,
    onChange,
    readonly = false,
}: {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
}) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    className={`transition-all duration-150 ${readonly
                        ? "cursor-default"
                        : "cursor-pointer hover:scale-110"
                        }`}
                >
                    <Star
                        className={`w-5 h-5 transition-colors ${star <= (hovered || value)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

function timeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
}

// ─── Feedback Form (reusable) ────────────────────────────────────────────────

function FeedbackForm({
    type,
    targetOptions,
    placeholder,
    label,
}: {
    type: "GENERAL" | "MENTOR_ABOUT_MENTEE" | "MENTEE_ABOUT_MENTOR";
    targetOptions?: PersonOption[];
    placeholder: string;
    label: string;
}) {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState("");
    const [targetId, setTargetId] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (type !== "GENERAL" && !targetId) {
            setError("Please select who this feedback is about.");
            return;
        }
        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }
        if (!content.trim()) {
            setError("Please write your feedback.");
            return;
        }
        setError("");
        setSuccess(false);

        startTransition(async () => {
            const result = await submitFeedback({
                content,
                rating,
                type,
                targetId: targetId || undefined,
            });
            if (result.error) {
                setError(result.error);
            } else {
                setRating(0);
                setContent("");
                setTargetId("");
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        });
    };

    const needsTarget = type !== "GENERAL";

    return (
        <div className="space-y-4">
            {/* Target selector */}
            {needsTarget && targetOptions && targetOptions.length > 0 && (
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {label}
                    </label>
                    <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    >
                        <option value="">— Select —</option>
                        {targetOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name || "Unknown"}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Rating */}
            <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Rating
                </label>
                <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Text */}
            <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Your feedback
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
                />
            </div>

            {/* Error / Success */}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
                <p className="text-sm text-green-600 font-medium">
                    ✓ Feedback submitted anonymously!
                </p>
            )}

            {/* Submit */}
            <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="gap-2"
            >
                <Send className="w-4 h-4" />
                {isPending ? "Submitting..." : "Submit Anonymously"}
            </Button>
        </div>
    );
}

// ─── Feedback Cards (anonymous) ──────────────────────────────────────────────

function FeedbackCard({ fb, showTarget = false }: {
    fb: GeneralFeedbackItem & { targetName?: string | null };
    showTarget?: boolean;
}) {
    return (
        <div className="bg-white rounded-xl border p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
                <StarRating value={fb.rating} readonly />
                <span className="text-xs text-gray-400">
                    {timeAgo(fb.createdAt)}
                </span>
            </div>
            {showTarget && fb.targetName && (
                <div className="mb-2">
                    <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
                        About: {fb.targetName}
                    </span>
                </div>
            )}
            <p className="text-sm text-gray-700 leading-relaxed">{fb.content}</p>
            <div className="mt-3 text-xs text-gray-400 italic">— Anonymous</div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function FeedbackSection({
    role,
    hasSession,
    generalFeedbacks,
    targetedFeedbacks,
    targetOptions,
}: FeedbackSectionProps) {
    const isMentor = role === "MENTOR";

    return (
        <div className="space-y-10">
            {/* ──────── ROLE-SPECIFIC SECTION ──────── */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className={`p-2 rounded-lg ${isMentor ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {isMentor ? <Users className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {isMentor ? "Feedback About Your Mentees" : "Mentor Reviews"}
                    </h3>
                </div>

                {/* Submit Form */}
                {hasSession ? (
                    <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            {isMentor
                                ? "Write feedback about a mentee"
                                : "Write a review about a mentor (helps other mentees!)"}
                        </h4>
                        <FeedbackForm
                            type={isMentor ? "MENTOR_ABOUT_MENTEE" : "MENTEE_ABOUT_MENTOR"}
                            targetOptions={targetOptions}
                            label={isMentor ? "Select mentee" : "Select mentor"}
                            placeholder={
                                isMentor
                                    ? "Share your observations about this mentee — their progress, engagement, areas to improve..."
                                    : "Share your experience with this mentor — how helpful were they, communication style, advice quality..."
                            }
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-dashed shadow-sm p-8 text-center mb-6">
                        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                            <MessageSquare className="w-7 h-7 text-amber-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Feedback Locked</h4>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            You&apos;ll be able to share feedback once you have a confirmed mentorship session.
                        </p>
                    </div>
                )}

                {/* Targeted Feedback List */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                        {isMentor ? "All Mentee Feedback" : "All Mentor Reviews"}
                        <span className="ml-2 text-muted-foreground font-normal normal-case">
                            ({targetedFeedbacks.length})
                        </span>
                    </h4>
                    {targetedFeedbacks.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm text-muted-foreground">
                                {isMentor
                                    ? "No mentee feedback has been submitted yet."
                                    : "No mentor reviews have been submitted yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {targetedFeedbacks.map((fb) => (
                                <FeedbackCard key={fb.id} fb={fb} showTarget />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ──────── GENERAL FEEDBACK SECTION ──────── */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">General Feedback</h3>
                </div>

                {/* Submit Form */}
                {hasSession ? (
                    <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Share general feedback about the mentorship program
                        </h4>
                        <FeedbackForm
                            type="GENERAL"
                            placeholder="Share your overall experience with the mentorship program — what's working, what could be improved..."
                            label=""
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-dashed shadow-sm p-8 text-center mb-6">
                        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                            <MessageSquare className="w-7 h-7 text-amber-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Feedback Locked</h4>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Complete the matching process first to share feedback.
                        </p>
                    </div>
                )}

                {/* General Feedback List */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                        All General Feedback
                        <span className="ml-2 text-muted-foreground font-normal normal-case">
                            ({generalFeedbacks.length})
                        </span>
                    </h4>
                    {generalFeedbacks.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm text-muted-foreground">
                                No general feedback has been submitted yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {generalFeedbacks.map((fb) => (
                                <FeedbackCard key={fb.id} fb={fb} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
