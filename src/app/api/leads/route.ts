import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await req.json();
    const leadCount = await prisma.lead.count();
    const salesUser = await prisma.user.findFirst({ where: { activeRole: "SALES" } }) || await prisma.user.findFirst();

    const newLead = await prisma.lead.create({
      data: {
        leadNumber: `LEAD-2026-00${leadCount + 1}`,
        contactPerson: body.contactPerson || "Primary Contact",
        companyName: body.clientName || "New Prospect",
        mobile: body.phone || "+91 98000 00000",
        email: body.email || "prospect@example.com",
        interestedService: body.projectScope || "Custom Business Application",
        estimatedBudget: body.leadValue || 250000,
        expectedValue: body.expectedRevenue || 200000,
        priority: body.leadPriority || "HIGH",
        status: body.stage || "NEW",
        createdById: salesUser!.id,
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
