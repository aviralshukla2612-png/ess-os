"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ActivityItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  targetType: "LEAD" | "CLIENT" | "PROJECT" | "EMPLOYEE" | "INVOICE" | "TASK" | "HELP";
  details?: string;
}

export interface LeadEntity {
  id: string;
  leadNumber: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: "NEW" | "CONTACTED" | "REQUIREMENTS" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
  leadValue: number;
  expectedRevenue: number;
  projectScope: string;
  assignedSales: string;
  nextFollowupDate: string;
  leadPriority: "HOT" | "HIGH" | "MEDIUM" | "LOW";
  notes: Array<{ id: string; author: string; text: string; time: string }>;
  callHistory: Array<{ id: string; caller: string; notes: string; date: string; outcome: string }>;
  activityHistory: Array<{ id: string; time: string; text: string }>;
}

export interface ClientEntity {
  id: string;
  clientCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  totalBilling: number;
  paidBilling: number;
  pendingBilling: number;
  status: "ACTIVE" | "ONBOARDING" | "PAUSED";
  portalToken: string;
  activeProjects: string[]; // Project IDs
  completedProjects: string[];
  invoices: string[]; // Invoice IDs
  notes: Array<{ id: string; author: string; text: string; time: string }>;
}

export interface EmployeeEntity {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: "OWNER" | "SALES" | "EMPLOYEE" | "CLIENT";
  designation: string;
  department: string;
  phone: string;
  punchedIn: boolean;
  punchInTime?: string;
  todayWorkSeconds: number;
  currentProject: string;
  currentTask: string;
  assignedProjects: string[]; // Project IDs
  todayTimeline: Array<{ id: string; timeRange: string; activity: string; project: string; duration: string }>;
  attendanceRecord: Array<{ date: string; punchIn: string; punchOut: string; status: string; workHours: string }>;
}

export interface ProjectEntity {
  id: string;
  projectCode: string;
  name: string;
  clientId: string;
  clientName: string;
  tmId: string;
  tmName: string;
  progress: number;
  currentStage: string;
  contractValue: number;
  paidValue: number;
  overdueValue: number;
  deadline: string;
  status: "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  health: "ON_TRACK" | "AT_RISK" | "DELAYED";
  scopeItems: string[];
  teamMembers: Array<{ id: string; name: string; role: string; assignedDate: string; active: boolean }>;
  removalHistory: Array<{ id: string; name: string; role: string; removedDate: string; reason: string }>;
  tasks: Array<{ id: string; title: string; assignee: string; status: "TODO" | "IN_PROGRESS" | "DONE"; priority: string; blockedReason?: string }>;
  livingDocs: Array<{ id: string; title: string; version: string; lastUpdated: string; author: string; content: string }>;
  changeRequests: Array<{ id: string; title: string; value: number; status: "APPROVED" | "PENDING"; date: string }>;
}

interface PrototypeStoreType {
  leads: LeadEntity[];
  clients: ClientEntity[];
  employees: EmployeeEntity[];
  projects: ProjectEntity[];
  activities: ActivityItem[];
  getLeadById: (id: string) => LeadEntity | undefined;
  getClientById: (id: string) => ClientEntity | undefined;
  getEmployeeById: (id: string) => EmployeeEntity | undefined;
  getProjectById: (id: string) => ProjectEntity | undefined;
  addLead: (lead: Partial<LeadEntity>) => void;
  updateLeadStage: (id: string, stage: LeadEntity["stage"]) => void;
  convertLeadToClient: (leadId: string) => { client: ClientEntity; project: ProjectEntity };
  addClient: (client: Partial<ClientEntity>) => void;
  addLeadNote: (leadId: string, noteText: string) => void;
  addLeadFollowup: (leadId: string, date: string, note: string) => void;
  importClientsBatch: (imported: Array<{ companyName: string; contactPerson: string; email: string; phone: string }>) => number;
}

const PrototypeStoreContext = createContext<PrototypeStoreType | undefined>(undefined);

export function PrototypeStoreProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<LeadEntity[]>([
    {
      id: "lead-1",
      leadNumber: "LEAD-2026-001",
      clientName: "ABC Retailers Pvt Ltd",
      contactPerson: "Rajesh Mehta (CEO)",
      email: "rajesh@abcretailers.com",
      phone: "+91 98250 11223",
      stage: "WON",
      leadValue: 400000,
      expectedRevenue: 400000,
      projectScope: "Headless Next.js Storefront + Razorpay HMAC Webhook API Integration",
      assignedSales: "Karan Verma",
      nextFollowupDate: "Today 02:30 PM",
      leadPriority: "HOT",
      notes: [
        { id: "n1", author: "Karan Verma", text: "Client agreed to ₹4,00,000 milestone schedule with 25% advance.", time: "Aug 1, 10:15 AM" },
      ],
      callHistory: [
        { id: "c1", caller: "Karan Verma", notes: "Discussed final payment terms and technical signoff.", date: "Aug 1, 09:30 AM", outcome: "Agreed" },
      ],
      activityHistory: [
        { id: "a1", time: "Aug 1 · 10:20 AM", text: "Lead moved from Negotiation to Won by Karan Verma." },
        { id: "a2", time: "Jul 28 · 03:45 PM", text: "Proposal of ₹4,00,000 sent via email." },
      ],
    },
    {
      id: "lead-2",
      leadNumber: "LEAD-2026-002",
      clientName: "Apex SaaS Solutions",
      contactPerson: "Suresh Shah (Founder)",
      email: "suresh@apexsaas.com",
      phone: "+91 99090 44556",
      stage: "NEGOTIATION",
      leadValue: 650000,
      expectedRevenue: 520000,
      projectScope: "Multi-Tenant Cloud Inventory & Billing ERP Portal",
      assignedSales: "Karan Verma",
      nextFollowupDate: "Tomorrow 11:00 AM",
      leadPriority: "HIGH",
      notes: [
        { id: "n2", author: "Karan Verma", text: "Revised technical wireframe proposal sent to Suresh Shah.", time: "Aug 2, 04:00 PM" },
      ],
      callHistory: [
        { id: "c2", caller: "Karan Verma", notes: "Reviewed scope requirements and design deliverables.", date: "Aug 2, 02:15 PM", outcome: "Followup Required" },
      ],
      activityHistory: [
        { id: "a3", time: "Aug 2 · 04:15 PM", text: "Proposal sent (₹6,50,000)." },
      ],
    },
    {
      id: "lead-3",
      leadNumber: "LEAD-2026-003",
      clientName: "Zenith Tech Labs",
      contactPerson: "Anita Sharma (VP Tech)",
      email: "anita@zenithtech.io",
      phone: "+91 98795 88776",
      stage: "PROPOSAL",
      leadValue: 220000,
      expectedRevenue: 180000,
      projectScope: "Cross-Platform iOS & Android Mobile Booking Application",
      assignedSales: "Karan Verma",
      nextFollowupDate: "05 Aug 2026",
      leadPriority: "MEDIUM",
      notes: [],
      callHistory: [],
      activityHistory: [
        { id: "a4", time: "Aug 2 · 11:00 AM", text: "Requirements gathering meeting completed." },
      ],
    },
  ]);

  const [clients, setClients] = useState<ClientEntity[]>([
    {
      id: "CLT-001",
      clientCode: "ABC_RETAIL",
      companyName: "ABC Retailers Pvt Ltd",
      contactPerson: "Rajesh Mehta (CEO)",
      email: "rajesh@abcretailers.com",
      phone: "+91 98250 11223",
      industry: "E-Commerce & Retail",
      totalBilling: 400000,
      paidBilling: 100000,
      pendingBilling: 100000,
      status: "ACTIVE",
      portalToken: "demo-token-abc",
      activeProjects: ["PRJ-2026-001"],
      completedProjects: [],
      invoices: ["INV-2026-001", "INV-2026-002"],
      notes: [
        { id: "cn1", author: "Rahul Emperor", text: "Client requested live staging preview access.", time: "Aug 1, 02:00 PM" },
      ],
    },
    {
      id: "CLT-002",
      clientCode: "APEX_SAAS",
      companyName: "Apex SaaS Solutions",
      contactPerson: "Suresh Shah (Founder)",
      email: "suresh@apexsaas.com",
      phone: "+91 99090 44556",
      industry: "Cloud & Enterprise Software",
      totalBilling: 650000,
      paidBilling: 0,
      pendingBilling: 650000,
      status: "ACTIVE",
      portalToken: "demo-token-apex",
      activeProjects: ["PRJ-2026-002"],
      completedProjects: [],
      invoices: ["INV-2026-003"],
      notes: [],
    },
    {
      id: "CLT-003",
      clientCode: "ZENITH_TECH",
      companyName: "Zenith Tech Labs",
      contactPerson: "Anita Sharma (VP Tech)",
      email: "anita@zenithtech.io",
      phone: "+91 98795 88776",
      industry: "Mobile Technology",
      totalBilling: 220000,
      paidBilling: 180000,
      pendingBilling: 40000,
      status: "ACTIVE",
      portalToken: "demo-token-zenith",
      activeProjects: ["PRJ-2026-003"],
      completedProjects: [],
      invoices: [],
      notes: [],
    },
  ]);

  const [employees, setEmployees] = useState<EmployeeEntity[]>([
    {
      id: "EMP-001",
      employeeId: "EMP-001",
      name: "Rahul Emperor",
      email: "owner@emperorsmart.com",
      role: "OWNER",
      designation: "Founder & CEO",
      department: "Executive Management",
      phone: "+91 98980 00001",
      punchedIn: true,
      punchInTime: "09:00 AM",
      todayWorkSeconds: 9600,
      currentProject: "Executive Command",
      currentTask: "Reviewing Exception Queue & Client Revenue Ledgers",
      assignedProjects: ["PRJ-2026-001", "PRJ-2026-002", "PRJ-2026-003"],
      todayTimeline: [
        { id: "t1", timeRange: "09:00 AM - 10:30 AM", activity: "Executive Briefing & Team Attendance Check", project: "General Management", duration: "1h 30m" },
        { id: "t2", timeRange: "10:30 AM - 12:15 PM", activity: "Reviewed Needs Attention Queue & Client Accounts", project: "Executive Command", duration: "1h 45m" },
      ],
      attendanceRecord: [
        { date: "Aug 2", punchIn: "09:00 AM", punchOut: "On-Going", status: "PRESENT", workHours: "5h 20m" },
        { date: "Aug 1", punchIn: "08:55 AM", punchOut: "07:10 PM", status: "PRESENT", workHours: "10h 15m" },
      ],
    },
    {
      id: "EMP-002",
      employeeId: "EMP-002",
      name: "Karan Verma",
      email: "karan@emperorsmart.com",
      role: "SALES",
      designation: "Head of Sales",
      department: "Business Development",
      phone: "+91 98980 00002",
      punchedIn: true,
      punchInTime: "09:15 AM",
      todayWorkSeconds: 8400,
      currentProject: "Sales Pipeline CRM",
      currentTask: "Follow-up Call with Suresh Shah (Apex SaaS)",
      assignedProjects: ["PRJ-2026-001"],
      todayTimeline: [
        { id: "t3", timeRange: "09:15 AM - 11:00 AM", activity: "Prospect Inbound Lead Calling & Qualification", project: "Sales CRM", duration: "1h 45m" },
        { id: "t4", timeRange: "11:00 AM - 01:00 PM", activity: "Proposal Preparation & Price Quotations", project: "Sales CRM", duration: "2h 00m" },
      ],
      attendanceRecord: [
        { date: "Aug 2", punchIn: "09:15 AM", punchOut: "On-Going", status: "PRESENT", workHours: "4h 45m" },
      ],
    },
    {
      id: "EMP-003",
      employeeId: "EMP-003",
      name: "Meet Shah",
      email: "meet.lead@emperorsmart.com",
      role: "EMPLOYEE",
      designation: "Senior Tech Lead (TM)",
      department: "Engineering",
      phone: "+91 98980 00003",
      punchedIn: true,
      punchInTime: "09:30 AM",
      todayWorkSeconds: 7800,
      currentProject: "PRJ-2026-001 (ABC E-Commerce)",
      currentTask: "Sprint Architecture Review & Webhook Security",
      assignedProjects: ["PRJ-2026-001"],
      todayTimeline: [
        { id: "t5", timeRange: "09:30 AM - 11:15 AM", activity: "Razorpay HMAC Verification Code Review", project: "PRJ-2026-001", duration: "1h 45m" },
        { id: "t6", timeRange: "11:15 AM - 01:00 PM", activity: "Database Migration Schema Signoff", project: "PRJ-2026-001", duration: "1h 45m" },
      ],
      attendanceRecord: [
        { date: "Aug 2", punchIn: "09:30 AM", punchOut: "On-Going", status: "PRESENT", workHours: "4h 30m" },
      ],
    },
    {
      id: "EMP-004",
      employeeId: "EMP-004",
      name: "Dev Patel",
      email: "dev.patel@emperorsmart.com",
      role: "EMPLOYEE",
      designation: "Full-Stack Developer",
      department: "Engineering",
      phone: "+91 98980 00004",
      punchedIn: true,
      punchInTime: "09:42 AM",
      todayWorkSeconds: 8077,
      currentProject: "PRJ-2026-001 (ABC E-Commerce)",
      currentTask: "Razorpay HMAC Webhook Signature Verification",
      assignedProjects: ["PRJ-2026-001", "PRJ-2026-002"],
      todayTimeline: [
        { id: "t7", timeRange: "09:42 AM - 11:20 AM", activity: "Razorpay Sandbox Payload Testing", project: "PRJ-2026-001", duration: "1h 38m" },
        { id: "t8", timeRange: "11:20 AM - 11:34 AM", activity: "Break · Standup Call", project: "PRJ-2026-001", duration: "14m" },
        { id: "t9", timeRange: "11:34 AM - 01:15 PM", activity: "Checkout Gateway API Route Implementation", project: "PRJ-2026-001", duration: "1h 41m" },
      ],
      attendanceRecord: [
        { date: "Aug 2", punchIn: "09:42 AM", punchOut: "On-Going", status: "PRESENT", workHours: "4h 15m" },
      ],
    },
    {
      id: "EMP-005",
      employeeId: "EMP-005",
      name: "Priya Desai",
      email: "priya.ux@emperorsmart.com",
      role: "EMPLOYEE",
      designation: "Lead UI/UX Designer",
      department: "Product Design",
      phone: "+91 98980 00005",
      punchedIn: true,
      punchInTime: "10:00 AM",
      todayWorkSeconds: 6600,
      currentProject: "PRJ-2026-002 (Apex SaaS)",
      currentTask: "Figma Component Design Tokens Audit",
      assignedProjects: ["PRJ-2026-002"],
      todayTimeline: [
        { id: "t10", timeRange: "10:00 AM - 01:00 PM", activity: "Figma Wireframes & Design System Audit", project: "PRJ-2026-002", duration: "3h 00m" },
      ],
      attendanceRecord: [
        { date: "Aug 2", punchIn: "10:00 AM", punchOut: "On-Going", status: "PRESENT", workHours: "3h 40m" },
      ],
    },
  ]);

  const [projects, setProjects] = useState<ProjectEntity[]>([
    {
      id: "PRJ-2026-001",
      projectCode: "PRJ-2026-001",
      name: "ABC E-Commerce Storefront & Mobile API",
      clientId: "CLT-001",
      clientName: "ABC Retailers Pvt Ltd",
      tmId: "EMP-003",
      tmName: "Meet Shah (Senior Tech Lead)",
      progress: 72,
      currentStage: "Full-Stack Development (68%)",
      contractValue: 400000,
      paidValue: 100000,
      overdueValue: 100000,
      deadline: "15 Sep 2026",
      status: "IN_PROGRESS",
      health: "AT_RISK",
      scopeItems: [
        "Headless E-Commerce Storefront using Next.js 14 App Router",
        "Razorpay Payment Gateway with HMAC Signature Webhook Validation",
        "Multi-address Shipping & Gift Messaging Options (CR-2026-001 Approved)",
        "Admin Order Management & Live Inventory Dashboard",
        "WhatsApp Order Confirmation Webhook Notification",
      ],
      teamMembers: [
        { id: "EMP-003", name: "Meet Shah", role: "TM (Team Manager)", assignedDate: "Jul 01, 2026", active: true },
        { id: "EMP-004", name: "Dev Patel", role: "Full-Stack Developer", assignedDate: "Jul 05, 2026", active: true },
        { id: "EMP-005", name: "Priya Desai", role: "UI/UX Designer", assignedDate: "Jul 01, 2026", active: true },
      ],
      removalHistory: [
        { id: "h1", name: "Rohan Varma", role: "Junior Frontend Dev", removedDate: "Jul 25, 2026", reason: "Reassigned to internal infrastructure" },
      ],
      tasks: [
        { id: "TSK-001", title: "Razorpay HMAC Webhook Verification", assignee: "Dev Patel", status: "IN_PROGRESS", priority: "HIGH", blockedReason: "Waiting for production API secret key from client." },
        { id: "TSK-002", title: "WhatsApp Order Confirmation Webhook", assignee: "Dev Patel", status: "TODO", priority: "HIGH" },
        { id: "TSK-003", title: "Review Figma Wireframes for Checkout", assignee: "Priya Desai", status: "DONE", priority: "MEDIUM" },
      ],
      livingDocs: [
        { id: "doc-1", title: "API Architecture & Security Protocol v2", version: "v2.4", lastUpdated: "Aug 1, 2026", author: "Meet Shah", content: "HMAC SHA256 signature verification guidelines for all incoming webhook endpoints." },
      ],
      changeRequests: [
        { id: "CR-001", title: "Gift Messaging & Special Packaging Flow", value: 35000, status: "APPROVED", date: "Jul 20, 2026" },
      ],
    },
  ]);

  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: "act-1", timestamp: "Today 11:45 AM", actor: "Dev Patel", action: "submitted Sir Help request", target: "Razorpay webhook blocker", targetType: "HELP" },
    { id: "act-2", timestamp: "Today 10:15 AM", actor: "Dev Patel", action: "logged work note", target: "Razorpay sandbox HMAC payload verified", targetType: "PROJECT" },
    { id: "act-3", timestamp: "Aug 1 · 10:20 AM", actor: "Karan Verma", action: "converted lead", target: "ABC Retailers Pvt Ltd (₹4,00,000)", targetType: "LEAD" },
  ]);

  const getLeadById = (id: string) => leads.find((l) => l.id === id || l.leadNumber === id);
  const getClientById = (id: string) => clients.find((c) => c.id === id || c.clientCode === id);
  const getEmployeeById = (id: string) => employees.find((e) => e.id === id || e.employeeId === id);
  const getProjectById = (id: string) => projects.find((p) => p.id === id || p.projectCode === id);

  // Load lists on mount from Next.js REST APIs
  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLeads(d.data);
      });
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setClients(d.data);
      });
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProjects(d.data);
      });
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployees(d.data);
      });
  }, []);

  const addLead = (leadData: Partial<LeadEntity>) => {
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLeads((prev) => [d.data, ...prev]);
        }
      });
  };

  const updateLeadStage = (id: string, stage: LeadEntity["stage"]) => {
    fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLeads((prev) => prev.map((l) => (l.id === id ? d.data : l)));
        }
      });
  };

  const convertLeadToClient = (leadId: string) => {
    const tempClientId = `CLT-00${clients.length + 1}`;
    const tempProjectId = `PRJ-2026-00${projects.length + 1}`;

    fetch(`/api/leads/${leadId}/convert`, {
      method: "POST",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setClients((prev) => [d.client, ...prev]);
          setProjects((prev) => [d.project, ...prev]);
          setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: "WON" } : l)));
        }
      });

    return {
      client: { id: tempClientId, companyName: "Converting..." } as any,
      project: { id: tempProjectId, name: "Initializing..." } as any,
    };
  };

  const addClient = (clientData: Partial<ClientEntity>) => {
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setClients((prev) => [d.data, ...prev]);
        }
      });
  };

  const addLeadNote = (leadId: string, noteText: string) => {
    fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteText }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLeads((prev) => prev.map((l) => (l.id === leadId ? d.data : l)));
        }
      });
  };

  const addLeadFollowup = (leadId: string, date: string, note: string) => {
    fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followupDate: date, followupNote: note }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLeads((prev) => prev.map((l) => (l.id === leadId ? d.data : l)));
        }
      });
  };

  const importClientsBatch = (imported: Array<{ companyName: string; contactPerson: string; email: string; phone: string }>) => {
    fetch("/api/clients/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imported }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setClients((prev) => [...d.data, ...prev]);
        }
      });
    return imported.length;
  };

  return (
    <PrototypeStoreContext.Provider
      value={{
        leads,
        clients,
        employees,
        projects,
        activities,
        getLeadById,
        getClientById,
        getEmployeeById,
        getProjectById,
        addLead,
        updateLeadStage,
        convertLeadToClient,
        addClient,
        addLeadNote,
        addLeadFollowup,
        importClientsBatch,
      }}
    >
      {children}
    </PrototypeStoreContext.Provider>
  );
}

export function usePrototypeStore() {
  const context = useContext(PrototypeStoreContext);
  if (!context) {
    throw new Error("usePrototypeStore must be used within PrototypeStoreProvider");
  }
  return context;
}
