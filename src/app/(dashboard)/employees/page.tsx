"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataImportModal } from "@/components/ui/DataImportModal";
import {
  UserCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { SubAdminPermissionSelector } from "@/components/admin/SubAdminPermissionSelector";

export default function EmployeesPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [empName, setEmpName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [subAdminPermissions, setSubAdminPermissions] = useState<string[]>([
    "attendance",
    "projects",
    "leads",
    "clients",
  ]);

  const [editPermissionsModal, setEditPermissionsModal] = useState<{
    isOpen: boolean;
    employeeId: string;
    name: string;
    permissions: string[];
    role: string;
  }>({
    isOpen: false,
    employeeId: "",
    name: "",
    permissions: [],
    role: "",
  });

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: "",
  });
  const [isImportOpen, setIsImportOpen] = useState(false);

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/crmtesting/api/employees");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner && role === "SUB_ADMIN") {
      showToast("Only the Owner can create Sub-Admins", "error");
      return;
    }
    try {
      const payload: any = { name: empName, email, password, designation, role: isOwner ? role : (role === "SALES" ? "SALES" : "EMPLOYEE") };
      if (role === "SUB_ADMIN" && isOwner) {
        payload.subAdminPermissions = subAdminPermissions;
      }

      const res = await fetch("/crmtesting/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Profile for "${empName || 'New User'}" created successfully`, "success");
        fetchEmployees();
        setIsAddOpen(false);
        setEmpName("");
        setEmail("");
        setPassword("");
        setDesignation("");
        setRole("EMPLOYEE");
        setSubAdminPermissions(["attendance", "projects", "leads", "clients"]);
      } else {
        if (res.status === 409) {
          showToast("Email already exists in the system", "error");
        } else {
          showToast(json.error || "Failed to create employee", "error");
        }
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      showToast("Only the Owner can manage Sub-Admin privileges", "error");
      return;
    }
    try {
      const res = await fetch(`/crmtesting/api/employees/${editPermissionsModal.employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editPermissionsModal.role,
          subAdminPermissions: editPermissionsModal.permissions,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Access permissions updated for "${editPermissionsModal.name}"`, "success");
        setEditPermissionsModal({ isOpen: false, employeeId: "", name: "", permissions: [], role: "" });
        fetchEmployees();
      } else {
        showToast(json.error || "Failed to update permissions", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    try {
      const res = await fetch(`/crmtesting/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Employee ${name} deleted successfully`, "success");
        fetchEmployees();
      } else {
        showToast(json.error || "Failed to delete employee", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleImportData = async (data: any[]) => {
    let successCount = 0;
    
    for (const row of data) {
      try {
        const rowName = row["Full Name"] || row["Name"] || row["name"];
        const rowEmail = row["Email"] || row["email"] || row["Email Address"];
        const rowDesignation = row["Designation"] || row["Role"] || "Employee";
        
        if (!rowName || !rowEmail) continue;

        const res = await fetch("/crmtesting/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: rowName, 
            email: rowEmail, 
            password: "Password123!", 
            designation: rowDesignation, 
            role: "EMPLOYEE" 
          }),
        });
        
        if (res.ok) successCount++;
      } catch (e) {
        console.error("Import error on row:", row);
      }
    }
    
    showToast(`✓ Imported ${successCount} employees successfully`, "success");
    fetchEmployees();
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Employees & HR Directory"
        description="Company workforce, designations, active task focus, and work logs."
        badge="WORKFORCE HUB"
        icon={<UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        }
      />
      {/* Employees Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading employee directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs dark:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200 space-y-4 flex flex-col justify-between group"
          >
            <Link href={`/employees/${emp.id}`} className="space-y-3 block">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-extrabold text-base flex items-center justify-center shadow-lg shadow-indigo-600/25">
                    {emp.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {emp.employeeId}
                      </span>
                      {emp.role === "SUB_ADMIN" && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>SUB-ADMIN ({emp.subAdminPermissions?.length || 0})</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {emp.designation} • {emp.department}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {emp.email}
                    </div>
                  </div>
                </div>

                {emp.punchedIn ? (
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>WORKING</span>
                  </span>
                ) : emp.shiftCompleted ? (
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                    COMPLETED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    OFFLINE
                  </span>
                )}
              </div>

              {/* Current Active Focus */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">CURRENT FOCUS</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{emp.currentTask}</div>
              </div>
            </Link>

            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Assigned: <strong className="text-slate-800 dark:text-slate-200">{emp.assignedProjects.length} Projects</strong>
              </span>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditPermissionsModal({
                        isOpen: true,
                        employeeId: emp.id,
                        name: emp.name,
                        permissions: emp.subAdminPermissions || [],
                        role: emp.role || "EMPLOYEE",
                      });
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                      emp.role === "SUB_ADMIN"
                        ? "bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    }`}
                    title="Configure Sub-Admin Permissions & Sides"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{emp.role === "SUB_ADMIN" ? "Permissions" : "Sub-Admin"}</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmDelete({ isOpen: true, id: emp.id, name: emp.name });
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  title="Fire Employee"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Link
                  href={`/employees/${emp.id}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all group-hover:translate-x-0.5 shadow-xs"
                >
                  <span>Employee 360°</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </Link>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Add Employee / Sub-Admin Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={isOwner ? "Add Team Member / Sub-Admin" : "Add Team Member"}
        subtitle={isOwner ? "Provision employee profile, role context, and administrative permissions." : "Provision employee profile and assign system role."}
      >
        <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              placeholder="e.g. Ankit Sharma"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@esscompany.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Temporary Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Secure temporary password"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Designation</label>
            <input
              type="text"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder={role === "SUB_ADMIN" && isOwner ? "Operations Manager / Sub Admin" : "Backend Developer"}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="EMPLOYEE">Standard Employee</option>
              <option value="SALES">Sales Representative</option>
              {isOwner && <option value="SUB_ADMIN">🛡️ Sub-Admin (Custom Admin Access)</option>}
            </select>
          </div>

          {/* Sub-Admin Module Permissions Selector */}
          {role === "SUB_ADMIN" && isOwner && (
            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60">
              <SubAdminPermissionSelector
                selectedPermissions={subAdminPermissions}
                onChange={setSubAdminPermissions}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            {role === "SUB_ADMIN" && isOwner ? "Create Sub-Admin Profile" : "Create Employee Profile"}
          </button>
        </form>
      </BottomSheet>

      {/* Manage Sub-Admin Permissions Bottom Sheet */}
      <BottomSheet
        isOpen={editPermissionsModal.isOpen}
        onClose={() => setEditPermissionsModal({ isOpen: false, employeeId: "", name: "", permissions: [], role: "" })}
        title={`Access & Permissions: ${editPermissionsModal.name}`}
        subtitle="Provision Sub-Admin privileges and select permitted admin sides."
      >
        <form onSubmit={handleSavePermissions} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">User System Role</label>
            <select
              value={editPermissionsModal.role}
              onChange={(e) => setEditPermissionsModal(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="EMPLOYEE">Standard Employee</option>
              <option value="SALES">Sales Representative</option>
              <option value="SUB_ADMIN">🛡️ Sub-Admin (Custom Admin Access)</option>
            </select>
          </div>

          {editPermissionsModal.role === "SUB_ADMIN" ? (
            <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60">
              <SubAdminPermissionSelector
                selectedPermissions={editPermissionsModal.permissions}
                onChange={(perms) => setEditPermissionsModal(prev => ({ ...prev, permissions: perms }))}
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              This user has standard {editPermissionsModal.role} access. Select <strong>Sub-Admin</strong> above to grant custom admin sides & tasks.
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditPermissionsModal({ isOpen: false, employeeId: "", name: "", permissions: [], role: "" })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold shadow-sm transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </BottomSheet>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: "", name: "" })}
        onConfirm={() => handleDeleteEmployee(confirmDelete.id, confirmDelete.name)}
        title="Fire Employee"
        message={`Are you sure you want to fire and permanently remove ${confirmDelete.name}? This action cannot be undone and will delete their attendance and session logs.`}
        confirmText="Yes, Fire Employee"
        isDestructive={true}
      />
      
      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportData}
        title="Import Employee Directory"
      />
    </div>
  );
}
