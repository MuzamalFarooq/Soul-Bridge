'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles, MapPin, UserCheck, Flame, UserMinus, Plus, ShieldCheck, HeartHandshake, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import API from '../../utils/api';
import AvatarImage from '../../components/AvatarImage';
import { APP_NAME } from '../../config/app';
import dynamic from 'next/dynamic';

const VoiceVideoCallPlaceholder = dynamic(
  () => import('../../components/VoiceVideoCallPlaceholder'),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-white/5 border border-pink-100/5 animate-pulse" />
    ),
    ssr: false,
  }
);

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { onlineUsers } = useSocket();
  const router = useRouter();

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestProgressId, setRequestProgressId] = useState(null);

  // Authentication Redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch algorithmic suggestions and pending requests
  const fetchData = async () => {
    if (!user) return;
    try {
      setLoadingSuggestions(true);
      setLoadingRequests(true);

      // Fetch match suggestions
      const suggRes = await API.get('/users/suggestions');
      if (suggRes.data.success) {
        setSuggestions(suggRes.data.suggestions);
      }

      // Fetch incoming friend requests from profiles directory
      const membersRes = await API.get('/users');
      if (membersRes.data.success) {
        const incoming = membersRes.data.members.filter(
          (m) => m.relationStatus === 'incoming_request'
        );
        setIncomingRequests(incoming);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingSuggestions(false);
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Action: Send Friend Request (Match proposal)
  const handleSendRequest = async (targetId) => {
    try {
      setRequestProgressId(targetId);
      const res = await API.post(`/users/friend-request/send/${targetId}`);
      if (res.data.success) {
        // Update suggestions status locally to avoid complete re-fetch
        setSuggestions((prev) =>
          prev.map((s) =>
            s._id === targetId ? { ...s, relationStatus: 'outgoing_request' } : s
          )
        );
      }
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setRequestProgressId(null);
    }
  };

  // Action: Accept Friend Request (Mutual Match)
  const handleAcceptRequest = async (senderId) => {
    try {
      setRequestProgressId(senderId);
      const res = await API.post(`/users/friend-request/accept/${senderId}`);
      if (res.data.success) {
        // Clear from incoming request queue
        setIncomingRequests((prev) => prev.filter((r) => r._id !== senderId));
        // Route to chat immediately
        if (res.data.conversationId) {
          router.push(`/chat?convo=${res.data.conversationId}`);
        } else {
          router.push('/chat');
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setRequestProgressId(null);
    }
  };

  // Action: Ignore / Reject Friend Request
  const handleRejectRequest = async (senderId) => {
    try {
      setRequestProgressId(senderId);
      const res = await API.post(`/users/friend-request/reject/${senderId}`);
      if (res.data.success) {
        setIncomingRequests((prev) => prev.filter((r) => r._id !== senderId));
        // Reset in suggestion relation status if present
        setSuggestions((prev) =>
          prev.map((s) =>
            s._id === senderId ? { ...s, relationStatus: 'none' } : s
          )
        );
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setRequestProgressId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-romantic-soft dark:bg-romantic-dark">
        <div className="text-center">
          <Heart className="h-12 w-12 text-pink-500 fill-pink-500 animate-heartbeat mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Welcome Glass Banner */}
        <GlassCard className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border-pink-400/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_right_top,#ec4899_0%,transparent_60%)] opacity-35" />
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <AvatarImage
              src={user.profilePicture}
              alt={user.fullName}
              className="h-20 w-20 rounded-full object-cover border-2 border-pink-500 shadow-md"
            />
            <div className="text-center sm:text-left space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-2">
                Welcome back, {user.fullName?.split(' ')[0]}!
                <Sparkles className="h-5 w-5 text-pink-500" />
              </h1>
              <p className="text-sm text-slate-550 dark:text-slate-350 max-w-xl">
                Ready to find eternal bonds today? We calculated new match suggestions matching your interest in {user.relationshipPreferences?.interestedIn === 'All' ? 'everyone' : (user.relationshipPreferences?.interestedIn || 'everyone')} from age {user.relationshipPreferences?.minAge ?? 18} to {user.relationshipPreferences?.maxAge ?? 60}.
              </p>
              <div className="flex justify-center sm:justify-start gap-4 pt-1.5 text-xs font-semibold text-pink-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.city}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 animate-pulse" />
                  Match Profile Completeness: 100%
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Center Content: Match Suggestions (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500 fill-pink-500 animate-heartbeat" />
                  Algorithmic Suggestions for You
                </h2>
                <button
                  onClick={fetchData}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition"
                >
                  Recalculate Matches
                </button>
              </div>

              {loadingSuggestions ? (
                <div className="text-center py-20 bg-white/5 border border-pink-100/5 rounded-2xl">
                  <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Analyzing demographic databases...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <GlassCard className="text-center py-16">
                  <Flame className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 dark:text-slate-350">No suggestions available</p>
                  <p className="text-xs text-slate-400 max-w-[280px] mx-auto mt-1">
                    Try opening your profile settings to widen your age range or expand gender interests!
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="mt-4 bg-indigo-500 hover:bg-indigo-650 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    Adjust preferences
                  </button>
                </GlassCard>
              ) : (
                /* Suggestion List */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {suggestions.map((prospect) => {
                    const isOnline = onlineUsers.has(prospect._id);
                    return (
                      <GlassCard
                        key={prospect._id}
                        className="flex flex-col h-full border border-pink-100/5 hover:-translate-y-1 transition duration-300"
                      >
                        {/* Prospect Header with Pic & City */}
                        <div className="flex gap-4 items-center mb-4">
                          <div className="relative">
                            <AvatarImage
                              src={prospect.profilePicture}
                              alt={prospect.fullName}
                              className="h-14 w-14 rounded-full object-cover border-2 border-pink-400"
                            />
                            <div
                              className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                isOnline ? 'bg-green-500' : 'bg-slate-350 dark:bg-slate-750'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 dark:text-slate-150 truncate">
                              {prospect.fullName}, {prospect.age}
                            </h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {prospect.city}
                            </p>
                          </div>
                        </div>

                        {/* Bio preview */}
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed flex-grow line-clamp-3">
                          {prospect.bio || "This user hasn't written a biography yet, but they value deep connections."}
                        </p>

                        {/* Match Score Indicator */}
                        <div className="flex items-center justify-between bg-pink-500/5 dark:bg-pink-500/2 px-3 py-1.5 rounded-lg my-4 text-[10px] font-bold">
                          <span className="text-slate-400">Match score index</span>
                          <span className="text-pink-500 flex items-center gap-0.5">
                            <Flame className="h-3.5 w-3.5" />
                            {prospect.score >= 5 ? '98%' : prospect.score >= 3 ? '85%' : '75%'}
                          </span>
                        </div>

                        {/* Send Request Action Button */}
                        {prospect.relationStatus === 'none' && (
                          <button
                            disabled={requestProgressId === prospect._id}
                            onClick={() => handleSendRequest(prospect._id)}
                            className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {requestProgressId === prospect._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Send Match Request
                              </>
                            )}
                          </button>
                        )}

                        {prospect.relationStatus === 'outgoing_request' && (
                          <div className="w-full text-center bg-indigo-500/10 text-indigo-500 font-bold text-xs py-2.5 rounded-xl border border-indigo-400/20">
                            Request Pending
                          </div>
                        )}

                        {prospect.relationStatus === 'incoming_request' && (
                          <div className="flex gap-2">
                            <button
                              disabled={requestProgressId === prospect._id}
                              onClick={() => handleAcceptRequest(prospect._id)}
                              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs py-2.5 rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              disabled={requestProgressId === prospect._id}
                              onClick={() => handleRejectRequest(prospect._id)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calling section placeholder */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 pl-1">
                <Flame className="h-5 w-5 text-indigo-500" />
                Live Premium Communication Channel
              </h2>
              {suggestions.length > 0 ? (
                <VoiceVideoCallPlaceholder
                  partnerName={suggestions[0].fullName}
                  partnerAvatar={suggestions[0].profilePicture}
                />
              ) : (
                <VoiceVideoCallPlaceholder partnerName="Match" partnerAvatar="/uploads/default-avatar.png" />
              )}
            </div>

          </div>

          {/* Right Sidebar: Pending Requests List & Details (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <GlassCard className="border border-pink-100/5">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-3 mb-4 flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-pink-500" />
                Pending Match Proposals ({incomingRequests.length})
              </h3>

              {loadingRequests ? (
                <div className="text-center py-8">
                  <Loader2 className="h-5 w-5 text-pink-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading queues...</p>
                </div>
              ) : incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <UserCheck className="h-8 w-8 text-slate-300 dark:text-slate-750 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No pending proposals</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Proposals from interested hearts will appear here.
                  </p>
                </div>
              ) : (
                /* Pending match requests lists */
                <div className="space-y-4 max-h-75 overflow-y-auto pr-1">
                  {incomingRequests.map((reqUser) => (
                    <div
                      key={reqUser._id}
                      className="flex gap-3 items-center p-3 rounded-2xl bg-white/5 border border-pink-100/5 transition hover:bg-white/10"
                    >
                      <AvatarImage
                        src={reqUser.profilePicture}
                        alt={reqUser.fullName}
                        className="h-10 w-10 rounded-full object-cover border"
                      />
                      <div className="grow min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">
                          {reqUser.fullName}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {reqUser.city}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          disabled={requestProgressId !== null}
                          onClick={() => handleAcceptRequest(reqUser._id)}
                          className="bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          disabled={requestProgressId !== null}
                          onClick={() => handleRejectRequest(reqUser._id)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Quick Security Badge Card */}
            <GlassCard className="border border-green-500/10 bg-green-500/5">
              <div className="flex gap-3">
                <ShieldCheck className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-green-600 uppercase tracking-wider">
                    Secure Matching Active
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Soul Bridge keeps your data localized and secured with industry-grade bcrypt hashing. Any report triggers instantaneous administrator review.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

        </div>
      </main>
    </div>
  );
}
