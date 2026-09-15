import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const lead = await prisma.lead.findFirst({
      where: { OR: [{ id: params.id }, { leadNumber: params.id }] },
      include: { followups: true, activities: true },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const effectiveGstNo = lead.description?.startsWith("GST: ")
      ? lead.description.replace("GST: ", "")
      : (lead.description || (lead.remarks?.startsWith("GST: ") ? lead.remarks.replace("GST: ", "") : undefined));
    const effectiveRemarks = lead.remarks?.startsWith("GST: ") ? "" : (lead.remarks || "");

    return NextResponse.json({
      success: true,
      data: {
        ...lead,
        remarks: effectiveRemarks,
        gstNo: effectiveGstNo,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const existing = await prisma.lead.findFirst({
      where: { OR: [{ id: params.id }, { leadNumber: params.id }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.stage !== undefined || body.status !== undefined) {
      updateData.status = body.stage || body.status;
    }
    if (body.leadPriority !== undefined || body.priority !== undefined) {
      updateData.priority = body.leadPriority || body.priority;
    }
    if (body.clientName !== undefined || body.companyName !== undefined) {
      updateData.companyName = body.clientName !== undefined ? body.clientName : body.companyName;
    }
    if (body.contactPerson !== undefined) {
      updateData.contactPerson = body.contactPerson;
    }
    if (body.phone !== undefined || body.mobile !== undefined) {
      updateData.mobile = body.phone !== undefined ? body.phone : body.mobile;
    }
    if (body.email !== undefined) {
      updateData.email = body.email;
    }
    if (body.projectScope !== undefined || body.interestedService !== undefined) {
      updateData.interestedService = body.projectScope !== undefined ? body.projectScope : body.interestedService;
    }
    if (body.leadValue !== undefined || body.estimatedBudget !== undefined) {
      const val = Number(body.leadValue !== undefined ? body.leadValue : body.estimatedBudget);
      if (!isNaN(val)) updateData.estimatedBudget = val;
    }
    if (body.expectedRevenue !== undefined || body.expectedValue !== undefined) {
      const val = Number(body.expectedRevenue !== undefined ? body.expectedRevenue : body.expectedValue);
      if (!isNaN(val)) updateData.expectedValue = val;
    }
    if (body.gstNo !== undefined) {
      updateData.description = body.gstNo ? `GST: ${body.gstNo}` : null;
    }
    if (body.remarks !== undefined) {
      updateData.remarks = body.remarks;
    }

    const lead = await prisma.lead.update({
      where: { id: existing.id },
      data: updateData,
    });

    try {
      await prisma.leadActivity.create({
        data: {
          leadId: existing.id,
          actorId: authRes.id,
          action: "LEAD_UPDATED",
          detailsJson: `Lead updated: ${lead.companyName || lead.contactPerson}`,
        },
      });
    } catch {
      // Activity logging optional failure
    }

    const effectiveGstNo = lead.description?.startsWith("GST: ")
      ? lead.description.replace("GST: ", "")
      : (lead.description || (lead.remarks?.startsWith("GST: ") ? lead.remarks.replace("GST: ", "") : undefined));
    const effectiveRemarks = lead.remarks?.startsWith("GST: ") ? "" : (lead.remarks || "");

    return NextResponse.json({
      success: true,
      data: {
        id: lead.id,
        leadNumber: lead.leadNumber,
        clientName: lead.companyName || lead.contactPerson,
        contactPerson: lead.contactPerson,
        email: lead.email || "prospect@example.com",
        phone: lead.mobile,
        stage: lead.status,
        leadValue: lead.estimatedBudget,
        expectedRevenue: lead.expectedValue,
        projectScope: lead.interestedService,
        assignedSales: "Karan Verma",
        gstNo: effectiveGstNo,
        remarks: effectiveRemarks,
        nextFollowupDate: lead.nextFollowupAt ? new Date(lead.nextFollowupAt).toLocaleDateString() : "Tomorrow 10:00 AM",
        leadPriority: lead.priority,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    await prisma.lead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete lead" }, { status: 500 });
  }
}
