import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const exceptions = [];

    // 1. Overdue Invoices
    const now = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        status: "UNPAID",
        dueDate: { lt: now },
      },
      include: {
        client: true,
        project: true,
      },
    });

    invoices.forEach((inv) => {
      const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      exceptions.push({
        id: `EXC-INV-${inv.id}`,
        severity: "HIGH",
        title: `₹${inv.totalAmount.toLocaleString("en-IN")} Payment Overdue (${inv.invoiceNumber})`,
        description: `${inv.client.companyName} invoice is overdue by ${daysOverdue} days.`,
        project: inv.project.name,
        actionText: "Send Payment Reminder",
        actionHref: "/finance",
        badgeColor: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20",
        time: `${daysOverdue} days overdue`,
        interactive: false,
      });
    });

    // 2. Delayed Projects
    const projects = await prisma.project.findMany({
      where: {
        priority: "URGENT",
        status: "IN_PROGRESS",
      },
      include: { client: true },
    });

    projects.forEach((prj) => {
      exceptions.push({
        id: `EXC-PRJ-${prj.id}`,
        severity: "CRITICAL",
        title: `Project ${prj.name}: High Risk / Urgent`,
        description: `This project has been marked as URGENT and requires immediate attention to avoid delays.`,
        project: prj.name,
        actionText: "Inspect Project Workspace",
        actionHref: `/projects/${prj.id}`,
        badgeColor: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20",
        time: "Action Required",
        interactive: false,
      });
    });

    return NextResponse.json({ success: true, data: exceptions });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch exceptions" }, { status: 500 });
  }
}
