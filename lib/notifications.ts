import nodemailer from "nodemailer";

type MentorRequestNotificationArgs = {
  mentorEmail: string;
  mentorName: string;
  menteeName: string;
  reason: "rank_1" | "promoted_after_rejection";
};

type MenteeAllRejectedNotificationArgs = {
  menteeEmail: string;
  menteeName: string;
};

function getDashboardUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export async function sendMentorRequestNotification({
  mentorEmail,
  mentorName,
  menteeName,
  reason,
}: MentorRequestNotificationArgs) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MENTOR_NOTIFICATION_FROM;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !port || !user || !pass || !from) {
    console.warn("Mentor notification skipped: missing SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, or MENTOR_NOTIFICATION_FROM");
    return { skipped: true as const };
  }

  const dashboardUrl = `${getDashboardUrl()}/dashboard`;
  const subject =
    `New mentorship request from ${menteeName}`;

  const intro = `${menteeName} selected you as a mentor, and the request is now ready for your review.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <p>Hi ${mentorName || "Mentor"},</p>
      <p>${intro}</p>
      <p>Please review the request from your dashboard.</p>
      <p>
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:8px;">
          Open Dashboard
        </a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">
        ENTC Mentorship Portal
      </p>
    </div>
  `;

  const text = [
    `Hi ${mentorName || "Mentor"},`,
    "",
    intro,
    "Please review the request from your dashboard.",
    dashboardUrl,
    "",
    "ENTC Mentorship Portal",
  ].join("\n");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to: mentorEmail,
    subject,
    html,
    text,
  });

  return { skipped: false as const };
}

export async function sendMenteeAllRejectedNotification({
  menteeEmail,
  menteeName,
}: MenteeAllRejectedNotificationArgs) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MENTOR_NOTIFICATION_FROM;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !port || !user || !pass || !from) {
    console.warn("Mentee rejection notification skipped: missing SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, or MENTOR_NOTIFICATION_FROM");
    return { skipped: true as const };
  }

  const dashboardUrl = `${getDashboardUrl()}/dashboard`;
  const subject = "Mentorship update: you can apply again";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <p>Hi ${menteeName || "there"},</p>
      <p>We are sorry to let you know that your current mentor requests were not accepted.</p>
      <p>You can update your mentor preferences and apply again from your dashboard.</p>
      <p>
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:8px;">
          Open Dashboard
        </a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">
        ENTC Mentorship Portal
      </p>
    </div>
  `;

  const text = [
    `Hi ${menteeName || "there"},`,
    "",
    "We are sorry to let you know that your current mentor requests were not accepted.",
    "You can update your mentor preferences and apply again from your dashboard.",
    dashboardUrl,
    "",
    "ENTC Mentorship Portal",
  ].join("\n");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to: menteeEmail,
    subject,
    html,
    text,
  });

  return { skipped: false as const };
}
