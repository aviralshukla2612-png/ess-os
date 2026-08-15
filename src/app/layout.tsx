import React from "react";
import "@/app/globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { PrototypeSessionProvider } from "@/lib/prototypeSession";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = {
  title: "EMPEROR OS — Master Business Operating System",
  description: "Centralized Operating System for Emperor Smart Solutions",
};

import { PrototypeStoreProvider } from "@/lib/prototypeStore";
import { WorkClockProvider } from "@/lib/workClockContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body>
        <ToastProvider>
          <PrototypeSessionProvider>
            <PrototypeStoreProvider>
              <WorkClockProvider>
                <AppShell>{children}</AppShell>
              </WorkClockProvider>
            </PrototypeStoreProvider>
          </PrototypeSessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
