import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyAdmins } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Accessible to OWNER, SUB_ADMIN, and SALES
    if (!["OWNER", "SUB_ADMIN", "SALES"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Access restricted" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const filter = searchParams.get("filter") || "ALL"; // ALL, DUE_SOON, ACTIVE, EXPIRED

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const where: any = {};

    if (search) {
      where.OR = [
        { clientName: { contains: search } },
        { mobileNumber: { contains: search } },
        { websiteLink: { contains: search } },
        { websiteDetails: { contains: search } },
      ];
    }

    if (filter === "DUE_SOON") {
      where.serverDate = {
        gte: now,
        lte: thirtyDaysFromNow,
      };
    } else if (filter === "EXPIRED") {
      where.serverDate = {
        lt: now,
      };
    }

    const websites = await prisma.clientWebsite.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

    // Compute stats
    const allRecords = await prisma.clientWebsite.findMany({
      select: { price: true, serverPrice: true, serverDate: true },
    });

    const totalWebsites = allRecords.length;
    const totalWebsiteRevenue = allRecords.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalServerRevenue = allRecords.reduce((sum, item) => sum + (item.serverPrice || 0), 0);
    const renewalsDueSoon = allRecords.filter((item) => {
      if (!item.serverDate) return false;
      const d = new Date(item.serverDate);
      return d >= now && d <= thirtyDaysFromNow;
    }).length;

    return NextResponse.json({
      success: true,
      data: websites,
      stats: {
        totalWebsites,
        totalWebsiteRevenue,
        totalServerRevenue,
        renewalsDueSoon,
      },
    });
  } catch (error: any) {
    console.error("Error fetching client websites:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch client websites" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!["OWNER", "SUB_ADMIN", "SALES"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Sales and Admin only" }, { status: 403 });
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

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ success: false, error: "Client name is required" }, { status: 400 });
    }

    if (!mobileNumber || !mobileNumber.trim()) {
      return NextResponse.json({ success: false, error: "Mobile number is required" }, { status: 400 });
    }

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      return NextResponse.json({ success: false, error: "Mobile number must be exactly 10 digits" }, { status: 400 });
    }

    const newRecord = await prisma.clientWebsite.create({
      data: {
        clientName: clientName.trim(),
        mobileNumber: cleanMobile,
        dateOfDevelopment: dateOfDevelopment ? new Date(dateOfDevelopment) : null,
        websiteLink: websiteLink ? websiteLink.trim() : null,
        websiteDetails: websiteDetails ? websiteDetails.trim() : null,
        price: typeof price === "number" ? price : parseFloat(price || "0") || 0,
        serverDate: serverDate ? new Date(serverDate) : null,
        serverPrice: typeof serverPrice === "number" ? serverPrice : parseFloat(serverPrice || "0") || 0,
        status: status || "ACTIVE",
        createdById: user.id,
      },
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

    // Notify admins if created by salesperson or sub-admin
    notifyAdmins({
      title: `🌐 New Client Website: ${newRecord.clientName}`,
      message: `${user.name} added website & server details for ${newRecord.clientName}. Price: ₹${newRecord.price.toLocaleString("en-IN")}, Server: ₹${newRecord.serverPrice.toLocaleString("en-IN")}.`,
      linkUrl: "/client-websites",
      type: "WEBSITE_CREATED",
      urgency: "MEDIUM",
      metadata: {
        websiteId: newRecord.id,
        clientName: newRecord.clientName,
        price: newRecord.price,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: newRecord });
  } catch (error: any) {
    console.error("Error creating client website record:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to save client website details" }, { status: 500 });
  }
}
