"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  Eye,
  X,
  CreditCard,
  Building2,
  User,
  Camera,
  FileText,
  Sparkles,
  PartyPopper,
  Save,
  RotateCcw,
  Check,
  RefreshCw,
} from "lucide-react";

interface KycData {
  id?: string;
  status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  aadharNumber?: string;
  aadharFrontUrl?: string;
  aadharBackUrl?: string;
  panNumber?: string;
  panCardUrl?: string;
  passportPhotoUrl?: string;
  selfieUrl?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankProofUrl?: string;
  rejectionReason?: string | null;
  isNotified?: boolean;
  submittedAt?: string;
  reviewedAt?: string;
}

export default function KycPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [kyc, setKyc] = useState<KycData>({
    status: "NOT_SUBMITTED",
    aadharNumber: "",
    aadharFrontUrl: "",
    aadharBackUrl: "",
    panNumber: "",
    panCardUrl: "",
    passportPhotoUrl: "",
    selfieUrl: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankProofUrl: "",
  });

  const [formData, setFormData] = useState<KycData>({
    status: "NOT_SUBMITTED",
    aadharNumber: "",
    aadharFrontUrl: "",
    aadharBackUrl: "",
    panNumber: "",
    panCardUrl: "",
    passportPhotoUrl: "",
    selfieUrl: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankProofUrl: "",
  });

  // Edit toggles per section
  const [editSection, setEditSection] = useState<{ [key: string]: boolean }>({
    aadhar: false,
    pan: false,
    photo: false,
    selfie: false,
    bank: false,
  });

  // Modal states
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    fetchKycData();
  }, []);

  const fetchKycData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/crmtesting/api/kyc");
      const json = await res.json();
      if (json.success && json.data) {
        setKyc(json.data);
        setFormData(json.data);

        // Check if Admin recently approved and employee hasn't dismissed celebration popup
        if (json.data.status === "APPROVED" && !json.data.isNotified) {
          setShowApprovalModal(true);
        }

        // Auto open edit mode if not submitted or rejected
        if (json.data.status === "NOT_SUBMITTED" || json.data.status === "REJECTED") {
          setEditSection({ aadhar: true, pan: true, photo: true, selfie: true, bank: true });
        }
      }
    } catch (err) {
      showToast("Failed to load KYC information", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDismissApprovalModal = async () => {
    setShowApprovalModal(false);
    try {
      await fetch("/crmtesting/api/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markNotified: true }),
      });
    } catch {
      // Ignored
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof KycData) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be less than 10MB", "error");
      return;
    }

    try {
      setUploadingField(fieldName as string);
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/crmtesting/api/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();

      if (json.success && json.url) {
        setFormData((prev) => ({ ...prev, [fieldName]: json.url }));
        showToast("Document uploaded successfully", "success");
      } else {
        showToast(json.error || "Upload failed", "error");
      }
    } catch {
      showToast("Error uploading file", "error");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveKyc = async () => {
    // Validate minimum required fields
    if (!formData.aadharNumber && !formData.aadharFrontUrl) {
      showToast("Please provide your Aadhaar Card details", "error");
      return;
    }
    if (!formData.panNumber && !formData.panCardUrl) {
      showToast("Please provide your PAN Card details", "error");
      return;
    }
    if (!formData.accountNumber || !formData.ifscCode) {
      showToast("Please fill in your Bank Account & IFSC code", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/crmtesting/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        showToast("KYC documents submitted to Admin for approval!", "success");
        setKyc(json.data);
        setFormData(json.data);
        setEditSection({ aadhar: false, pan: false, photo: false, selfie: false, bank: false });
      } else {
        showToast(json.error || "Failed to submit KYC", "error");
      }
    } catch {
      showToast("Error submitting KYC", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleSectionEdit = (section: string) => {
    setEditSection((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading KYC status & documents...</p>
      </div>
    );
  }

  const isApproved = kyc.status === "APPROVED";
  const isPending = kyc.status === "PENDING";
  const isRejected = kyc.status === "REJECTED";
  const isNotSubmitted = kyc.status === "NOT_SUBMITTED";

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      <PageHeader
        title="Personal Details & KYC Verification"
        description="Upload and manage your Aadhaar, PAN, identity portrait, and bank verification documents."
        badge="IDENTITY & COMPLIANCE"
        icon={<ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
      />

      {/* STATUS BANNER */}
      {isApproved && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
              Verified & Approved by Admin
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400/90 mt-0.5">
              All your identity documents and bank details have been verified by the Admin.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
            APPROVED
          </span>
        </div>
      )}

      {isPending && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">
              Under Review by Admin
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-0.5">
              Your KYC submission is currently awaiting verification by the Admin. You can update any detail if needed.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
            PENDING VERIFICATION
          </span>
        </div>
      )}

      {isRejected && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-rose-800 dark:text-rose-300">
              Correction Required - KYC Rejected
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              Admin remarks: <strong className="font-semibold">{kyc.rejectionReason || "Please upload clear photos and valid account details."}</strong>
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
            ACTION REQUIRED
          </span>
        </div>
      )}

      {isNotSubmitted && (
        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-200">
              Complete Your Verification
            </h3>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
              Please fill in your Aadhaar, PAN card, passport photograph, and bank account information below.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
            NOT SUBMITTED
          </span>
        </div>
      )}

      {/* 4 CARD SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: AADHAAR CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">1. Aadhaar Card</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Front & Back Government ID</p>
              </div>
            </div>
            <button
              onClick={() => toggleSectionEdit("aadhar")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editSection.aadhar ? "Done" : "Edit"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Aadhaar Number (12 Digits)
              </label>
              {editSection.aadhar ? (
                <input
                  type="text"
                  maxLength={14}
                  placeholder="e.g. 1234 5678 9012"
                  value={formData.aadharNumber || ""}
                  onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formData.aadharNumber || <span className="text-slate-400 italic">Not entered</span>}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Front Side */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Aadhaar Front Photo</span>
                {formData.aadharFrontUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                    <img src={formData.aadharFrontUrl} alt="Aadhaar Front" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewImage({ url: formData.aadharFrontUrl!, title: "Aadhaar Front Side" })}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {editSection.aadhar && (
                        <label className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "aadharFrontUrl")} />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl aspect-video flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                    {uploadingField === "aadharFrontUrl" ? (
                      <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-500">Upload Front</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "aadharFrontUrl")} />
                  </label>
                )}
              </div>

              {/* Back Side */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Aadhaar Back Photo</span>
                {formData.aadharBackUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                    <img src={formData.aadharBackUrl} alt="Aadhaar Back" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewImage({ url: formData.aadharBackUrl!, title: "Aadhaar Back Side" })}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {editSection.aadhar && (
                        <label className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "aadharBackUrl")} />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl aspect-video flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all">
                    {uploadingField === "aadharBackUrl" ? (
                      <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-500">Upload Back</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "aadharBackUrl")} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PAN CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">2. PAN Card</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tax Identification Number</p>
              </div>
            </div>
            <button
              onClick={() => toggleSectionEdit("pan")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editSection.pan ? "Done" : "Edit"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                PAN Number (10 Characters)
              </label>
              {editSection.pan ? (
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={formData.panNumber || ""}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formData.panNumber || <span className="text-slate-400 italic">Not entered</span>}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">PAN Card Photo</span>
              {formData.panCardUrl ? (
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                  <img src={formData.panCardUrl} alt="PAN Card" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewImage({ url: formData.panCardUrl!, title: "PAN Card" })}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {editSection.pan && (
                      <label className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "panCardUrl")} />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl aspect-video flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all">
                  {uploadingField === "panCardUrl" ? (
                    <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500">Upload PAN Photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "panCardUrl")} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: PASSPORT PHOTO */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">3. Passport Size Photo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Official Profile Photo</p>
              </div>
            </div>
            <button
              onClick={() => toggleSectionEdit("photo")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editSection.photo ? "Done" : "Edit"}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {formData.passportPhotoUrl ? (
              <div className="relative group rounded-3xl overflow-hidden border-2 border-indigo-500/40 w-36 h-44 flex-shrink-0 bg-slate-950">
                <img src={formData.passportPhotoUrl} alt="Passport Photo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewImage({ url: formData.passportPhotoUrl!, title: "Passport Photo" })}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {editSection.photo && (
                    <label className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "passportPhotoUrl")} />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl w-36 h-44 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all flex-shrink-0">
                {uploadingField === "passportPhotoUrl" ? (
                  <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 text-center px-2">Upload Photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "passportPhotoUrl")} />
              </label>
            )}

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Photo Requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Clear front-facing portrait with plain background</li>
                <li>Good lighting with no hats, sunglasses, or filters</li>
                <li>Supported formats: JPG, PNG, WEBP (Max 10MB)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 4: LIVE SELFIE PHOTO */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">4. Live Selfie Photo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Identity Verification Selfie with Face Match</p>
              </div>
            </div>
            <button
              onClick={() => toggleSectionEdit("selfie")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editSection.selfie ? "Done" : "Edit"}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {formData.selfieUrl ? (
              <div className="relative group rounded-3xl overflow-hidden border-2 border-cyan-500/40 w-36 h-44 flex-shrink-0 bg-slate-950">
                <img src={formData.selfieUrl} alt="Selfie Verification" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewImage({ url: formData.selfieUrl!, title: "Live Selfie Photo" })}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {editSection.selfie && (
                    <label className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileUpload(e, "selfieUrl")} />
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl w-36 h-44 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition-all flex-shrink-0">
                {uploadingField === "selfieUrl" ? (
                  <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 text-center px-2">Take / Upload Selfie</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileUpload(e, "selfieUrl")} />
              </label>
            )}

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Selfie Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Take a direct selfie facing your front camera</li>
                <li>Ensure face is centered with clear neutral expression</li>
                <li>Remove cap, mask, or sunglasses during capture</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 5: BANK DETAILS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">5. Bank Account Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">For Payroll & Salary Disbursements</p>
              </div>
            </div>
            <button
              onClick={() => toggleSectionEdit("bank")}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editSection.bank ? "Done" : "Edit"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                {editSection.bank ? (
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={formData.bankName || ""}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formData.bankName || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Holder Name</label>
                {editSection.bank ? (
                  <input
                    type="text"
                    placeholder="As per bank records"
                    value={formData.accountHolderName || ""}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formData.accountHolderName || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                {editSection.bank ? (
                  <input
                    type="text"
                    placeholder="e.g. 50100234567890"
                    value={formData.accountNumber || ""}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">{formData.accountNumber || "-"}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">IFSC Code</label>
                {editSection.bank ? (
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={formData.ifscCode || ""}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">{formData.ifscCode || "-"}</p>
                )}
              </div>
            </div>

            {/* Passbook / Cancelled Cheque image */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Passbook / Cheque Proof Photo</span>
              {formData.bankProofUrl ? (
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                  <img src={formData.bankProofUrl} alt="Bank Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewImage({ url: formData.bankProofUrl!, title: "Bank Passbook / Cheque" })}
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {editSection.bank && (
                      <label className="p-2 rounded-xl bg-white/20 hover:bg-white/40 text-white backdrop-blur-md cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "bankProofUrl")} />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl aspect-video flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-amber-500 hover:bg-amber-500/5 transition-all">
                  {uploadingField === "bankProofUrl" ? (
                    <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[11px] font-semibold text-slate-500">Upload Passbook / Cheque</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "bankProofUrl")} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div>
          <h4 className="font-bold text-base">Save & Submit for Verification</h4>
          <p className="text-xs text-slate-400">
            Once submitted, your personal details will be sent directly to the Admin for official review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFormData(kyc)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSaveKyc}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isApproved ? "Update Verified Details" : "Submit KYC Documents"}</span>
          </button>
        </div>
      </div>

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <h3 className="font-bold text-sm">{previewImage.title}</h3>
              <button onClick={() => setPreviewImage(null)} className="p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATORY APPROVAL POPUP MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-emerald-500/40 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <PartyPopper className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                VERIFICATION COMPLETE
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Congratulations! 🎉
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Admin has verified and approved all of your KYC documents and bank details successfully.
              </p>
            </div>

            <button
              onClick={handleDismissApprovalModal}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Got it, Thank you!</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
