"use client";

import Image from "next/image";

// Full Section / Card Loading Overlay
export function ComponentLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        <div className="absolute animate-pulse">
          <Image src="/logo-md-squared(1).png" alt="Loading" width={20} height={20} className="mix-blend-multiply" />
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{text}</p>
    </div>
  );
}

// Small Inline Spinner for Action Buttons
export function ButtonSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}