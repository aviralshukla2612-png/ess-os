const http = require('http');

const BASE_URL = 'http://localhost/mdz-os';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      ...options,
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      url: response.url,
      text: text,
      ok: response.ok
    };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function verifyRouting() {
  console.log('--- 1. Verifying Nginx Routing ---');
  
  // Root should redirect to login or dashboard
  let res = await request('');
  console.log('GET /mdz-os ->', res.status, res.headers.get('location'));
  if (![307, 308].includes(res.status)) throw new Error('Expected redirect on root');

  res = await request('/login');
  console.log('GET /mdz-os/login ->', res.status);
  if (res.status !== 200) throw new Error('Expected 200 on login');

  res = await request('/api/health');
  console.log('GET /mdz-os/api/health ->', res.status, res.text);
  if (res.status !== 200) throw new Error('Expected 200 on health API');
  
  console.log('Routing OK\n');
}

async function verifyAuth() {
  console.log('--- 3. Verifying Authentication ---');
  
  // 1. Get CSRF token
  let res = await request('/api/auth/csrf');
  const csrfTokenCookie = res.headers.get('set-cookie');
  if (!csrfTokenCookie) throw new Error('No CSRF cookie');
  const json = JSON.parse(res.text);
  const csrfToken = json.csrfToken;
  console.log('Got CSRF Token');

  // 2. Login
  res = await request('/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': csrfTokenCookie
    },
    body: JSON.stringify({
      csrfToken: csrfToken,
      email: 'owner@mdzcompany.com',
      password: 'password123',
      redirect: false
    })
  });
  
  const sessionCookie = res.headers.get('set-cookie');
  console.log('Session Cookie ->', sessionCookie);
  console.log('Login Response ->', res.status, res.headers.get('location'));
  
  const tokenMatch = sessionCookie.match(/next-auth\.session-token=([^;]+)/);
  if (!tokenMatch) throw new Error('Failed to extract session token');
  const tokenStr = `next-auth.session-token=${tokenMatch[1]}`;
  
  // 3. Verify Session
  res = await request('/api/auth/session', {
    headers: {
      'Cookie': tokenStr
    }
  });
  console.log('Session API ->', res.status, res.text);
  const sessionData = JSON.parse(res.text);
  if (sessionData?.user?.email !== 'owner@mdzcompany.com') {
    throw new Error('Invalid session returned');
  }
  
  console.log('Auth OK\n');
  return tokenStr;
}

async function verifyPersistence(sessionCookie) {
  console.log('--- 4. Verifying Data Persistence (Write) ---');
  
  // Create Project
  const projectName = 'TEST-INFRA-' + Date.now();
  const res = await request('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      name: projectName,
      status: 'PROSPECT',
      clientName: 'Infra Client',
      clientEmail: 'infra@test.com'
    })
  });
  
  console.log('Create Project ->', res.status, res.text);
  if (res.status !== 201 && res.status !== 200) throw new Error('Failed to create project');
  const project = JSON.parse(res.text).data;
  console.log('Created project ID:', project.id, 'Name:', project.name);
  
  return project.id;
}

async function verifyStaticAssets() {
  console.log('--- 2. Verifying Static Assets ---');
  let res = await request('/login');
  const cssMatch = res.text.match(/_next\/static\/css\/[^"']+\.css/);
  if (!cssMatch) throw new Error('No CSS link found in HTML');
  const cssPath = '/' + cssMatch[0];
  console.log('Fetching CSS:', cssPath);
  res = await request(cssPath);
  console.log('CSS Fetch ->', res.status);
  if (res.status !== 200 || !res.text.includes('body')) {
    throw new Error('Static asset fetch failed');
  }
  console.log('Static Assets OK\n');
}

async function run() {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error('Please provide project ID');
    process.exit(1);
  }
  
  try {
    const sessionCookie = await verifyAuth();
    console.log('--- Verifying Data Persistence (Read) ---');
    const res = await request(`/api/projects/${projectId}`, {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log(`GET /api/projects/${projectId} ->`, res.status);
    if (res.status === 200) {
      console.log('Persistence OK! Project exists.');
    } else {
      throw new Error(`Project not found! Status: ${res.status}`);
    }
  } catch(e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

run();
