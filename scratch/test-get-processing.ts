import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contacts: true,
      projects: true,
      invoices: true,
    },
  });
  console.log("Clients found:", clients.length);
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
    notes: c.notes ? [{ id: "n1", author: "Rahul ESS", text: c.notes, time: "Aug 1" }] : [],
  }));
  console.log("Formatted:", formatted);
}
main().catch(console.error).finally(() => prisma.$disconnect());
