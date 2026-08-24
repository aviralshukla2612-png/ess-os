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
  gstNo?: string;
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
  const [leads, setLeads] = useState<LeadEntity[]>([]);

  const [clients, setClients] = useState<ClientEntity[]>([]);

  const [employees, setEmployees] = useState<EmployeeEntity[]>([]);

  const [projects, setProjects] = useState<ProjectEntity[]>([]);

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const getLeadById = (id: string) => leads.find((l) => l.id === id || l.leadNumber === id);
  const getClientById = (id: string) => clients.find((c) => c.id === id || c.clientCode === id);
  const getEmployeeById = (id: string) => employees.find((e) => e.id === id || e.employeeId === id);
  const getProjectById = (id: string) => projects.find((p) => p.id === id || p.projectCode === id);

  const fetchAllData = async () => {
    try {
      const [leadsRes, clientsRes, projectsRes, employeesRes] = await Promise.all([
        fetch("/mdz-crm/api/leads").catch(() => null),
        fetch("/mdz-crm/api/clients").catch(() => null),
        fetch("/mdz-crm/api/projects").catch(() => null),
        fetch("/mdz-crm/api/employees").catch(() => null),
      ]);

      if (leadsRes) {
        const d = await leadsRes.json();
        if (d.success) setLeads(d.data);
      }
      if (clientsRes) {
        const d = await clientsRes.json();
        if (d.success) setClients(d.data);
      }
      if (projectsRes) {
        const d = await projectsRes.json();
        if (d.success) setProjects(d.data);
      }
      if (employeesRes) {
        const d = await employeesRes.json();
        if (d.success) setEmployees(d.data);
      }
    } catch (e) {
      console.error("Fetch Data Error:", e);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const addLead = (leadData: Partial<LeadEntity>) => {
    fetch("/mdz-crm/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          fetchAllData();
        }
      });
  };

  const updateLeadStage = (id: string, stage: LeadEntity["stage"]) => {
    fetch(`/mdz-crm/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          fetchAllData();
        }
      });
  };

  const convertLeadToClient = (leadId: string) => {
    fetch(`/mdz-crm/api/leads/${leadId}/convert`, {
      method: "POST",
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          fetchAllData();
        }
      });

    return {
      client: { id: "temp", companyName: "Converting..." } as any,
      project: { id: "temp", name: "Initializing..." } as any,
    };
  };

  const addClient = (clientData: Partial<ClientEntity>) => {
    fetch("/mdz-crm/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          fetchAllData();
        }
      });
  };

  const addLeadNote = (leadId: string, noteText: string) => {
    fetch(`/mdz-crm/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteText }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          fetchAllData();
        }
      });
  };

  const addLeadFollowup = (leadId: string, date: string, note: string) => {
    fetch(`/mdz-crm/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followupDate: date, followupNote: note }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          fetchAllData();
        }
      });
  };

  const importClientsBatch = (imported: Array<{ companyName: string; contactPerson: string; email: string; phone: string }>) => {
    fetch("/mdz-crm/api/clients/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imported }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          fetchAllData();
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
