import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { leadSchema } from "@/lib/validations";
import { notifyAdmins } from "@/lib/notifications";

export async function GET() {
  const authRes = await requireRole(["OWNER", "SALES"], "leads");
  if (authRes instanceof NextResponse) return authRes;

  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        followups: true,
        activities: true,
      },
    });

    const formatted = leads.map((l) => {
      const effectiveGstNo = l.description?.startsWith("GST: ")
        ? l.description.replace("GST: ", "")
        : (l.description || (l.remarks?.startsWith("GST: ") ? l.remarks.replace("GST: ", "") : undefined));
      const effectiveRemarks = l.remarks?.startsWith("GST: ") ? "" : (l.remarks || "");
      return {
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
        gstNo: effectiveGstNo,
        remarks: effectiveRemarks,
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
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch leads from database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "SALES"], "leads");
  if (authRes instanceof NextResponse) return authRes;

  try {
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
    let leadNumber = `LEAD-2026-${String(leadCount + 1).padStart(4, "0")}`;
    const existingLead = await prisma.lead.findUnique({ where: { leadNumber } });
    if (existingLead) {
      leadNumber = `LEAD-2026-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    }

    const newLead = await prisma.lead.create({
      data: {
        leadNumber,
        contactPerson: validData.contactPerson,
        companyName: validData.clientName,
        mobile: validData.phone,
        email: validData.email,
        interestedService: validData.projectScope,
        description: validData.gstNo ? `GST: ${validData.gstNo}` : null,
        estimatedBudget: validData.leadValue,
        expectedValue: validData.expectedRevenue,
        priority: validData.leadPriority,
        status: validData.stage,
        remarks: validData.remarks || null,
        createdById: authRes.id,
      },
    });

    // Notify admins & sales team about new lead
    notifyAdmins({
      title: `💼 New Lead: ${newLead.companyName || newLead.contactPerson}`,
      message: `${validData.contactPerson} - interested in ${validData.projectScope} (Est: ₹${validData.leadValue.toLocaleString("en-IN")}).`,
      linkUrl: "/leads",
      type: "LEAD_CREATED",
      urgency: validData.leadPriority === "HIGH" ? "HIGH" : "MEDIUM",
      metadata: {
        leadId: newLead.id,
        leadNumber: newLead.leadNumber,
      }
    }).catch(() => {});

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
        gstNo: validData.gstNo || undefined,
        remarks: newLead.remarks || "",
        nextFollowupDate: "Tomorrow 10:00 AM",
        leadPriority: newLead.priority,
        notes: [],
        callHistory: [],
        activityHistory: [{ id: Date.now().toString(), time: "Just now", text: "Lead created in CRM pipeline." }],
      },
    });
  } catch (error: any) {
    console.error("Failed to create lead:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create lead" }, { status: 500 });
  }
}
