// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'pending' | 'active'>('loading');
  const router = useRouter();

  useEffect(() => {
    // 1. Grab the token
    const token = localStorage.getItem('token');

    // 2. If NO token exists, kick them to the login page immediately
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // 3. If token exists, fetch their data concurrently
    const fetchClientData = async () => {
      try {
        const [profileRes, contentRes, delivRes, docRes] = await Promise.all([
          fetch(`${API_URL}/profiles/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/content/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/deliverables/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/documents/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (profileRes.status === 403) {
          // THE NEW ALERT AND REDIRECT
          alert("Admin credentials detected. Please login via Admin Portal.");
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          
          if (contentRes.ok) setContent(await contentRes.json());
          if (delivRes.ok) setDeliverables(await delivRes.json());
          if (docRes.ok) setDocuments(await docRes.json());
          
          setStatus('active');
        } else if (profileRes.status === 404) {
          setStatus('pending');
        } else {
          // Token is invalid/expired - clear it and kick to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error("Failed to fetch client data:", error);
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    };

    fetchClientData();
  }, []); // <-- Empty array prevents infinite re-renders

  // 4. Secure Download Handler
  const handleDownload = async (docId: number, docTitle: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/documents/${docId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docTitle.replace(/\s+/g, '_')}.pdf`; 
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download the document. Please try again.");
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcf7f2]">
        <p className={`text-slate-600 ${inter.className}`}>Loading your portal...</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: THE NEW CLIENT WAITING SCREEN
  // ==========================================
  if (status === 'pending') {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#fcf7f2] to-[#f3ebd9] px-4 ${inter.className}`}>
        <div className="w-full max-w-lg rounded-2xl bg-white/60 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md border border-white/40">
          <Image
            src="/logo-md-squared(1).png"
            alt="Meridian Dynamics Logo"
            width={80} height={80}
            className="mx-auto mb-6 mix-blend-multiply opacity-80"
          />
          <h2 className={`text-2xl sm:text-3xl font-bold text-slate-900 mb-4 ${playfair.className}`}>
            Welcome to Meridian Dynamics
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
            Your account has been successfully created. We are currently preparing your custom dashboard.
          </p>
          <div className="inline-block rounded-lg bg-white/50 px-4 sm:px-6 py-4 border border-white/60 shadow-sm">
            <div className="flex items-center justify-center space-x-3 text-slate-700 font-medium text-sm sm:text-base">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span>Awaiting response from team...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE ACTIVE CLIENT DASHBOARD
  // ==========================================
  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#fcf7f2] to-[#f3ebd9] ${inter.className}`}>

      {/* Top Navigation - Glassmorphism */}
      <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/40 px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Image src="/logo-md-squared(1).png" alt="Logo" width={32} height={32} className="mix-blend-multiply sm:w-[40px] sm:h-[40px]" />
          <h1 className={`text-lg sm:text-xl font-bold text-slate-900 ${playfair.className}`}>Meridian Dynamics</h1>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="text-xs sm:text-sm font-medium text-slate-700 transition-all hover:text-slate-900 bg-white/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/60 hover:bg-white/80 shadow-sm hover:shadow"
        >
          Sign Out
        </button>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-8 sm:py-8">

        {/* Welcome Banner */}
        <div className="mb-6 sm:mb-8">
          <h2 className={`text-2xl sm:text-3xl font-bold text-slate-900 mb-2 ${playfair.className}`}>
            Welcome back
          </h2>
          <p className="text-sm sm:text-base text-slate-600">Here is the latest overview of your SEO campaigns and deliverables for {profile.company_name}.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          {/* Column 1: Account Details */}
          <div className="rounded-2xl bg-white/60 p-5 sm:p-6 shadow-xl backdrop-blur-md border border-white/40 flex flex-col h-fit">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 sm:mb-6">Account Details</h3>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 mb-1">Company / Brand</p>
                <p className="text-sm sm:text-base font-semibold text-slate-900">{profile.company_name}</p>
              </div>
              <div className="h-px bg-slate-200/50 w-full"></div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500 mb-1">Category</p>
                <p className="text-sm sm:text-base font-semibold text-slate-900">{profile.industry || 'Not specified'}</p>
              </div>
              <div className="h-px bg-slate-200/50 w-full"></div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500 mb-2">Active Plan</p>
                <span className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-1 text-xs sm:text-sm font-medium text-white shadow-sm">
                  {profile.plan || 'Pro Growth SEO'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Content Calendar & Deliverables */}
          <div className="flex flex-col gap-6 sm:gap-8 lg:col-span-2">
            
            {/* Deliverables Section */}
            <div className="rounded-2xl bg-white/60 p-5 sm:p-6 shadow-xl backdrop-blur-md border border-white/40">
              <div className="flex justify-between items-center mb-5 sm:mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Deliverables</h3>
                <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-1 rounded border border-blue-200/50">{deliverables.length} Active</span>
              </div>

              {deliverables.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No deliverables assigned yet.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {deliverables.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/50 bg-white/40 transition-colors hover:bg-white/70 gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shadow-inner uppercase">
                          {item.title.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <span className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded border ${
                          item.status === 'Completed' ? 'bg-green-100/80 text-green-700 border-green-200/50' :
                          item.status === 'In Progress' ? 'bg-blue-100/80 text-blue-700 border-blue-200/50' : 'bg-slate-100/80 text-slate-700 border-slate-200/50'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Calendar Section */}
            <div className="rounded-2xl bg-white/60 p-5 sm:p-6 shadow-xl backdrop-blur-md border border-white/40">
              <div className="flex justify-between items-center mb-5 sm:mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Content Calendar</h3>
                <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2 py-1 rounded border border-purple-200/50">{content.length} Scheduled</span>
              </div>

              {content.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No content scheduled yet.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {content.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/50 bg-white/40 transition-colors hover:bg-white/70 gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner uppercase">
                          {item.platform.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                            <span className="font-medium">{item.platform}</span> • {new Date(item.scheduled_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right">
                        <span className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded border ${
                          item.status === 'Published' ? 'bg-green-100/80 text-green-700 border-green-200/50' : 'bg-amber-100/80 text-amber-700 border-amber-200/50'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Secure Document Vault Section (Full Width) */}
        <div className="mt-6 sm:mt-8 rounded-2xl bg-white/60 p-5 sm:p-6 shadow-xl backdrop-blur-md border border-white/40">
          <div className="flex justify-between items-center mb-5 sm:mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secure Document Vault</h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded border border-emerald-200/50">{documents.length} Files</span>
          </div>

          {documents.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No documents uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col justify-between p-5 rounded-xl border border-white/50 bg-white/40 transition-colors hover:bg-white/70 group">
                  <div className="mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 shadow-inner">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2">{doc.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Added {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(doc.id, doc.title)}
                    className="w-full text-xs font-bold text-slate-700 hover:text-slate-900 bg-white/60 hover:bg-white border border-white/80 py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    Download File
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}