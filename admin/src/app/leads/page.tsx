"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000"
    : "https://client-portal-md.onrender.com");

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  value: number;
  notes?: string;
  created_at?: string;
}

const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", value: 0, notes: "" });
  const router = useRouter();

  const getAuthToken = () => localStorage.getItem("admin_token") || localStorage.getItem("token");

  const fetchLeads = async () => {
    const token = getAuthToken();
    if (!token) return router.push("/login");

    try {
      const res = await fetch(`${API_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) return router.push("/login");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: number, nextStatus: string) => {
    const token = getAuthToken();
    await fetch(`${API_URL}/admin/leads/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l)));
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/admin/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", company: "", value: 0, notes: "" });
      fetchLeads();
    } else {
      alert("Failed to create lead");
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const token = getAuthToken();
    await fetch(`${API_URL}/admin/leads/${leadId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setLeads(leads.filter((l) => l.id !== leadId));
  };

  return (
    <div className={`min-h-screen bg-[#fcfaf7] text-slate-900 ${inter.className}`}>
      {/* Header matching main admin layout */}
      <header className="bg-slate-900 shadow-lg px-4 sm:px-8 py-3.5 flex justify-between items-center sticky top-0 z-10 border-b border-slate-800">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded p-1 shadow-sm">
              <Image src="/logo-md-squared(1).png" alt="Logo" width={26} height={26} className="mix-blend-multiply" />
            </div>
            <h1 className={`text-lg font-bold text-white tracking-wide ${playfair.className}`}>
              Meridian Dynamics{" "}
              <span className="text-blue-400 text-xs tracking-widest uppercase font-sans font-semibold ml-1.5 px-1.5 py-0.5 bg-blue-950/60 rounded border border-blue-800/60">
                Admin
              </span>
            </h1>
          </div>

          {/* Tab Navigation Links */}
          <nav className="flex items-center space-x-1">
            <Link
              href="/"
              className="text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 px-3 py-1.5 rounded-md transition-all"
            >
              Clients
            </Link>
            <Link
              href="/leads"
              className="text-xs font-semibold text-white bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 shadow-sm"
            >
              Leads
            </Link>
          </nav>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("admin_token");
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700/80 transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <main className="p-6 sm:p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight ${playfair.className}`}>
              Lead Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Track and manage prospective client relationships and pipeline values.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
          >
            + Add Lead
          </button>
        </div>

        {/* Leads Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="p-4 pl-6">Contact</th>
                <th className="p-4">Company</th>
                <th className="p-4">Estimated Value</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading pipeline...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <p className="text-slate-500 font-medium">No leads currently in the pipeline.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "+ Add Lead" above to create your first prospect.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-semibold text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lead.email} {lead.phone && `• ${lead.phone}`}
                      </p>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{lead.company || "—"}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      ${Number(lead.value || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className={`text-xl font-bold text-slate-900 ${playfair.className}`}>New Prospect</h3>
              <p className="text-xs text-slate-500 mt-1">Enter prospect details to track in your sales pipeline.</p>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="jane@company.com"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 0000-0000-00"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Estimated Deal Value (₹)
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={form.value || ""}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Goals, timeline, or notes..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold shadow-sm active:scale-[0.98]"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}