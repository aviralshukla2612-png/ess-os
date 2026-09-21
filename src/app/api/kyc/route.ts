import { NextResponse } from "next/server";
import { prisma, ensureDbReady } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  await ensureDbReady();
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: authRes.id },
          ...(authRes.employeeId ? [{ id: authRes.employeeId }] : []),
        ],
      },
      include: {
        kyc: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: employee.kyc || {
        status: "NOT_SUBMITTED",
        aadharNumber: "",
        aadharFrontUrl: "",
        aadharBackUrl: "",
        panNumber: "",
        panCardUrl: "",
        passportPhotoUrl: "",
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankProofUrl: "",
        rejectionReason: null,
        isNotified: false,
      },
      employee: {
        id: employee.id,
        name: employee.user?.name,
        email: employee.user?.email,
        employeeCode: employee.employeeIdCode,
        department: employee.user?.department,
        designation: employee.user?.designation,
      },
    });
  } catch (error: any) {
    console.error("GET /api/kyc error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch KYC data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await ensureDbReady();
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: authRes.id },
          ...(authRes.employeeId ? [{ id: authRes.employeeId }] : []),
        ],
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    const kycData = {
      aadharNumber: body.aadharNumber || null,
      aadharFrontUrl: body.aadharFrontUrl || null,
      aadharBackUrl: body.aadharBackUrl || null,
      panNumber: body.panNumber ? body.panNumber.toUpperCase() : null,
      panCardUrl: body.panCardUrl || null,
      passportPhotoUrl: body.passportPhotoUrl || null,
      bankName: body.bankName || null,
      accountHolderName: body.accountHolderName || null,
      accountNumber: body.accountNumber || null,
      ifscCode: body.ifscCode ? body.ifscCode.toUpperCase() : null,
      bankProofUrl: body.bankProofUrl || null,
      status: "PENDING",
      rejectionReason: null,
      submittedAt: new Date(),
      isNotified: false,
    };

    const updatedKyc = await prisma.employeeKyc.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        ...kycData,
      },
      update: {
        ...kycData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "KYC documents submitted successfully for Admin verification",
      data: updatedKyc,
    });
  } catch (error: any) {
    console.error("POST /api/kyc error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to submit KYC data" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  await ensureDbReady();
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: authRes.id },
          ...(authRes.employeeId ? [{ id: authRes.employeeId }] : []),
        ],
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    if (body.markNotified) {
      await prisma.employeeKyc.update({
        where: { employeeId: employee.id },
        data: { isNotified: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/kyc error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update KYC" }, { status: 500 });
  }
}
