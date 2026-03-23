import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentorAcceptRequestButton } from "@/components/mentor-accept-request-button";
import { MentorDirectAcceptButton } from "@/components/mentor-direct-accept-button";
import { isActionableSelection } from "@/lib/mentor-request-capacity";

export default async function MenteeProfilePage({
  params,
}: {
  params: Promise<{ menteeId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const viewer = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      mentorProfile: {
        select: { id: true },
      },
    },
  });

  const { menteeId } = await params;

  const mentee = await db.menteeProfile.findUnique({
    where: { id: menteeId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      selections: {
        where: {
          status: "ACCEPTED",
        },
        orderBy: {
          createdAt: "desc",
        },
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
    redirect("/dashboard");
  }

  const mentorName =
    mentee.selections[0]?.mentor.user.name || mentee.selections[0]?.mentor.user.email || "No mentor yet";

  let actionableSelectionId: string | null = null;
  if (viewer?.role === "MENTOR" && viewer.mentorProfile?.id) {
    const pendingSelection = await db.selection.findFirst({
      where: {
        menteeId,
        mentorId: viewer.mentorProfile.id,
        status: "PENDING",
      },
      include: {
        mentee: {
          select: {
            preferencesSubmitted: true,
            selections: {
              select: {
                rank: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (
      pendingSelection &&
      isActionableSelection({
        rank: pendingSelection.rank,
        mentee: pendingSelection.mentee,
      })
    ) {
      actionableSelectionId = pendingSelection.id;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col">
      <Navigation variant="dashboard" user={session.user} />

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-1">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-primary hover:underline">
              Back to dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{mentee.user.name || "Unknown"}</h1>
            <p className="mt-2 text-muted-foreground">{mentee.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Batch {mentee.batch || "-"}</Badge>
            <Badge variant="secondary">Index {mentee.indexNumber || "-"}</Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Mentor: {mentorName}</Badge>
          </div>
        </div>

        {actionableSelectionId ? (
          <div className="mb-6">
            <MentorAcceptRequestButton selectionId={actionableSelectionId} />
          </div>
        ) : viewer?.role === "MENTOR" && mentorName === "No mentor yet" ? (
          <div className="mb-6">
            <MentorDirectAcceptButton menteeId={mentee.id} />
          </div>
        ) : null}

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
