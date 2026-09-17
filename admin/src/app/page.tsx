"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000'
    : 'https://client-portal-md.onrender.com');

// Inline Button Spinner Component
function ButtonSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current inline-block" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// Section / Panel Loader Component
function SectionLoader({ text = "Loading..." }: { text?: string }) {
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

// Fullscreen Route Transition Overlay Inner Component (Cream Theme, No Box)
function FullScreenLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      if (
        target.href &&
        target.href.startsWith(window.location.origin) &&
        target.pathname !== pathname
      ) {
        setNavigating(true);
      }
    };

    const links = document.querySelectorAll("a");
    links.forEach((link) => link.addEventListener("click", handleAnchorClick));

    return () => {
      links.forEach((link) => link.removeEventListener("click", handleAnchorClick));
    };
  }, [pathname]);

  if (!navigating) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fcfaf7] transition-all">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex items-center justify-center">
          {/* Animated Spinner with slate border top */}
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
          <div className="absolute animate-pulse">
            <Image
              src="/logo-md-squared(1).png"
              alt="Loading..."
              width={28}
              height={28}
              className="mix-blend-multiply"
            />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-800 uppercase tracking-widest animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}

// Fullscreen Loader Wrapper with Suspense
function FullScreenLoader() {
  return (
    <Suspense fallback={null}>
      <FullScreenLoaderContent />
    </Suspense>
  );
}

export default function AdminPortal() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'content' | 'deliverables' | 'vault'>('profile');

  // Loading States
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  // Client Data States
  const [clientContent, setClientContent] = useState<any[]>([]);
  const [clientDeliverables, setClientDeliverables] = useState<any[]>([]);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);

  // Edit Mode States
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [editingDeliverableId, setEditingDeliverableId] = useState<number | null>(null);

  // Form States - Profile
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [plan, setPlan] = useState('Essential');

  // Form States - Content Calendar
  const [contentTitle, setContentTitle] = useState('');
  const [contentPlatform, setContentPlatform] = useState('YouTube');
  const [contentDate, setContentDate] = useState('');
  const [contentStatus, setContentStatus] = useState('Drafting');

  // Form States - Deliverables
  const [delivTitle, setDelivTitle] = useState('');
  const [delivDueDate, setDelivDueDate] = useState('');
  const [delivStatus, setDelivStatus] = useState('Pending');

  // Form States - Secure Vault
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const fetchUsers = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUsers(await response.json());
      } else {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    } catch (error) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchClientData = async (userId: number) => {
    setLoadingClientData(true);
    const token = localStorage.getItem('admin_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [contentRes, delivRes, docRes] = await Promise.all([
        fetch(`${API_URL}/admin/users/${userId}/content`, { headers }),
        fetch(`${API_URL}/admin/users/${userId}/deliverables`, { headers }),
        fetch(`${API_URL}/admin/users/${userId}/documents`, { headers })
      ]);

      if (contentRes.ok) setClientContent(await contentRes.json());
      if (delivRes.ok) setClientDeliverables(await delivRes.json());
      if (docRes.ok) setClientDocuments(await docRes.json());
    } catch (error) {
      console.error("Failed to fetch client data:", error);
    } finally {
      setLoadingClientData(false);
    }
  };

  const formatForInput = (isoString: string) => {
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setCompanyName(user.profile?.company_name || '');
    setIndustry(user.profile?.industry || '');
    setPlan(user.profile?.plan || 'Essential');

    cancelContentEdit();
    cancelDeliverableEdit();
    fetchClientData(user.id);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || submitting) return;

    setSubmitting(true);
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ company_name: companyName, industry, plan }),
      });

      if (response.ok) {
        alert("Client profile updated!");
        await fetchUsers();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || submitting) return;

    setSubmitting(true);
    const token = localStorage.getItem('admin_token');

    const method = editingContentId ? 'PUT' : 'POST';
    const url = editingContentId
      ? `${API_URL}/admin/content/${editingContentId}`
      : `${API_URL}/admin/users/${selectedUser.id}/content`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: contentTitle,
          platform: contentPlatform,
          scheduled_date: new Date(contentDate).toISOString(),
          status: contentStatus
        }),
      });

      if (response.ok) {
        cancelContentEdit();
        await fetchClientData(selectedUser.id);
      } else {
        alert("Failed to save content item.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const editContent = (item: any) => {
    setEditingContentId(item.id);
    setContentTitle(item.title);
    setContentPlatform(item.platform);
    setContentDate(formatForInput(item.scheduled_date));
    setContentStatus(item.status);
  };

  const cancelContentEdit = () => {
    setEditingContentId(null);
    setContentTitle('');
    setContentDate('');
    setContentStatus('Drafting');
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || submitting) return;

    setSubmitting(true);
    const token = localStorage.getItem('admin_token');

    const method = editingDeliverableId ? 'PUT' : 'POST';
    const url = editingDeliverableId
      ? `${API_URL}/admin/deliverables/${editingDeliverableId}`
      : `${API_URL}/admin/users/${selectedUser.id}/deliverables`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: delivTitle,
          due_date: new Date(delivDueDate).toISOString(),
          status: delivStatus
        }),
      });

      if (response.ok) {
        cancelDeliverableEdit();
        await fetchClientData(selectedUser.id);
      } else {
        alert("Failed to save deliverable.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const editDeliverable = (item: any) => {
    setEditingDeliverableId(item.id);
    setDelivTitle(item.title);
    setDelivDueDate(formatForInput(item.due_date));
    setDelivStatus(item.status);
  };

  const cancelDeliverableEdit = () => {
    setEditingDeliverableId(null);
    setDelivTitle('');
    setDelivDueDate('');
    setDelivStatus('Pending');
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || submitting) return;
    if (!docFile) return alert("Please select a file to upload.");

    setSubmitting(true);
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append("title", docTitle);
    formData.append("file", docFile);

    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        alert("Document securely uploaded!");
        setDocTitle('');
        setDocFile(null);
        await fetchClientData(selectedUser.id);
      } else {
        const errorData = await response.json();
        alert(`Server Error: ${errorData.detail}`);
      }
    } catch (error) {
      alert("An error occurred during upload.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type: 'content' | 'deliverables' | 'documents', itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    if (deletingItemId) return;

    setDeletingItemId(itemId);
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_URL}/admin/${type}/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        if (type === 'content' && editingContentId === itemId) cancelContentEdit();
        if (type === 'deliverables' && editingDeliverableId === itemId) cancelDeliverableEdit();
        await fetchClientData(selectedUser.id);
      } else {
        alert(`Failed to delete ${type} item.`);
      }
    } catch (error) {
      console.error("Delete error", error);
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDeleteClient = async (userId: number, email: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently delete the account for ${email}? This will wipe all their vault files and history.`);
    if (!isConfirmed) return;
    if (deletingClientId) return;

    setDeletingClientId(userId);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        alert("Client successfully deleted.");
        if (selectedUser?.id === userId) setSelectedUser(null);
      } else {
        const data = await response.json();
        alert(`Failed to delete client: ${data.detail}`);
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("An error occurred while trying to delete the client.");
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className={`min-h-screen bg-[#fcfaf7] text-slate-900 ${inter.className}`}>
      {/* Fullscreen Transition Loader */}
      <FullScreenLoader />

      {/* Responsive Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* Client Roster Panel */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight ${playfair.className}`}>Client Roster</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Select a client below to configure profiles, deliverables, and secure document vaults.</p>
          </div>

          {/* Table Container with Horizontal Scroll on Mobile */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 overflow-x-auto">
            {loadingUsers ? (
              <SectionLoader text="Fetching registered clients..." />
            ) : (
              <table className="w-full text-left text-xs sm:text-sm min-w-[550px]">
                <thead className="bg-slate-50/75 text-slate-500 uppercase text-[10px] sm:text-[11px] tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4">Client Email</th>
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4">Role</th>
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4">Company</th>
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No clients found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isSelected = selectedUser?.id === user.id;
                      const isAdmin = user.role === 'admin';
                      const isDeletingThis = deletingClientId === user.id;

                      return (
                        <tr key={user.id} className={`transition-colors ${isSelected ? 'bg-slate-100/70' : 'hover:bg-slate-50/60'}`}>
                          <td className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-none">{user.email}</td>
                          <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-slate-600 font-medium">{user.profile?.company_name || '—'}</td>
                          <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right whitespace-nowrap">
                            {!isAdmin ? (
                              <button onClick={() => handleSelectUser(user)} className="text-xs text-slate-900 font-bold hover:underline mr-3 sm:mr-4">
                                Manage
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic select-none mr-3 sm:mr-4">
                                Action
                              </span>
                            )}

                            {!isAdmin ? (
                              <button
                                disabled={isDeletingThis}
                                onClick={() => handleDeleteClient(user.id, user.email)}
                                className="text-xs text-red-600 font-bold hover:text-red-800 disabled:opacity-50"
                              >
                                {isDeletingThis && <ButtonSpinner />}
                                {isDeletingThis ? "Deleting..." : "Delete"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium italic select-none">
                                Disabled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="w-full">
          {selectedUser ? (
            <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-slate-200/80 sticky top-20 sm:top-24 space-y-4 sm:space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="overflow-hidden">
                  <h3 className={`text-base sm:text-lg font-bold text-slate-900 ${playfair.className}`}>Manage Client</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-[200px]">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2.5 py-1 rounded bg-slate-100">Close</button>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-slate-200 text-xs font-semibold space-x-2 overflow-x-auto">
                {(['profile', 'content', 'deliverables', 'vault'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2.5 px-1 capitalize transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                  >
                    {tab === 'content' ? 'Calendar' : tab}
                  </button>
                ))}
              </div>

              {loadingClientData ? (
                <SectionLoader text="Syncing client vault..." />
              ) : (
                <>
                  {/* Profile Management Tab */}
                  {activeTab === 'profile' && (
                    <form onSubmit={handleUpdateProfile} className="space-y-3.5 sm:space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Company</label>
                        <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-60" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Industry</label>
                        <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-60" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Plan</label>
                        <select disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-60" value={plan} onChange={(e) => setPlan(e.target.value)} required>
                          <option value="Essential">Essential</option>
                          <option value="Professional">Professional</option>
                          <option value="Signature">Signature</option>
                          <option value="Custom - Website">Custom - Website</option>
                          <option value="Foundation">Foundation</option>
                          <option value="Momentum">Momentum</option>
                          <option value="Dominance">Dominance</option>
                          <option value="Custom - Social">Custom - Social</option>
                        </select>
                      </div>
                      <button disabled={submitting} className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center">
                        {submitting && <ButtonSpinner />}
                        {submitting ? "Saving Profile..." : "Save Profile"}
                      </button>
                    </form>
                  )}

                  {/* Content Calendar Tab */}
                  {activeTab === 'content' && (
                    <div className="space-y-4 sm:space-y-5">
                      <form onSubmit={handleSubmitContent} className={`space-y-3 p-3.5 rounded-xl border ${editingContentId ? 'bg-slate-50 border-slate-300' : 'bg-slate-50/50 border-slate-200'}`}>
                        {editingContentId && <p className="text-xs font-bold text-slate-900 mb-1">Editing Calendar Entry...</p>}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Post Title</label>
                          <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" type="text" placeholder="e.g. Q3 SEO Strategy" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Platform</label>
                            <select disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" value={contentPlatform} onChange={(e) => setContentPlatform(e.target.value)}>
                              <option value="YouTube">YouTube</option>
                              <option value="Instagram">Instagram</option>
                              <option value="TikTok">TikTok</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="X (Twitter)">X (Twitter)</option>
                              <option value="Facebook">Facebook</option>
                              <option value="Newsletter">Newsletter</option>
                              <option value="Blog">Blog</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                            <select disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" value={contentStatus} onChange={(e) => setContentStatus(e.target.value)}>
                              <option value="Drafting">Drafting</option>
                              <option value="In Review">In Review</option>
                              <option value="Scheduled">Scheduled</option>
                              <option value="Published">Published</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Scheduled Date</label>
                          <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" type="datetime-local" value={contentDate} onChange={(e) => setContentDate(e.target.value)} required />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 flex items-center justify-center disabled:opacity-50">
                            {submitting && <ButtonSpinner />}
                            {submitting ? "Saving..." : editingContentId ? 'Update Item' : 'Add Entry'}
                          </button>
                          {editingContentId && (
                            <button type="button" disabled={submitting} onClick={cancelContentEdit} className="flex-1 rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50">Cancel</button>
                          )}
                        </div>
                      </form>

                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Existing Calendar</p>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {clientContent.length === 0 ? <p className="text-xs text-slate-400 italic">No content scheduled.</p> : clientContent.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-2.5 border border-slate-200 rounded-lg bg-white">
                              <div className="overflow-hidden pr-2">
                                <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                                <p className="text-[10px] text-slate-500">{item.platform} • {new Date(item.scheduled_date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex shrink-0 space-x-1">
                                <button onClick={() => editContent(item)} className="text-[10px] text-slate-900 font-bold hover:bg-slate-100 p-1 rounded">Edit</button>
                                <button
                                  disabled={deletingItemId === item.id}
                                  onClick={() => handleDelete('content', item.id)}
                                  className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1 rounded disabled:opacity-50"
                                >
                                  {deletingItemId === item.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Deliverables Tab */}
                  {activeTab === 'deliverables' && (
                    <div className="space-y-4 sm:space-y-5">
                      <form onSubmit={handleSubmitDeliverable} className={`space-y-3 p-3.5 rounded-xl border ${editingDeliverableId ? 'bg-slate-50 border-slate-300' : 'bg-slate-50/50 border-slate-200'}`}>
                        {editingDeliverableId && <p className="text-xs font-bold text-slate-900 mb-1">Editing Deliverable...</p>}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Title</label>
                          <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" type="text" placeholder="e.g. Website Audit" value={delivTitle} onChange={(e) => setDelivTitle(e.target.value)} required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                          <select disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" value={delivStatus} onChange={(e) => setDelivStatus(e.target.value)}>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Due Date</label>
                          <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" type="datetime-local" value={delivDueDate} onChange={(e) => setDelivDueDate(e.target.value)} required />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 flex items-center justify-center disabled:opacity-50">
                            {submitting && <ButtonSpinner />}
                            {submitting ? "Saving..." : editingDeliverableId ? 'Update Item' : 'Assign'}
                          </button>
                          {editingDeliverableId && (
                            <button type="button" disabled={submitting} onClick={cancelDeliverableEdit} className="flex-1 rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50">Cancel</button>
                          )}
                        </div>
                      </form>

                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Deliverables</p>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {clientDeliverables.length === 0 ? <p className="text-xs text-slate-400 italic">No deliverables assigned.</p> : clientDeliverables.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-2.5 border border-slate-200 rounded-lg bg-white">
                              <div className="overflow-hidden pr-2">
                                <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                                <p className="text-[10px] text-slate-500">{item.status}</p>
                              </div>
                              <div className="flex shrink-0 space-x-1">
                                <button onClick={() => editDeliverable(item)} className="text-[10px] text-slate-900 font-bold hover:bg-slate-100 p-1 rounded">Edit</button>
                                <button
                                  disabled={deletingItemId === item.id}
                                  onClick={() => handleDelete('deliverables', item.id)}
                                  className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1 rounded disabled:opacity-50"
                                >
                                  {deletingItemId === item.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Secure Vault Tab */}
                  {activeTab === 'vault' && (
                    <div className="space-y-4 sm:space-y-5">
                      <form onSubmit={handleUploadDocument} className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Document Title</label>
                          <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white disabled:opacity-60" type="text" placeholder="e.g. Q3 Performance Report" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} required />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">File Attachment</label>
                          <input disabled={submitting} className="w-full rounded-lg border border-slate-200 p-1.5 text-xs text-slate-900 bg-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-slate-900 file:text-white hover:file:bg-slate-800 disabled:opacity-60" type="file" onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)} required accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv" />
                        </div>
                        <button disabled={submitting} className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center disabled:opacity-50">
                          {submitting && <ButtonSpinner />}
                          {submitting ? "Uploading File..." : "Upload to Vault"}
                        </button>
                      </form>

                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Vault Contents</p>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {clientDocuments.length === 0 ? <p className="text-xs text-slate-400 italic">Vault is currently empty.</p> : clientDocuments.map((doc) => (
                            <div key={doc.id} className="flex justify-between items-center p-2.5 border border-slate-200 rounded-lg bg-white">
                              <div className="overflow-hidden pr-2 flex items-center space-x-2">
                                <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                                  <p className="text-[10px] text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <button
                                disabled={deletingItemId === doc.id}
                                onClick={() => handleDelete('documents', doc.id)}
                                className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1 rounded disabled:opacity-50"
                              >
                                {deletingItemId === doc.id ? "..." : "Delete"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-slate-200/80 text-center flex items-center justify-center h-48 sm:h-64 border-dashed sticky top-20 sm:top-24 shadow-sm">
              <p className="text-slate-400 text-xs font-medium">Select a client from the roster to manage their profile and vault.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}