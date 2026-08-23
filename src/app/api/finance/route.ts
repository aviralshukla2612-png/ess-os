import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

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

    // 1. Calculate Authoritative Finance Metrics from Invoices
    const invoiceAggregations = await prisma.invoice.groupBy({
      by: ['status'],
      _sum: {
        grandTotal: true,
      },
    });

    let totalBilling = 0;
    let paidBilling = 0;
    let pendingBilling = 0;
    let overdueBilling = 0;

    invoiceAggregations.forEach(agg => {
      const amount = agg._sum.grandTotal || 0;
      totalBilling += amount;
      
      if (agg.status === "PAID") paidBilling += amount;
      else if (agg.status === "UNPAID") pendingBilling += amount;
      else if (agg.status === "OVERDUE") overdueBilling += amount;
    });

    // 2. Calculate Sales Pipeline from Leads
    const pipelineAggregation = await prisma.lead.aggregate({
      where: {
        status: { notIn: ["LOST", "CONVERTED"] }
      },
      _sum: {
        expectedValue: true,
      }
    });
    const pipelineValue = pipelineAggregation._sum.expectedValue || 0;

    return NextResponse.json({
      success: true,
      data: {
        invoices: formattedInvoices,
        metrics: {
          totalBilling,
          paidBilling,
          pendingBilling,
          overdueBilling,
          pipelineValue
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch financial data" }, { status: 500 });
  }
}
