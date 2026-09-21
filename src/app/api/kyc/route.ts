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
        selfieUrl: "",
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

    const existingKyc = await prisma.employeeKyc.findUnique({
      where: { employeeId: employee.id },
    });

    const kycData = {
      aadharNumber: body.aadharNumber !== undefined ? (body.aadharNumber || null) : existingKyc?.aadharNumber || null,
      aadharFrontUrl: body.aadharFrontUrl !== undefined ? (body.aadharFrontUrl || null) : existingKyc?.aadharFrontUrl || null,
      aadharBackUrl: body.aadharBackUrl !== undefined ? (body.aadharBackUrl || null) : existingKyc?.aadharBackUrl || null,
      panNumber: body.panNumber !== undefined ? (body.panNumber ? String(body.panNumber).toUpperCase() : null) : existingKyc?.panNumber || null,
      panCardUrl: body.panCardUrl !== undefined ? (body.panCardUrl || null) : existingKyc?.panCardUrl || null,
      passportPhotoUrl: body.passportPhotoUrl !== undefined ? (body.passportPhotoUrl || null) : existingKyc?.passportPhotoUrl || null,
      selfieUrl: body.selfieUrl !== undefined ? (body.selfieUrl || null) : existingKyc?.selfieUrl || null,
      bankName: body.bankName !== undefined ? (body.bankName || null) : existingKyc?.bankName || null,
      accountHolderName: body.accountHolderName !== undefined ? (body.accountHolderName || null) : existingKyc?.accountHolderName || null,
      accountNumber: body.accountNumber !== undefined ? (body.accountNumber || null) : existingKyc?.accountNumber || null,
      ifscCode: body.ifscCode !== undefined ? (body.ifscCode ? String(body.ifscCode).toUpperCase() : null) : existingKyc?.ifscCode || null,
      bankProofUrl: body.bankProofUrl !== undefined ? (body.bankProofUrl || null) : existingKyc?.bankProofUrl || null,
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

    const allowedKeys = [
      "aadharNumber",
      "aadharFrontUrl",
      "aadharBackUrl",
      "panNumber",
      "panCardUrl",
      "passportPhotoUrl",
      "selfieUrl",
      "bankName",
      "accountHolderName",
      "accountNumber",
      "ifscCode",
      "bankProofUrl",
      "status",
      "isNotified",
    ];

    const patchData: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in body) {
        if (key === "panNumber" || key === "ifscCode") {
          patchData[key] = body[key] ? String(body[key]).toUpperCase() : null;
        } else {
          patchData[key] = body[key] !== undefined ? body[key] : null;
        }
      }
    }

    if (body.markNotified) {
      patchData.isNotified = true;
    }

    const updatedKyc = await prisma.employeeKyc.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        ...patchData,
      },
      update: {
        ...patchData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updatedKyc });
  } catch (error: any) {
    console.error("PATCH /api/kyc error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update KYC" }, { status: 500 });
  }
}
