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

  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookiePrefix = useSecureCookies ? "__Secure-" : "";
  const cookieName = `${cookiePrefix}ess-crm.session-token`;

  const token = await getToken({ req, cookieName });
  console.log("MIDDLEWARE TOKEN ROLE:", token?.role, "FOR PATH:", pathname);

  if (!token) {
    return NextResponse.redirect(new URL("/crmtesting/login", req.url));
  }

  // Universal access for OWNER
  if (token?.role === "OWNER") {
    return NextResponse.next();
  }

  // Route-to-module mapping for SUB_ADMIN administrative pages
  const subAdminRouteMap: Record<string, string> = {
    "/owner": "overview",
    "/leads": "leads",
    "/quotes": "quotes",
    "/clients": "clients",
    "/employees": "employees",
    "/attendance-requests": "attendance-requests",
    "/leave-requests": "leave-requests",
    "/finance": "finance",
    "/audit": "audit",
  };

  // Check SUB_ADMIN permissions
  if (token?.role === "SUB_ADMIN") {
    const userPerms = (token?.permissions as string[]) || [];
    
    // Find matching module for current path
    const matchedPrefix = Object.keys(subAdminRouteMap).find(prefix => pathname.startsWith(prefix));
    if (matchedPrefix) {
      const requiredModule = subAdminRouteMap[matchedPrefix];
      if (userPerms.includes(requiredModule)) {
        return NextResponse.next();
      } else {
        // Redirect to their first allowed module, or login if none
        const firstAllowedKey = Object.keys(subAdminRouteMap).find(prefix => userPerms.includes(subAdminRouteMap[prefix]));
        const destination = firstAllowedKey ? `/crmtesting${firstAllowedKey}` : "/crmtesting/login";
        return NextResponse.redirect(new URL(destination, req.url));
      }
    }
    return NextResponse.next();
  }

  // OWNER only routes for other non-owner roles
  const ownerOnlyRoutes = ["/owner", "/finance", "/audit", "/attendance-requests", "/employees"];
  if (ownerOnlyRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/crmtesting/login", req.url));
  }

  // SALES routes
  const salesRoutes = ["/leads", "/clients", "/sales", "/quotes"];
  if (salesRoutes.some(r => pathname.startsWith(r)) && token?.role !== "SALES") {
    return NextResponse.redirect(new URL("/crmtesting/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
