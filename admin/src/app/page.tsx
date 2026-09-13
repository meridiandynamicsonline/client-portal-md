"use client";

import Link from "next/link";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000'
    : 'https://client-portal-md.onrender.com');

export default function AdminPortal() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  // Initialized to 'active' so the layout shell renders immediately
  const [status, setStatus] = useState<'loading' | 'active'>('active');
  const [activeTab, setActiveTab] = useState<'profile' | 'content' | 'deliverables' | 'vault'>('profile');

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
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchClientData = async (userId: number) => {
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
    if (!selectedUser) return;
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ company_name: companyName, industry, plan }),
    });

    if (response.ok) {
      alert("Client profile updated!");
      fetchUsers();
    }
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const token = localStorage.getItem('admin_token');

    const method = editingContentId ? 'PUT' : 'POST';
    const url = editingContentId
      ? `${API_URL}/admin/content/${editingContentId}`
      : `${API_URL}/admin/users/${selectedUser.id}/content`;

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
      fetchClientData(selectedUser.id);
    } else {
      alert("Failed to save content item.");
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
    if (!selectedUser) return;
    const token = localStorage.getItem('admin_token');

    const method = editingDeliverableId ? 'PUT' : 'POST';
    const url = editingDeliverableId
      ? `${API_URL}/admin/deliverables/${editingDeliverableId}`
      : `${API_URL}/admin/users/${selectedUser.id}/deliverables`;

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
      fetchClientData(selectedUser.id);
    } else {
      alert("Failed to save deliverable.");
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
    if (!selectedUser) return;
    if (!docFile) return alert("Please select a file to upload.");

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
        fetchClientData(selectedUser.id);
      } else {
        const errorData = await response.json();
        alert(`Server Error: ${errorData.detail}`);
      }
    } catch (error) {
      alert("An error occurred during upload.");
    }
  };

  const handleDelete = async (type: 'content' | 'deliverables' | 'documents', itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_URL}/admin/${type}/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        if (type === 'content' && editingContentId === itemId) cancelContentEdit();
        if (type === 'deliverables' && editingDeliverableId === itemId) cancelDeliverableEdit();
        fetchClientData(selectedUser.id);
      } else {
        alert(`Failed to delete ${type} item.`);
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleDeleteClient = async (userId: number, email: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently delete the account for ${email}? This will wipe all their vault files and history.`);
    if (!isConfirmed) return;

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
    }
  };

  return (
    <div className={`min-h-screen bg-[#fcfaf7] text-slate-900 ${inter.className}`}>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Client Roster Panel */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight ${playfair.className}`}>Client Roster</h2>
            <p className="text-sm text-slate-500 mt-1">Select a client below to configure profiles, deliverables, and secure document vaults.</p>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-slate-200/80 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Client Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Loading clients...
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <tr key={user.id} className={`transition-colors ${isSelected ? 'bg-slate-100/70' : 'hover:bg-slate-50/60'}`}>
                        <td className="px-6 py-4 font-semibold text-slate-900">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{user.profile?.company_name || '—'}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button onClick={() => handleSelectUser(user)} className="text-xs text-slate-900 font-bold hover:underline mr-4">Manage</button>
                          <button onClick={() => handleDeleteClient(user.id, user.email)} className="text-xs text-red-600 font-bold hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Sidebar */}
        <div>
          {selectedUser ? (
            <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-200/80 sticky top-24 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className={`text-lg font-bold text-slate-900 ${playfair.className}`}>Manage Client</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2 py-1 rounded bg-slate-100">Close</button>
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

              {/* Profile Management Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Company</label>
                    <input className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Industry</label>
                    <input className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Plan</label>
                    <select className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500" value={plan} onChange={(e) => setPlan(e.target.value)} required>
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
                  <button className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm">Save Profile</button>
                </form>
              )}

              {/* Content Calendar Tab */}
              {activeTab === 'content' && (
                <div className="space-y-5">
                  <form onSubmit={handleSubmitContent} className={`space-y-3 p-3.5 rounded-xl border ${editingContentId ? 'bg-slate-50 border-slate-300' : 'bg-slate-50/50 border-slate-200'}`}>
                    {editingContentId && <p className="text-xs font-bold text-slate-900 mb-1">Editing Calendar Entry...</p>}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Post Title</label>
                      <input className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" type="text" placeholder="e.g. Q3 SEO Strategy" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Platform</label>
                        <select className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" value={contentPlatform} onChange={(e) => setContentPlatform(e.target.value)}>
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
                        <select className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" value={contentStatus} onChange={(e) => setContentStatus(e.target.value)}>
                          <option value="Drafting">Drafting</option>
                          <option value="In Review">In Review</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Published">Published</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Scheduled Date</label>
                      <input className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" type="datetime-local" value={contentDate} onChange={(e) => setContentDate(e.target.value)} required />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                        {editingContentId ? 'Update Item' : 'Add Entry'}
                      </button>
                      {editingContentId && (
                        <button type="button" onClick={cancelContentEdit} className="flex-1 rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300">Cancel</button>
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
                            <button onClick={() => handleDelete('content', item.id)} className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1 rounded">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Deliverables Tab */}
              {activeTab === 'deliverables' && (
                <div className="space-y-5">
                  <form onSubmit={handleSubmitDeliverable} className={`space-y-3 p-3.5 rounded-xl border ${editingDeliverableId ? 'bg-slate-50 border-slate-300' : 'bg-slate-50/50 border-slate-200'}`}>
                    {editingDeliverableId && <p className="text-xs font-bold text-slate-900 mb-1">Editing Deliverable...</p>}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Title</label>
                      <input className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" type="text" placeholder="e.g. Website Audit" value={delivTitle} onChange={(e) => setDelivTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                      <select className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" value={delivStatus} onChange={(e) => setDelivStatus(e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Due Date</label>
                      <input className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" type="datetime-local" value={delivDueDate} onChange={(e) => setDelivDueDate(e.target.value)} required />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                        {editingDeliverableId ? 'Update Item' : 'Assign'}
                      </button>
                      {editingDeliverableId && (
                        <button type="button" onClick={cancelDeliverableEdit} className="flex-1 rounded-lg bg-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300">Cancel</button>
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
                            <button onClick={() => handleDelete('deliverables', item.id)} className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1 rounded">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Secure Vault Tab */}
              {activeTab === 'vault' && (
                <div className="space-y-5">
                  <form onSubmit={handleUploadDocument} className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Document Title</label>
                      <input className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white" type="text" placeholder="e.g. Q3 Performance Report" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">File Attachment</label>
                      <input className="w-full rounded-lg border border-slate-200 p-1.5 text-xs text-slate-900 bg-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-slate-900 file:text-white hover:file:bg-slate-800" type="file" onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)} required accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv" />
                    </div>
                    <button className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm">Upload to Vault</button>
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
                          <button onClick={() => handleDelete('documents', doc.id)} className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1 rounded">Delete</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 border border-slate-200/80 text-center flex items-center justify-center h-64 border-dashed sticky top-24 shadow-sm">
              <p className="text-slate-400 text-xs font-medium">Select a client from the roster to manage their profile and vault.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}