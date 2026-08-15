import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        project: true,
      },
    });

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      companyName: inv.client.companyName,
      project: inv.project.name,
      amount: inv.totalAmount,
      dueDate: new Date(inv.dueDate).toLocaleDateString(),
      status: inv.status,
    }));

    const clients = await prisma.client.findMany();
    const totalBilling = clients.reduce((sum, c) => sum + c.totalBusiness, 0);
    const pendingBilling = clients.reduce((sum, c) => sum + c.outstandingBalance, 0);
    const paidBilling = totalBilling - pendingBilling;

    return NextResponse.json({
      success: true,
      data: {
        invoices: formattedInvoices,
        metrics: {
          totalBilling,
          paidBilling,
          pendingBilling,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch financial data" }, { status: 500 });
  }
}
