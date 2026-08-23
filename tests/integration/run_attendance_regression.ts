

const BASE_URL = "http://localhost:3020/mdz-os";

async function login(email: string, password: string): Promise<string> {
  // Get CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json() as any;
  const csrfToken = csrfData.csrfToken;
  const rawCookie = csrfRes.headers.get("set-cookie") || "";

  const formData = new URLSearchParams();
  formData.append("csrfToken", csrfToken);
  formData.append("email", email);
  formData.append("password", password);
  formData.append("json", "true");

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": rawCookie
    },
    body: formData,
    redirect: "manual"
  });

  const cookies = loginRes.headers.getSetCookie();
  if (!cookies || cookies.length === 0) throw new Error(`Login failed for ${email}`);
  
  let sessionCookie = "";
  for (const cookie of cookies) {
    if (cookie.includes("next-auth.session-token")) {
      sessionCookie = cookie.split(";")[0];
    }
  }

  return sessionCookie;
}

async function run() {
  console.log("🚀 Starting Attendance Regression Test Suite...\n");

  try {
    const employeeCookie = await login("dev.patel@mdzcompany.com", "password123");
    const ownerCookie = await login("owner@mdzcompany.com", "password123");

    const fetchAPI = async (path: string, method = "GET", body: any = null, cookie = employeeCookie) => {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cookie": cookie,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // 1. PUNCH IN
    let res = await fetchAPI("/api/attendance/punch-in", "POST", { employeeId: "SPOOF_ID" });
    console.log(`[TEST 1 - PUNCH IN] Status: ${res.status}`);
    
    // 2. DOUBLE PUNCH IN
    res = await fetchAPI("/api/attendance/punch-in", "POST");
    console.log(`[TEST 13 - DOUBLE PUNCH IN] Expected 400. Status: ${res.status}`);

    // 3. START BREAK
    res = await fetchAPI("/api/attendance/breaks", "POST", { action: "START", statusType: "Tea Break" });
    console.log(`[TEST 4 - START BREAK] Status: ${res.status}`);

    // 4. DOUBLE BREAK
    res = await fetchAPI("/api/attendance/breaks", "POST", { action: "START", statusType: "Lunch Break" });
    console.log(`[TEST 5 - DOUBLE BREAK] (If implementation replaces it, status is 200). Status: ${res.status}`);

    // 5. END BREAK
    res = await fetchAPI("/api/attendance/breaks", "POST", { action: "END" });
    console.log(`[TEST 7 - END BREAK] Status: ${res.status}`);

    // 6. EARLY PUNCH OUT REQUEST
    res = await fetchAPI("/api/attendance/punch-out-request", "POST", { reason: "Doctor Appointment" });
    console.log(`[TEST 20 - EARLY PUNCH OUT] Status: ${res.status}. Data:`, res.data);
    const attendanceId = res.data?.data?.id;

    if (attendanceId) {
      // 7. OWNER APPROVAL
      const approveRes = await fetchAPI("/api/attendance/admin/approve-punch-out", "POST", {
        attendanceId, action: "APPROVE"
      }, ownerCookie);
      console.log(`[TEST 21 - APPROVE] Status: ${approveRes.status}`);

      // 8. DOUBLE APPROVAL
      const doubleApproveRes = await fetchAPI("/api/attendance/admin/approve-punch-out", "POST", {
        attendanceId, action: "APPROVE"
      }, ownerCookie);
      console.log(`[TEST 22 - DOUBLE APPROVE] Expected 409. Status: ${doubleApproveRes.status}`);
    }

    console.log("\n🎉 API Flow Tests complete.");
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();
