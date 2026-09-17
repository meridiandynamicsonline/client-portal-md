"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000'
    : 'https://client-portal-md.onrender.com');

function ButtonSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await fetch(`${API_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always show success state to prevent email enumeration
      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to connect to the server", error);
      alert("Failed to connect to the backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center bg-[#fcfaf7] px-4 ${inter.className}`}>
      
      {/* Fullscreen Transition Loader */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fcfaf7] transition-all">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
              <div className="absolute animate-pulse">
                <Image
                  src="/logo-md-squared(1).png"
                  alt="Loading..."
                  width={32}
                  height={32}
                  className="mix-blend-multiply"
                />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest animate-pulse">
              Sending Instructions...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 sm:p-10 shadow-xl border border-slate-200/80">

        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo-md-squared(1).png"
            alt="Meridian Dynamics Logo"
            width={80} height={80}
            className="mb-2 mix-blend-multiply" priority
          />
          <h1 className={`text-2xl font-bold tracking-tight text-slate-900 ${playfair.className}`}>
            Reset Password
          </h1>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleResetRequest} className="mt-8 space-y-6">
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              Enter your email address and we'll send you a secure link to reset your password.
            </p>
            <div className="space-y-4">
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs sm:text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                type="email"
                placeholder="Email address"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              disabled={isSubmitting}
              className="w-full rounded-lg bg-slate-900 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting && <ButtonSpinner />}
              {isSubmitting ? "Processing..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="mt-8 text-center space-y-6">
            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
              <p className="text-xs sm:text-sm text-emerald-800 font-medium">
                If an account exists for <span className="font-bold">{email}</span>, a password reset link has been dispatched to your inbox.
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs sm:text-sm text-slate-600 pt-2">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Return to Login
          </Link>
        </p>
      </div>
    </div>
  );
}