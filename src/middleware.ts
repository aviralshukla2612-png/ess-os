import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  console.log("MIDDLEWARE HIT:", pathname);
  
  // Exclude static files, API routes, login, and portal
  if (
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname === "/login" ||
    pathname.startsWith("/portal") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req });
  console.log("MIDDLEWARE TOKEN ROLE:", token?.role, "FOR PATH:", pathname);

  if (!token) {
    return NextResponse.redirect(new URL("/ess-crm/login", req.url));
  }

  // OWNER only routes
  const ownerOnlyRoutes = ["/owner", "/finance", "/audit", "/attendance-requests", "/employees"];
  if (ownerOnlyRoutes.some(r => pathname.startsWith(r)) && token?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/ess-crm/login", req.url));
  }

  // SALES or OWNER routes
  const salesRoutes = ["/leads", "/clients", "/sales", "/quotes"];
  if (salesRoutes.some(r => pathname.startsWith(r)) && token?.role !== "OWNER" && token?.role !== "SALES") {
    return NextResponse.redirect(new URL("/ess-crm/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
