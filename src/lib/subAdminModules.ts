export interface SubAdminModuleItem {
  id: string;
  title: string;
  href: string;
  description: string;
  category: "CORE" | "MANAGEMENT" | "OPERATIONS" | "SYSTEM";
}

export const SUB_ADMIN_MODULES: SubAdminModuleItem[] = [
  {
    id: "overview",
    title: "Overview",
    href: "/owner",
    description: "Company overview, executive metrics, KPI cards, and financial pulses",
    category: "CORE",
  },
  {
    id: "leads",
    title: "Sales & Leads",
    href: "/leads",
    description: "Pipeline management, prospect details, conversions, and follow-ups",
    category: "MANAGEMENT",
  },
  {
    id: "quotes",
    title: "Proposals / Quotes",
    href: "/quotes",
    description: "Client quotations, draft cost estimations, and formal scopes",
    category: "MANAGEMENT",
  },
  {
    id: "clients",
    title: "Clients",
    href: "/clients",
    description: "Client directory, contracts, accounts, and point-of-contacts",
    category: "MANAGEMENT",
  },
  {
    id: "projects",
    title: "Projects",
    href: "/projects",
    description: "Active development projects, milestones, stage checklists, and team assignments",
    category: "OPERATIONS",
  },
  {
    id: "employees",
    title: "Team",
    href: "/employees",
    description: "Workforce directory, designations, employee profiles, and access management",
    category: "OPERATIONS",
  },
  {
    id: "attendance",
    title: "Attendance",
    href: "/attendance",
    description: "Live attendance monitoring, employee break status, and work hour logs",
    category: "OPERATIONS",
  },
  {
    id: "attendance-requests",
    title: "Punch Out Requests",
    href: "/attendance-requests",
    description: "Review, approve, or reject employee early punch-out requests",
    category: "OPERATIONS",
  },
  {
    id: "leave-requests",
    title: "Leave Applications",
    href: "/leave-requests",
    description: "Review, approve, or reject employee leave requests and balances",
    category: "OPERATIONS",
  },
  {
    id: "finance",
    title: "Finance",
    href: "/finance",
    description: "Invoices, payment milestones, collected revenue, and outstanding dues",
    category: "SYSTEM",
  },
  {
    id: "audit",
    title: "Activity",
    href: "/audit",
    description: "Audit trail, security events, real-time action logs, and system events",
    category: "SYSTEM",
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    description: "System parameters, company holidays, policies, and configuration",
    category: "SYSTEM",
  },
];
