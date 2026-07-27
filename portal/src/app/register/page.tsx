// src/app/register/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      alert('Account created successfully! Please log in.');
      router.push('/login');
    } else {
      const errorData = await response.json();
      alert(`Registration failed: ${errorData.detail}`);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fcf7f2] to-[#f3ebd9] px-4 ${inter.className}`}>
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/60 p-10 shadow-2xl backdrop-blur-md border border-white/40">
        
        <div className="flex flex-col items-center text-center">
          <Image 
            src="/logo-md-squared(1).png" 
            alt="Meridian Dynamics Logo" 
            width={100} height={100} 
            className="mb-2 mix-blend-multiply" priority
          />
          <h1 className={`text-3xl font-bold tracking-tight text-slate-900 ${playfair.className}`}>
            Join Meridian
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">Create your client portal account</p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input
              className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="email" placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)} required
            />
            <input
              className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="password" placeholder="Password"
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
            />
            <input
              className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="password" placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
            />
          </div>

          <button className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}