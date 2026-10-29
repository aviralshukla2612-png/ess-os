"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";

interface PremiumDatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (dateStr: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  presets?: { label: string; monthsOffset?: number; daysOffset?: number; isToday?: boolean }[];
  accentColor?: "indigo" | "sky" | "emerald";
  align?: "left" | "right";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function PremiumDatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  presets = [
    { label: "Today", isToday: true },
    { label: "+1 Month", monthsOffset: 1 },
    { label: "+6 Months", monthsOffset: 6 },
    { label: "+1 Year", monthsOffset: 12 },
  ],
  accentColor = "indigo",
  align = "left",
}: PremiumDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 350 && rect.top > 350) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
    setIsOpen(!isOpen);
  };

  // Parse current selected date
  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  // View state (which month/year is shown on the calendar)
  const [viewDate, setViewDate] = useState<Date>(
    selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()
  );

  // Synchronize viewDate if value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yr = parseInt(e.target.value, 10);
    setViewDate(new Date(yr, viewMonth, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10);
    setViewDate(new Date(viewYear, m, 1));
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formatted = `${year}-${mm}-${dd}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleApplyPreset = (preset: { monthsOffset?: number; daysOffset?: number; isToday?: boolean }) => {
    const now = new Date();
    let target = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (preset.monthsOffset) {
      target = new Date(now.getFullYear(), now.getMonth() + preset.monthsOffset, now.getDate());
    } else if (preset.daysOffset) {
      target.setDate(target.getDate() + preset.daysOffset);
    }

    const yr = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    const formatted = `${yr}-${mm}-${dd}`;
    onChange(formatted);
    setViewDate(target);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Generate days matrix
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: { day: number; currentMonth: boolean; year: number; month: number }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: totalDaysInPrevMonth - i,
      currentMonth: false,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      month: viewMonth === 0 ? 11 : viewMonth - 1,
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    days.push({
      day: i,
      currentMonth: true,
      year: viewYear,
      month: viewMonth,
    });
  }

  // Next month leading days to complete grid of 35 or 42
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      currentMonth: false,
      year: viewMonth === 11 ? viewYear + 1 : viewYear,
      month: viewMonth === 11 ? 0 : viewMonth + 1,
    });
  }

  const isSelected = (yr: number, m: number, d: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === yr &&
      selectedDate.getMonth() === m &&
      selectedDate.getDate() === d
    );
  };

  const isToday = (yr: number, m: number, d: number) => {
    const today = new Date();
    return (
      today.getFullYear() === yr &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return null;
    const d = new Date(dStr + "T00:00:00");
    if (isNaN(d.getTime())) return dStr;
    const day = d.getDate();
    const month = MONTH_NAMES[d.getMonth()].slice(0, 3);
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  // Generate Year options from currentYear - 5 to currentYear + 10
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all group outline-none select-none ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-900 shadow-md shadow-indigo-500/10"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/60"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`p-1.5 rounded-lg shrink-0 transition-colors ${
              value
                ? accentColor === "sky"
                  ? "bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400"
                  : "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>

          {value ? (
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">
              {formatDisplayDate(value)}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </button>

      {/* Premium Popover Calendar */}
      {isOpen && (
        <div
          className={`absolute ${openUpward ? "bottom-full mb-2" : "top-full mt-2"} ${
            align === "right" ? "right-0" : "left-0"
          } z-[120] w-[310px] sm:w-[330px] p-4 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-indigo-950/30 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Calendar Header with Month & Year Dropdowns */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                className="bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={handleYearChange}
                className="bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs font-bold font-mono text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets Pills */}
          {presets && presets.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700/60 transition-all shrink-0 active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 mb-1.5 text-center">
            {WEEK_DAYS.map((wd) => (
              <span
                key={wd}
                className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1 font-mono"
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((item, idx) => {
              const selected = isSelected(item.year, item.month, item.day);
              const currentToday = isToday(item.year, item.month, item.day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(item.year, item.month, item.day)}
                  className={`h-8 rounded-xl text-xs font-semibold flex items-center justify-center relative transition-all active:scale-95 font-mono ${
                    selected
                      ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black shadow-md shadow-indigo-600/30"
                      : item.currentMonth
                      ? currentToday
                        ? "text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                      : "text-slate-300 dark:text-slate-600 hover:bg-slate-100/40 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <span>{item.day}</span>
                  {currentToday && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => handleApplyPreset({ isToday: true })}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Clock className="w-3 h-3" /> Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
