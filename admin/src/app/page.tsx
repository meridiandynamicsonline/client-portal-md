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
  const [activeTab, setActiveTab] = useState<'profile' | 'content' | 'deliverables'>('profile');

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

  const fetchUsers = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setStatus('active');
      } else {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setCompanyName(user.profile?.company_name || '');
    setIndustry(user.profile?.industry || '');
    setPlan(user.profile?.plan || 'Pro Growth SEO');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/profile`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ company_name: companyName, industry, plan }),
    });

    if (response.ok) {
      alert("Client profile updated!");
      fetchUsers(); 
    } else {
      alert("Failed to update profile.");
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/content`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        title: contentTitle,
        platform: contentPlatform,
        scheduled_date: new Date(contentDate).toISOString(),
        status: contentStatus
      }),
    });

    if (response.ok) {
      alert("Content calendar item added!");
      setContentTitle('');
      setContentDate('');
    } else {
      alert("Failed to add content item.");
    }
  };

  const handleAddDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const token = localStorage.getItem('admin_token');

    const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/deliverables`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        title: delivTitle,
        due_date: new Date(delivDueDate).toISOString(),
        status: delivStatus
      }),
    });

    if (response.ok) {
      alert("Deliverable assigned!");
      setDelivTitle('');
      setDelivDueDate('');
    } else {
      alert("Failed to add deliverable.");
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
                <tr>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className={`transition-colors ${selectedUser?.id === user.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.profile?.company_name || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleSelectUser(user)}
                        className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                      >
                        Manage
                      </button>
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
              <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`pb-2 mr-4 ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setActiveTab('content')}
                  className={`pb-2 mr-4 ${activeTab === 'content' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
                >
                  Calendar
                </button>
                <button 
                  onClick={() => setActiveTab('deliverables')}
                  className={`pb-2 ${activeTab === 'deliverables' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}
                >
                  Deliverables
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Company</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Industry</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Plan</label>
                    <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" value={plan} onChange={(e) => setPlan(e.target.value)} required>
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
                <form onSubmit={handleAddContent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Post Title</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" type="text" placeholder="e.g. Q3 SEO Case Study" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Platform</label>
                    <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" value={contentPlatform} onChange={(e) => setContentPlatform(e.target.value)}>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Blog">Blog</option>
                      <option value="X">X (Twitter)</option>
                      <option value="Newsletter">Newsletter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Scheduled Date</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" type="datetime-local" value={contentDate} onChange={(e) => setContentDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                    <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" value={contentStatus} onChange={(e) => setContentStatus(e.target.value)}>
                      <option value="Drafting">Drafting</option>
                      <option value="In Review">In Review</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                  <button className="w-full rounded bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Add to Calendar</button>
                </form>
              )}

              {/* Deliverables Tab */}
              {activeTab === 'deliverables' && (
                <form onSubmit={handleAddDeliverable} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Deliverable Title</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" type="text" placeholder="e.g. Technical SEO Audit" value={delivTitle} onChange={(e) => setDelivTitle(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Due Date</label>
                    <input className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" type="datetime-local" value={delivDueDate} onChange={(e) => setDelivDueDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                    <select className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 bg-white placeholder-slate-400" value={delivStatus} onChange={(e) => setDelivStatus(e.target.value)}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <button className="w-full rounded bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Assign Deliverable</button>
                </form>
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