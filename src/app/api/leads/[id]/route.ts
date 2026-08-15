import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { OR: [{ id: params.id }, { leadNumber: params.id }] },
      include: { followups: true, activities: true },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: body.stage || body.status,
        priority: body.leadPriority || body.priority,
        companyName: body.clientName || body.companyName,
        contactPerson: body.contactPerson,
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.lead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete lead" }, { status: 500 });
  }
}
