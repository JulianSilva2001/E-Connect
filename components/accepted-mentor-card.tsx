import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Linkedin, Mail } from "lucide-react";

export function AcceptedMentorCard({ mentor }: {
    mentor: {
        id: string;
        name: string;
        email: string;
        organization?: string | null;
        jobTitle?: string | null;
        interests: string[];
        bio?: string | null;
        linkedin?: string | null;
        expectations?: string | null;
    };
}) {
    return (
        <Card className="border shadow-sm">
            <CardHeader>
                <CardTitle>{mentor.name}</CardTitle>
                <CardDescription>{mentor.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{mentor.jobTitle || "Mentor"}{mentor.organization ? ` • ${mentor.organization}` : ""}</span>
                </div>

                {mentor.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {mentor.interests.map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                                {interest}
                            </Badge>
                        ))}
                    </div>
                )}

                {mentor.bio ? (
                    <div>
                        <div className="text-sm font-medium mb-1">About</div>
                        <p className="text-sm text-muted-foreground">{mentor.bio}</p>
                    </div>
                ) : null}

                {mentor.expectations ? (
                    <div>
                        <div className="text-sm font-medium mb-1">Expectations</div>
                        <p className="text-sm text-muted-foreground">{mentor.expectations}</p>
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-4 text-sm">
                    <a href={`mailto:${mentor.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                        <Mail className="h-4 w-4" />
                        Contact
                    </a>
                    {mentor.linkedin ? (
                        <a
                            href={mentor.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                        >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                        </a>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
