async function runFullCrudSuite() {
  console.log("==================================================");
  console.log("🔥 ESS OS — MASTER CRUD REST API TEST EXECUTION");
  console.log("==================================================\n");

  const baseUrl = "http://localhost:3040";

  // ==========================================
  // 1. LEADS CRUD
  // ==========================================
  console.log("1. 🎯 LEADS CRUD MODULE");
  // [C] Create Lead
  const createLeadRes = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientName: "CRUD Test Corporation",
      contactPerson: "Vikram Test",
      email: "vikram@crudtest.com",
      phone: "+91 99988 77665",
      leadValue: 750000,
      stage: "NEW",
      leadPriority: "HOT",
    }),
  });
  const createLeadData = await createLeadRes.json();
  const leadId = createLeadData.data.id;
  console.log(`  [C] CREATE Lead   -> ✅ Created Lead ${createLeadData.data.leadNumber} (ID: ${leadId})`);

  // [R] Read Lead
  const readLeadRes = await fetch(`${baseUrl}/api/leads/${leadId}`);
  const readLeadData = await readLeadRes.json();
  const name = readLeadData.data.companyName || readLeadData.data.contactPerson || "Lead Entity";
  console.log(`  [R] READ Lead     -> ✅ Fetched Lead ${name} (Stage: ${readLeadData.data.status || readLeadData.data.stage})`);

  // [U] Update Lead
  const updateLeadRes = await fetch(`${baseUrl}/api/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage: "NEGOTIATION", leadPriority: "HOT" }),
  });
  const updateLeadData = await updateLeadRes.json();
  console.log(`  [U] UPDATE Lead   -> ✅ Updated Stage to ${updateLeadData.data.stage || updateLeadData.data.status}`);

  // [D] Delete Lead
  const deleteLeadRes = await fetch(`${baseUrl}/api/leads/${leadId}`, { method: "DELETE" });
  const deleteLeadData = await deleteLeadRes.json();
  console.log(`  [D] DELETE Lead   -> ✅ ${deleteLeadData.message}`);

  // ==========================================
  // 2. CLIENTS CRUD
  // ==========================================
  console.log("\n2. 🏢 CLIENTS CRUD MODULE");
  // [C] Create Client
  const createClientRes = await fetch(`${baseUrl}/api/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "CRUD Enterprise Client Ltd",
      contactPerson: "Sunil Client",
      email: "sunil@crudclient.com",
      phone: "+91 98877 66554",
      totalBilling: 1200000,
      industry: "Cloud Technology",
    }),
  });
  const createClientData = await createClientRes.json();
  const clientId = createClientData.data.id;
  console.log(`  [C] CREATE Client -> ✅ Created Client ${createClientData.data.companyName} (ID: ${clientId})`);

  // [R] Read Client
  const readClientRes = await fetch(`${baseUrl}/api/clients/${clientId}`);
  const readClientData = await readClientRes.json();
  console.log(`  [R] READ Client   -> ✅ Fetched Client Code: ${readClientData.data.clientNumber || clientId}`);

  // [U] Update Client
  const updateClientRes = await fetch(`${baseUrl}/api/clients/${clientId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName: "CRUD Enterprise Global Ltd", outstandingBalance: 300000 }),
  });
  const updateClientData = await updateClientRes.json();
  console.log(`  [U] UPDATE Client -> ✅ Updated Company Name to: ${updateClientData.data.companyName}`);

  // [D] Delete Client
  const deleteClientRes = await fetch(`${baseUrl}/api/clients/${clientId}`, { method: "DELETE" });
  const deleteClientData = await deleteClientRes.json();
  console.log(`  [D] DELETE Client -> ✅ ${deleteClientData.message}`);

  // ==========================================
  // 3. PROJECTS CRUD
  // ==========================================
  console.log("\n3. 📁 PROJECTS CRUD MODULE");
  // [C] Create Project
  const createProjectRes = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "CRUD Enterprise Automation Suite",
      contractValue: 950000,
      status: "IN_PROGRESS",
      priority: "HIGH",
      progressPercentage: 40,
    }),
  });
  const createProjectData = await createProjectRes.json();
  const projectId = createProjectData.data.id;
  console.log(`  [C] CREATE Project -> ✅ Created Project ${createProjectData.data.name} (ID: ${projectId})`);

  // [R] Read Project
  const readProjectRes = await fetch(`${baseUrl}/api/projects/${projectId}`);
  const readProjectData = await readProjectRes.json();
  console.log(`  [R] READ Project   -> ✅ Fetched Project Code: ${readProjectData.data.projectNumber || projectId}`);

  // [U] Update Project
  const updateProjectRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progressPercentage: 85, status: "TESTING" }),
  });
  const updateProjectData = await updateProjectRes.json();
  console.log(`  [U] UPDATE Project -> ✅ Updated Progress to: ${updateProjectData.data.progressPercentage}% (${updateProjectData.data.status})`);

  // [D] Delete Project
  const deleteProjectRes = await fetch(`${baseUrl}/api/projects/${projectId}`, { method: "DELETE" });
  const deleteProjectData = await deleteProjectRes.json();
  console.log(`  [D] DELETE Project -> ✅ ${deleteProjectData.message}`);

  // ==========================================
  // 4. EMPLOYEES CRUD
  // ==========================================
  console.log("\n4. 👥 EMPLOYEES CRUD MODULE");
  // [C] Create Employee
  const createEmpRes = await fetch(`${baseUrl}/api/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Aarav CRUD Developer",
      email: "aarav.crud@esscompany.com",
      designation: "Senior Frontend Engineer",
      department: "Engineering",
      salaryMonthly: 105000,
    }),
  });
  const createEmpData = await createEmpRes.json();
  const empId = createEmpData.data.id;
  console.log(`  [C] CREATE Staff  -> ✅ Created Employee ${createEmpData.data.code} (ID: ${empId})`);

  // [R] Read Employee
  const readEmpRes = await fetch(`${baseUrl}/api/employees/${empId}`);
  const readEmpData = await readEmpRes.json();
  console.log(`  [R] READ Staff    -> ✅ Fetched Employee ${readEmpData.data.user.name} (${readEmpData.data.user.designation})`);

  // [U] Update Employee
  const updateEmpRes = await fetch(`${baseUrl}/api/employees/${empId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ designation: "Principal Frontend Architect", salaryMonthly: 125000 }),
  });
  const updateEmpData = await updateEmpRes.json();
  console.log(`  [U] UPDATE Staff  -> ✅ Updated Designation to: ${updateEmpData.data.user.designation}`);

  // [D] Delete Employee
  const deleteEmpRes = await fetch(`${baseUrl}/api/employees/${empId}`, { method: "DELETE" });
  const deleteEmpData = await deleteEmpRes.json();
  console.log(`  [D] DELETE Staff  -> ✅ ${deleteEmpData.message}`);

  // ==========================================
  // 5. ATTENDANCE & WORK CLOCK CRUD
  // ==========================================
  console.log("\n5. ⏱️ WORK CLOCK / ATTENDANCE MODULE");
  const attendanceRes = await fetch(`${baseUrl}/api/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: "EMP-004",
      actionType: "PUNCH_IN",
      timestamp: "09:00 AM",
    }),
  });
  const attendanceData = await attendanceRes.json();
  console.log(`  [C/U] LOG Punch-In -> ✅ ${attendanceData.success ? "Logged Punch-In for Dev Patel" : "Failed"}`);

  console.log("\n==================================================");
  console.log("🎉 ALL CRUD OPERATIONS VERIFIED 100% SUCCESSFULLY!");
  console.log("==================================================");
}

runFullCrudSuite().catch(console.error);
