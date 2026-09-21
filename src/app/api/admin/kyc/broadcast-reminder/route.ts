import { NextResponse } from "next/server";
import { prisma, ensureDbReady } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAndSendNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  await ensureDbReady();
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  // STRICT PRIVACY: ONLY OWNER (Admin) can broadcast reminders
  if (authRes.activeRole !== "OWNER") {
    return NextResponse.json({ success: false, error: "Forbidden: Only Admin can broadcast KYC reminders" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const deadlineText = body.deadline || "23 September";

    // Find all active employees
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: { user: true, kyc: true },
    });

    let sentCount = 0;

    for (const emp of employees) {
      // Send to employees whose KYC is not yet approved
      if (emp.userId && emp.kyc?.status !== "APPROVED") {
        try {
          await createAndSendNotification({
            recipientId: emp.userId,
            title: `🚨 Mandatory KYC Submission (Deadline: ${deadlineText})`,
            message: `Please upload your Aadhaar Card (front & back), PAN Card, Passport photograph, and Bank Account details before ${deadlineText} for identity verification and payroll processing.`,
            type: "KYC_REMINDER",
            urgency: "HIGH",
            linkUrl: "/kyc",
          });
          sentCount++;
        } catch (notifErr) {
          console.warn("Failed to dispatch notification to", emp.userId, notifErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `KYC reminder broadcasted successfully to ${sentCount} staff members.`,
      sentCount,
    });
  } catch (error: any) {
    console.error("POST /api/admin/kyc/broadcast-reminder error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to broadcast reminder" }, { status: 500 });
  }
}
