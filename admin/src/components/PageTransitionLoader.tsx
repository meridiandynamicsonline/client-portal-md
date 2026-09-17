"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoadingContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Hide the loader whenever the route change completes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Listen for anchor click events to trigger the full-screen loader immediately
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      if (
        target.href &&
        target.href.startsWith(window.location.origin) &&
        target.pathname !== pathname
      ) {
        setIsLoading(true);
      }
    };

    const links = document.querySelectorAll("a");
    links.forEach((link) => link.addEventListener("click", handleAnchorClick));

    return () => {
      links.forEach((link) => link.removeEventListener("click", handleAnchorClick));
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 border border-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin" />
          <div className="absolute animate-pulse">
            <Image
              src="/logo-md-squared(1).png"
              alt="Loading..."
              width={24}
              height={24}
              className="mix-blend-multiply"
            />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">
          Switching Views...
        </p>
      </div>
    </div>
  );
}

export default function PageTransitionLoader() {
  return (
    <Suspense fallback={null}>
      <LoadingContent />
    </Suspense>
  );
}