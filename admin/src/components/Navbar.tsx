"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

export default function Navbar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="bg-slate-900 shadow-lg px-4 sm:px-8 py-3.5 flex justify-between items-center sticky top-0 z-10 border-b border-slate-800">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded p-1 shadow-sm">
            <Image
              src="/logo-md-squared(1).png"
              alt="Logo"
              width={26}
              height={26}
              className="mix-blend-multiply"
            />
          </div>
          <h1 className={`text-lg font-bold text-white tracking-wide ${playfair.className}`}>
            Meridian Dynamics{" "}
            <span className="text-blue-400 text-xs tracking-widest uppercase font-sans font-semibold ml-1.5 px-1.5 py-0.5 bg-blue-950/60 rounded border border-blue-800/60">
              Admin
            </span>
          </h1>
        </div>

        <nav className="flex items-center space-x-1">
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

      <button
        onClick={handleSignOut}
        className="text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700/80 transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}