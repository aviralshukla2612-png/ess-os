import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const client = await prisma.client.findFirst({
      where: { OR: [{ id: params.id }, { clientNumber: params.id }] },
      include: { contacts: true, projects: true, invoices: true },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        notes: body.notes,
        totalBusiness: body.totalBusiness,
        outstandingBalance: body.outstandingBalance,
      },
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete client" }, { status: 500 });
  }
}
