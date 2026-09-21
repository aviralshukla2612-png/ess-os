import { NextResponse } from "next/server";
import { prisma, ensureDbReady } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAndSendNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  await ensureDbReady();
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  // STRICT PRIVACY: ONLY OWNER (Super Admin) can access all employee KYC data
  if (authRes.activeRole !== "OWNER") {
    return NextResponse.json({ success: false, error: "Forbidden: Only Owner (Super Admin) has access to employee KYC data" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "ALL";
    const departmentFilter = searchParams.get("department") || "ALL";
    const searchQuery = searchParams.get("search") || "";

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            avatarUrl: true,
            activeRole: true,
          },
        },
        kyc: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let results = employees.map((emp) => {
      const kyc = emp.kyc;
      const hasAnyData = !!(
        kyc && (
          (kyc.aadharNumber && kyc.aadharNumber.trim()) ||
          kyc.aadharFrontUrl ||
          kyc.aadharBackUrl ||
          (kyc.panNumber && kyc.panNumber.trim()) ||
          kyc.panCardUrl ||
          kyc.passportPhotoUrl ||
          kyc.selfieUrl ||
          (kyc.accountNumber && kyc.accountNumber.trim()) ||
          kyc.bankProofUrl
        )
      );

      const status = (kyc && hasAnyData) ? (kyc.status || "NOT_SUBMITTED") : "NOT_SUBMITTED";

      return {
        id: emp.id,
        employeeCode: emp.employeeIdCode,
        userId: emp.userId,
        name: emp.user?.name || "Employee",
        email: emp.user?.email || "",
        department: emp.user?.department || "General",
        designation: emp.user?.designation || "Staff",
        avatarUrl: emp.user?.avatarUrl,
        activeRole: emp.user?.activeRole,
        joiningDate: emp.joiningDate,
        kyc: (kyc && hasAnyData) ? kyc : {
          status: "NOT_SUBMITTED",
          aadharNumber: null,
          aadharFrontUrl: null,
          aadharBackUrl: null,
          panNumber: null,
          panCardUrl: null,
          passportPhotoUrl: null,
          selfieUrl: null,
          bankName: null,
          accountHolderName: null,
          accountNumber: null,
          ifscCode: null,
          bankProofUrl: null,
          rejectionReason: null,
          submittedAt: null,
          reviewedAt: null,
        },
        status,
      };
    });

    // Calculate metrics before applying user search/status filters
    const totalCount = results.length;
    const pendingCount = results.filter((r) => r.status === "PENDING").length;
    const approvedCount = results.filter((r) => r.status === "APPROVED").length;
    const rejectedCount = results.filter((r) => r.status === "REJECTED").length;
    const notSubmittedCount = results.filter((r) => r.status === "NOT_SUBMITTED").length;

    // Apply filters
    if (statusFilter !== "ALL") {
      results = results.filter((r) => r.status === statusFilter);
    }

    if (departmentFilter !== "ALL") {
      results = results.filter((r) => r.department.toLowerCase() === departmentFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.employeeCode.toLowerCase().includes(q) ||
          (r.kyc.aadharNumber && r.kyc.aadharNumber.includes(q)) ||
          (r.kyc.panNumber && r.kyc.panNumber.toLowerCase().includes(q)) ||
          (r.kyc.accountNumber && r.kyc.accountNumber.includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      data: results,
      metrics: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        notSubmitted: notSubmittedCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/kyc error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch KYC records" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  await ensureDbReady();
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  // STRICT PRIVACY: ONLY OWNER (Super Admin) can approve/reject KYC data
  if (authRes.activeRole !== "OWNER") {
    return NextResponse.json({ success: false, error: "Forbidden: Only Owner (Super Admin) can review KYC documents" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { employeeId, action, rejectionReason } = body;

    if (!employeeId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid employeeId or action" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true, kyc: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedKyc = await prisma.employeeKyc.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        status: newStatus,
        rejectionReason: action === "REJECT" ? (rejectionReason || "Documents require resubmission.") : null,
        reviewedAt: new Date(),
        reviewedById: authRes.id,
        isNotified: false,
      },
      update: {
        status: newStatus,
        rejectionReason: action === "REJECT" ? (rejectionReason || "Documents require resubmission.") : null,
        reviewedAt: new Date(),
        reviewedById: authRes.id,
        isNotified: false,
        updatedAt: new Date(),
      },
    });

    // Send notification to employee
    if (employee.userId) {
      try {
        if (action === "APPROVE") {
          await createAndSendNotification({
            recipientId: employee.userId,
            title: "🎉 KYC Documents Approved",
            message: "Admin has verified and approved all your identity and bank documents.",
            type: "KYC_APPROVAL",
            urgency: "HIGH",
            linkUrl: "/kyc",
          });
        } else {
          await createAndSendNotification({
            recipientId: employee.userId,
            title: "⚠️ KYC Verification Action Required",
            message: `Your KYC documents need revision: ${rejectionReason || "Please re-upload clear photos."}`,
            type: "KYC_REJECTION",
            urgency: "HIGH",
            linkUrl: "/kyc",
          });
        }
      } catch (notifErr) {
        console.warn("KYC notification dispatch notice:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: action === "APPROVE" ? "KYC Approved Successfully" : "KYC Rejected with remarks",
      data: updatedKyc,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/kyc error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update KYC status" }, { status: 500 });
  }
}
