/**
 * Direct NextAuth credential-flow test
 * Does not use Playwright.
 */

const BASE = 'http://localhost:8080/mdz-os';

function extractCookies(setCookieHeader) {
  if (!setCookieHeader) return [];
  return setCookieHeader
    .split(/,(?=[^;]+=[^;]+)/)
    .map(cookie => cookie.split(';')[0].trim());
}

function mergeCookies(...cookieHeaders) {
  const jar = new Map();
  for (const header of cookieHeaders) {
    for (const cookie of extractCookies(header)) {
      const index = cookie.indexOf('=');
      if (index === -1) continue;
      const name = cookie.slice(0, index);
      const value = cookie.slice(index + 1);
      jar.set(name, `${name}=${value}`);
    }
  }
  return [...jar.values()].join('; ');
}

async function testAuth() {
  console.log('--- Testing NextAuth Credential Flow ---');

  // 1. GET CSRF
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const csrfSetCookie = csrfRes.headers.get('set-cookie') || '';

  console.log('\n1. CSRF');
  console.log('Status:', csrfRes.status);
  console.log('CSRF Token:', csrfToken ? 'RECEIVED' : 'MISSING');
  console.log('Set-Cookie:', csrfSetCookie || 'NONE');

  if (!csrfToken) throw new Error('CSRF token was not returned');

  let cookieJar = mergeCookies(csrfSetCookie);
  console.log('Cookie Jar:', cookieJar);

  // 2. LOGIN
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieJar,
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'owner@test.com',
      password: 'TestPassword123!',
      json: 'true',
    }).toString(),
    redirect: 'manual',
  });

  const loginBody = await loginRes.text();
  const loginSetCookie = loginRes.headers.get('set-cookie') || '';

  console.log('\n2. LOGIN');
  console.log('Status:', loginRes.status);
  console.log('Set-Cookie:', loginSetCookie || 'NONE');
  console.log('Body:', loginBody.substring(0, 300));

  // 3. MERGE COOKIES
  cookieJar = mergeCookies(csrfSetCookie, loginSetCookie);
  console.log('\n3. SESSION COOKIE');
  console.log('Cookie Jar:', cookieJar);

  if (!loginSetCookie) {
    throw new Error('Login succeeded/returned but no session cookie was issued');
  }

  // 4. GET SESSION
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieJar },
  });
  const session = await sessionRes.json();

  console.log('\n4. SESSION');
  console.log('Status:', sessionRes.status);
  console.log('Session:', JSON.stringify(session, null, 2));

  if (!session?.user) {
    throw new Error('Session is empty — authentication cookie was not accepted');
  }

  console.log('\n✅ AUTHENTICATION TEST PASSED');
  console.log('Authenticated user:', session.user);
}

testAuth().catch(error => {
  console.error('\n❌ AUTHENTICATION TEST FAILED');
  console.error(error);
  process.exit(1);
});
