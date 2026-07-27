// src/app/forgot-password/page.tsx
"use client";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Whether it succeeds or fails, we show the success message 
      // to prevent bad actors from guessing valid emails
      setIsSubmitted(true);
      
    } catch (error) {
      console.error("Failed to connect to the server", error);
      alert("Failed to connect to the backend server.");
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
          <h1 className={`text-2xl font-bold tracking-tight text-slate-900 ${playfair.className}`}>
            Reset Password
          </h1>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleResetRequest} className="mt-8 space-y-6">
            <p className="text-sm text-slate-600 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="space-y-4">
              <input
                className="w-full rounded-lg border border-slate-200 bg-white/80 p-3 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                type="email" placeholder="Email address"
                onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <button className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]">
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className="mt-8 text-center space-y-6">
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-800 font-medium">
                If an account exists for {email}, a password reset link has been sent.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-slate-600 pt-4">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Return to Login
          </Link>
        </p>
      </div>
    </div>
  );
}