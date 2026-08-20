import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Fetch lead from Prisma DB
    const lead = await prisma.lead.findFirst({
      where: { OR: [{ id: params.id }, { leadNumber: params.id }] },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    // 2. Idempotency Check: Prevent duplicate conversion
    if (lead.status === "WON") {
      // Find existing client & project linked if already converted
      const existingClient = await prisma.client.findFirst({
        where: { email: lead.email || undefined },
        include: { projects: true },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Lead is already converted to WON stage",
          alreadyConverted: true,
          data: {
            lead,
            client: existingClient,
            project: existingClient?.projects[0] || null,
          },
        },
        { status: 200 }
      );
    }

    // Fetch active owner user ID for createdById references
    const ownerUser =
      (await prisma.user.findFirst({ where: { activeRole: "OWNER" } })) ||
      (await prisma.user.findFirst());

    if (!ownerUser) {
      return NextResponse.json({ success: false, error: "System User not initialized" }, { status: 500 });
    }

    // 3. Execute Atomic Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = lead.companyName || lead.contactPerson || "New Client Enterprise";
      const clientCount = await tx.client.count();
      const uniqueClientCode = `CLT-${String(clientCount + 101).padStart(3, "0")}`;

      // A. Create Client Record in DB
      const newClient = await tx.client.create({
        data: {
          clientNumber: uniqueClientCode,
          companyName: company,
          email: lead.email || `contact-${Date.now()}@client.com`,
          phone: lead.mobile || "+91 98000 11111",
          totalBusiness: lead.expectedValue || lead.estimatedBudget || 400000,
          outstandingBalance: lead.expectedValue || lead.estimatedBudget || 400000,
          createdById: ownerUser.id,
          contacts: {
            create: [
              {
                name: lead.contactPerson || "Primary Contact",
                designation: "Primary Contact",
                email: lead.email || "contact@client.com",
                phone: lead.mobile || "+91 98000 11111",
                isPrimary: true,
              },
            ],
          },
        },
        include: {
          contacts: true,
        },
      });

      // B. Create Project Record in DB
      const projectCount = await tx.project.count();
      const uniquePrjCode = `PRJ-2026-${String(projectCount + 101).padStart(3, "0")}`;

      const newProject = await tx.project.create({
        data: {
          projectNumber: uniquePrjCode,
          name: `${company} Core Platform Solution`,
          clientId: newClient.id,
          contractValue: lead.expectedValue || lead.estimatedBudget || 400000,
          status: "IN_PROGRESS",
          priority: lead.priority || "MEDIUM",
          progressPercentage: 10,
          createdById: ownerUser.id,
        },
        include: {
          client: true,
        },
      });

      // C. Update Lead status to WON
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "WON",
        },
      });

      // D. Log Immutable Audit Activity Event
      await tx.activityEvent.create({
        data: {
          eventType: "LEAD_WON_CONVERTED",
          actorId: ownerUser.id,
          entityType: "LEAD",
          entityId: lead.id,
          clientId: newClient.id,
          projectId: newProject.id,
          metadataJson: JSON.stringify({
            leadNumber: lead.leadNumber,
            clientNumber: newClient.clientNumber,
            projectNumber: newProject.projectNumber,
            contractValue: newProject.contractValue,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return { lead: updatedLead, client: newClient, project: newProject };
    });

    return NextResponse.json({
      success: true,
      data: {
        lead: result.lead,
        client: result.client,
        project: result.project,
      },
    });
  } catch (error: any) {
    console.error("Lead conversion transaction failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to convert lead via Prisma transaction", details: error.message },
      { status: 500 }
    );
  }
}
