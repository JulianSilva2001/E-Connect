import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AdminDeleteUserButton } from "@/components/admin-delete-user-button";
import { AdminRegistrationBatchesForm } from "@/components/admin-registration-batches-form";
import { getAllowedMenteeBatches } from "@/lib/registration-batches";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const [
    mentorsCount,
    menteesCount,
    selectionsCount,
    acceptedCount,
    pendingCount,
    rejectedCount,
    allocations,
    mentors,
    mentees,
    allowedMenteeBatches,
  ] = await Promise.all([
    db.mentorProfile.count(),
    db.menteeProfile.count(),
    db.selection.count(),
    db.selection.count({ where: { status: "ACCEPTED" } }),
    db.selection.count({ where: { status: "PENDING" } }),
    db.selection.count({ where: { status: "REJECTED" } }),
    db.selection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        mentee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    db.mentorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    db.menteeProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    getAllowedMenteeBatches(),
  ]);

  const mentorAllocationGroups = Array.from(
    allocations
      .filter((item) => item.status === "ACCEPTED")
      .reduce((acc, item) => {
        const key = item.mentor.user.id;
        const current = acc.get(key) ?? {
          mentorName: item.mentor.user.name || "Unknown",
          mentorEmail: item.mentor.user.email,
          mentees: [] as Array<{
            id: string;
            name: string;
            email: string;
            rank: number;
            createdAt: Date;
          }>,
        };

        current.mentees.push({
          id: item.id,
          name: item.mentee.user.name || "Unknown",
          email: item.mentee.user.email,
          rank: item.rank,
          createdAt: item.createdAt,
        });

        acc.set(key, current);
        return acc;
      }, new Map<string, {
        mentorName: string;
        mentorEmail: string;
        mentees: Array<{ id: string; name: string; email: string; rank: number; createdAt: Date }>;
      }>())
      .values()
  ).sort((a, b) => a.mentorName.localeCompare(b.mentorName));

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      <Navigation variant="dashboard" user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-muted-foreground text-lg">
            Inspect mentor-mentee allocation status and platform activity.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCardLink title="Mentors" value={mentorsCount} href="#all-mentors" />
          <StatCardLink title="Mentees" value={menteesCount} href="#all-mentees" />
          <StatCard title="All Requests" value={selectionsCount} />
          <StatCard title="Accepted" value={acceptedCount} />
          <StatCard title="Pending" value={pendingCount} />
          <StatCard title="Rejected" value={rejectedCount} />
        </div>

        <Card className="border shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Registration Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminRegistrationBatchesForm initialValue={allowedMenteeBatches.join(", ")} />
          </CardContent>
        </Card>

        <Card className="border shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Allocated Mentees by Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            {mentorAllocationGroups.length === 0 ? (
              <p className="text-muted-foreground">No accepted allocations yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentorAllocationGroups.map((group) => (
                  <div key={group.mentorEmail} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold">{group.mentorName}</h3>
                        <p className="text-xs text-muted-foreground">{group.mentorEmail}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {group.mentees.length} mentee{group.mentees.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {group.mentees
                        .sort((a, b) => a.rank - b.rank)
                        .map((mentee) => (
                          <div key={mentee.id} className="rounded-md border p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">{mentee.name}</span>
                              <Badge variant="secondary">Rank {mentee.rank}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{mentee.email}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="all-mentors" className="border shadow-sm mb-8 scroll-mt-24">
          <CardHeader>
            <CardTitle>All Mentors</CardTitle>
          </CardHeader>
          <CardContent>
            {mentors.length === 0 ? (
              <p className="text-muted-foreground">No mentors found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 pr-4 font-semibold">Name</th>
                      <th className="py-3 pr-4 font-semibold">Email</th>
                      <th className="py-3 pr-4 font-semibold">Organization</th>
                      <th className="py-3 pr-4 font-semibold">Job Title</th>
                      <th className="py-3 pr-4 font-semibold">Preferred Mentees</th>
                      <th className="py-3 pr-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((mentor) => (
                      <tr key={mentor.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium">{mentor.user.name || "Unknown"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{mentor.user.email}</td>
                        <td className="py-3 pr-4">{mentor.organization || "-"}</td>
                        <td className="py-3 pr-4">{mentor.jobTitle || "-"}</td>
                        <td className="py-3 pr-4">{mentor.preferredMentees}</td>
                        <td className="py-3 pr-4">
                          <AdminDeleteUserButton
                            userId={mentor.user.id}
                            label={mentor.user.name || mentor.user.email}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="all-mentees" className="border shadow-sm mb-8 scroll-mt-24">
          <CardHeader>
            <CardTitle>All Mentees</CardTitle>
          </CardHeader>
          <CardContent>
            {mentees.length === 0 ? (
              <p className="text-muted-foreground">No mentees found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 pr-4 font-semibold">Name</th>
                      <th className="py-3 pr-4 font-semibold">Email</th>
                      <th className="py-3 pr-4 font-semibold">Batch</th>
                      <th className="py-3 pr-4 font-semibold">Interests</th>
                      <th className="py-3 pr-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentees.map((mentee) => (
                      <tr key={mentee.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium">{mentee.user.name || "Unknown"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{mentee.user.email}</td>
                        <td className="py-3 pr-4">{mentee.batch || "-"}</td>
                        <td className="py-3 pr-4">{mentee.interests.length ? mentee.interests.join(", ") : "-"}</td>
                        <td className="py-3 pr-4">
                          <AdminDeleteUserButton
                            userId={mentee.user.id}
                            label={mentee.user.name || mentee.user.email}
                          />
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
            <CardTitle>Mentor-Mentee Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocations.length === 0 ? (
              <p className="text-muted-foreground">No allocation records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 pr-4 font-semibold">Mentee</th>
                      <th className="py-3 pr-4 font-semibold">Mentor</th>
                      <th className="py-3 pr-4 font-semibold">Rank</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 pr-4 font-semibold">Requested On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{item.mentee.user.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{item.mentee.user.email}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{item.mentor.user.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{item.mentor.user.email}</div>
                        </td>
                        <td className="py-3 pr-4">{item.rank}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function StatCardLink({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="border shadow-sm transition hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
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
