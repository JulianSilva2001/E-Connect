"use client";

import React, { useState, useTransition } from "react";
import { Star, Send, MessageSquare } from "lucide-react";
import { submitFeedback } from "@/actions/feedback";
import { Button } from "@/components/ui/button";

type FeedbackItem = {
    id: string;
    content: string;
    rating: number;
    authorId: string;
    author: { name: string | null; role: string };
    createdAt: Date;
};

interface FeedbackSectionProps {
    feedbacks: FeedbackItem[];
    hasSession: boolean;
}

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

export function FeedbackSection({ feedbacks, hasSession }: FeedbackSectionProps) {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }
        if (!content.trim()) {
            setError("Please write your feedback.");
            return;
        }
        setError("");

        startTransition(async () => {
            const result = await submitFeedback({ content, rating });
            if (result.error) {
                setError(result.error);
            } else {
                setRating(0);
                setContent("");
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Submit Feedback Form — only shown when user has a completed session */}
            {hasSession ? (
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Share Your Experience
                    </h3>

                    <div className="space-y-4">
                        {/* Rating */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                How was your mentorship session?
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
                                placeholder="Share your honest experience — what went well, what could improve, any advice for others..."
                                rows={4}
                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        {/* Submit */}
                        <Button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isPending ? "Submitting..." : "Submit Feedback"}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-dashed shadow-sm p-8 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                        <MessageSquare className="w-7 h-7 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Feedback Locked</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        You&apos;ll be able to share your honest feedback once you have a confirmed mentorship session.
                        Complete the matching process first!
                    </p>
                </div>
            )}

            {/* Past Feedbacks */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Your Past Feedback
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({feedbacks.length})
                    </span>
                </h3>

                {feedbacks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm text-muted-foreground">
                            You haven&apos;t submitted any feedback yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {feedbacks.map((fb) => (
                            <div
                                key={fb.id}
                                className="bg-white rounded-xl border p-5 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <StarRating value={fb.rating} readonly />
                                    <span className="text-xs text-gray-400">
                                        {timeAgo(fb.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {fb.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
