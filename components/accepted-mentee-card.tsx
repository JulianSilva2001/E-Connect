"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Linkedin, Github, Globe, FileText, Mail, Phone } from "lucide-react";
import { useState } from "react";

interface AcceptedMenteeCardProps {
    mentee: {
        id: string;
        name: string;
        email: string;
        indexNumber?: string | null;
        contactNumber?: string | null;
        batch: string;
        interests: string[];
        bio?: string;
        motivation?: string;
        goal?: string;
        portfolio?: string;
        cvLink?: string;
        github?: string;
        linkedin?: string;
    }
}

export function AcceptedMenteeCard({ mentee }: AcceptedMenteeCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card className="transition-all duration-300">
            <div className="h-2 bg-green-500 w-full" />
            <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {mentee.name}
                            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </CardTitle>
                        <CardDescription>{mentee.email}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Batch:</span>
                        <span className="font-medium">{mentee.batch}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Index Number:</span>
                        <span className="font-medium">{mentee.indexNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contact Number:</span>
                        <span className="font-medium">{mentee.contactNumber || "-"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {mentee.interests.map((i: string) => (
                            <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                        ))}
                    </div>
                </div>

                {expanded && (
                    <div className="space-y-4 pt-4 border-t border-border mt-4 animate-in fade-in-50 slide-in-from-top-1">
                        {mentee.bio && (
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">About:</span>
                                <p className="text-muted-foreground">{mentee.bio}</p>
                            </div>
                        )}

                        {mentee.motivation && (
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Motivation:</span>
                                <p className="text-muted-foreground">{mentee.motivation}</p>
                            </div>
                        )}

                        {mentee.goal && (
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Goals:</span>
                                <p className="text-muted-foreground">{mentee.goal}</p>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Email:</span>
                                <p className="text-muted-foreground break-all">{mentee.email}</p>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Contact Number:</span>
                                <p className="text-muted-foreground">{mentee.contactNumber || "-"}</p>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Batch:</span>
                                <p className="text-muted-foreground">{mentee.batch || "-"}</p>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold block text-foreground">Index Number:</span>
                                <p className="text-muted-foreground">{mentee.indexNumber || "-"}</p>
                            </div>
                        </div>

                        {/* Links Section */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <a href={`mailto:${mentee.email}`} className="text-xs flex items-center gap-1 text-primary hover:underline">
                                <Mail className="h-3 w-3" /> Email
                            </a>
                            {mentee.contactNumber && (
                                <a href={`tel:${mentee.contactNumber}`} className="text-xs flex items-center gap-1 text-emerald-600 hover:underline">
                                    <Phone className="h-3 w-3" /> Call
                                </a>
                            )}
                            {mentee.linkedin && (
                                <a href={mentee.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                    <Linkedin className="h-3 w-3" /> LinkedIn
                                </a>
                            )}
                            {mentee.github && (
                                <a href={mentee.github} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-foreground hover:underline">
                                    <Github className="h-3 w-3" /> GitHub
                                </a>
                            )}
                            {mentee.portfolio && (
                                <a href={mentee.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-purple-600 hover:underline">
                                    <Globe className="h-3 w-3" /> Portfolio
                                </a>
                            )}
                            {mentee.cvLink && (
                                <a href={mentee.cvLink} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-red-600 hover:underline">
                                    <FileText className="h-3 w-3" /> CV / Resume
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <div className="grid w-full gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="w-full" asChild>
                        <a href={`mailto:${mentee.email}`}>Email Student</a>
                    </Button>
                    {mentee.contactNumber ? (
                        <Button variant="outline" className="w-full" asChild>
                            <a href={`tel:${mentee.contactNumber}`}>Call Student</a>
                        </Button>
                    ) : null}
                </div>
            </CardFooter>
        </Card>
    );
}
