// apps/admin/src/app/login/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save the JWT token to the browser
        localStorage.setItem('admin_token', data.access_token);
        // Hard redirect to clear any cached states
        window.location.href = '/';
      } else {
        setError(data.detail || 'Authentication failed.');
      }
    } catch (err) {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 ${inter.className}`}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900 px-8 py-10 text-center">
          <div className="bg-white inline-block rounded p-1.5 mb-4">
            <Image 
              src="/logo-md-squared(1).png" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="mix-blend-multiply" 
            />
          </div>
          <h2 className={`text-2xl text-white tracking-wide ${playfair.className}`}>
            Meridian Dynamics <br></br> <span className="font-bold">Admin Panel</span>
          </h2>
          <p className="text-slate-400 text-xs uppercase tracking-widest mt-2 font-semibold">
            Authorized Personnel Only
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-md text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-3 outline-none transition-colors"
                placeholder="name@meridiandynamics.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-3 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-3.5 text-center mt-4 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Footer text */}
      <p className="text-slate-400 text-xs mt-8">
        &copy; {new Date().getFullYear()} Meridian Dynamics. Internal System.
      </p>
    </div>
  );
}