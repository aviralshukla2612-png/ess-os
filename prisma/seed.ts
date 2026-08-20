import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MDZ OS database with realistic company data...");

  // Clean existing records for fresh seed
  await prisma.activityEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.clientUpdate.deleteMany();
  await prisma.clientPortalToken.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentMilestone.deleteMany();

  await prisma.workSession.deleteMany();
  await prisma.employeeStatusEvent.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.clientDiscussion.deleteMany();
  await prisma.projectNote.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectChecklist.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.projectMembership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectType.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.leadFollowup.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // 1. Roles
  const ownerRole = await prisma.role.upsert({
    where: { code: "OWNER" },
    update: {},
    create: { code: "OWNER", name: "Owner / Super Admin", description: "Full operational & financial control" },
  });

  const salesRole = await prisma.role.upsert({
    where: { code: "SALES" },
    update: {},
    create: { code: "SALES", name: "Sales Executive", description: "Lead pipeline & client onboarding" },
  });

  const employeeRole = await prisma.role.upsert({
    where: { code: "EMPLOYEE" },
    update: {},
    create: { code: "EMPLOYEE", name: "Employee / Team Member", description: "Internal workforce" },
  });

  const clientRole = await prisma.role.upsert({
    where: { code: "CLIENT" },
    update: {},
    create: { code: "CLIENT", name: "Client Portal User", description: "External safe portal access" },
  });

  // 2. Users
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@mdzcompany.com" },
    update: {},
    create: {
      email: "owner@mdzcompany.com",
      passwordHash: "demo123",
      name: "Rahul MDZ",
      designation: "Founder & CEO",
      department: "Management",
      activeRole: "OWNER",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: "karan.sales@mdzcompany.com" },
    update: {},
    create: {
      email: "karan.sales@mdzcompany.com",
      passwordHash: "demo123",
      name: "Karan Verma",
      designation: "Head of Sales",
      department: "Sales",
      activeRole: "SALES",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  });

  const tmUser = await prisma.user.upsert({
    where: { email: "meet.lead@mdzcompany.com" },
    update: {},
    create: {
      email: "meet.lead@mdzcompany.com",
      passwordHash: "demo123",
      name: "Meet Shah",
      designation: "Senior Tech Lead",
      department: "Engineering",
      activeRole: "EMPLOYEE",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
  });

  const devUser = await prisma.user.upsert({
    where: { email: "dev.patel@mdzcompany.com" },
    update: {},
    create: {
      email: "dev.patel@mdzcompany.com",
      passwordHash: "demo123",
      name: "Dev Patel",
      designation: "Full-Stack Developer",
      department: "Engineering",
      activeRole: "EMPLOYEE",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    },
  });

  const designerUser = await prisma.user.upsert({
    where: { email: "priya.ux@mdzcompany.com" },
    update: {},
    create: {
      email: "priya.ux@mdzcompany.com",
      passwordHash: "demo123",
      name: "Priya Desai",
      designation: "Lead UI/UX Designer",
      department: "Design",
      activeRole: "EMPLOYEE",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
  });

  const qaUser = await prisma.user.upsert({
    where: { email: "jay.qa@mdzcompany.com" },
    update: {},
    create: {
      email: "jay.qa@mdzcompany.com",
      passwordHash: "demo123",
      name: "Jay Shah",
      designation: "QA Lead",
      department: "Quality Assurance",
      activeRole: "EMPLOYEE",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "rajesh@abcretailers.com" },
    update: {},
    create: {
      email: "rajesh@abcretailers.com",
      passwordHash: "demo123",
      name: "Rajesh Mehta",
      designation: "CEO",
      department: "Client",
      activeRole: "CLIENT",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
    },
  });

  // Assign Roles
  const roleAssignments = [
    { userId: ownerUser.id, roleId: ownerRole.id },
    { userId: salesUser.id, roleId: salesRole.id },
    { userId: tmUser.id, roleId: employeeRole.id },
    { userId: devUser.id, roleId: employeeRole.id },
    { userId: designerUser.id, roleId: employeeRole.id },
    { userId: qaUser.id, roleId: employeeRole.id },
    { userId: clientUser.id, roleId: clientRole.id },
  ];

  for (const assign of roleAssignments) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: assign.userId, roleId: assign.roleId } },
      update: {},
      create: assign,
    });
  }

  // Employee Profiles
  const empMeet = await prisma.employee.upsert({
    where: { userId: tmUser.id },
    update: {},
    create: {
      userId: tmUser.id,
      employeeIdCode: "EMP-001",
      salaryMonthly: 125000,
      skillsJson: JSON.stringify(["Node.js", "React", "Architecture", "PostgreSQL"]),
    },
  });

  const empDev = await prisma.employee.upsert({
    where: { userId: devUser.id },
    update: {},
    create: {
      userId: devUser.id,
      employeeIdCode: "EMP-002",
      salaryMonthly: 85000,
      skillsJson: JSON.stringify(["Next.js", "TypeScript", "Tailwind CSS", "Prisma"]),
    },
  });

  const empPriya = await prisma.employee.upsert({
    where: { userId: designerUser.id },
    update: {},
    create: {
      userId: designerUser.id,
      employeeIdCode: "EMP-003",
      salaryMonthly: 90000,
      skillsJson: JSON.stringify(["Figma", "UI/UX", "Design Systems", "Prototyping"]),
    },
  });

  const empJay = await prisma.employee.upsert({
    where: { userId: qaUser.id },
    update: {},
    create: {
      userId: qaUser.id,
      employeeIdCode: "EMP-004",
      salaryMonthly: 75000,
      skillsJson: JSON.stringify(["Automated Testing", "Playwright", "API Testing"]),
    },
  });

  // 3. Leads (Sales CRM)
  const lead1 = await prisma.lead.create({
    data: {
      leadNumber: "LEAD-2026-001",
      contactPerson: "Rajesh Mehta",
      companyName: "ABC Retailers Pvt Ltd",
      mobile: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      email: "rajesh@abcretailers.com",
      source: "REFERRAL",
      interestedService: "E-Commerce Website & Mobile App",
      description: "Needs full multi-vendor e-commerce platform with Razorpay and WhatsApp integration.",
      estimatedBudget: 350000,
      expectedValue: 400000,
      priority: "HOT",
      status: "WON",
      assignedSalespersonId: salesUser.id,
      createdById: salesUser.id,
      remarks: "Converted to project on 01 Aug 2026.",
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      leadNumber: "LEAD-2026-002",
      contactPerson: "Suresh Shah",
      companyName: "Apex SaaS Solutions",
      mobile: "+91 98989 12345",
      whatsapp: "+91 98989 12345",
      email: "suresh@apexsaas.io",
      source: "WEBSITE",
      interestedService: "Custom SaaS Web Application",
      description: "Cloud-based inventory management dashboard with multi-tenant API backend.",
      estimatedBudget: 600000,
      expectedValue: 650000,
      priority: "HIGH",
      status: "NEGOTIATION",
      assignedSalespersonId: salesUser.id,
      createdById: salesUser.id,
      nextFollowupAt: new Date(Date.now() + 86400000), // Tomorrow
      remarks: "Sent revised proposal with payment milestone options.",
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      leadNumber: "LEAD-2026-003",
      contactPerson: "Anita Sharma",
      companyName: "Zenith Tech Labs",
      mobile: "+91 97123 45678",
      whatsapp: "+91 97123 45678",
      email: "anita@zenithlabs.com",
      source: "DIRECT",
      interestedService: "AI Workflow Automation",
      description: "Automated WhatsApp lead responder and document processing bot.",
      estimatedBudget: 200000,
      expectedValue: 220000,
      priority: "MEDIUM",
      status: "MEETING",
      assignedSalespersonId: salesUser.id,
      createdById: salesUser.id,
      nextFollowupAt: new Date(Date.now() - 3600000 * 3), // Overdue by 3 hours
      remarks: "Demo meeting scheduled for today.",
    },
  });

  // Follow-ups
  await prisma.leadFollowup.create({
    data: {
      leadId: lead2.id,
      salespersonId: salesUser.id,
      scheduledAt: new Date(),
      communicationType: "CALL",
      notes: "Discussed custom SLA terms with Suresh. Agreed to 4 payment milestones.",
      result: "PROPOSAL_REVISED",
      nextAction: "Send final agreement",
      status: "COMPLETED",
    },
  });

  // 4. Clients
  const clientABC = await prisma.client.create({
    data: {
      clientNumber: "CLT-001",
      companyName: "ABC Retailers Pvt Ltd",
      billingAddress: "Suite 402, Trade Tower, CG Road, Ahmedabad 380009",
      taxId: "24AAACA12341Z5",
      phone: "+91 98765 43210",
      email: "rajesh@abcretailers.com",
      notes: "VIP Client. High priority for e-commerce launch before festive season.",
      totalBusiness: 400000,
      outstandingBalance: 85000,
      createdById: ownerUser.id,
      contacts: {
        create: [
          {
            name: "Rajesh Mehta",
            designation: "CEO & Founder",
            email: "rajesh@abcretailers.com",
            phone: "+91 98765 43210",
            isPrimary: true,
          },
          {
            name: "Priya Shah",
            designation: "Accounts Manager",
            email: "accounts@abcretailers.com",
            phone: "+91 98765 43211",
            isPrimary: false,
          },
        ],
      },
    },
  });

  // 5. Project Types
  const typeEcom = await prisma.projectType.create({
    data: {
      name: "E-Commerce Website",
      code: "ECOM_WEB",
      description: "Standard E-Commerce Playbook with Payment & Logistics Integration",
    },
  });

  // 6. Project
  const projectABC = await prisma.project.create({
    data: {
      projectNumber: "PRJ-2026-001",
      name: "ABC E-Commerce Storefront & Mobile API",
      clientId: clientABC.id,
      projectTypeId: typeEcom.id,
      description: "Modern headless e-commerce store with custom product builder, Razorpay checkout, and WhatsApp order tracking.",
      scopeText: "1. Responsive Homepage & Catalog\n2. Guest & User Auth\n3. Cart & Razorpay Payment\n4. Admin Order Dashboard\n5. WhatsApp Notification Webhook",
      contractValue: 400000,
      startDate: new Date("2026-07-01"),
      targetDeadline: new Date("2026-09-15"),
      status: "IN_PROGRESS",
      priority: "HIGH",
      progressPercentage: 72,
      liveUrl: "https://staging.abcretailers.com",
      stagingUrl: "https://abc-staging.mdzcompany.com",
      designUrl: "https://figma.com/file/abc-ecommerce-design",
      createdById: ownerUser.id,
    },
  });

  // 7. Project Memberships (Including Historical Retention!)
  // Meet Shah is TM
  await prisma.projectMembership.create({
    data: {
      projectId: projectABC.id,
      employeeId: empMeet.id,
      roleInProject: "TM",
      assignedById: ownerUser.id,
    },
  });

  // Dev Patel is Member
  await prisma.projectMembership.create({
    data: {
      projectId: projectABC.id,
      employeeId: empDev.id,
      roleInProject: "MEMBER",
      assignedById: ownerUser.id,
    },
  });

  // Priya Desai was assigned, but removed later (Historical Audit Demo)
  await prisma.projectMembership.create({
    data: {
      projectId: projectABC.id,
      employeeId: empPriya.id,
      roleInProject: "MEMBER",
      assignedAt: new Date("2026-07-01"),
      removedAt: new Date("2026-07-20"),
      assignedById: ownerUser.id,
      removedById: ownerUser.id,
      removalReason: "Design Phase completed successfully. Reassigned to Apex SaaS project.",
      isActive: false,
    },
  });

  // 8. Stages & Checklists
  const stage1 = await prisma.projectStage.create({
    data: {
      projectId: projectABC.id,
      name: "1. Planning & Scope Approval",
      orderIndex: 1,
      weight: 10,
      progressPercentage: 100,
      status: "COMPLETED",
    },
  });

  const stage2 = await prisma.projectStage.create({
    data: {
      projectId: projectABC.id,
      name: "2. UI/UX Design System",
      orderIndex: 2,
      weight: 20,
      progressPercentage: 100,
      status: "COMPLETED",
    },
  });

  const stage3 = await prisma.projectStage.create({
    data: {
      projectId: projectABC.id,
      name: "3. Full-Stack Development",
      orderIndex: 3,
      weight: 40,
      progressPercentage: 68,
      status: "IN_PROGRESS",
    },
  });

  const stage4 = await prisma.projectStage.create({
    data: {
      projectId: projectABC.id,
      name: "4. Testing & QA",
      orderIndex: 4,
      weight: 15,
      progressPercentage: 20,
      status: "PENDING",
    },
  });

  // Checklists in Development Stage
  await prisma.projectChecklist.createMany({
    data: [
      {
        stageId: stage3.id,
        title: "Product Catalog & Filtering API",
        status: "COMPLETED",
        assignedToId: devUser.id,
        completedById: devUser.id,
        completedAt: new Date("2026-07-25"),
        weight: 1,
      },
      {
        stageId: stage3.id,
        title: "Razorpay Webhook Payment Integration",
        status: "IN_PROGRESS",
        assignedToId: devUser.id,
        weight: 1.5,
        notes: "Waiting for production credentials verification from client.",
      },
      {
        stageId: stage3.id,
        title: "Guest Checkout & Cart Validation",
        status: "COMPLETED",
        assignedToId: devUser.id,
        completedById: devUser.id,
        completedAt: new Date("2026-07-29"),
        weight: 1,
      },
      {
        stageId: stage3.id,
        title: "WhatsApp Order Confirmation Webhook",
        status: "PENDING",
        assignedToId: tmUser.id,
        weight: 1,
      },
    ],
  });

  // 9. Tasks
  await prisma.task.create({
    data: {
      projectId: projectABC.id,
      stageId: stage3.id,
      title: "Fix Razorpay Signature Verification Flake",
      description: "Ensure HMAC SHA256 checksum comparison is constant-time to prevent timing attacks.",
      assignedToId: devUser.id,
      createdById: tmUser.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      startDate: new Date(),
      deadline: new Date(Date.now() + 86400000 * 2),
      estimatedHours: 6,
      actualHours: 4,
    },
  });

  // 10. Documents & Version History
  const doc1 = await prisma.projectDocument.create({
    data: {
      projectId: projectABC.id,
      title: "System Architecture & Payment Specs",
      category: "ARCHITECTURE",
      content: "# ABC E-Commerce Architecture\n\n## Tech Stack\n- Next.js 14 App Router\n- Prisma SQLite / PostgreSQL\n- Razorpay Payment Gateway\n\n## Payment Gateway\nRazorpay Webhook configuration is set up under `/api/webhooks/razorpay`.",
      version: 2,
      createdById: tmUser.id,
      updatedById: tmUser.id,
    },
  });

  await prisma.documentVersion.create({
    data: {
      documentId: doc1.id,
      version: 1,
      content: "# ABC E-Commerce Architecture\n\nInitial version with Stripe integration.",
      changeReason: "Client requested Razorpay instead of Stripe for local INR processing.",
      updatedById: tmUser.id,
    },
  });

  // 11. Notes & Client Discussions
  await prisma.projectNote.create({
    data: {
      projectId: projectABC.id,
      authorId: devUser.id,
      content: "Webhook test environment passed with 100% test coverage. Staging URL updated.",
      visibility: "INTERNAL",
    },
  });

  const contactPrimary = await prisma.clientContact.findFirst({ where: { clientId: clientABC.id } });
  await prisma.clientDiscussion.create({
    data: {
      projectId: projectABC.id,
      clientContactId: contactPrimary?.id,
      summary: "Weekly Progress Call with Rajesh Mehta",
      discussionText: "Discussed guest checkout flows and Razorpay integration timeline. Client requested guest checkout without forced registration.",
      decisionsText: "✓ Guest checkout approved\n✓ WhatsApp confirmation approved",
      actionItemsText: "Dev: Finalize Razorpay webhook\nClient: Send production API credentials",
      createdById: tmUser.id,
    },
  });

  // 12. Change Requests
  await prisma.changeRequest.create({
    data: {
      requestNumber: "CR-2026-001",
      projectId: projectABC.id,
      requestedBy: "Rajesh Mehta (Client)",
      source: "CLIENT",
      originalRequirement: "Standard single-address checkout flow.",
      requestedChange: "Add multi-address shipping & gift messaging options during checkout.",
      reason: "Holiday season promotional campaigns demand gift ordering capability.",
      technicalImpact: "Requires schema update for ShippingAddress array and message payload.",
      timelineImpactDays: 4,
      costImpactAmount: 25000,
      estimatedHours: 16,
      status: "APPROVED",
      approvedById: ownerUser.id,
      approvedAt: new Date("2026-07-28"),
    },
  });

  // 13. Attendance & Work Sessions
  await prisma.attendance.create({
    data: {
      employeeId: empDev.id,
      punchIn: new Date(Date.now() - 3600000 * 5), // Punched in 5 hours ago
      status: "PRESENT",
      totalMinutes: 300,
    },
  });

  await prisma.employeeStatusEvent.create({
    data: {
      employeeId: empDev.id,
      statusType: "WORKING",
      startedAt: new Date(Date.now() - 3600000 * 2),
      notes: "Working on Razorpay webhook signature testing",
    },
  });

  await prisma.workSession.create({
    data: {
      employeeId: empDev.id,
      projectId: projectABC.id,
      statusType: "WORKING",
      startedAt: new Date(Date.now() - 3600000 * 2),
      durationMinutes: 120,
      notes: "Testing Razorpay HMAC webhook verification",
    },
  });



  // 15. Financial Milestones & Invoices
  await prisma.paymentMilestone.createMany({
    data: [
      {
        projectId: projectABC.id,
        title: "Milestone 1: Project Advance",
        amount: 100000,
        dueDate: new Date("2026-07-05"),
        status: "PAID",
        paidAmount: 100000,
        paidAt: new Date("2026-07-06"),
        paymentMethod: "NEFT",
        transactionReference: "NEFT202607060012",
        invoiceNumber: "INV-2026-001",
      },
      {
        projectId: projectABC.id,
        title: "Milestone 2: Design Approval & Development Start",
        amount: 100000,
        dueDate: new Date("2026-07-25"),
        status: "OVERDUE",
        paidAmount: 15000,
        notes: "Client requested 3 days extension for accounts processing.",
        invoiceNumber: "INV-2026-002",
      },
      {
        projectId: projectABC.id,
        title: "Milestone 3: QA & UAT Signoff",
        amount: 100000,
        dueDate: new Date("2026-08-25"),
        status: "UPCOMING",
      },
      {
        projectId: projectABC.id,
        title: "Milestone 4: Production Launch & Handover",
        amount: 100000,
        dueDate: new Date("2026-09-15"),
        status: "UPCOMING",
      },
    ],
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-002",
      projectId: projectABC.id,
      clientId: clientABC.id,
      issueDate: new Date("2026-07-25"),
      dueDate: new Date("2026-07-30"),
      totalAmount: 100000,
      taxAmount: 18000,
      grandTotal: 118000,
      status: "OVERDUE",
      itemsJson: JSON.stringify([
        { description: "Milestone 2: UI/UX Design Approval & Full-Stack Core Development", amount: 100000 },
      ]),
    },
  });

  // 16. Client Portal Token
  await prisma.clientPortalToken.create({
    data: {
      clientId: clientABC.id,
      projectId: projectABC.id,
      token: "token-abc-123",
      expiresAt: new Date(Date.now() + 86400000 * 30), // 30 days
      isActive: true,
    },
  });

  // 17. Published Client Update
  await prisma.clientUpdate.create({
    data: {
      projectId: projectABC.id,
      title: "Development Sprint 2 Completed - Staging Environment Updated",
      content: "We have finalized product catalog APIs and guest checkout flows. You can test live on the staging URL.",
      visibility: "CLIENT_VISIBLE",
      authorId: tmUser.id,
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
