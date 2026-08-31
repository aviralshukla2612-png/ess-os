"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from "lucide-react";

interface CalendarDatePickerProps {
  startDate: string;
  endDate?: string;
  onDateChange: (start: string, end: string) => void;
  className?: string;
  isSingle?: boolean;
  align?: "left" | "right";
}

export function CalendarDatePicker({ startDate, endDate, onDateChange, className = "", isSingle = false, align = "left" }: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Date objects for rendering
  const [currentMonth, setCurrentMonth] = useState(startDate ? new Date(startDate) : new Date());
  
  // Selection state
  const [selectingStart, setSelectingStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
  const [selectingEnd, setSelectingEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update internal state when props change
  useEffect(() => {
    if (startDate) setSelectingStart(new Date(startDate));
    if (endDate) setSelectingEnd(new Date(endDate));
  }, [startDate, endDate]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    if (isSingle) {
      setSelectingStart(day);
      setSelectingEnd(day);
      onDateChange(format(day, "yyyy-MM-dd"), format(day, "yyyy-MM-dd"));
      setIsOpen(false);
      return;
    }

    // If both are selected, reset and start a new selection
    if (selectingStart && selectingEnd) {
      setSelectingStart(day);
      setSelectingEnd(null);
    } 
    // If only start is selected, set end
    else if (selectingStart && !selectingEnd) {
      if (isBefore(day, selectingStart)) {
        // Picked a date before start, swap them
        setSelectingEnd(selectingStart);
        setSelectingStart(day);
        
        onDateChange(
          format(day, "yyyy-MM-dd"),
          format(selectingStart, "yyyy-MM-dd")
        );
      } else {
        setSelectingEnd(day);
        onDateChange(
          format(selectingStart, "yyyy-MM-dd"),
          format(day, "yyyy-MM-dd")
        );
      }
      setIsOpen(false);
    } 
    // If nothing is selected
    else {
      setSelectingStart(day);
      setSelectingEnd(null);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Add padding for start of month
    const startPadding = start.getDay(); // 0-6 (Sun-Sat)
    const paddingDays = Array.from({ length: startPadding }).map((_, i) => null);
    
    const days = eachDayOfInterval({ start, end });
    return [...paddingDays, ...days];
  };

  const days = getDaysInMonth();
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const formatDateLabel = () => {
    if (!startDate) return "Select Date";
    if (isSingle || !endDate || startDate === endDate) return format(new Date(startDate), "MMM d, yyyy");
    return `${format(new Date(startDate), "MMM d")} - ${format(new Date(endDate), "MMM d, yyyy")}`;
  };

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          <span>{formatDateLabel()}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} z-50 w-72 bg-white dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200`}>
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="h-8" />;
              }

              const isSelectedStart = selectingStart && isSameDay(day, selectingStart);
              const isSelectedEnd = selectingEnd && isSameDay(day, selectingEnd);
              const isSelected = isSelectedStart || isSelectedEnd;
              
              const isInRange = selectingStart && selectingEnd && 
                isWithinInterval(day, { 
                  start: startOfDay(selectingStart), 
                  end: startOfDay(selectingEnd) 
                });
                
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateClick(day)}
                  className={`
                    h-8 w-full flex items-center justify-center text-xs font-semibold rounded-md transition-all relative
                    ${isSelected ? "bg-indigo-600 text-white shadow-md z-10" : ""}
                    ${isInRange && !isSelected ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-none" : ""}
                    ${!isSelected && !isInRange ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" : ""}
                    ${isToday && !isSelected ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : ""}
                    
                    ${isSelectedStart && selectingEnd ? "rounded-r-none" : ""}
                    ${isSelectedEnd && selectingStart ? "rounded-l-none" : ""}
                  `}
                >
                  {format(day, "d")}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Presets */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const today = format(new Date(), "yyyy-MM-dd");
                onDateChange(today, today);
                setIsOpen(false);
              }}
              className={`${isSingle ? 'col-span-2' : ''} px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors`}
            >
              Today
            </button>
            {!isSingle && (
              <button
                onClick={() => {
                  const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
                  const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
                  onDateChange(start, end);
                  setIsOpen(false);
                }}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                This Month
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
