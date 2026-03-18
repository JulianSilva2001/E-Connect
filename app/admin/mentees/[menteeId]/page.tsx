import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
});

export default async function AdminMenteeDetailPage({
  params,
}: {
  params: Promise<{ menteeId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const { menteeId } = await params;

  const mentee = await db.menteeProfile.findUnique({
    where: { id: menteeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      selections: {
        orderBy: { rank: "asc" },
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!mentee) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      <Navigation variant="dashboard" user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-1">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/admin#all-mentees" className="text-sm text-primary hover:underline">
              Back to admin panel
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {mentee.user.name || "Unknown"}
            </h1>
            <p className="mt-2 text-muted-foreground">{mentee.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              Index {mentee.indexNumber || "-"}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              Batch {mentee.batch || "-"}
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              {mentee.selections.length} preference{mentee.selections.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <DetailBlock label="About Yourself" value={mentee.bio} />
                <DetailBlock label="Why do you need a mentor?" value={mentee.motivation} />
                <DetailBlock label="What is your goal?" value={mentee.goal} />
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Preference Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {mentee.selections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No mentor preferences submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 pr-4 font-semibold">Rank</th>
                          <th className="py-3 pr-4 font-semibold">Mentor</th>
                          <th className="py-3 pr-4 font-semibold">Status</th>
                          <th className="py-3 pr-4 font-semibold">Requested On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mentee.selections.map((selection) => (
                          <tr key={selection.id} className="border-b last:border-b-0">
                            <td className="py-3 pr-4">#{selection.rank}</td>
                            <td className="py-3 pr-4">
                              <div className="font-medium">
                                {selection.mentor.user.name || "Unknown"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selection.mentor.user.email}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <StatusBadge status={selection.status} />
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {dateFormatter.format(new Date(selection.createdAt))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow label="Index Number" value={mentee.indexNumber} />
                <DetailRow label="Contact Number" value={mentee.contactNumber} />
                <DetailRow label="Batch" value={mentee.batch} />
                <DetailRow
                  label="Areas of Interest"
                  value={mentee.interests.length ? mentee.interests.join(", ") : undefined}
                />
                <DetailRow
                  label="Registered On"
                  value={dateFormatter.format(new Date(mentee.user.createdAt))}
                />
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <LinkRow label="LinkedIn" href={mentee.linkedin} />
                <LinkRow label="GitHub" href={mentee.github} />
                <LinkRow label="Portfolio" href={mentee.portfolio} />
                <LinkRow label="CV" href={mentee.cvLink} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{value || "-"}</p>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
        {value || "-"}
      </p>
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm text-primary hover:underline"
        >
          {href}
        </a>
      ) : (
        <p className="mt-1 text-sm text-gray-900">-</p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "ACCEPTED" | "REJECTED" }) {
  if (status === "ACCEPTED") {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Accepted</Badge>;
  }
  if (status === "REJECTED") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
}
