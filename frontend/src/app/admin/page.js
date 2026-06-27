'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Heart, AlertTriangle, Trash2, Loader2,
  CheckCircle2, X, BarChart3, Eye, Ban
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import API from '../../utils/api';
import { avatarSrc } from '../../utils/avatar';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <GlassCard className={`border ${color} text-center`}>
    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-3 ${color.replace('border-', 'bg-').replace('/20', '/10')}`}>
      <Icon className={`h-6 w-6 ${color.replace('border-', 'text-').replace('/20', '')}`} />
    </div>
    <p className={`text-3xl font-extrabold ${color.replace('border-', 'text-').replace('/20', '')}`}>{value}</p>
    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{label}</p>
  </GlassCard>
);

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auth + admin gate
  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login');
      else if (!user.isAdmin) router.push('/dashboard');
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const res = await API.get('/users/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setReports(res.data.reports || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load admin data.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.isAdmin) fetchData();
  }, [user]);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Permanently delete ${userName}'s account? This cannot be undone.`)) return;
    try {
      setDeletingId(userId);
      setErrorMsg('');
      const res = await API.delete(`/users/admin/user/${userId}`);
      if (res.data.success) {
        setReports((prev) => prev.filter((r) => r._id !== userId));
        setSuccessMsg(`${userName}'s account has been permanently deleted.`);
        setTimeout(() => setSuccessMsg(''), 4000);
        // Refresh stats
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-romantic-soft dark:bg-romantic-dark">
        <Heart className="h-12 w-12 text-pink-500 fill-pink-500 animate-heartbeat" />
      </div>
    );
  }

  if (!user.isAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 p-3 rounded-2xl">
            <Shield className="h-7 w-7 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
              Moderation Panel
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage reports, users, and platform safety.
            </p>
          </div>
        </div>

        {/* Toasts */}
        {successMsg && (
          <div className="flex items-center gap-2 bg-green-500 text-white font-bold px-4 py-3 rounded-2xl shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-400/20 text-rose-600 dark:text-rose-400 font-medium px-4 py-3 rounded-2xl">
            <X className="h-4 w-4" />
            {errorMsg}
          </div>
        )}

        {loadingData ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Members" value={stats?.totalUsers ?? 0} color="border-indigo-400/20" />
              <StatCard icon={Heart} label="Active Online" value={stats?.activeOnlineUsers ?? 0} color="border-green-500/20" />
              <StatCard icon={BarChart3} label="Mutual Matches" value={stats?.totalMutualMatches ?? 0} color="border-pink-400/20" />
              <StatCard icon={AlertTriangle} label="Reports Filed" value={stats?.totalReports ?? 0} color="border-rose-500/20" />
            </div>

            {/* Reports Table */}
            <GlassCard className="border border-rose-500/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  Reported Accounts ({reports.length})
                </h2>
                <button
                  onClick={fetchData}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition"
                >
                  Refresh
                </button>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-slate-600 dark:text-slate-400">No reports filed</p>
                  <p className="text-xs text-slate-400 mt-1">The platform is clean and safe. 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((reportedUser) => (
                    <div
                      key={reportedUser._id}
                      className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-400/10 hover:border-rose-400/20 transition"
                    >
                      {/* User Info */}
                      <div className="flex items-start gap-3 flex-grow min-w-0">
                        <img
                          src={avatarSrc(reportedUser.profilePicture)}
                          alt={reportedUser.fullName}
                          className="h-12 w-12 rounded-full object-cover border-2 border-rose-400/30 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100">
                              {reportedUser.fullName}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              reportedUser.isOnline
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-400'
                            }`}>
                              {reportedUser.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{reportedUser.email} · {reportedUser.city}</p>

                          {/* Reports List */}
                          <div className="mt-2 space-y-1">
                            {reportedUser.reportedUsers.map((report, idx) => (
                              <div
                                key={idx}
                                className="text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg border border-rose-400/10"
                              >
                                <span className="font-semibold">
                                  Report #{idx + 1} by {report.user?.fullName || 'Unknown'}:
                                </span>{' '}
                                {report.reason}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 shrink-0 sm:justify-start">
                        <button
                          onClick={() => handleDeleteUser(reportedUser._id, reportedUser.fullName)}
                          disabled={deletingId === reportedUser._id}
                          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === reportedUser._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete Account
                        </button>
                        <button
                          onClick={() => router.push(`/members?search=${encodeURIComponent(reportedUser.fullName)}`)}
                          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </>
        )}
      </main>
    </div>
  );
}
