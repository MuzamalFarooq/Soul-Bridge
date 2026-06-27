'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Lock, LogOut, Trash2, Eye, EyeOff, Loader2,
  Heart, ShieldCheck, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import API from '../../utils/api';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // Auth redirect
  React.useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    try {
      setPwLoading(true);
      // The backend authController should have a change-password endpoint.
      // We'll call it here — if it doesn't exist yet, the error will be graceful.
      const res = await API.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        setPwSuccess('Password changed successfully! Please log in again.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Log out after 2 seconds since token may be invalidated
        setTimeout(() => logout(), 2500);
      } else {
        setPwError(res.data.message || 'Failed to change password.');
      }
    } catch (err) {
      setPwError(err.response?.data?.message || 'An error occurred. Please check your current password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-romantic-soft dark:bg-romantic-dark">
        <Heart className="h-12 w-12 text-pink-500 fill-pink-500 animate-heartbeat" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Navbar />

      {/* Background ambient */}
      <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none -z-0" />

      <main className="flex-grow max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 relative z-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-500/10 p-3 rounded-2xl">
            <Settings className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Settings</h1>
            <p className="text-xs text-slate-400">Account security and preferences</p>
          </div>
        </div>

        {/* Change Password */}
        <GlassCard className="border border-pink-100/10">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-500" />
            Change Password
          </h2>

          {pwSuccess && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-400/20 text-green-600 dark:text-green-400 font-medium text-sm px-4 py-3 rounded-xl mb-4">
              <CheckCircle2 className="h-4 w-4" />
              {pwSuccess}
            </div>
          )}
          {pwError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-400/20 text-rose-600 dark:text-rose-400 font-medium text-sm px-4 py-3 rounded-xl mb-4">
              <X className="h-4 w-4" />
              {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password match indicator */}
              {confirmPassword && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${
                  newPassword === confirmPassword ? 'text-green-500' : 'text-rose-500'
                }`}>
                  {newPassword === confirmPassword
                    ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                    : <><X className="h-3 w-3" /> Passwords do not match</>
                  }
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {pwLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {pwLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </GlassCard>

        {/* Account Actions */}
        <GlassCard className="border border-pink-100/10">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-pink-500" />
            Account Actions
          </h2>

          <div className="space-y-3">
            {/* Log Out */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-semibold text-sm transition border border-slate-200/50 dark:border-slate-700/30 text-left"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              <div>
                <p className="font-bold">Log Out</p>
                <p className="text-[11px] text-slate-400 font-normal">Sign out of your Soul Bridge account</p>
              </div>
            </button>
          </div>
        </GlassCard>

        {/* Security Info */}
        <GlassCard className="border border-green-500/10 bg-green-500/5">
          <div className="flex gap-3">
            <ShieldCheck className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-green-600 uppercase tracking-wider">
                Your Account is Secure
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Soul Bridge uses bcrypt password hashing, JWT authentication, and unique CNIC verification to keep your account protected. We never store plain-text credentials.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="border border-rose-500/20 bg-rose-500/5">
          <div className="flex gap-3">
            <AlertTriangle className="h-6 w-6 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-rose-600 uppercase tracking-wider mb-1">
                Danger Zone
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Deleting your account is permanent and irreversible. All your matches, conversations, and profile data will be removed.
              </p>
              <p className="text-[11px] text-slate-400">
                To permanently delete your account, please contact our support team or an administrator.
              </p>
            </div>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
