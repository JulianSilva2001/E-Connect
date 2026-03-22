import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
});

export default async function AdminMentorDetailPage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const { mentorId } = await params;

  const mentor = await db.mentorProfile.findUnique({
    where: { id: mentorId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          createdAt: true,
        },
      },
      selections: {
        orderBy: { createdAt: "desc" },
        include: {
          mentee: {
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

  if (!mentor) {
    redirect("/admin");
  }

  const assignedMentees = mentor.selections
    .filter((selection) => selection.status === "ACCEPTED")
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      <Navigation variant="dashboard" user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-6xl flex-1">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/admin#all-mentors" className="text-sm text-primary hover:underline">
              Back to admin panel
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{mentor.user.name || "Unknown"}</h1>
            <p className="mt-2 text-muted-foreground">{mentor.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              Capacity {mentor.preferredMentees}
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              {assignedMentees.length} assigned mentee{assignedMentees.length === 1 ? "" : "s"}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              Registered {dateFormatter.format(new Date(mentor.user.createdAt))}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Assigned Mentees</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedMentees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No mentees assigned yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 pr-4 font-semibold">Mentee</th>
                          <th className="py-3 pr-4 font-semibold">Contact Number</th>
                          <th className="py-3 pr-4 font-semibold">Batch</th>
                          <th className="py-3 pr-4 font-semibold">Rank</th>
                          <th className="py-3 pr-4 font-semibold">Accepted On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedMentees.map((selection) => (
                          <tr key={selection.id} className="border-b last:border-b-0">
                            <td className="py-3 pr-4">
                              <div className="font-medium">
                                <Link
                                  href={`/admin/mentees/${selection.mentee.id}`}
                                  className="text-primary hover:underline"
                                >
                                  {selection.mentee.user.name || "Unknown"}
                                </Link>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selection.mentee.user.email}
                              </div>
                            </td>
                            <td className="py-3 pr-4">{selection.mentee.contactNumber || "-"}</td>
                            <td className="py-3 pr-4">{selection.mentee.batch || "-"}</td>
                            <td className="py-3 pr-4">#{selection.rank}</td>
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

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>All Requests for This Mentor</CardTitle>
              </CardHeader>
              <CardContent>
                {mentor.selections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No requests yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 pr-4 font-semibold">Mentee</th>
                          <th className="py-3 pr-4 font-semibold">Rank</th>
                          <th className="py-3 pr-4 font-semibold">Status</th>
                          <th className="py-3 pr-4 font-semibold">Requested On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mentor.selections.map((selection) => (
                          <tr key={selection.id} className="border-b last:border-b-0">
                            <td className="py-3 pr-4">
                              <Link
                                href={`/admin/mentees/${selection.mentee.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {selection.mentee.user.name || "Unknown"}
                              </Link>
                            </td>
                            <td className="py-3 pr-4">#{selection.rank}</td>
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
                <CardTitle>Mentor Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow label="Contact Number" value={mentor.contactNumber} />
                <DetailRow label="Organization" value={mentor.organization} />
                <DetailRow label="Job Title" value={mentor.jobTitle} />
                <DetailRow
                  label="Graduation Year"
                  value={mentor.graduationYear ? String(mentor.graduationYear) : undefined}
                />
                <DetailRow
                  label="Expertise"
                  value={mentor.expertise.length ? mentor.expertise.join(", ") : undefined}
                />
                <DetailRow label="LinkedIn" value={mentor.linkedIn} isLink />
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <DetailBlock label="Bio" value={mentor.bio} />
                <DetailBlock label="Expectations" value={mentor.expectations} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLink,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {isLink && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm text-gray-900">{value || "-"}</p>
      )}
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

function StatusBadge({ status }: { status: "PENDING" | "ACCEPTED" | "REJECTED" }) {
  if (status === "ACCEPTED") {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Accepted</Badge>;
  }
  if (status === "REJECTED") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
}
