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
import { AdminRejectRequestButton } from "@/components/admin-reject-request-button";
import { AdminAcceptRequestButton } from "@/components/admin-accept-request-button";
import { AdminMentorSpotsForm } from "@/components/admin-mentor-spots-form";
import { AdminRegistrationBatchesForm } from "@/components/admin-registration-batches-form";
import { getAllowedMenteeBatches } from "@/lib/registration-batches";

const allocationDateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
});

function isMentorReceivedRequest(selection: {
  rank: number;
  mentee: {
    preferencesSubmitted?: boolean | null;
    selections: Array<{ rank: number; status: "PENDING" | "ACCEPTED" | "REJECTED" }>;
  };
}) {
  if (!selection.mentee.preferencesSubmitted) {
    return false;
  }

  const higherRankedSelections = selection.mentee.selections.filter((item) => item.rank < selection.rank);
  return higherRankedSelections.every((item) => item.status === "REJECTED");
}

type MenteeStatusFilter = "all" | "accepted" | "rejected" | "pending";

function getMenteeStatusFlags(mentee: {
  preferencesSubmitted: boolean;
  selections: Array<{ status: "PENDING" | "ACCEPTED" | "REJECTED" }>;
}) {
  const hasAccepted = mentee.selections.some((selection) => selection.status === "ACCEPTED");
  const hasPending = mentee.selections.some((selection) => selection.status === "PENDING");
  const isRejected =
    mentee.preferencesSubmitted &&
    mentee.selections.length > 0 &&
    mentee.selections.every((selection) => selection.status === "REJECTED");

  return { hasAccepted, hasPending, isRejected };
}

function isTransientDbError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Connection pool") ||
    message.includes("timed out") ||
    message.includes("forcibly closed") ||
    message.includes("RetryableWriteError") ||
    message.includes("Raw query failed")
  );
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withDbRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransientDbError(error)) {
        throw error;
      }

      await sleep(250 * (attempt + 1));
    }
  }

  throw lastError;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ menteeStatus?: string | string[] }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const menteeStatusParam = Array.isArray(resolvedSearchParams?.menteeStatus)
    ? resolvedSearchParams?.menteeStatus[0]
    : resolvedSearchParams?.menteeStatus;
  const menteeStatusFilter: MenteeStatusFilter =
    menteeStatusParam === "accepted" ||
    menteeStatusParam === "rejected" ||
    menteeStatusParam === "pending"
      ? menteeStatusParam
      : "all";

  const [
    allocations,
    mentors,
    mentees,
    allowedMenteeBatches,
  ] = await Promise.all([
    withDbRetry(() =>
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
            selections: {
              select: {
                rank: true,
                status: true,
              },
            },
          },
        },
      },
      })
    ),
    withDbRetry(() =>
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
      })
    ),
    withDbRetry(() =>
      db.menteeProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        selections: {
          select: {
            status: true,
            mentorId: true,
          },
        },
      },
      })
    ),
    getAllowedMenteeBatches(),
  ]);
  const mentorsCount = mentors.length;
  const menteesCount = mentees.length;

  const pendingCount = allocations.filter(
    (item) => item.status === "PENDING" && isMentorReceivedRequest(item)
  ).length;
  const acceptedCount = allocations.filter((item) => item.status === "ACCEPTED").length;
  const fullyRejectedMentees = mentees.filter(
    (mentee) =>
      mentee.preferencesSubmitted &&
      mentee.selections.length > 0 &&
      mentee.selections.every((selection) => selection.status === "REJECTED")
  );
  const fullyRejectedCount = fullyRejectedMentees.length;
  const filteredMentees = mentees.filter((mentee) => {
    const { hasAccepted, hasPending, isRejected } = getMenteeStatusFlags(mentee);

    if (menteeStatusFilter === "accepted") return hasAccepted;
    if (menteeStatusFilter === "rejected") return isRejected;
    if (menteeStatusFilter === "pending") return hasPending;
    return true;
  });

  const mentorAllocationGroups = Array.from(
    allocations
      .filter((item) => item.status === "ACCEPTED")
      .reduce((acc, item) => {
        const key = item.mentor.user.id;
        const current = acc.get(key) ?? {
          mentorId: item.mentor.id,
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
        mentorId: string;
        mentorName: string;
        mentorEmail: string;
        mentees: Array<{ id: string; name: string; email: string; rank: number; createdAt: Date }>;
      }>())
      .values()
  ).sort((a, b) => a.mentorName.localeCompare(b.mentorName));

  const mentorRequestGroups = mentors
    .map((mentor) => ({
      id: mentor.id,
      mentorName: mentor.user.name || "Unknown",
      mentorEmail: mentor.user.email,
      preferredMentees: mentor.preferredMentees,
      requests: allocations
        .filter((item) => item.mentor.id === mentor.id && isMentorReceivedRequest(item))
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }),
    }))
    .sort((a, b) => a.mentorName.localeCompare(b.mentorName));

  const totalSpots = mentors.reduce((sum, mentor) => sum + (mentor.preferredMentees || 0), 0);
  const filledSpots = acceptedCount;
  const mentorNameById = new Map(
    mentors.map((mentor) => [mentor.id, mentor.user.name || mentor.user.email] as const)
  );

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
          <StatCard title="Total Spots" value={totalSpots} />
          <StatCardLink title="Filled Spots" value={filledSpots} href="#allocated-mentees" />
          <StatCardLink title="Pending" value={pendingCount} href="#requests-by-mentor" />
          <StatCard
            title="Rejected"
            value={fullyRejectedCount}
            description="Rejected by all mentors"
          />
        </div>

        <Card className="border shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Registration Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminRegistrationBatchesForm initialValue={allowedMenteeBatches.join(", ")} />
          </CardContent>
        </Card>

        <Card id="allocated-mentees" className="border shadow-sm mb-8 scroll-mt-24">
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
                        <Link
                          href={`/admin/mentors/${group.mentorId}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {group.mentorName}
                        </Link>
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
                              <Link
                                href={`/admin/mentees/${mentee.id}`}
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {mentee.name}
                              </Link>
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

        <Card id="requests-by-mentor" className="border shadow-sm mb-8 scroll-mt-24">
          <CardHeader>
            <CardTitle>Requests by Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            {mentorRequestGroups.length === 0 ? (
              <p className="text-muted-foreground">No mentors found.</p>
            ) : (
              <div className="space-y-4">
                {mentorRequestGroups.map((group) => (
                  <div key={group.id} className="rounded-xl border bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
                      <div>
                        <Link
                          href={`/admin/mentors/${group.id}`}
                          className="font-semibold text-base text-primary hover:underline"
                        >
                          {group.mentorName}
                        </Link>
                        <p className="text-sm text-muted-foreground">{group.mentorEmail}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                          {group.requests.length} received request{group.requests.length === 1 ? "" : "s"}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          Capacity {group.preferredMentees}
                        </Badge>
                      </div>
                    </div>

                    {group.requests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No requests received yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left">
                              <th className="py-3 pr-4 font-semibold">Mentee</th>
                              <th className="py-3 pr-4 font-semibold">Preference</th>
                              <th className="py-3 pr-4 font-semibold">Status</th>
                              <th className="py-3 pr-4 font-semibold">Requested On</th>
                              <th className="py-3 pr-4 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.requests.map((request) => (
                              <tr key={request.id} className="border-b last:border-b-0">
                                <td className="py-3 pr-4">
                                  <div className="font-medium">
                                    <Link
                                      href={`/admin/mentees/${request.mentee.id}`}
                                      className="text-primary hover:underline"
                                    >
                                      {request.mentee.user.name || "Unknown"}
                                    </Link>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{request.mentee.user.email}</div>
                                </td>
                                <td className="py-3 pr-4">#{request.rank}</td>
                                <td className="py-3 pr-4">
                                  <StatusBadge status={request.status} />
                                </td>
                                <td className="py-3 pr-4 text-muted-foreground">
                                  {allocationDateFormatter.format(new Date(request.createdAt))}
                                </td>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <AdminAcceptRequestButton
                                      selectionId={request.id}
                                      menteeLabel={request.mentee.user.name || request.mentee.user.email}
                                      disabled={request.status === "ACCEPTED"}
                                    />
                                    <AdminRejectRequestButton
                                      selectionId={request.id}
                                      menteeLabel={request.mentee.user.name || request.mentee.user.email}
                                      disabled={request.status === "REJECTED"}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
                      <th className="py-3 pr-4 font-semibold">Spots</th>
                      <th className="py-3 pr-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentors.map((mentor) => (
                      <tr key={mentor.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium">
                          <Link
                            href={`/admin/mentors/${mentor.id}`}
                            className="text-primary hover:underline"
                          >
                            {mentor.user.name || "Unknown"}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{mentor.user.email}</td>
                        <td className="py-3 pr-4">{mentor.organization || "-"}</td>
                        <td className="py-3 pr-4">{mentor.jobTitle || "-"}</td>
                        <td className="py-3 pr-4">
                          <AdminMentorSpotsForm
                            mentorId={mentor.id}
                            initialSpots={mentor.preferredMentees || 1}
                          />
                        </td>
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
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <MenteeFilterLink
                    label="All"
                    href="/admin?menteeStatus=all#all-mentees"
                    count={mentees.length}
                    active={menteeStatusFilter === "all"}
                  />
                  <MenteeFilterLink
                    label="Accepted"
                    href="/admin?menteeStatus=accepted#all-mentees"
                    count={mentees.filter((mentee) => getMenteeStatusFlags(mentee).hasAccepted).length}
                    active={menteeStatusFilter === "accepted"}
                  />
                  <MenteeFilterLink
                    label="Rejected"
                    href="/admin?menteeStatus=rejected#all-mentees"
                    count={mentees.filter((mentee) => getMenteeStatusFlags(mentee).isRejected).length}
                    active={menteeStatusFilter === "rejected"}
                  />
                  <MenteeFilterLink
                    label="Pending Requests"
                    href="/admin?menteeStatus=pending#all-mentees"
                    count={mentees.filter((mentee) => getMenteeStatusFlags(mentee).hasPending).length}
                    active={menteeStatusFilter === "pending"}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-3 pr-4 font-semibold">Name</th>
                        <th className="py-3 pr-4 font-semibold">Email</th>
                        <th className="py-3 pr-4 font-semibold">Contact Number</th>
                        <th className="py-3 pr-4 font-semibold">Index Number</th>
                        <th className="py-3 pr-4 font-semibold">Batch</th>
                        <th className="py-3 pr-4 font-semibold">Assigned Mentor(s)</th>
                        <th className="py-3 pr-4 font-semibold">Interests</th>
                        <th className="py-3 pr-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMentees.map((mentee) => {
                        const assignedMentors = mentee.selections
                          .filter((selection) => selection.status === "ACCEPTED")
                          .map((selection) => mentorNameById.get(selection.mentorId) || "Unknown");

                        return (
                          <tr key={mentee.id} className="border-b last:border-b-0">
                            <td className="py-3 pr-4 font-medium">
                              <Link
                                href={`/admin/mentees/${mentee.id}`}
                                className="text-primary hover:underline"
                              >
                                {mentee.user.name || "Unknown"}
                              </Link>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{mentee.user.email}</td>
                            <td className="py-3 pr-4">{mentee.contactNumber || "-"}</td>
                            <td className="py-3 pr-4">{mentee.indexNumber || "-"}</td>
                            <td className="py-3 pr-4">{mentee.batch || "-"}</td>
                            <td className="py-3 pr-4">
                              {assignedMentors.length ? assignedMentors.join(", ") : "-"}
                            </td>
                            <td className="py-3 pr-4">
                              {mentee.interests.length ? mentee.interests.join(", ") : "-"}
                            </td>
                            <td className="py-3 pr-4">
                              <AdminDeleteUserButton
                                userId={mentee.user.id}
                                label={mentee.user.name || mentee.user.email}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredMentees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No mentees match this filter.</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>All Requests Flat View</CardTitle>
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
                          <div className="font-medium">
                            <Link
                              href={`/admin/mentees/${item.mentee.id}`}
                              className="text-primary hover:underline"
                            >
                              {item.mentee.user.name || "Unknown"}
                            </Link>
                          </div>
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
                          {allocationDateFormatter.format(new Date(item.createdAt))}
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

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description?: string;
}) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatCardLink({
  title,
  value,
  href,
  description,
}: {
  title: string;
  value: number;
  href: string;
  description?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="border shadow-sm transition hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
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

function MenteeFilterLink({
  label,
  href,
  count,
  active,
}: {
  label: string;
  href: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <span>{label}</span>
      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">
        {count}
      </Badge>
    </Link>
  );
}
