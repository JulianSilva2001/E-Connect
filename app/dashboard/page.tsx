
import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MentorBrowser } from "@/components/mentor-browser";
import { RequestCard } from "@/components/request-card";
import { AcceptedMenteeCard } from "@/components/accepted-mentee-card";
import { getMentors, getMentorRequests, processMentorshipRequest, getAcceptedMentees } from "@/actions/mentorship";
import { User, MenteeProfile } from "@prisma/client";
import { Target, BookOpen, Clock, Lightbulb, Briefcase, Users, CheckCircle2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
            menteeProfile: {
                include: {
                    selections: {
                        include: {
                            mentor: {
                                include: {
                                    user: true
                                }
                            }
                        },
                        orderBy: {
                            rank: 'asc'
                        }
                    }
                }
            },
            mentorProfile: true
        }
    });

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full text-center">
                    <h1 className="text-xl font-bold mb-2 text-destructive">Account Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        Your account record was not found in the database. This can happen after a system reset.
                        Please sign out and register again.
                    </p>
                    <form action={async () => {
                        "use server"
                        await signOut({ redirectTo: "/register" })
                    }}>
                        <Button variant="destructive" className="w-full">Sign Out & Register</Button>
                    </form>
                </div>
            </div>
        )
    }
    // Fetch data based on role
    let allMentors = [];
    let allMentees: (User & { menteeProfile: MenteeProfile | null })[] = [];

    // Always fetch mentors for both roles (Mentors want to see other mentors, Mentees need to select)
    allMentors = await getMentors();

    if (user.role === 'MENTOR') {
        // We might still want mentees for "My Mentees" later, but for now user said "show other mentors instead of students"
        // keeping the "My Mentees" tab placeholder logic for now but the "Browse" part changes.
    }

    const mentorRequests = user.role === 'MENTOR' ? await getMentorRequests() : [];
    const myMentees = user.role === 'MENTOR' ? await getAcceptedMentees() : [];

    return (
        <div className="min-h-screen bg-neutral-50/50 flex flex-col">
            <Navigation variant="dashboard" user={user} />

            <main className="container mx-auto px-4 py-8 max-w-6xl flex-1">
                {/* Hero Welcome */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your mentorship journey and preferences.
                    </p>
                </div>

                <Tabs defaultValue={user.role === 'MENTOR' ? "requests" : "instructions"} className="w-full space-y-8">
                    <TabsList className="bg-white border p-1 rounded-xl shadow-sm inline-flex h-auto gap-1">
                        <TabsTrigger
                            value="instructions"
                            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-2 transition-all"
                        >
                            Program Guide
                        </TabsTrigger>
                        {user.role === 'MENTEE' ? (
                            <TabsTrigger
                                value="select-mentors"
                                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-2 transition-all"
                            >
                                Select Mentors
                            </TabsTrigger>
                        ) : (
                            <>
                                <TabsTrigger value="requests" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-2 transition-all">
                                    Requests
                                    <Badge className="ml-2 bg-primary text-white hover:bg-primary">{mentorRequests.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="my-mentees"
                                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-2 transition-all"
                                >
                                    My Mentees
                                </TabsTrigger>
                                <TabsTrigger
                                    value="browse-mentors" // Changed from browse-mentees
                                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-2 transition-all"
                                >
                                    Other Mentors
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    <TabsContent value="instructions" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                        {user.role === 'MENTEE' ? (
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Welcome Card */}
                                <div className="md:col-span-2 bg-white rounded-2xl p-8 border shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(' ')[0]}!</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <p className="text-gray-600 leading-relaxed">
                                            You are currently in the <strong>Preference Selection Phase</strong>. Please review the available mentors and select your top 5 choices. This helps us ensure the best possible match for your academic goals.
                                        </p>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
                                                <div className="font-semibold text-gray-900 mb-1">Step 1</div>
                                                <div className="text-sm text-gray-500">Go to "Select Mentors" tab</div>
                                            </div>
                                            <div className="p-4 bg-muted/30 rounded-xl border border-dashed">
                                                <div className="font-semibold text-gray-900 mb-1">Step 2</div>
                                                <div className="text-sm text-gray-500">Pick up to 5 Preferences</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Card */}
                                <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-8 text-white shadow-lg">
                                    <h3 className="text-lg font-semibold mb-4 opacity-90">Current Status</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-3xl font-bold mb-1">Active</div>
                                            <div className="text-primary-foreground/80 text-sm">Selection Period</div>
                                        </div>

                                        {user.role === 'MENTEE' && (
                                            <div>
                                                <div className="text-sm font-medium opacity-80 mb-2">Your Selections</div>
                                                <div className="text-2xl font-bold">
                                                    {user.menteeProfile?.selections?.length || 0} / 5
                                                </div>
                                                <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
                                                    <div
                                                        className="bg-white h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${((user.menteeProfile?.selections?.length || 0) / 5) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Program Introduction & Objectives */}
                                <div className="bg-white rounded-2xl border shadow-sm p-8">
                                    <h2 className="text-2xl font-bold mb-6">Program Objectives</h2>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <ObjectiveItem
                                            icon={<Target className="w-6 h-6" />}
                                            title="Guidance"
                                            description="Personalized career & research advice."
                                        />
                                        <ObjectiveItem
                                            icon={<Briefcase className="w-6 h-6" />}
                                            title="Career"
                                            description="Identify paths before graduation."
                                        />
                                        <ObjectiveItem
                                            icon={<Lightbulb className="w-6 h-6" />}
                                            title="Skills"
                                            description="Develop industry-relevant skills."
                                        />
                                        <ObjectiveItem
                                            icon={<Users className="w-6 h-6" />}
                                            title="Network"
                                            description="Foster professional relationships."
                                        />
                                    </div>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="bg-white rounded-2xl border shadow-sm p-8 h-full">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-bold">Expectations from Mentors</h3>
                                        </div>
                                        <ul className="space-y-4 text-gray-600">
                                            <li className="flex gap-3"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Start-ups & Entrepreneurship: Guidance on validating ideas and starting new businesses.</li>
                                            <li className="flex gap-3"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Academic Research: Assisting students interested in publishing papers and higher studies.</li>
                                            <li className="flex gap-3"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Career Development: Helping mentees navigate the industry and define their career paths.</li>
                                            <li className="flex gap-3"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />Skill Building: Offering constructive feedback on technical projects and soft skills.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="bg-white rounded-2xl border shadow-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-bold">Time Commitment</h3>
                                            </div>
                                            <ul className="space-y-3 text-gray-600">
                                                <li className="flex gap-2"><span className="font-semibold text-primary">Frequency:</span> At least once every two weeks is recommended.</li>
                                                <li className="flex gap-2"><span className="font-semibold text-primary">Mode:</span> Online or in-person.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* Selections List */}
                        {user.role === 'MENTEE' && user.menteeProfile?.selections && user.menteeProfile.selections.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 p-1.5 rounded-md">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </span>
                                    Your Top Choices
                                </h3>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {user.menteeProfile.selections.map((s) => (
                                        <div key={s.id} className="group bg-white p-4 rounded-xl border hover:border-primary/50 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="secondary" className="font-bold">Rank {s.rank}</Badge>
                                                {s.rank === 1 && <span className="text-xs font-medium text-yellow-600 flex items-center gap-1">⭐ Top Pick</span>}
                                            </div>
                                            <div className="font-semibold text-gray-900 text-lg group-hover:text-primary transition-colors">
                                                {s.mentor.user.name}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                {s.mentor.bio}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {user.role === 'MENTEE' && (
                        <TabsContent value="select-mentors" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <MentorBrowser
                                initialMentors={allMentors as any}
                                selections={user.menteeProfile?.selections?.map(s => ({
                                    mentorId: s.mentorId,
                                    rank: s.rank
                                })) || []}
                            />
                        </TabsContent>
                    )}

                    {user.role === 'MENTOR' && (
                        <>
                            <TabsContent value="requests" className="mt-6">
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold mb-2">Pending Requests</h2>
                                    <p className="text-muted-foreground">
                                        Respond to mentorship requests. You can accept up to your capacity.
                                        Rejection passes the request to the mentee's next choice.
                                    </p>
                                </div>
                                {mentorRequests.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                                        <p className="text-muted-foreground">No pending requests at the moment.</p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {mentorRequests.map((req: any) => (
                                            <RequestCard key={req.id} req={req} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="my-mentees" className="mt-6">
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold mb-2">My Mentees</h2>
                                    <p className="text-muted-foreground">
                                        These students have been successfully matched with you.
                                    </p>
                                </div>
                                {myMentees.length === 0 ? (
                                    <div className="bg-white p-6 rounded-xl shadow-sm border min-h-[200px] flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="bg-yellow-100 text-yellow-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-lg font-medium">No mentees yet</h3>
                                            <p className="text-muted-foreground mt-2">Accept requests to build your mentorship group.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {myMentees.map((mentee: any) => (
                                            <AcceptedMenteeCard key={mentee.id} mentee={mentee} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="browse-mentors" className="mt-6">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {allMentors.filter(m => m.userId !== user.id).map((mentor) => (
                                        <div key={mentor.userId} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {mentor.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{mentor.name}</h3>
                                                    <div className="text-sm text-muted-foreground flex flex-col">
                                                        <span>{mentor.jobTitle}</span>
                                                        <span className="text-xs opacity-80">{mentor.organization}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mt-2">{mentor.bio}</p>

                                            <div className="mt-4">
                                                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Fields of Expertise</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {mentor.interests?.map((exp: string) => (
                                                        <Badge key={exp} variant="secondary" className="text-xs">
                                                            {exp}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {allMentors.length <= 1 && (
                                        <div className="col-span-full text-center py-12 text-muted-foreground">
                                            No other mentors registered yet.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </main>
            <Footer />
        </div>
    );
}

function ObjectiveItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50 border">
            <div className="text-primary mb-3">
                {icon}
            </div>
            <h4 className="font-semibold mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

function FocusCard({ year, title, points, color }: { year: string, title: string, points: string[], color: string }) {
    return (
        <div className={`p-6 rounded-xl border ${color}`}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">{year}</div>
            <h4 className="text-lg font-bold mb-3">{title}</h4>
            <ul className="space-y-2">
                {points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm opacity-90">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 opacity-70" /> {p}
                    </li>
                ))}
            </ul>
        </div>
    )
}
