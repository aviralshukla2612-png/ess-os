"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Phone,
  Calendar,
  IndianRupee,
  Server,
  FileText,
  User,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Copy,
  MessageCircle,
} from "lucide-react";

interface CreatedBy {
  id: string;
  name: string;
  email: string;
  designation?: string;
  activeRole?: string;
}

interface ClientWebsite {
  id: string;
  clientName: string;
  mobileNumber: string;
  dateOfDevelopment: string | null;
  websiteLink: string | null;
  websiteDetails: string | null;
  price: number;
  serverDate: string | null;
  serverPrice: number;
  status: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: CreatedBy | null;
}

export default function ClientWebsitesPage() {
  const { showToast } = useToast();

  const [websites, setWebsites] = useState<ClientWebsite[]>([]);
  const [stats, setStats] = useState({
    totalWebsites: 0,
    totalWebsiteRevenue: 0,
    totalServerRevenue: 0,
    renewalsDueSoon: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [renewalFilter, setRenewalFilter] = useState<"ALL" | "DUE_SOON" | "ACTIVE" | "EXPIRED">("ALL");

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientWebsite | null>(null);
  const [viewDetailsItem, setViewDetailsItem] = useState<ClientWebsite | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    clientName: "",
    mobileNumber: "",
    dateOfDevelopment: "",
    websiteLink: "",
    websiteDetails: "",
    price: "",
    serverDate: "",
    serverPrice: "",
  });

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const res = await fetch("/crmtesting/api/client-websites");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWebsites(json.data);
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        showToast(json.error || "Failed to load website records", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error fetching client websites", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      clientName: "",
      mobileNumber: "",
      dateOfDevelopment: new Date().toISOString().split("T")[0],
      websiteLink: "",
      websiteDetails: "",
      price: "",
      serverDate: "",
      serverPrice: "",
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (item: ClientWebsite) => {
    setEditingItem(item);
    setFormData({
      clientName: item.clientName,
      mobileNumber: item.mobileNumber,
      dateOfDevelopment: item.dateOfDevelopment ? item.dateOfDevelopment.split("T")[0] : "",
      websiteLink: item.websiteLink || "",
      websiteDetails: item.websiteDetails || "",
      price: item.price ? String(item.price) : "",
      serverDate: item.serverDate ? item.serverDate.split("T")[0] : "",
      serverPrice: item.serverPrice ? String(item.serverPrice) : "",
    });
    setIsAddEditOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName.trim()) {
      showToast("Please enter client name", "error");
      return;
    }
    const cleanMobile = formData.mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      showToast("Mobile number must be exactly 10 digits", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingItem
        ? `/crmtesting/api/client-websites/${editingItem.id}`
        : `/crmtesting/api/client-websites`;
      const method = editingItem ? "PATCH" : "POST";

      const payload = {
        clientName: formData.clientName.trim(),
        mobileNumber: cleanMobile,
        dateOfDevelopment: formData.dateOfDevelopment || null,
        websiteLink: formData.websiteLink.trim() || null,
        websiteDetails: formData.websiteDetails.trim() || null,
        price: parseFloat(formData.price) || 0,
        serverDate: formData.serverDate || null,
        serverPrice: parseFloat(formData.serverPrice) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          editingItem
            ? `✓ Updated website details for "${formData.clientName}"`
            : `✓ Added new website record for "${formData.clientName}"`,
          "success"
        );
        setIsAddEditOpen(false);
        fetchWebsites();
      } else {
        showToast(`✕ ${json.error || "Save operation failed"}`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error while saving details", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete website details for "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/crmtesting/api/client-websites/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Removed website record for "${name}"`, "success");
        setWebsites((prev) => prev.filter((w) => w.id !== id));
        fetchWebsites();
      } else {
        showToast(`✕ ${json.error || "Failed to delete"}`, "error");
      }
    } catch (err) {
      showToast("Network error deleting record", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label} to clipboard`, "success");
  };

  // Filtered websites
  const filteredWebsites = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    return websites.filter((item) => {
      // Search
      const matchSearch =
        !search ||
        item.clientName.toLowerCase().includes(search.toLowerCase()) ||
        item.mobileNumber.toLowerCase().includes(search.toLowerCase()) ||
        (item.websiteLink && item.websiteLink.toLowerCase().includes(search.toLowerCase())) ||
        (item.websiteDetails && item.websiteDetails.toLowerCase().includes(search.toLowerCase())) ||
        (item.createdBy?.name && item.createdBy.name.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      // Renewal Filter
      if (renewalFilter === "ALL") return true;

      if (!item.serverDate) {
        return renewalFilter === "ACTIVE";
      }

      const sDate = new Date(item.serverDate);
      if (renewalFilter === "DUE_SOON") {
        return sDate >= now && sDate <= thirtyDays;
      }
      if (renewalFilter === "EXPIRED") {
        return sDate < now;
      }
      if (renewalFilter === "ACTIVE") {
        return sDate >= now;
      }

      return true;
    });
  }, [websites, search, renewalFilter]);

  const getServerDateStatus = (dateStr: string | null) => {
    if (!dateStr) {
      return {
        label: "No date set",
        color: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
      };
    }
    const target = new Date(dateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired (${Math.abs(diffDays)}d ago)`,
        color: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
      };
    }
    if (diffDays <= 30) {
      return {
        label: `Due in ${diffDays}d`,
        color: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
      };
    }
    return {
      label: `Active (${diffDays}d left)`,
      color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
    };
  };

  const exportToCSV = () => {
    if (websites.length === 0) {
      showToast("No records available to export", "error");
      return;
    }

    const headers = [
      "Client Name",
      "Mobile Number",
      "Date of Development",
      "Website Link",
      "Website Details",
      "Price (INR)",
      "Server Date",
      "Server Price (INR)",
      "Added By",
      "Created At",
    ];

    const rows = websites.map((w) => [
      `"${w.clientName.replace(/"/g, '""')}"`,
      `"${w.mobileNumber}"`,
      `"${w.dateOfDevelopment ? new Date(w.dateOfDevelopment).toLocaleDateString() : ""}"`,
      `"${w.websiteLink || ""}"`,
      `"${(w.websiteDetails || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      w.price || 0,
      `"${w.serverDate ? new Date(w.serverDate).toLocaleDateString() : ""}"`,
      w.serverPrice || 0,
      `"${w.createdBy?.name || "Salesperson"}"`,
      `"${new Date(w.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `client_websites_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ CSV Export complete", "success");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Client Websites Directory"
        description="Comprehensive repository of client development deliverables, web links, hosting dates, and server pricing."
        badge={`${websites.length} SITES`}
        icon={<Globe className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={exportToCSV}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-xs transition-all flex items-center gap-2"
              title="Export as CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={fetchWebsites}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all shadow-xs"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client Website</span>
            </button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Websites */}
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Client Sites</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            {stats.totalWebsites}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Active client development projects</p>
        </div>

        {/* Development Revenue */}
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Development Value</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            ₹{stats.totalWebsiteRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Aggregated project billing</p>
        </div>

        {/* Server / Hosting Revenue */}
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Annual Hosting Value</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            ₹{stats.totalServerRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Recurring server maintenance</p>
        </div>

        {/* Renewals Due Soon */}
        <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Renewals in 30 Days</span>
            <div
              className={`p-2 rounded-xl ${
                stats.renewalsDueSoon > 0
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono flex items-center gap-2">
            <span>{stats.renewalsDueSoon}</span>
            {stats.renewalsDueSoon > 0 && (
              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Action Needed
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Upcoming hosting renewal deadlines</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, mobile, website URL, details, or salesperson..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Filter Status:</span>
          {(
            [
              { key: "ALL", label: "All Records" },
              { key: "DUE_SOON", label: "Due Soon (30d)" },
              { key: "ACTIVE", label: "Active" },
              { key: "EXPIRED", label: "Expired" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRenewalFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                renewalFilter === tab.key
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View ("i want thia as column") */}
      <div className="bg-white/90 dark:bg-[#090F1D]/90 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Websites & Hosting Records
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Showing {filteredWebsites.length} of {websites.length}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto opacity-70" />
            <p className="text-sm font-semibold text-slate-500">Loading website records...</p>
          </div>
        ) : filteredWebsites.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Globe className="w-8 h-8 opacity-80" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No Website Records Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {search || renewalFilter !== "ALL"
                  ? "No client records match your search or filter criteria. Clear filters to see all entries."
                  : "Sales persons can start recording client website deliverables, development dates, and server hosting pricing."}
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Website Record</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">#</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Client Name</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Mobile Number</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Date of Dev</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Website Link</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Website Details</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Price</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Server Date</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Server Price</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Salesperson</th>
                  <th className="py-3.5 px-4 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredWebsites.map((item, idx) => {
                  const status = getServerDateStatus(item.serverDate);
                  const cleanUrl = item.websiteLink
                    ? item.websiteLink.startsWith("http")
                      ? item.websiteLink
                      : `https://${item.websiteLink}`
                    : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Serial */}
                      <td className="py-4 px-4 font-mono text-slate-400 font-semibold">{idx + 1}</td>

                      {/* Client Name */}
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {item.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              {item.clientName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              Added {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Mobile Number */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a
                            href={`tel:${item.mobileNumber}`}
                            className="hover:text-indigo-600 hover:underline font-semibold"
                          >
                            {item.mobileNumber}
                          </a>
                          <button
                            onClick={() => copyToClipboard(item.mobileNumber, "Phone Number")}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-600 transition-opacity"
                            title="Copy number"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={`https://wa.me/${item.mobileNumber.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-500"
                            title="Open WhatsApp chat"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Date of Development */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.dateOfDevelopment ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(item.dateOfDevelopment).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Website Link */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {cleanUrl ? (
                          <a
                            href={cleanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-all font-mono font-medium max-w-[180px] truncate"
                          >
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.websiteLink}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Website Details */}
                      <td className="py-4 px-4 max-w-xs">
                        {item.websiteDetails ? (
                          <div
                            onClick={() => setViewDetailsItem(item)}
                            className="cursor-pointer group/desc hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Click to view full details"
                          >
                            <p className="line-clamp-2 text-slate-600 dark:text-slate-400 text-xs font-normal">
                              {item.websiteDetails}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.price > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                            ₹{item.price.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      {/* Server Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.serverDate ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                              <Server className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(item.serverDate).toLocaleDateString()}</span>
                            </div>
                            <span
                              className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No date set</span>
                        )}
                      </td>

                      {/* Server Price */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.serverPrice > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ₹{item.serverPrice.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      {/* Added By / Salesperson */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-semibold">{item.createdBy?.name || "Sales Team"}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewDetailsItem(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="View Full Profile"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.clientName)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit BottomSheet Modal */}
      <BottomSheet
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingItem ? `Edit: ${editingItem.clientName}` : "Add Client Website Record"}
        subtitle="Record development parameters, website links, and server hosting renewal schedules."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs pb-36">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Client Name */}
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Acme Innovations Corp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* 2. Mobile Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-bold">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    formData.mobileNumber.length === 10
                      ? "text-emerald-500"
                      : formData.mobileNumber.length > 0
                      ? "text-amber-500"
                      : "text-slate-400"
                  }`}
                >
                  {formData.mobileNumber.length}/10 digits
                </span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.mobileNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, mobileNumber: val });
                }}
                placeholder="e.g. 9876543210"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-xs focus:ring-2 outline-none font-medium text-slate-900 dark:text-slate-100 font-mono transition-colors ${
                  formData.mobileNumber.length === 10
                    ? "border-emerald-500/60 focus:ring-emerald-500"
                    : formData.mobileNumber.length > 0
                    ? "border-amber-500/60 focus:ring-amber-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
              {formData.mobileNumber.length > 0 && formData.mobileNumber.length < 10 && (
                <p className="text-[10px] text-amber-500 mt-1 font-medium">
                  Must be exactly 10 digits ({10 - formData.mobileNumber.length} more needed)
                </p>
              )}
              {formData.mobileNumber.length === 10 && (
                <p className="text-[10px] text-emerald-500 mt-1 font-medium flex items-center gap-1">
                  <span>✓ 10-digit number</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 3. Date of Development */}
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Date of Development</span>
              </label>
              <PremiumDatePicker
                value={formData.dateOfDevelopment}
                onChange={(d) => setFormData({ ...formData, dateOfDevelopment: d })}
                placeholder="Select date of dev..."
                presets={[
                  { label: "Today", isToday: true },
                  { label: "-1 Month", monthsOffset: -1 },
                  { label: "-3 Months", monthsOffset: -3 },
                  { label: "-6 Months", monthsOffset: -6 },
                ]}
              />
            </div>

            {/* 4. Website Link */}
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>Website Link</span>
              </label>
              <input
                type="text"
                value={formData.websiteLink}
                onChange={(e) => setFormData({ ...formData, websiteLink: e.target.value })}
                placeholder="e.g. https://www.clientwebsite.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* 5. Website Details */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Website Details & Tech Scope</span>
            </label>
            <textarea
              rows={3}
              value={formData.websiteDetails}
              onChange={(e) => setFormData({ ...formData, websiteDetails: e.target.value })}
              placeholder="e.g. Next.js corporate portal with payment gateway, CMS blog, multi-lingual support, and SEO setup."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* 6. Price */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              <span>Development Price (₹)</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. 75000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            {/* 7. Server Date */}
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-500" />
                <span>Server Renewal Date</span>
              </label>
              <PremiumDatePicker
                value={formData.serverDate}
                onChange={(d) => setFormData({ ...formData, serverDate: d })}
                placeholder="Select renewal date..."
                accentColor="sky"
                align="left"
                presets={[
                  { label: "Today", isToday: true },
                  { label: "+1 Month", monthsOffset: 1 },
                  { label: "+6 Months", monthsOffset: 6 },
                  { label: "+1 Year", monthsOffset: 12 },
                  { label: "+2 Years", monthsOffset: 24 },
                ]}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Date when hosting/domain renewal is due</span>
            </div>

            {/* 8. Server Price */}
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-sky-500" />
                <span>Server Renewal Price (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.serverPrice}
                onChange={(e) => setFormData({ ...formData, serverPrice: e.target.value })}
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Annual hosting or maintenance cost</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? "Update Record" : "Save Website Record"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Detailed View Modal */}
      {viewDetailsItem && (
        <BottomSheet
          isOpen={!!viewDetailsItem}
          onClose={() => setViewDetailsItem(null)}
          title={viewDetailsItem.clientName}
          subtitle="Full record specification and hosting details"
        >
          <div className="space-y-5 text-xs pb-4">
            {/* Quick action bar */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  Primary Client Contact
                </span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {viewDetailsItem.mobileNumber}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${viewDetailsItem.mobileNumber}`}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={`https://wa.me/${viewDetailsItem.mobileNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                  Date of Development
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {viewDetailsItem.dateOfDevelopment
                    ? new Date(viewDetailsItem.dateOfDevelopment).toLocaleDateString()
                    : "Not Specified"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                  Development Price
                </span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  ₹{(viewDetailsItem.price || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                  Server Renewal Date
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {viewDetailsItem.serverDate
                      ? new Date(viewDetailsItem.serverDate).toLocaleDateString()
                      : "Not Specified"}
                  </span>
                  {viewDetailsItem.serverDate && (
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                        getServerDateStatus(viewDetailsItem.serverDate).color
                      }`}
                    >
                      {getServerDateStatus(viewDetailsItem.serverDate).label}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                  Server Hosting Price
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{(viewDetailsItem.serverPrice || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Website Link */}
            {viewDetailsItem.websiteLink && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                  Website URL
                </span>
                <div className="flex items-center justify-between gap-3">
                  <a
                    href={
                      viewDetailsItem.websiteLink.startsWith("http")
                        ? viewDetailsItem.websiteLink
                        : `https://${viewDetailsItem.websiteLink}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 break-all"
                  >
                    <span>{viewDetailsItem.websiteLink}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(viewDetailsItem.websiteLink!, "Website URL")}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Scope Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">
                Website Scope & Technical Details
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {viewDetailsItem.websiteDetails || "No specific details logged for this record."}
              </p>
            </div>

            {/* Audit info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Added by: {viewDetailsItem.createdBy?.name || "Sales Team"}</span>
              <span>Logged on: {new Date(viewDetailsItem.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
