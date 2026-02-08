"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown, ChevronUp, Linkedin, Github, Globe, FileText } from "lucide-react";
import { processMentorshipRequest } from "@/actions/mentorship";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RequestCard({ req }: { req: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleAction = async (action: "ACCEPT" | "REJECT") => {
        setLoading(true);
        try {
            const res = await processMentorshipRequest(req.id, action);
            if (res.error) {
                toast.error(res.error);
            } else if (res.success) {
                toast.success(res.success);
                router.refresh();
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="transition-all duration-300">
            <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {req.menteeName}
                        </CardTitle>
                        <CardDescription>Batch of {req.menteeBatch}</CardDescription>
                    </div>
                    <Badge variant="outline">Rank #{req.rank}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    {req.menteeInterests.map((i: string) => (
                        <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                    ))}
                </div>

                {expanded && (
                    <div className="space-y-4 pt-4 border-t border-border animate-in fade-in-50 slide-in-from-top-1">
                        {req.bio && (
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">About:</span>
                                <p className="text-muted-foreground">{req.bio}</p>
                            </div>
                        )}

                        {req.motivation && (
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Motivation:</span>
                                <p className="text-muted-foreground">{req.motivation}</p>
                            </div>
                        )}

                        {req.goal && (
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Goals:</span>
                                <p className="text-muted-foreground">{req.goal}</p>
                            </div>
                        )}

                        {/* Links Section */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            {req.linkedin && (
                                <a href={req.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                    <Linkedin className="h-3 w-3" /> LinkedIn
                                </a>
                            )}
                            {req.github && (
                                <a href={req.github} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-foreground hover:underline">
                                    <Github className="h-3 w-3" /> GitHub
                                </a>
                            )}
                            {req.portfolio && (
                                <a href={req.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-purple-600 hover:underline">
                                    <Globe className="h-3 w-3" /> Portfolio
                                </a>
                            )}
                            {req.cvLink && (
                                <a href={req.cvLink} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-red-600 hover:underline">
                                    <FileText className="h-3 w-3" /> CV / Resume
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button variant="ghost" onClick={() => setExpanded(!expanded)} className="w-full" size="sm">
                    {expanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {expanded ? "Hide Details" : "View Details"}
                </Button>
                <div className="flex gap-2 w-full">
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleAction("ACCEPT"); }}
                        disabled={loading}
                    >
                        <Check className="w-4 h-4 mr-2" /> Accept
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleAction("REJECT"); }}
                        disabled={loading}
                    >
                        <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
