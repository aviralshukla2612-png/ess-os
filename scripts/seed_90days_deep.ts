async function seed90DaysDeep() {
  console.log("==================================================");
  console.log("🚀 ESS OS — 90-DAY DEEP REST API DATA INGESTION");
  console.log("==================================================\n");

  const baseUrl = "http://localhost:3040";

  // 1. INGEST 10 EMPLOYEES VIA REST API
  console.log("1. 👥 Ingesting 10 Corporate Employee Accounts via POST /api/employees...");
  const employeeSeeds = [
    { name: "Rahul ESS", email: "owner_deep@esscompany.com", role: "OWNER", designation: "Founder & CEO", department: "Executive Management", salaryMonthly: 250000 },
    { name: "Karan Verma", email: "karan_sales_deep@esscompany.com", role: "SALES", designation: "Head of Sales", department: "Business Development", salaryMonthly: 140000 },
    { name: "Meet Shah", email: "meet_lead_deep@esscompany.com", role: "EMPLOYEE", designation: "Senior Tech Lead (TM)", department: "Engineering", salaryMonthly: 130000 },
    { name: "Dev Patel", email: "dev_patel_deep@esscompany.com", role: "EMPLOYEE", designation: "Full-Stack Developer", department: "Engineering", salaryMonthly: 90000 },
    { name: "Priya Desai", email: "priya_ux_deep@esscompany.com", role: "EMPLOYEE", designation: "Lead UI/UX Designer", department: "Product Design", salaryMonthly: 95000 },
    { name: "Jay Shah", email: "jay_qa_deep@esscompany.com", role: "EMPLOYEE", designation: "QA Lead Engineer", department: "Quality Assurance", salaryMonthly: 80000 },
    { name: "Ananya Roy", email: "ananya_dev_deep@esscompany.com", role: "EMPLOYEE", designation: "Backend API Specialist", department: "Engineering", salaryMonthly: 88000 },
    { name: "Rohan Varma", email: "rohan_mobile_deep@esscompany.com", role: "EMPLOYEE", designation: "Mobile App Engineer", department: "Engineering", salaryMonthly: 85000 },
    { name: "Siddharth Joshi", email: "sid_sales_deep@esscompany.com", role: "EMPLOYEE", designation: "Sales Executive", department: "Business Development", salaryMonthly: 70000 },
    { name: "Neha Kulkarni", email: "neha_pm_deep@esscompany.com", role: "EMPLOYEE", designation: "Project Operations Lead", department: "Project Operations", salaryMonthly: 110000 },
  ];

  for (let i = 0; i < employeeSeeds.length; i++) {
    const res = await fetch(`${baseUrl}/api/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeSeeds[i]),
    });
    const data = await res.json();
    console.log(`   [${i + 1}/10] POST /api/employees -> ${data.success ? "✅ Created " + employeeSeeds[i].name : "❌ Failed"}`);
  }

  // 2. INGEST 25 CLIENTS VIA REST API
  console.log("\n2. 🏢 Ingesting 25 Enterprise Clients via POST /api/clients...");
  for (let i = 1; i <= 25; i++) {
    const clientPayload = {
      companyName: `Enterprise Client ${i} Corp`,
      contactPerson: `Executive Partner ${i}`,
      email: `client90_${i}@enterprisecorp${i}.com`,
      phone: `+91 98000 ${20000 + i}`,
      totalBilling: 400000 + i * 50000,
      industry: "Technology & Software",
    };
    const res = await fetch(`${baseUrl}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientPayload),
    });
    const data = await res.json();
    console.log(`   [${i}/25] POST /api/clients -> ${data.success ? "✅ Created Client " + clientPayload.companyName : "❌ Failed"}`);
  }

  // 3. INGEST 25 PROJECTS VIA REST API
  console.log("\n3. 📁 Ingesting 25 Project Workspaces via POST /api/projects...");
  for (let i = 1; i <= 25; i++) {
    const projectPayload = {
      name: `Project Solution Workspace ${i}`,
      contractValue: 350000 + i * 45000,
      status: i % 4 === 0 ? "COMPLETED" : i % 3 === 0 ? "TESTING" : "IN_PROGRESS",
      priority: i % 5 === 0 ? "URGENT" : "HIGH",
      progressPercentage: Math.min(100, 20 + i * 3),
      deadline: new Date(Date.now() + 86400000 * (i + 15)).toISOString(),
    };
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectPayload),
    });
    const data = await res.json();
    console.log(`   [${i}/25] POST /api/projects -> ${data.success ? "✅ Created Project " + projectPayload.name : "❌ Failed"}`);
  }

  // 4. INGEST 59 LEADS VIA REST API
  console.log("\n4. 🎯 Ingesting 59 CRM Prospect Leads via POST /api/leads...");
  const stages = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "HOT"];

  for (let i = 1; i <= 59; i++) {
    const leadVal = 180000 + (i * 42000) % 950000;
    const stage = stages[i % stages.length];
    const priority = priorities[i % priorities.length];

    const leadPayload = {
      clientName: `Prospect Lead Organization ${i}`,
      contactPerson: `VP Procurement ${i}`,
      email: `prospect90_${i}@prospectlead${i}.org`,
      phone: `+91 97000 ${30000 + i}`,
      leadValue: leadVal,
      expectedRevenue: Math.floor(leadVal * 0.85),
      projectScope: `Cloud Migration & Next.js Module ${i}`,
      stage: stage,
      leadPriority: priority,
    };

    const res = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadPayload),
    });
    const data = await res.json();
    console.log(`   [${i}/59] POST /api/leads -> ${data.success ? "✅ Created Lead " + data.data.leadNumber + " (" + stage + ")" : "❌ Failed"}`);
  }

  // 5. SEED 90 DAYS OF PUNCH-IN / PUNCH-OUT WORK CLOCK LOGS VIA REST API
  console.log("\n5. ⏱️ Seeding 90 Days of Work Clock Punch-In & Punch-Out Logs via POST /api/attendance...");
  const empRes = await fetch(`${baseUrl}/api/employees`);
  const empData = await empRes.json();
  const employees = empData.data || [];

  for (let day = 0; day < 90; day += 10) {
    for (let eIdx = 0; eIdx < Math.min(5, employees.length); eIdx++) {
      const empCode = employees[eIdx].employeeId || employees[eIdx].id;

      // Punch In
      await fetch(`${baseUrl}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empCode,
          actionType: "PUNCH_IN",
          dateOffsetDays: day,
          notes: `Day -${day} Morning Punch-In for Core Sprint`,
        }),
      });

      // Punch Out
      await fetch(`${baseUrl}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empCode,
          actionType: "PUNCH_OUT",
          dateOffsetDays: day,
          notes: `Day -${day} Evening Punch-Out`,
        }),
      });
    }
    console.log(`   [Day -${day}/90] POST /api/attendance -> ✅ Logged Punch-In / Punch-Out logs across staff`);
  }

  // 6. INGEST "SIR HELP" BLOCKER ALERTS VIA REST API
  console.log("\n6. 🚨 Ingesting Escalated 'Sir Help' Blocker Alerts via POST /api/help-request...");
  const helpAlerts = [
    { employeeId: "EMP-004", message: "Razorpay Webhook HMAC signature checksum mismatch in staging environment.", urgency: "HIGH", category: "TECHNICAL_BLOCKER", dateOffsetDays: 2 },
    { employeeId: "EMP-003", message: "Production Database Migration deadlock on LeadFollowup table.", urgency: "URGENT", category: "TECHNICAL_BLOCKER", dateOffsetDays: 12 },
    { employeeId: "EMP-005", message: "Figma Design Token sync blocked on Client brand asset signoff.", urgency: "MEDIUM", category: "CLIENT_ISSUE", dateOffsetDays: 25 },
  ];

  for (let i = 0; i < helpAlerts.length; i++) {
    const res = await fetch(`${baseUrl}/api/help-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(helpAlerts[i]),
    });
    const data = await res.json();
    console.log(`   [${i + 1}/${helpAlerts.length}] POST /api/help-request -> ${data.success ? "✅ Created Sir Help Blocker Alert " + data.data.requestNumber : "❌ Failed"}`);
  }

  console.log("\n==================================================");
  console.log("🎉 90-DAY DEEP REST API DATA INGESTION COMPLETE!");
  console.log("==================================================");
}

seed90DaysDeep().catch(console.error);
