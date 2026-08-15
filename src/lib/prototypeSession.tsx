"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RoleContext } from "./auth";

export interface UserSession {
  email: string;
  name: string;
  role: RoleContext;
  designation: string;
  avatarUrl?: string;
  employeeId?: string;
}

export const MOCK_USERS: UserSession[] = [
  { email: "owner@emperorsmart.com", name: "Rahul Emperor", role: "OWNER", designation: "Founder & CEO", employeeId: "EMP-001" },
  { email: "karan@emperorsmart.com", name: "Karan Verma", role: "SALES", designation: "Head of Sales", employeeId: "EMP-002" },
  { email: "meet.lead@emperorsmart.com", name: "Meet Shah", role: "EMPLOYEE", designation: "Tech Lead (TM Project ABC)", employeeId: "EMP-003" },
  { email: "dev.patel@emperorsmart.com", name: "Dev Patel", role: "EMPLOYEE", designation: "Full-Stack Developer", employeeId: "EMP-004" },
  { email: "priya.ux@emperorsmart.com", name: "Priya Desai", role: "EMPLOYEE", designation: "Lead UI/UX Designer", employeeId: "EMP-005" },
  { email: "rajesh@abcretailers.com", name: "Rajesh Mehta", role: "CLIENT", designation: "Client CEO (ABC Retailers)", employeeId: "CLI-001" },
];

interface SessionContextType {
  session: UserSession | null;
  login: (email: string) => boolean;
  logout: () => void;
  switchIdentity: (user: UserSession) => void;
  isAuthenticated: boolean;
}

const PrototypeSessionContext = createContext<SessionContextType | undefined>(undefined);

export function PrototypeSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(MOCK_USERS[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedEmail = localStorage.getItem("emperor_session_email");
    if (savedEmail) {
      const found = MOCK_USERS.find((u) => u.email === savedEmail);
      if (found) setSession(found);
    }
    setIsLoaded(true);
  }, []);

  const login = (emailOrId: string): boolean => {
    const term = emailOrId.trim().toLowerCase();
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === term || u.employeeId?.toLowerCase() === term
    ) || MOCK_USERS[0];

    setSession(found);
    localStorage.setItem("emperor_session_email", found.email);

    // Navigate to role homepage
    if (found.role === "OWNER") router.push("/owner");
    else if (found.role === "SALES") router.push("/sales");
    else if (found.role === "CLIENT") router.push("/portal/demo-token-abc");
    else router.push("/employee");

    return true;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("emperor_session_email");
    router.push("/login");
  };

  const switchIdentity = (user: UserSession) => {
    setSession(user);
    localStorage.setItem("emperor_session_email", user.email);
  };

  return (
    <PrototypeSessionContext.Provider
      value={{
        session,
        login,
        logout,
        switchIdentity,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </PrototypeSessionContext.Provider>
  );
}

export function usePrototypeSession() {
  const context = useContext(PrototypeSessionContext);
  if (!context) {
    throw new Error("usePrototypeSession must be used within PrototypeSessionProvider");
  }
  return context;
}
