import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!["OWNER", "SUB_ADMIN", "SALES"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Access restricted" }, { status: 403 });
    }

    const website = await prisma.clientWebsite.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            activeRole: true,
          },
        },
      },
    });

    if (!website) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: website });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch record" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!["OWNER", "SUB_ADMIN", "SALES"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Access restricted" }, { status: 403 });
    }

    const body = await req.json();
    const {
      clientName,
      mobileNumber,
      dateOfDevelopment,
      websiteLink,
      websiteDetails,
      price,
      serverDate,
      serverPrice,
      status,
    } = body;

    const existing = await prisma.clientWebsite.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (clientName !== undefined) updateData.clientName = clientName.trim();
    if (mobileNumber !== undefined) {
      const cleanMobile = mobileNumber.replace(/\D/g, "");
      if (cleanMobile.length !== 10) {
        return NextResponse.json({ success: false, error: "Mobile number must be exactly 10 digits" }, { status: 400 });
      }
      updateData.mobileNumber = cleanMobile;
    }
    if (dateOfDevelopment !== undefined) {
      updateData.dateOfDevelopment = dateOfDevelopment ? new Date(dateOfDevelopment) : null;
    }
    if (websiteLink !== undefined) updateData.websiteLink = websiteLink ? websiteLink.trim() : null;
    if (websiteDetails !== undefined) updateData.websiteDetails = websiteDetails ? websiteDetails.trim() : null;
    if (price !== undefined) updateData.price = typeof price === "number" ? price : parseFloat(price || "0") || 0;
    if (serverDate !== undefined) {
      updateData.serverDate = serverDate ? new Date(serverDate) : null;
    }
    if (serverPrice !== undefined) {
      updateData.serverPrice = typeof serverPrice === "number" ? serverPrice : parseFloat(serverPrice || "0") || 0;
    }
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.clientWebsite.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            activeRole: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error updating client website:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!["OWNER", "SUB_ADMIN", "SALES"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Access restricted" }, { status: 403 });
    }

    const existing = await prisma.clientWebsite.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    // Sales can delete their own, Owner/Sub-Admin can delete any
    if (user.activeRole === "SALES" && existing.createdById !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only delete records you created" }, { status: 403 });
    }

    await prisma.clientWebsite.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting client website:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete record" }, { status: 500 });
  }
}
