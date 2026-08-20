"use client";

import { SessionProvider } from "next-auth/react";

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/mdz-os/api/auth">{children}</SessionProvider>;
}
