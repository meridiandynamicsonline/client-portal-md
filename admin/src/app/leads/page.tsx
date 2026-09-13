"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", value: 0, notes: "" });
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
        alert(`Failed to create lead: ${errorData.detail?.[0]?.msg || errorData.detail || "Server error"}`);
      }
    } catch (err) {
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
      <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Responsive Header Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-bold ${playfair.className}`}>Lead Pipeline</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Click any lead row to drop down scheduled events & follow-ups.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm">
            + Add Lead
          </button>
        </div>

        {/* Scrollable Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
            <thead className="bg-slate-50 border-b text-slate-500 text-[10px] sm:text-[11px] uppercase font-semibold">
              <tr>
                <th className="p-3.5 sm:p-4 pl-4 sm:pl-6">Prospect</th>
                <th className="p-3.5 sm:p-4">Company</th>
                <th className="p-3.5 sm:p-4">Value</th>
                <th className="p-3.5 sm:p-4">Status</th>
                <th className="p-3.5 sm:p-4 pr-4 sm:pr-6 text-right">Actions</th>
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
                      <div className="flex items-center justify-between p-3.5 sm:p-4 pl-4 sm:pl-6 hover:bg-slate-50/80 cursor-pointer" onClick={() => toggleExpand(lead.id)}>
                        <div className="w-1/4">
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <span className="text-[10px] sm:text-xs text-slate-400">{isExpanded ? "▼" : "▶"}</span>
                            <span className="truncate">{lead.name}</span>
                          </p>
                          <p className="text-[11px] sm:text-xs text-slate-500 ml-4 sm:ml-5 truncate">{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                        </div>
                        <div className="w-1/5 text-slate-700 truncate">{lead.company || "—"}</div>
                        <div className="w-1/6 font-semibold">₹{Number(lead.value || 0).toLocaleString('en-IN')}</div>
                        <div className="w-1/5" onClick={(e) => e.stopPropagation()}>
                          <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value)} className="text-[11px] sm:text-xs font-semibold px-2 py-1 rounded border bg-slate-50 focus:outline-none">
                            {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>
                        <div className="w-1/6 text-right pr-4 sm:pr-6" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleDeleteLead(lead.id)} className="text-xs text-red-600 hover:text-red-800 font-semibold">Delete</button>
                        </div>
                      </div>

                      {/* Dropdown Event Panel */}
                      {isExpanded && (
                        <div className="bg-slate-50/80 border-t border-b border-slate-200/80 p-4 sm:p-6 pl-6 sm:pl-12 space-y-4">
                          
                          {/* Prospect Notes */}
                          {lead.notes && (
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 max-w-2xl">
                              <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Prospect Notes & Requirements
                              </h4>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {lead.notes}
                              </p>
                            </div>
                          )}

                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Events & Milestones</h4>

                          {/* Add Event Form */}
                          <form onSubmit={(e) => handleAddEvent(lead.id, e)} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center max-w-2xl">
                            <input
                              type="text" placeholder="Event (e.g., Demo Call, Proposal Sent)"
                              className="flex-1 text-xs border rounded-lg p-2 bg-white focus:outline-none"
                              value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)}
                            />
                            <input
                              type="datetime-local"
                              className="text-xs border rounded-lg p-2 bg-white text-slate-700 focus:outline-none"
                              value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)}
                            />
                            <button type="submit" className="text-xs bg-slate-900 text-white px-3 py-2 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                              + Add Event
                            </button>
                          </form>

                          {/* Events List */}
                          <div className="space-y-2 max-w-2xl">
                            {(!lead.events || lead.events.length === 0) ? (
                              <p className="text-xs text-slate-400 italic">No events scheduled for this lead yet.</p>
                            ) : (
                              lead.events.map((ev) => (
                                <div key={ev.id} className="flex justify-between items-center bg-white p-2.5 sm:p-3 rounded-lg border text-xs border-slate-200">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                                    <span className="font-medium text-slate-800">{ev.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    <span className="text-slate-500 font-mono text-[11px] sm:text-xs">{new Date(ev.event_date).toLocaleString('en-IN')}</span>
                                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-red-500 hover:text-red-700 font-bold px-1">×</button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-2xl border border-slate-100 my-auto">
            <div>
              <h3 className={`text-lg sm:text-xl font-bold text-slate-900 ${playfair.className}`}>New Prospect</h3>
              <p className="text-xs text-slate-500 mt-1">Enter prospect details to track in your sales pipeline.</p>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="company@mail.com"
                  required
                  className="w-full border border-slate-200 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 12345 67890"
                    className="w-full border border-slate-200 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    placeholder="Company Name"
                    className="w-full border border-slate-200 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Estimated Deal Value (₹)
                </label>
                <input
                  type="number"
                  placeholder="xxxxxx"
                  className="w-full border border-slate-200 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={form.value || ""}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Requirements, timeline, or meeting notes..."
                  className="w-full border border-slate-200 rounded-lg p-2 sm:p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 sm:pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs sm:text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs sm:text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold shadow-sm"
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