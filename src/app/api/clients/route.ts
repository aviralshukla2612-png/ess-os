import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { clientSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        contacts: true,
        projects: true,
        invoices: true,
      },
    });

    const formatted = clients.map((c) => ({
      id: c.id,
      clientCode: c.clientNumber,
      companyName: c.companyName,
      contactPerson: c.contacts[0]?.name || "Primary Contact",
      email: c.email,
      phone: c.phone,
      industry: "E-Commerce & Technology",
      totalBilling: c.totalBusiness,
      paidBilling: c.totalBusiness - c.outstandingBalance,
      pendingBilling: c.outstandingBalance,
      status: "ACTIVE",
      portalToken: `token-${c.id}`,
      activeProjects: c.projects.map((p) => p.id),
      completedProjects: [],
      invoices: c.invoices.map((i) => i.id),
      notes: c.notes ? [{ id: "n1", author: "Rahul MDZ", text: c.notes, time: "Aug 1" }] : [],
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch clients from database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    
    // Zod validation
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }
    
    const validData = parsed.data;
    const clientCount = await prisma.client.count();

    const newClient = await prisma.client.create({
      data: {
        clientNumber: `CLT-00${clientCount + 1}`,
        companyName: validData.companyName,
        email: validData.email,
        phone: validData.phone,
        totalBusiness: validData.totalBilling,
        outstandingBalance: validData.totalBilling,
        createdById: authRes.id,
        contacts: {
          create: [
            {
              name: validData.contactPerson,
              designation: "Primary Contact",
              email: validData.email,
              phone: validData.phone,
              isPrimary: true,
            },
          ],
        },
      },
      include: {
        contacts: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newClient.id,
        clientCode: newClient.clientNumber,
        companyName: newClient.companyName,
        contactPerson: newClient.contacts[0]?.name || "CEO",
        email: newClient.email,
        phone: newClient.phone,
        industry: body.industry || "General Industry",
        totalBilling: newClient.totalBusiness,
        paidBilling: 0,
        pendingBilling: newClient.outstandingBalance,
        status: "ACTIVE",
        portalToken: `token-${newClient.id}`,
        activeProjects: [],
        completedProjects: [],
        invoices: [],
        notes: [],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 });
  }
}
