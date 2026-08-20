import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { leadSchema } from "@/lib/validations";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        followups: true,
        activities: true,
      },
    });

    const formatted = leads.map((l) => ({
      id: l.id,
      leadNumber: l.leadNumber,
      clientName: l.companyName || l.contactPerson,
      contactPerson: l.contactPerson,
      email: l.email || "prospect@example.com",
      phone: l.mobile,
      stage: l.status,
      leadValue: l.estimatedBudget,
      expectedRevenue: l.expectedValue,
      projectScope: l.interestedService,
      assignedSales: "Karan Verma",
      gstNo: l.remarks ? l.remarks.replace("GST: ", "") : undefined,
      nextFollowupDate: l.nextFollowupAt ? new Date(l.nextFollowupAt).toLocaleDateString() : "Tomorrow 10:00 AM",
      leadPriority: l.priority,
      notes: [],
      callHistory: l.followups.map((f) => ({
        id: f.id,
        caller: "Karan Verma",
        notes: f.notes || "Call logged",
        date: new Date(f.scheduledAt).toLocaleDateString(),
        outcome: f.result || "Scheduled",
      })),
      activityHistory: l.activities.map((a) => ({
        id: a.id,
        time: new Date(a.createdAt).toLocaleDateString(),
        text: a.action,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch leads from database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Zod validation
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }
    
    const validData = parsed.data;
    const leadCount = await prisma.lead.count();

    const newLead = await prisma.lead.create({
      data: {
        leadNumber: `LEAD-2026-00${leadCount + 1}`,
        contactPerson: validData.contactPerson,
        companyName: validData.clientName,
        mobile: validData.phone,
        email: validData.email,
        interestedService: validData.projectScope,
        estimatedBudget: validData.leadValue,
        expectedValue: validData.expectedRevenue,
        priority: validData.leadPriority,
        status: validData.stage,
        remarks: validData.gstNo ? `GST: ${validData.gstNo}` : null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newLead.id,
        leadNumber: newLead.leadNumber,
        clientName: newLead.companyName,
        contactPerson: newLead.contactPerson,
        email: newLead.email,
        phone: newLead.mobile,
        stage: newLead.status,
        leadValue: newLead.estimatedBudget,
        expectedRevenue: newLead.expectedValue,
        projectScope: newLead.interestedService,
        assignedSales: "Karan Verma",
        gstNo: newLead.remarks ? newLead.remarks.replace("GST: ", "") : undefined,
        nextFollowupDate: "Tomorrow 10:00 AM",
        leadPriority: newLead.priority,
        notes: [],
        callHistory: [],
        activityHistory: [{ id: Date.now().toString(), time: "Just now", text: "Lead created in CRM pipeline." }],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create lead" }, { status: 500 });
  }
}
