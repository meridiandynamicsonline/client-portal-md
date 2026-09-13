"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="bg-slate-900 shadow-lg px-4 sm:px-8 py-3.5 sticky top-0 z-30 border-b border-slate-800">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 sm:space-x-8">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="bg-white rounded p-1 shadow-sm shrink-0">
              <Image
                src="/logo-md-squared(1).png"
                alt="Logo"
                width={24}
                height={24}
                className="mix-blend-multiply sm:w-[26px] sm:h-[26px]"
              />
            </div>
            <h1 className={`text-base sm:text-lg font-bold text-white tracking-wide truncate ${playfair.className}`}>
              Meridian Dynamics{" "}
              <span className="text-blue-400 text-[10px] sm:text-xs tracking-widest uppercase font-sans font-semibold ml-1 px-1.5 py-0.5 bg-blue-950/60 rounded border border-blue-800/60">
                Admin
              </span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                pathname === "/"
                  ? "text-white bg-slate-800 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              Clients
            </Link>
            <Link
              href="/leads"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                pathname === "/leads"
                  ? "text-white bg-slate-800 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              Leads
            </Link>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:block">
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700/80 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 border-t border-slate-800/80 mt-3 space-y-2">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-xs font-semibold px-3 py-2 rounded-md transition-all ${
                pathname === "/"
                  ? "text-white bg-slate-800 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              Clients
            </Link>
            <Link
              href="/leads"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-xs font-semibold px-3 py-2 rounded-md transition-all ${
                pathname === "/leads"
                  ? "text-white bg-slate-800 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              Leads
            </Link>
          </nav>
          <div className="pt-2 border-t border-slate-800/60">
            <button
              onClick={handleSignOut}
              className="w-full text-left text-xs font-medium text-red-400 hover:text-red-300 bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}