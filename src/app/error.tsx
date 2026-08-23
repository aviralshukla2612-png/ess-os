"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error server-side or to monitoring safely
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-[#090E18]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Something went wrong</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Unable to complete this operation. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
