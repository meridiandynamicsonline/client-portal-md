"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

// Load the elegant serif font for the brand, and a clean sans font for the form
const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('http://127.0.0.1:8000/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } else {
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    /* Background matching the warm cream of the logo */
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fcf7f2] to-[#f3ebd9] px-4 ${inter.className}`}>
      
      {/* Minimalist, subtle card design */}
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/60 p-10 shadow-2xl backdrop-blur-md border border-white/40">
        
        {/* Brand Area */}
        <div className="flex flex-col items-center text-center">
          <Image 
            src="/logo-md-squared(1).png" 
            alt="Meridian Dynamics Logo" 
            width={100} 
            height={100} 
            className="mb-2 mix-blend-multiply" 
            priority
          />
          <h1 className={`text-3xl font-bold tracking-tight text-slate-900 ${playfair.className}`}>
            Meridian Dynamics
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">Sign in to your portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input
              className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="email" placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)} required
            />
            <input
              className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="password" placeholder="Password"
              onChange={(e) => setPassword(e.target.value)} required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-slate-600 hover:text-slate-900 hover:underline transition-colors">
              Forgot password?
            </Link>
          </div>

          <button className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]">
            Sign In
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-slate-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}