import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = req.cookies.getAll();
  
  // Also try with secureCookie option
  const tokenSecure = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: false });
  
  return NextResponse.json({ 
    token, 
    tokenSecure,
    cookies: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })),
    cookieHeader: cookieHeader.substring(0, 200),
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    secret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'
  });
}
