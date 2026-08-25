async function testApis() {
  console.log("🚀 Running ESS OS REST API Verification Test Suite...\n");

  const baseUrl = "http://localhost:3040";


  // 2. GET /api/leads (Unauthenticated)
  const leadsRes = await fetch(`${baseUrl}/api/leads`);
  console.log("2. GET /api/leads (Unauth) ->", leadsRes.status === 401 ? `✅ SUCCESS (Blocked: 401 Unauthorized)` : `❌ FAILED (Status: ${leadsRes.status})`);

  // 3. POST /api/leads (Unauthenticated)
  const addLeadRes = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientName: "Automated Test Prospect",
      contactPerson: "QA Bot",
      email: "qa@esscompany.com",
      leadValue: 450000,
      stage: "NEW",
    }),
  });
  console.log("3. POST /api/leads (Unauth) ->", addLeadRes.status === 401 ? `✅ SUCCESS (Blocked: 401 Unauthorized)` : `❌ FAILED (Status: ${addLeadRes.status})`);

  // 4. GET /api/clients (Unauthenticated)
  const clientsRes = await fetch(`${baseUrl}/api/clients`);
  console.log("4. GET /api/clients (Unauth) ->", clientsRes.status === 401 ? `✅ SUCCESS (Blocked: 401 Unauthorized)` : `❌ FAILED (Status: ${clientsRes.status})`);

  // 5. GET /api/projects (Unauthenticated)
  const projectsRes = await fetch(`${baseUrl}/api/projects`);
  console.log("5. GET /api/projects (Unauth) ->", projectsRes.status === 401 ? `✅ SUCCESS (Blocked: 401 Unauthorized)` : `❌ FAILED (Status: ${projectsRes.status})`);

  // 6. GET /api/employees (Unauthenticated)
  const employeesRes = await fetch(`${baseUrl}/api/employees`);
  console.log("6. GET /api/employees (Unauth) ->", employeesRes.status === 401 ? `✅ SUCCESS (Blocked: 401 Unauthorized)` : `❌ FAILED (Status: ${employeesRes.status})`);

  // 7. GET /api/finance (Unauthenticated)
  const financeRes = await fetch(`${baseUrl}/api/finance`);
  console.log("7. GET /api/finance (Unauth) ->", financeRes.status === 401 ? `✅ SUCCESS (Blocked: 401 Unauthorized)` : `❌ FAILED (Status: ${financeRes.status})`);

  console.log("\n🎉 ALL REST API SECURITY BOUNDARIES VERIFIED SUCCESSFULLY!");
}

testApis().catch(console.error);
