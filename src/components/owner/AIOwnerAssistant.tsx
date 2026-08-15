"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, RefreshCw } from "lucide-react";

export function AIOwnerAssistant() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const prompts = [
    "✨ Morning Brief",
    "Why is ABC delayed?",
    "Overdue Payments",
    "Team Workload",
  ];

  const handleAsk = async (userQuery: string) => {
    if (!userQuery.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });
      const data = await res.json();
      setResponse(data.reply || data.answer || "No insights found.");
    } catch {
      setResponse("Could not process query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">EMPEROR AI ASSISTANT</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Natural language intelligence operating over company data.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p);
                handleAsk(p);
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {response && (
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans shadow-xs">
            <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Emperor AI Executive Brief</span>
            </div>
            {response}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Emperor AI (e.g. 'What should I focus on today?', 'Who is working on ABC?')"
            className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
