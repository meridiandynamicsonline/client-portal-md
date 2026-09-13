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

interface LeadEvent {
  id: number;
  title: string;
  event_date: string;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  value: number;
  notes?: string;
  events?: LeadEvent[];
}

const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // New Lead Form State
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", value: 0, notes: "" });
  
  // New Event Inputs for Expanded Rows
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

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

  const toggleExpand = (leadId: number) => {
    setExpandedLeadId(expandedLeadId === leadId ? null : leadId);
    setNewEventTitle("");
    setNewEventDate("");
  };

  const handleAddEvent = async (leadId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return alert("Please fill in event title and date.");

    const token = getAuthToken();
    const res = await fetch(`${API_URL}/admin/leads/${leadId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newEventTitle, event_date: new Date(newEventDate).toISOString() }),
    });

    if (res.ok) {
      setNewEventTitle("");
      setNewEventDate("");
      fetchLeads();
    } else {
      alert("Failed to add event");
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/admin/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchLeads();
  };

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

    try {
      const res = await fetch(`${API_URL}/admin/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          value: Number(form.value) || 0,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ name: "", email: "", phone: "", company: "", value: 0, notes: "" });
        fetchLeads();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Create Lead Error Response:", errorData);
        alert(`Failed to create lead: ${errorData.detail?.[0]?.msg || errorData.detail || "Server error"}`);
      }
    } catch (err) {
      console.error("Network / Server Error:", err);
      alert("Could not reach backend server to create lead.");
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!confirm("Delete lead and associated events?")) return;
    const token = getAuthToken();
    await fetch(`${API_URL}/admin/leads/${leadId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setLeads(leads.filter((l) => l.id !== leadId));
  };

  return (
    <div className={`min-h-screen bg-[#fcfaf7] text-slate-900 ${inter.className}`}>
      {/* Header */}
      <header className="bg-slate-900 px-8 py-3.5 flex justify-between items-center sticky top-0 z-10 border-b border-slate-800">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded p-1">
              <Image src="/logo-md-squared(1).png" alt="Logo" width={26} height={26} className="mix-blend-multiply" />
            </div>
            <h1 className={`text-lg font-bold text-white ${playfair.className}`}>
              Meridian Dynamics <span className="text-blue-400 text-xs font-semibold uppercase ml-1 px-1.5 py-0.5 bg-blue-950/60 rounded border border-blue-800/60">Admin</span>
            </h1>
          </div>
          <nav className="flex space-x-1">
            <Link href="/" className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-md">Clients</Link>
            <Link href="/leads" className="text-xs font-semibold text-white bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">Leads</Link>
          </nav>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded border border-slate-700">Sign Out</button>
      </header>

      {/* Main Container */}
      <main className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-bold ${playfair.className}`}>Lead Pipeline</h2>
            <p className="text-sm text-slate-500 mt-1">Click any lead row to drop down scheduled events & follow-ups.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800">+ Add Lead</button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-500 text-[11px] uppercase font-semibold">
              <tr>
                <th className="p-4 pl-6">Prospect</th>
                <th className="p-4">Company</th>
                <th className="p-4">Value</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading pipeline...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No leads found. Click "+ Add Lead" to get started.</td></tr>
              ) : leads.map((lead) => {
                const isExpanded = expandedLeadId === lead.id;
                return (
                  <tr key={lead.id} className="group">
                    <td colSpan={5} className="p-0">
                      {/* Main Lead Row */}
                      <div className="flex items-center justify-between p-4 pl-6 hover:bg-slate-50/80 cursor-pointer" onClick={() => toggleExpand(lead.id)}>
                        <div className="w-1/4">
                          <p className="font-semibold text-slate-900 flex items-center gap-2">
                            <span className="text-xs text-slate-400">{isExpanded ? "▼" : "▶"}</span>
                            {lead.name}
                          </p>
                          <p className="text-xs text-slate-500 ml-5">{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                        </div>
                        <div className="w-1/5 text-slate-700">{lead.company || "—"}</div>
                        <div className="w-1/6 font-semibold">${Number(lead.value || 0).toLocaleString()}</div>
                        <div className="w-1/5" onClick={(e) => e.stopPropagation()}>
                          <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value)} className="text-xs font-semibold px-2 py-1 rounded border bg-slate-50">
                            {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>
                        <div className="w-1/6 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleDeleteLead(lead.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </div>

                      {/* Dropdown Event Panel */}
                      {isExpanded && (
                        <div className="bg-slate-50/80 border-t border-b border-slate-200/80 p-6 pl-12 space-y-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Events & Milestones</h4>

                          {/* Add Event Form */}
                          <form onSubmit={(e) => handleAddEvent(lead.id, e)} className="flex gap-3 items-center max-w-2xl">
                            <input
                              type="text" placeholder="Event (e.g., Demo Call, Proposal Sent)"
                              className="flex-1 text-xs border rounded-lg p-2 bg-white"
                              value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)}
                            />
                            <input
                              type="datetime-local"
                              className="text-xs border rounded-lg p-2 bg-white text-slate-700"
                              value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)}
                            />
                            <button type="submit" className="text-xs bg-slate-900 text-white px-3 py-2 rounded-lg font-semibold hover:bg-slate-800">
                              + Add Event
                            </button>
                          </form>

                          {/* Events List */}
                          <div className="space-y-2 max-w-2xl">
                            {(!lead.events || lead.events.length === 0) ? (
                              <p className="text-xs text-slate-400 italic">No events scheduled for this lead yet.</p>
                            ) : (
                              lead.events.map((ev) => (
                                <div key={ev.id} className="flex justify-between items-center bg-white p-3 rounded-lg border text-xs border-slate-200">
                                  <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="font-medium text-slate-800">{ev.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-slate-500 font-mono">{new Date(ev.event_date).toLocaleString()}</span>
                                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
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
                    placeholder="+1 (555) 000-0000"
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
                  Estimated Deal Value ($)
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