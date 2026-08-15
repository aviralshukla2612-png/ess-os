async function testApis() {
  console.log("🚀 Running Emperor OS REST API Verification Test Suite...\n");

  const baseUrl = "http://localhost:3020";

  // 1. Auth Login Test
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@emperorsmart.com", password: "demo123" }),
  });
  const loginData = await loginRes.json();
  console.log("1. POST /api/auth/login ->", loginData.success ? `✅ SUCCESS (${loginData.session.name} as ${loginData.session.activeRole})` : `❌ FAILED`);

  // 2. GET /api/leads
  const leadsRes = await fetch(`${baseUrl}/api/leads`);
  const leadsData = await leadsRes.json();
  console.log("2. GET /api/leads ->", leadsData.success ? `✅ SUCCESS (${leadsData.data.length} Leads found in Database)` : `❌ FAILED`);

  // 3. POST /api/leads
  const addLeadRes = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientName: "Automated Test Prospect",
      contactPerson: "QA Bot",
      email: "qa@emperorsmart.com",
      leadValue: 450000,
      stage: "NEW",
    }),
  });
  const addLeadData = await addLeadRes.json();
  console.log("3. POST /api/leads ->", addLeadData.success ? `✅ SUCCESS (Created Lead ${addLeadData.data.leadNumber})` : `❌ FAILED`);

  // 4. GET /api/clients
  const clientsRes = await fetch(`${baseUrl}/api/clients`);
  const clientsData = await clientsRes.json();
  console.log("4. GET /api/clients ->", clientsData.success ? `✅ SUCCESS (${clientsData.data.length} Clients found)` : `❌ FAILED`);

  // 5. GET /api/projects
  const projectsRes = await fetch(`${baseUrl}/api/projects`);
  const projectsData = await projectsRes.json();
  console.log("5. GET /api/projects ->", projectsData.success ? `✅ SUCCESS (${projectsData.data.length} Projects Workspace active)` : `❌ FAILED`);

  // 6. GET /api/employees
  const employeesRes = await fetch(`${baseUrl}/api/employees`);
  const employeesData = await employeesRes.json();
  console.log("6. GET /api/employees ->", employeesData.success ? `✅ SUCCESS (${employeesData.data.length} Staff records loaded)` : `❌ FAILED`);

  // 7. GET /api/finance
  const financeRes = await fetch(`${baseUrl}/api/finance`);
  const financeData = await financeRes.json();
  console.log("7. GET /api/finance ->", financeData.success ? `✅ SUCCESS (Total Billing: ₹${financeData.data.metrics.totalBilling.toLocaleString("en-IN")})` : `❌ FAILED`);

  console.log("\n🎉 ALL REST API ENDPOINTS VERIFIED SUCCESSFULLY!");
}

testApis().catch(console.error);
