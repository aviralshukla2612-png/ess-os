import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Optional: Add fine-grained role checks here if needed in the future
    // For example, if a CLIENT tries to access /owner
    if (pathname.startsWith("/owner") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/mdz-os/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/mdz-os/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
