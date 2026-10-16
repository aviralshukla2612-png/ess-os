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
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolUsed?: string;
  source?: "ollama" | "fallback";
  data?: any;
  downloadUrl?: string;
}

export function AttendanceAiAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your Emperor Smart Solutions Attendance Assistant. I can analyze real-time attendance logs, late arrivals, incomplete check-outs, and monthly department summaries using verified database records. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "How many employees are present today?",
    "Who arrived late today?",
    "Which employees have incomplete check-outs?",
    "Show attendance for Engineering department",
    "Show my attendance history",
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
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Emperor Attendance AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Ollama Analytics
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified database attendance intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2.5 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-500/10"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                {/* Assistant Metadata Badge */}
                {msg.role === "assistant" && msg.toolUsed && (
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-700/80 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Tool: {msg.toolUsed}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>Source: {msg.source}</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.downloadUrl && (
                  <div className="pt-2">
                    <a
                      href={msg.downloadUrl}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download PDF Report</span>
                    </a>
                  </div>
                )}

                {/* Structured UI Card for Summary */}
                {msg.data?.type === "summary" && (
                  <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-500">Present</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {msg.data.data.present} / {msg.data.data.totalExpected}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-500">Absent</div>
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {msg.data.data.absent}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-500">Late Arrivals</div>
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {msg.data.data.late}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-500">Open Shifts</div>
                      <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {msg.data.data.incompleteCheckout}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                Analyzing real database records...
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2.5 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
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
            placeholder="Ask anything about attendance, staff, or hours..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 flex items-center justify-center transition-all shadow-md shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
