"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(75), 100);
    const timer2 = setTimeout(() => setProgress(100), 220);
    const timer3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-0.5 bg-slate-200/20 dark:bg-slate-800/20 overflow-hidden">
      <div
        className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(99,102,241,0.8)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarInner />
    </Suspense>
  );
}
