// src/app/reset-password/page.tsx
"use client";
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Grab the ?token=... from the URL
  const token = searchParams.get('token');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!token) {
      alert("Invalid or missing reset token. Please request a new link.");
      return;
    }

    const response = await fetch('http://127.0.0.1:8000/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (response.ok) {
      alert('Password has been successfully reset! Please log in.');
      router.push('/login');
    } else {
      const errorData = await response.json();
      alert(`Reset failed: ${errorData.detail}`);
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
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-slate-600 font-medium">Please enter your new password below</p>
        </div>

        <form onSubmit={handleReset} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input
              className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="password" placeholder="New Password"
              onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
            />
            <input
              className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              type="password" placeholder="Confirm New Password"
              onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
            />
          </div>

          <button className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

// Next.js requires components using useSearchParams to be wrapped in a Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fcf7f2]">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}