'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Heart, User, MapPin, Eye, Filter, UserCheck, UserPlus, Flame, ShieldAlert, Ban, X, Loader2, Info, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import API from '../../utils/api';
import AvatarImage from '../../components/AvatarImage';
import { avatarSrc, bannerSrc } from '../../utils/avatar';

export default function Members() {
  const { user, loading } = useAuth();
  const { onlineUsers } = useSocket();
  const router = useRouter();

  // Search & Filter States
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [filterCity, setFilterCity] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(100);

  // Selected Profile Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Action Pending State
  const [actionProgressId, setActionProgressId] = useState(null);

  // Authentication Redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Query member directory
  const fetchMembers = async () => {
    if (!user) return;
    try {
      setLoadingMembers(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery;
      if (filterGender !== 'All') params.gender = filterGender;
      if (filterCity.trim()) params.city = filterCity;
      params.minAge = minAge;
      params.maxAge = maxAge;

      const res = await API.get('/users', { params });
      if (res.data.success) {
        setMembers(res.data.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user, filterGender]); // Trigger on mount & immediate gender filter

  // Trigger search on submit/enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  // Action: Match Proposal
  const handleSendMatchRequest = async (targetId) => {
    try {
      setActionProgressId(targetId);
      const res = await API.post(`/users/friend-request/send/${targetId}`);
      if (res.data.success) {
        // Update local state relations
        setMembers((prev) =>
          prev.map((m) =>
            m._id === targetId ? { ...m, relationStatus: 'outgoing_request' } : m
          )
        );
        if (selectedMember && selectedMember._id === targetId) {
          setSelectedMember((prev) => ({ ...prev, relationStatus: 'outgoing_request' }));
        }
      }
    } catch (error) {
      console.error('Match request error:', error);
    } finally {
      setActionProgressId(null);
    }
  };

  // Action: Accept Incoming Proposal
  const handleAcceptRequest = async (senderId) => {
    try {
      setActionProgressId(senderId);
      const res = await API.post(`/users/friend-request/accept/${senderId}`);
      if (res.data.success) {
        // Navigate directly to conversation
        if (res.data.conversationId) {
          router.push(`/chat?convo=${res.data.conversationId}`);
        } else {
          router.push('/chat');
        }
      }
    } catch (error) {
      console.error('Accept request error:', error);
    } finally {
      setActionProgressId(null);
    }
  };

  // Action: Block Member
  const handleBlockUser = async (targetId) => {
    if (!confirm('Are you sure you want to block this user? You will not see their profile anymore.')) return;
    try {
      setActionProgressId(targetId);
      const res = await API.post(`/users/block/${targetId}`);
      if (res.data.success) {
        // Remove from list
        setMembers((prev) => prev.filter((m) => m._id !== targetId));
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Blocking error:', error);
    } finally {
      setActionProgressId(null);
    }
  };

  // Action: Report Member
  const handleReportUser = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    try {
      setActionProgressId(selectedMember._id);
      const res = await API.post(`/users/report/${selectedMember._id}`, { reason: reportReason });
      if (res.data.success) {
        alert(res.data.message);
        // Reported user is auto-blocked, so remove from directory
        setMembers((prev) => prev.filter((m) => m._id !== selectedMember._id));
        setSelectedMember(null);
        setShowReportModal(false);
        setReportReason('');
      }
    } catch (error) {
      console.error('Reporting error:', error);
    } finally {
      setActionProgressId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-romantic-soft dark:bg-romantic-dark">
        <div className="text-center">
          <Heart className="h-12 w-12 text-pink-500 fill-pink-500 animate-heartbeat mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Navbar />

      <main className="flex-grow mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Search & Filter Card (4 cols) */}
          <div className="lg:col-span-4">
            <GlassCard className="border border-pink-100/5 sticky top-24">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-850 pb-3 mb-5 flex items-center gap-2">
                <Filter className="h-5 w-5 text-pink-500" />
                Filter Directories
              </h3>

              <form onSubmit={handleSearchSubmit} className="space-y-4">
                
                {/* Text Search */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">
                    Search Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter member's name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="glass-input block w-full pl-3 pr-10 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                    />
                    <button
                      type="submit"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-pink-500 cursor-pointer"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Gender Select */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">
                    Gender Choice
                  </label>
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="glass-input block w-full px-3 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 dark:bg-slate-900"
                  >
                    <option value="All">All Genders</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* City Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">
                    City/Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Lahore, Karachi"
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="glass-input block w-full pl-3 pr-10 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Age Slider boundaries */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">
                    Preferred Age Span
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="glass-input block w-full px-2 py-2.5 rounded-xl text-sm text-center focus:ring-2 focus:ring-pink-500"
                    />
                    <span className="text-slate-400 text-xs font-semibold">to</span>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      className="glass-input block w-full px-2 py-2.5 rounded-xl text-sm text-center focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Search buttons */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow transition transform hover:scale-103 mt-6 cursor-pointer"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filter Queries
                </button>
              </form>
            </GlassCard>
          </div>

          {/* RIGHT: Members Grid Showcase (8 cols) */}
          <div className="lg:col-span-8">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 pl-1">
              <User className="h-5 w-5 text-pink-500" />
              Registered Matches ({members.length})
            </h2>

            {loadingMembers ? (
              <div className="text-center py-32 bg-white/5 border border-pink-100/5 rounded-2xl">
                <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Searching active companion registry...</p>
              </div>
            ) : members.length === 0 ? (
              <GlassCard className="text-center py-20">
                <Info className="h-10 w-10 text-slate-300 dark:text-slate-750 mx-auto mb-3 animate-pulse" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">No companion found</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto mt-1">
                  Adjust your search criteria, verify spellings, or reset parameters to search again.
                </p>
              </GlassCard>
            ) : (
              /* Members Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {members.map((member) => {
                  const isOnline = onlineUsers.has(member._id);
                  return (
                    <GlassCard
                      key={member._id}
                      className="flex flex-col h-full border border-pink-100/5 hover:-translate-y-1 transition duration-300 relative group"
                    >
                      <div className="flex gap-4 items-center mb-4">
                        <div className="relative">
                          <AvatarImage
                            src={member.profilePicture}
                            alt={member.fullName}
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
                            {member.fullName}, {member.age}
                          </h4>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {member.city}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed flex-grow line-clamp-3">
                        {member.bio || "No biography provided, but values mutual love and respect."}
                      </p>

                      {/* View details and quick actions */}
                      <div className="flex gap-2.5 pt-4 mt-4 border-t border-slate-100 dark:border-slate-850/40">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Profile
                        </button>
                        
                        {member.relationStatus === 'none' && (
                          <button
                            disabled={actionProgressId === member._id}
                            onClick={() => handleSendMatchRequest(member._id)}
                            className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-bold py-2 rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Match
                          </button>
                        )}

                        {member.relationStatus === 'outgoing_request' && (
                          <span className="flex-1 text-center bg-indigo-500/10 text-indigo-500 font-bold text-xs py-2 rounded-xl border border-indigo-400/20">
                            Sent
                          </span>
                        )}

                        {member.relationStatus === 'incoming_request' && (
                          <button
                            disabled={actionProgressId === member._id}
                            onClick={() => handleAcceptRequest(member._id)}
                            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs py-2 rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                          >
                            Accept
                          </button>
                        )}

                        {member.relationStatus === 'matched' && (
                          <button
                            onClick={() => router.push('/chat')}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold text-xs py-2 rounded-xl shadow transition cursor-pointer"
                          >
                            Chat
                          </button>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* MODAL: Comprehensive Profile preview drawer */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto border border-pink-400/20 relative p-0 overflow-hidden animate-glow">
            
            {/* Banner Image */}
            <div className="relative h-28 w-full bg-slate-200 dark:bg-slate-800">
              <img
                src={bannerSrc(selectedMember.bannerImage)}
                alt="Member Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-60" />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-3 right-3 bg-slate-950/40 hover:bg-rose-500/80 text-white rounded-full p-1.5 transition z-10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 -mt-12 relative z-10">
              {/* Profile Avatar & Header */}
              <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="relative mb-3">
                  <img
                    src={avatarSrc(selectedMember.profilePicture)}
                    alt={selectedMember.fullName}
                    className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-slate-950 shadow-md ring-2 ring-pink-400/30"
                  />
                  <div
                    className={`absolute bottom-1 right-1 h-4.5 w-4.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      onlineUsers.has(selectedMember._id) ? 'bg-green-500' : 'bg-slate-350'
                    }`}
                  />
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {selectedMember.fullName}, {selectedMember.age}
                </h3>
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-pink-500" />
                  {selectedMember.city}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mt-2 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                  {selectedMember.gender} Match
                </span>
              </div>

              {/* Profile Content */}
              <div className="py-5 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1">
                    About Me / Biography
                  </h4>
                  <p className="bg-slate-500/5 p-3 rounded-xl border border-pink-100/5 text-xs text-slate-650 dark:text-slate-350">
                    {selectedMember.bio || "No biography details shared yet."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dating Interest</h4>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedMember.relationshipPreferences?.interestedIn || 'All'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-0.5">Partner Age Span</h4>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedMember.relationshipPreferences?.minAge || 18} - {selectedMember.relationshipPreferences?.maxAge || 100} yrs
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Drawer footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5 justify-center">
                
                {selectedMember.relationStatus === 'none' && (
                  <button
                    disabled={actionProgressId !== null}
                    onClick={() => handleSendMatchRequest(selectedMember._id)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold text-xs py-2.5 rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Send Proposal
                  </button>
                )}

                {selectedMember.relationStatus === 'outgoing_request' && (
                  <div className="flex-1 text-center bg-indigo-500/10 text-indigo-500 font-bold text-xs py-2.5 rounded-xl border border-indigo-400/20">
                    Proposals Sent
                  </div>
                )}

                {selectedMember.relationStatus === 'incoming_request' && (
                  <button
                    disabled={actionProgressId !== null}
                    onClick={() => handleAcceptRequest(selectedMember._id)}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs py-2.5 rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
                  >
                    Accept Match
                  </button>
                )}

                {selectedMember.relationStatus === 'matched' && (
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      router.push('/chat');
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold text-xs py-2.5 rounded-xl shadow transition cursor-pointer"
                  >
                    Start Chat
                  </button>
                )}

                {/* Block Action */}
                <button
                  disabled={actionProgressId !== null}
                  onClick={() => handleBlockUser(selectedMember._id)}
                  className="bg-slate-100 hover:bg-rose-500/10 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-slate-600 dark:text-slate-400 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Block User"
                >
                  <Ban className="h-4 w-4" />
                  Block
                </button>

                {/* Report Action */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="bg-slate-100 hover:bg-rose-500/10 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-slate-600 dark:text-slate-400 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Report User"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Report
                </button>

              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL: Report Input dialog */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <GlassCard className="w-full max-w-[400px] border border-rose-500/20 relative animate-glow">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-rose-600 flex items-center gap-1.5 border-b pb-3 mb-4">
              <ShieldAlert className="h-5 w-5" />
              Report Account
            </h3>

            <form onSubmit={handleReportUser} className="space-y-4">
              <p className="text-xs text-slate-500">
                Please describe the reason for reporting <span className="font-bold text-slate-800 dark:text-slate-250">{selectedMember?.fullName}</span>. Any reported user is automatically blocked for your protection.
              </p>
              
              <textarea
                required
                placeholder="Reason (e.g. fake profile, inappropriate behavior, harassment)..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows="3"
                className="glass-input block w-full px-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProgressId !== null}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  {actionProgressId !== null ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'File Report'
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
