"use client";

import { SessionProvider } from "next-auth/react";

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/ess-crm/api/auth">{children}</SessionProvider>;
}
