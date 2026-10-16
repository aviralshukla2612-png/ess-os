import React from "react";
import "@/app/globals.css";
import Script from "next/script";
import { ToastProvider } from "@/components/ui/Toast";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { PrototypeStoreProvider } from "@/lib/prototypeStore";
import { WorkClockProvider } from "@/lib/workClockContext";

export const metadata = {
  title: "ESS OS — Master Business Operating System",
  description: "Centralized Operating System for ESS Company",
  icons: {
    icon: "/crmtesting/ess-logo.png",
    shortcut: "/crmtesting/ess-logo.png",
    apple: "/crmtesting/ess-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/crmtesting/ess-logo.png" type="image/png" />
      </head>
      <body>
        <ToastProvider>
          <NextAuthProvider>
            <PrototypeStoreProvider>
              <WorkClockProvider>
                <AppShell>{children}</AppShell>
              </WorkClockProvider>
            </PrototypeStoreProvider>
          </NextAuthProvider>
        </ToastProvider>

        {/* Embedded Live Chatbot Widget */}
        <Script
          src="/crmtesting/widget.js"
          strategy="afterInteractive"
          data-bot-id="bot_aa"
          data-color="#4f46e5"
          data-position="bottom-right"
          data-api-url="/crmtesting"
        />
      </body>
    </html>
  );
}
