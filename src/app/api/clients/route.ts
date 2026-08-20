import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
  try {
    const body = await req.json();
    const clientCount = await prisma.client.count();
    const ownerUser = await prisma.user.findFirst({ where: { activeRole: "OWNER" } }) || await prisma.user.findFirst();

    const newClient = await prisma.client.create({
      data: {
        clientNumber: `CLT-00${clientCount + 1}`,
        companyName: body.companyName || "New Client Corp",
        email: body.email || "client@company.com",
        phone: body.phone || "+91 98000 22222",
        totalBusiness: body.totalBilling || 350000,
        outstandingBalance: body.totalBilling || 350000,
        createdById: ownerUser!.id,
        contacts: {
          create: [
            {
              name: body.contactPerson || "CEO",
              designation: "Primary Contact",
              email: body.email || "client@company.com",
              phone: body.phone || "+91 98000 22222",
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
