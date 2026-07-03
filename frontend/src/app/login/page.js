'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Mail, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/GlassCard';
import BrandLogo from '../../components/BrandLogo';

export default function Login() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!usernameOrEmail || !password) {
      return setErrorMsg('Please fill in all fields');
    }

    try {
      setLocalLoading(true);
      const res = await login(usernameOrEmail, password);
      if (res && !res.success) {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-romantic-soft dark:bg-romantic-dark items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting spheres */}
      <div className="absolute top-[-10%] right-[-10%] w-100 h-100 rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-100 h-100 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-110 z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <BrandLogo className="text-3xl" iconClass="h-8 w-8" />
          </Link>
          <p className="text-sm text-slate-550 dark:text-slate-350">
            Welcome back. Log in to Soul Bridge.
          </p>
        </div>

        {/* Form Container */}
        <GlassCard glow={true}>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center border-b border-slate-100 dark:border-slate-850 pb-3">
            Account Log In
          </h2>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 p-3 rounded-xl text-xs font-semibold mb-4 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email or Full Name Field */}
            <div>
              <label htmlFor="usernameOrEmail" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">
                Email or Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="usernameOrEmail"
                  type="text"
                  required
                  placeholder="email@example.com or Full Name"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="glass-input block w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5 pl-1">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input block w-full pl-10 pr-10 py-3 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-pink-500 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || localLoading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform hover:scale-103 active:scale-97 disabled:opacity-50 disabled:pointer-events-none mt-6 cursor-pointer"
            >
              {localLoading || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Account...
                </>
              ) : (
                'Secure Log In'
              )}
            </button>
          </form>

          {/* Footnotes */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-pink-500 font-bold hover:underline">
              Create one now
            </Link>
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <Link href="/" className="hover:underline">Home</Link> • Secure JWT & local bcrypt hashing.
        </div>

      </div>
    </div>
  );
}
