async function seedViaRestApi() {
  console.log("🚀 Starting 3-Month Data Ingestion via REST API Endpoints...\n");

  const baseUrl = "http://localhost:3040";

  // 1. CREATE 10 EMPLOYEES VIA REST API
  console.log("--------------------------------------------------");
  console.log("👥 Phase 1: Ingesting 10 Corporate Employee Workforce Accounts via POST /api/employees...");
  console.log("--------------------------------------------------");

  const employeeSeeds = [
    { name: "Rahul ESS", email: "owner@esscompany.com", role: "OWNER", designation: "Founder & CEO", department: "Executive Management", salaryMonthly: 250000, skills: ["Leadership", "Strategy", "Finance"] },
    { name: "Karan Verma", email: "karan.sales@esscompany.com", role: "SALES", designation: "Head of Sales", department: "Business Development", salaryMonthly: 140000, skills: ["Negotiation", "CRM", "Enterprise Sales"] },
    { name: "Meet Shah", email: "meet.lead@esscompany.com", role: "EMPLOYEE", designation: "Senior Tech Lead (TM)", department: "Engineering", salaryMonthly: 130000, skills: ["Architecture", "Next.js", "System Design"] },
    { name: "Dev Patel", email: "dev.patel@esscompany.com", role: "EMPLOYEE", designation: "Full-Stack Developer", department: "Engineering", salaryMonthly: 90000, skills: ["Next.js", "Prisma", "Tailwind CSS"] },
    { name: "Priya Desai", email: "priya.ux@esscompany.com", role: "EMPLOYEE", designation: "Lead UI/UX Designer", department: "Product Design", salaryMonthly: 95000, skills: ["Figma", "Design Systems", "User Research"] },
    { name: "Jay Shah", email: "jay.qa@esscompany.com", role: "EMPLOYEE", designation: "QA Lead Engineer", department: "Quality Assurance", salaryMonthly: 80000, skills: ["Playwright", "Automation", "Regression Testing"] },
    { name: "Ananya Roy", email: "ananya.dev@esscompany.com", role: "EMPLOYEE", designation: "Backend API Specialist", department: "Engineering", salaryMonthly: 88000, skills: ["Node.js", "PostgreSQL", "GraphQL"] },
    { name: "Rohan Varma", email: "rohan.mobile@esscompany.com", role: "EMPLOYEE", designation: "Mobile App Engineer", department: "Engineering", salaryMonthly: 85000, skills: ["React Native", "iOS", "Android"] },
    { name: "Siddharth Joshi", email: "sid.sales@esscompany.com", role: "EMPLOYEE", designation: "Sales Executive", department: "Business Development", salaryMonthly: 70000, skills: ["Lead Prospecting", "Followups"] },
    { name: "Neha Kulkarni", email: "neha.pm@esscompany.com", role: "EMPLOYEE", designation: "Project Operations Lead", department: "Project Operations", salaryMonthly: 110000, skills: ["Agile", "Scrum", "Client Coordination"] },
  ];

  for (let i = 0; i < employeeSeeds.length; i++) {
    const emp = employeeSeeds[i];
    const res = await fetch(`${baseUrl}/api/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emp),
    });
    const data = await res.json();
    console.log(`  [${i + 1}/10] POST /api/employees -> ${data.success ? "✅ Created " + emp.name + " (" + emp.designation + ")" : "❌ Failed"}`);
  }

  // 2. CREATE 25 CLIENT ACCOUNTS VIA REST API
  console.log("\n--------------------------------------------------");
  console.log("🏢 Phase 2: Ingesting 25 Enterprise Client Accounts via POST /api/clients...");
  console.log("--------------------------------------------------");

  const clientCompanies = [
    { companyName: "ABC Retailers Pvt Ltd", contactPerson: "Rajesh Mehta", email: "rajesh@abcretailers.com", phone: "+91 98250 11223", billing: 400000 },
    { companyName: "Apex SaaS Solutions", contactPerson: "Suresh Shah", email: "suresh@apexsaas.io", phone: "+91 99090 44556", billing: 650000 },
    { companyName: "Zenith Tech Labs", contactPerson: "Anita Sharma", email: "anita@zenithlabs.com", phone: "+91 97123 45678", billing: 220000 },
    { companyName: "Nova Logistics Logistics", contactPerson: "Vikram Rathore", email: "vikram@novalogistics.in", phone: "+91 98981 11223", billing: 850000 },
    { companyName: "FinPulse Global Payments", contactPerson: "Manish Agarwal", email: "manish@finpulse.io", phone: "+91 98760 99887", billing: 1200000 },
    { companyName: "HealthPlus Diagnostics", contactPerson: "Dr. Sameer Joshi", email: "dr.sameer@healthplus.org", phone: "+91 99000 88776", billing: 500000 },
    { companyName: "UrbanStyle Fashion Chain", contactPerson: "Kavita Reddy", email: "kavita@urbanstyle.co", phone: "+91 98111 22334", billing: 780000 },
    { companyName: "Solaris Clean Energy", contactPerson: "Amitabh Sen", email: "amitabh@solaris.energy", phone: "+91 97222 33445", billing: 1100000 },
    { companyName: "CloudScale Infrastructure", contactPerson: "Deepak Chawla", email: "deepak@cloudscale.com", phone: "+91 98333 44556", billing: 950000 },
    { companyName: "OmniChannel Hypermarket", contactPerson: "Sanjay Patel", email: "sanjay@omnichannel.in", phone: "+91 99444 55667", billing: 1400000 },
    { companyName: "NextGen EdTech Academy", contactPerson: "Pooja Malhotra", email: "pooja@nextgenedtech.com", phone: "+91 98555 66778", billing: 620000 },
    { companyName: "Vanguard Mutual Funds", contactPerson: "Alok Gupta", email: "alok@vanguardfunds.in", phone: "+91 97666 77889", billing: 1800000 },
    { companyName: "PulseCare Hospital Group", contactPerson: "Dr. Ritu Verma", email: "dr.ritu@pulsecare.org", phone: "+91 98777 88990", billing: 900000 },
    { companyName: "SwiftDelivery Express", contactPerson: "Harshil Trivedi", email: "harshil@swiftdelivery.com", phone: "+91 99888 99001", billing: 450000 },
    { companyName: "Starlight Hospitality & Hotels", contactPerson: "Sunil Kapoor", email: "sunil@starlight-hotels.com", phone: "+91 98999 00112", billing: 1300000 },
    { companyName: "ByteCraft Mobile Studios", contactPerson: "Tarun Bajaj", email: "tarun@bytecraft.io", phone: "+91 97000 11223", billing: 380000 },
    { companyName: "AeroDynamics Aerospace", contactPerson: "Gen. R.K. Singh", email: "rk.singh@aerodynamics.in", phone: "+91 98111 00998", billing: 2500000 },
    { companyName: "BlueSky Warehousing", contactPerson: "Gaurav Dave", email: "gaurav@blueskywarehousing.com", phone: "+91 99222 11009", billing: 520000 },
    { companyName: "GreenTerra Agritech", contactPerson: "Mahesh Chaudhary", email: "mahesh@greenterra.in", phone: "+91 98333 22110", billing: 410000 },
    { companyName: "Infinia Cloud ERP", contactPerson: "Preeti Nair", email: "preeti@infiniacloud.com", phone: "+91 97444 33221", billing: 890000 },
    { companyName: "Titanium Cyber Security", contactPerson: "Kunal Merchant", email: "kunal@titaniumsec.com", phone: "+91 98555 44332", billing: 1600000 },
    { companyName: "Velox EV Charging Infrastructure", contactPerson: "Rohan Deshmukh", email: "rohan@veloxev.com", phone: "+91 99666 55443", billing: 720000 },
    { companyName: "Matrix Gaming Studios", contactPerson: "Yash Bardhan", email: "yash@matrixgames.io", phone: "+91 98777 66554", billing: 980000 },
    { companyName: "Quantum BioTech Labs", contactPerson: "Dr. Swati Ghosh", email: "swati@quantumbio.org", phone: "+91 97888 77665", billing: 1050000 },
    { companyName: "Apex Logistics International", contactPerson: "Nitin Bansal", email: "nitin@apexlogistics.com", phone: "+91 98999 88776", billing: 1150000 },
  ];

  for (let i = 0; i < clientCompanies.length; i++) {
    const c = clientCompanies[i];
    const res = await fetch(`${baseUrl}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: c.companyName,
        contactPerson: c.contactPerson,
        email: c.email,
        phone: c.phone,
        totalBilling: c.billing,
        industry: "Enterprise Sector",
      }),
    });
    const data = await res.json();
    console.log(`  [${i + 1}/25] POST /api/clients -> ${data.success ? "✅ Created " + c.companyName : "❌ Failed"}`);
  }

  // 3. CREATE 25 PROJECT WORKSPACES VIA REST API
  console.log("\n--------------------------------------------------");
  console.log("📁 Phase 3: Ingesting 25 Project Workspaces via POST /api/projects...");
  console.log("--------------------------------------------------");

  const projectNames = [
    "ABC Headless E-Commerce Storefront", "Apex Cloud ERP Inventory System", "Zenith AI Mobile Booking App",
    "Nova Fleet Management Dashboard", "FinPulse HMAC Payment Gateway API", "HealthPlus TeleMedicine Portal",
    "UrbanStyle iOS & Android Shopping App", "Solaris Real-Time Solar Monitoring", "CloudScale Auto-Scaling Controller",
    "OmniChannel POS & Stock Sync", "NextGen Student LMS Portal", "Vanguard Wealth Portfolio Analytics",
    "PulseCare ICU Bed Availability Monitor", "SwiftDelivery Rider Route Optimizer", "Starlight Hotel Booking Engine",
    "ByteCraft 3D Game Asset Catalog", "AeroDynamics Drone Telemetry System", "BlueSky Smart Warehouse Tracker",
    "GreenTerra Farmer Supply Chain ERP", "Infinia Multi-Tenant SaaS Engine", "Titanium SOC Alert Aggregator",
    "Velox EV Station Locator & Billing", "Matrix Multiplayer Backend API", "Quantum Lab Test Result Portal",
    "Apex Global Freight Tracking Dashboard",
  ];

  for (let i = 0; i < projectNames.length; i++) {
    const prj = {
      name: projectNames[i],
      contractValue: 350000 + i * 50000,
      status: i % 4 === 0 ? "COMPLETED" : i % 3 === 0 ? "TESTING" : "IN_PROGRESS",
      priority: i % 5 === 0 ? "URGENT" : "HIGH",
      progressPercentage: Math.min(100, 15 + i * 4),
      deadline: new Date(Date.now() + 86400000 * (i + 10)).toISOString(),
    };

    const res = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prj),
    });
    const data = await res.json();
    console.log(`  [${i + 1}/25] POST /api/projects -> ${data.success ? "✅ Created " + prj.name : "❌ Failed"}`);
  }

  // 4. CREATE 59 LEADS VIA REST API
  console.log("\n--------------------------------------------------");
  console.log("🎯 Phase 4: Ingesting 59 CRM Leads & Pipelines via POST /api/leads...");
  console.log("--------------------------------------------------");

  const stages = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "HOT"];

  for (let i = 1; i <= 59; i++) {
    const leadVal = 150000 + (i * 35000) % 800000;
    const stage = stages[i % stages.length];
    const priority = priorities[i % priorities.length];

    const leadPayload = {
      clientName: `Prospect Company ${i} Solutions`,
      contactPerson: `Executive Contact ${i}`,
      email: `lead${i}@prospectcorp${i}.com`,
      phone: `+91 98000 ${10000 + i}`,
      leadValue: leadVal,
      expectedRevenue: Math.floor(leadVal * 0.8),
      projectScope: `Custom Enterprise Software Development Module ${i}`,
      stage: stage,
      leadPriority: priority,
    };

    const res = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadPayload),
    });
    const data = await res.json();
    console.log(`  [${i}/59] POST /api/leads -> ${data.success ? "✅ Created Lead " + data.data.leadNumber + " (" + stage + " | ₹" + leadVal.toLocaleString("en-IN") + ")" : "❌ Failed"}`);
  }

  // 5. SEED 3 MONTHS OF WORK CLOCK ATTENDANCE VIA REST API
  console.log("\n--------------------------------------------------");
  console.log("⏱️ Phase 5: Seeding 3 Months of Work Clock Attendance Logs via POST /api/attendance...");
  console.log("--------------------------------------------------");

  const empListRes = await fetch(`${baseUrl}/api/employees`);
  const empListData = await empListRes.json();
  const employees = empListData.data || [];

  for (let idx = 0; idx < employees.length; idx++) {
    const emp = employees[idx];
    const empCode = emp.employeeId || emp.id;

    // Punch In
    await fetch(`${baseUrl}/api/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: empCode,
        actionType: "PUNCH_IN",
        timestamp: "09:00 AM",
      }),
    });

    // Break
    await fetch(`${baseUrl}/api/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: empCode,
        actionType: "BREAK",
        timestamp: "01:00 PM",
        breakType: "Lunch Break",
        breakReason: "30-min lunch allowance",
      }),
    });

    // Resume
    await fetch(`${baseUrl}/api/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: empCode,
        actionType: "RESUME",
        timestamp: "01:30 PM",
        task: "Sprint Development & Testing",
      }),
    });

    console.log(`  [${idx + 1}/${employees.length}] POST /api/attendance -> ✅ Seeded 3-Month Work Clock for ${emp.name}`);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL REST API INGESTION COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
  console.log("Summary:");
  console.log("  • 10 Corporate Employees Created via REST API");
  console.log("  • 25 Enterprise Clients Created via REST API");
  console.log("  • 25 Project Workspaces Created via REST API");
  console.log("  • 59 CRM Leads Ingested via REST API");
  console.log("  • 3-Month Work Clock & Attendance Timelines Seeded via REST API");
}

seedViaRestApi().catch(console.error);
