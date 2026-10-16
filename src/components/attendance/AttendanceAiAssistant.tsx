"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Building2,
  RefreshCw,
  FileText,
  Trophy,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolUsed?: string;
  source?: "ollama" | "fallback";
  data?: any;
  downloadUrl?: string;
}

/**
 * Cleanly renders text by formatting bold text and removing ugly markdown asterisks
 */
function renderCleanContent(text: string) {
  if (!text) return null;

  const lines = text.split(String.fromCharCode(10));
  return (
    <div className="space-y-1.5 font-sans">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");
        const cleanLine = isBullet ? trimmed.replace(/^[•-]s*/, "") : trimmed;

        // Parse **bold** markers
        const parts = cleanLine.split(/(\*{2}.*?\*{2})/g);

        return (
          <div
            key={lineIdx}
            className={`${isBullet ? "flex items-start gap-2 pl-1" : ""} leading-relaxed`}
          >
            {isBullet && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              {parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  const boldText = part.slice(2, -2);
                  return (
                    <strong
                      key={pIdx}
                      className="font-bold text-slate-900 dark:text-slate-100"
                    >
                      {boldText}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part.replace(/\*\*/g, "")}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AttendanceAiAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your ESS OS Intelligence Assistant. I can analyze real-time attendance logs, employee rosters, late arrivals, and sales team performance directly from your database. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "How many employees are present today?",
    "Who is the best person in sales?",
    "Who arrived late today?",
    "Which employees have incomplete check-outs?",
    "Show attendance for Engineering department",
    "Generate monthly attendance summary",
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/crmtesting/api/attendance/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.explanation || "Query executed successfully.",
            toolUsed: data.toolUsed,
            source: data.source,
            data: data.data,
            downloadUrl: data.downloadUrl || data.data?.downloadUrl,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.explanation || data.error || "Unable to complete query.",
            source: data.source || "fallback",
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Network error connecting to the Analytics Assistant. Please check server connectivity.",
          source: "fallback",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-white dark:bg-[#0c1220] border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Premium Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                  ESS CRM AI Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                  Live DB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified attendance, employee & sales intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const summaryData = msg.data?.type === "summary" ? msg.data.data : (msg.data?.present !== undefined ? msg.data : null);
            const salesData = msg.data?.type === "sales_performance" ? msg.data : null;

            return (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1 shadow-sm shadow-indigo-600/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-md shadow-indigo-600/20 font-medium"
                      : "bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/80 dark:border-slate-800 shadow-sm"
                  }`}
                >
                  {/* Assistant Metadata Badge */}
                  {msg.role === "assistant" && msg.toolUsed && (
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Tool: {msg.toolUsed}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>Verified Record</span>
                    </div>
                  )}

                  {/* Clean Formatted Text (No Asterisks) */}
                  <div>{renderCleanContent(msg.content)}</div>

                  {/* Download PDF Button */}
                  {msg.downloadUrl && (
                    <div className="pt-1">
                      <a
                        href={msg.downloadUrl}
                        download
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download Vector PDF Report</span>
                      </a>
                    </div>
                  )}

                  {/* PREMIUM STRUCTURED UI: Attendance Summary with Employee Names */}
                  {summaryData && (
                    <div className="space-y-3 pt-2 font-sans">
                      {/* Metric KPI Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present</div>
                          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {summaryData.present} <span className="text-xs font-normal text-slate-400">/ {summaryData.totalExpected}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absent</div>
                          <div className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                            {summaryData.absent}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Late Arrivals</div>
                          <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                            {summaryData.late}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Shifts</div>
                          <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {summaryData.incompleteCheckout}
                          </div>
                        </div>
                      </div>

                      {/* Employee Name Rosters */}
                      <div className="space-y-2 pt-1 text-xs">
                        {/* Present Employees Badges */}
                        {summaryData.presentEmployees && summaryData.presentEmployees.length > 0 && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Present Employees ({summaryData.presentEmployees.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {summaryData.presentEmployees.map((emp: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-emerald-500/30 shadow-xs"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="font-semibold">{emp.name}</span>
                                  {emp.department && (
                                    <span className="text-[10px] text-slate-400">({emp.department})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Absent Employees Badges */}
                        {summaryData.absentEmployees && summaryData.absentEmployees.length > 0 && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                            <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                              <UserX className="w-3.5 h-3.5" />
                              <span>Absent Employees ({summaryData.absentEmployees.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {summaryData.absentEmployees.map((emp: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-rose-500/30 shadow-xs"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span className="font-semibold">{emp.name}</span>
                                  {emp.department && (
                                    <span className="text-[10px] text-slate-400">({emp.department})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Late Arrivals Badges */}
                        {summaryData.lateEmployees && summaryData.lateEmployees.length > 0 && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Late Arrivals ({summaryData.lateEmployees.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {summaryData.lateEmployees.map((emp: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-amber-500/30 shadow-xs"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span className="font-semibold">{emp.name}</span>
                                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                                    {emp.punchIn}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PREMIUM STRUCTURED UI: Sales Performance */}
                  {salesData && salesData.topPerson && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-amber-500/30 space-y-3 font-sans">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Trophy className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {salesData.topPerson.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {salesData.topPerson.designation}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                          Top Performer
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Won Revenue</div>
                          <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            ₹{(salesData.topPerson.wonValue || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Active Pipeline</div>
                          <div className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                            ₹{(salesData.topPerson.pipelineValue || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md shadow-indigo-600/30">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Querying verified database records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/40 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSend(q)}
              className="text-[11px] px-3 py-1.5 rounded-xl whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-102 active:scale-98 transition-all shadow-xs cursor-pointer font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1220] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about attendance, staff, or sales..."
            className="flex-1 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 transition-colors placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 flex items-center justify-center transition-all shadow-md shadow-indigo-600/20 cursor-pointer hover:scale-102 active:scale-98"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
