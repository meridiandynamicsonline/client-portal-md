"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminPortal() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'active'>('loading');
  const [activeTab, setActiveTab] = useState<'profile' | 'content' | 'deliverables' | 'vault'>('profile');

  // Client Existing Data
  const [clientContent, setClientContent] = useState<any[]>([]);
  const [clientDeliverables, setClientDeliverables] = useState<any[]>([]);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);

  // Edit Mode States
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [editingDeliverableId, setEditingDeliverableId] = useState<number | null>(null);

  // Form States - Profile
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [plan, setPlan] = useState('Pro Growth SEO');

  // Form States - Content Calendar
  const [contentTitle, setContentTitle] = useState('');
  const [contentPlatform, setContentPlatform] = useState('LinkedIn');
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
        setStatus('active');
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
      console.error("Failed to fetch client specifics:", error);
    }
  };

  // Helper to format ISO dates to HTML datetime-local format
  const formatForInput = (isoString: string) => {
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setCompanyName(user.profile?.company_name || '');
    setIndustry(user.profile?.industry || '');
    setPlan(user.profile?.plan || 'Pro Growth SEO');
    
    // Reset edit modes when switching users
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

  // --- CONTENT SUBMISSION (ADD OR UPDATE) ---
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

  // --- DELIVERABLES SUBMISSION (ADD OR UPDATE) ---
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

  // --- VAULT SUBMISSION ---
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

  // --- DELETE HANDLERS ---
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

  // NEW: Delete User Account Handler
  const handleDeleteClient = async (userId: number, email: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to permanently delete the account for ${email}? This will wipe all their vault files and history.`);
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the deleted client from the UI dynamically
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        alert("Client successfully deleted.");
        
        // If the deleted user was currently selected in the side panel, close it
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      } else {
        const data = await response.json();
        alert(`Failed to delete client: ${data.detail}`);
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("An error occurred while trying to delete the client.");
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className={`text-slate-600 ${inter.className}`}>Verifying admin credentials...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.className}`}>
      
      {/* Header */}
      <header className="bg-slate-900 shadow-lg px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded p-1">
            <Image src="/logo-md-squared(1).png" alt="Logo" width={28} height={28} className="mix-blend-multiply" />
          </div>
          <h1 className={`text-xl font-bold text-white ${playfair.className}`}>Meridian Dynamics <span className="text-blue-400 text-sm tracking-widest uppercase ml-2">Admin</span></h1>
        </div>
        
        <button 
          onClick={() => {
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
          }}
          className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded border border-slate-700 transition-colors"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Client Roster */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className={`text-2xl font-bold text-slate-900 ${playfair.className}`}>Client Roster</h2>
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                <tr><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Company</th><th className="px-6 py-4 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className={`transition-colors ${selectedUser?.id === user.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.profile?.company_name || '—'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button onClick={() => handleSelectUser(user)} className="text-blue-600 font-semibold hover:text-blue-800 mr-4">Manage</button>
                      <button onClick={() => handleDeleteClient(user.id, user.email)} className="text-red-600 font-semibold hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Sidebar */}
        <div>
          {selectedUser ? (
            <div className="rounded-xl bg-white p-6 shadow-xl border border-slate-200 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Manage Client</h3>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
              </div>
              
              <p className="text-xs text-slate-500 mb-4">Target: <strong className="text-slate-900">{selectedUser.email}</strong></p>
              
              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold overflow-x-auto">
                <button onClick={() => setActiveTab('profile')} className={`pb-2 mr-4 whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Profile</button>
                <button onClick={() => setActiveTab('content')} className={`pb-2 mr-4 whitespace-nowrap ${activeTab === 'content' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Calendar</button>
                <button onClick={() => setActiveTab('deliverables')} className={`pb-2 mr-4 whitespace-nowrap ${activeTab === 'deliverables' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Deliverables</button>
                <button onClick={() => setActiveTab('vault')} className={`pb-2 whitespace-nowrap ${activeTab === 'vault' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Vault</button>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Company</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Industry</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Plan</label>
                    <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" value={plan} onChange={(e) => setPlan(e.target.value)} required>
                      <option value="Pro Growth SEO">Pro Growth SEO</option>
                      <option value="Enterprise SEO">Enterprise SEO</option>
                      <option value="Local SEO Starter">Local SEO Starter</option>
                    </select>
                  </div>
                  <button className="w-full rounded bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Save Profile</button>
                </form>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <form onSubmit={handleSubmitContent} className={`space-y-3 p-3 rounded-lg border ${editingContentId ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent'}`}>
                    {editingContentId && <p className="text-xs font-bold text-blue-600 mb-2">Editing Item...</p>}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Post Title</label>
                      <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" type="text" placeholder="e.g. Q3 SEO Case Study" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Platform</label>
                        <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" value={contentPlatform} onChange={(e) => setContentPlatform(e.target.value)}>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Blog">Blog</option>
                          <option value="X">X (Twitter)</option>
                          <option value="Newsletter">Newsletter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                        <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" value={contentStatus} onChange={(e) => setContentStatus(e.target.value)}>
                          <option value="Drafting">Drafting</option>
                          <option value="In Review">In Review</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Published">Published</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Scheduled Date</label>
                      <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" type="datetime-local" value={contentDate} onChange={(e) => setContentDate(e.target.value)} required />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 rounded bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">
                        {editingContentId ? 'Update Item' : 'Add to Calendar'}
                      </button>
                      {editingContentId && (
                        <button type="button" onClick={cancelContentEdit} className="flex-1 rounded bg-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-300">Cancel</button>
                      )}
                    </div>
                  </form>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Manage Existing</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {clientContent.length === 0 ? <p className="text-xs text-slate-400">No content scheduled.</p> : clientContent.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 border border-slate-200 rounded-md bg-slate-50">
                          <div className="overflow-hidden pr-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-500">{item.platform} • {new Date(item.scheduled_date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex shrink-0">
                            <button onClick={() => editContent(item)} className="text-[10px] text-blue-600 font-bold hover:bg-blue-50 p-1.5 rounded transition-colors">Edit</button>
                            <button onClick={() => handleDelete('content', item.id)} className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1.5 rounded transition-colors">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Deliverables Tab */}
              {activeTab === 'deliverables' && (
                <div className="space-y-6">
                  <form onSubmit={handleSubmitDeliverable} className={`space-y-3 p-3 rounded-lg border ${editingDeliverableId ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent'}`}>
                    {editingDeliverableId && <p className="text-xs font-bold text-blue-600 mb-2">Editing Item...</p>}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Deliverable Title</label>
                      <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" type="text" placeholder="e.g. Technical SEO Audit" value={delivTitle} onChange={(e) => setDelivTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                      <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" value={delivStatus} onChange={(e) => setDelivStatus(e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Due Date</label>
                      <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" type="datetime-local" value={delivDueDate} onChange={(e) => setDelivDueDate(e.target.value)} required />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 rounded bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">
                        {editingDeliverableId ? 'Update Item' : 'Assign Deliverable'}
                      </button>
                      {editingDeliverableId && (
                        <button type="button" onClick={cancelDeliverableEdit} className="flex-1 rounded bg-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-300">Cancel</button>
                      )}
                    </div>
                  </form>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Manage Existing</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {clientDeliverables.length === 0 ? <p className="text-xs text-slate-400">No deliverables assigned.</p> : clientDeliverables.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 border border-slate-200 rounded-md bg-slate-50">
                          <div className="overflow-hidden pr-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-500">{item.status}</p>
                          </div>
                          <div className="flex shrink-0">
                            <button onClick={() => editDeliverable(item)} className="text-[10px] text-blue-600 font-bold hover:bg-blue-50 p-1.5 rounded transition-colors">Edit</button>
                            <button onClick={() => handleDelete('deliverables', item.id)} className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1.5 rounded transition-colors">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Secure Vault Tab */}
              {activeTab === 'vault' && (
                <div className="space-y-6">
                  <form onSubmit={handleUploadDocument} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Document Title</label>
                      <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white" type="text" placeholder="e.g. Q3 Performance Report" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">File Attachment</label>
                      <input className="w-full rounded border border-slate-300 p-1.5 text-xs text-slate-900 bg-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" type="file" onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)} required accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv" />
                    </div>
                    <button className="w-full rounded bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700">Upload to Vault</button>
                  </form>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Vault Contents</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {clientDocuments.length === 0 ? <p className="text-xs text-slate-400">Vault is currently empty.</p> : clientDocuments.map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center p-2 border border-emerald-100 rounded-md bg-emerald-50/50">
                          <div className="overflow-hidden pr-2 flex items-center space-x-2">
                            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            <div>
                              <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                              <p className="text-[10px] text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex shrink-0">
                            <button 
                              onClick={() => handleDelete('documents', doc.id)} 
                              className="text-[10px] text-red-600 font-bold hover:bg-red-50 p-1.5 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-8 border border-slate-200 text-center flex items-center justify-center h-64 border-dashed sticky top-24">
              <p className="text-slate-500 text-xs font-medium">Select a client from the roster to manage their data.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}