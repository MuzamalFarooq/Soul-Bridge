'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, MapPin, Heart, Edit3, Camera, Save, X, Loader2,
  ShieldCheck, Calendar, Phone, Mail, Users, Sparkles, CheckCircle2,
  ImagePlus, Trash2, ZoomIn, ChevronLeft, ChevronRight, Images
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import GlassCard from '../../components/GlassCard';
import API from '../../utils/api';
import { avatarSrc, bannerSrc } from '../../utils/avatar';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateAge = (dob) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

export default function ProfilePage() {
  const { user, loading, updateProfileLocally } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state mirrors the fields updateProfile accepts
  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    city: '',
    phoneNumber: '',
    interestedIn: 'All',
    minAge: 18,
    maxAge: 60
  });
  const [previewPic, setPreviewPic] = useState(null);
  const [newPicFile, setNewPicFile] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [newBannerFile, setNewBannerFile] = useState(null);

  // Photo gallery state
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Redirect if unauthenticated
  React.useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Init form when user loads
  React.useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        city: user.city || '',
        phoneNumber: user.phoneNumber || '',
        interestedIn: user.relationshipPreferences?.interestedIn || 'All',
        minAge: user.relationshipPreferences?.minAge || 18,
        maxAge: user.relationshipPreferences?.maxAge || 60
      });
      // Sync photos from user object
      setPhotos(user.photos || []);
    }
  }, [user]);

  // ── Photo Gallery Handlers ──────────────────────────────────────────────────

  const handlePhotoUpload = useCallback(async (file) => {
    if (!file) return;
    if (photos.length >= 12) {
      setPhotoError('Maximum 12 photos allowed. Delete one first.');
      return;
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setPhotoError('Only JPEG, PNG or WEBP images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File too large. Maximum size is 5 MB.');
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoError('');
      const fd = new FormData();
      fd.append('photo', file);
      const res = await API.post('/users/photos', fd);
      if (res.data.success) {
        setPhotos(res.data.photos);
        updateProfileLocally({ ...user, photos: res.data.photos });
      } else {
        setPhotoError(res.data.message || 'Upload failed.');
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  }, [photos, user, updateProfileLocally]);

  const handlePhotoDelete = useCallback(async (photoId) => {
    try {
      setDeletingPhotoId(photoId);
      setPhotoError('');
      const res = await API.delete(`/users/photos/${photoId}`);
      if (res.data.success) {
        setPhotos(res.data.photos);
        updateProfileLocally({ ...user, photos: res.data.photos });
        // Close lightbox if deleted photo was open
        setLightboxIndex(null);
      } else {
        setPhotoError(res.data.message || 'Delete failed.');
      }
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Delete failed. Try again.');
    } finally {
      setDeletingPhotoId(null);
    }
  }, [user, updateProfileLocally]);

  const onPhotoDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handlePhotoUpload(file);
  }, [handlePhotoUpload]);

  const getPhotoSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    return `${base}${url}`;
  };

  // Lightbox nav helpers
  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex((i) => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setLightboxIndex((i) => (i + 1) % photos.length);

  const handleStartEdit = () => {
    setEditing(true);
    setSaveSuccess(false);
    setError('');
    setPreviewPic(null);
    setNewPicFile(null);
    setPreviewBanner(null);
    setNewBannerFile(null);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError('');
    setPreviewPic(null);
    setNewPicFile(null);
    setPreviewBanner(null);
    setNewBannerFile(null);
    // Reset to current user data
    if (user) {
      setForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        city: user.city || '',
        phoneNumber: user.phoneNumber || '',
        interestedIn: user.relationshipPreferences?.interestedIn || 'All',
        minAge: user.relationshipPreferences?.minAge || 18,
        maxAge: user.relationshipPreferences?.maxAge || 60
      });
    }
  };

  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPicFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewBannerFile(file);
    setPreviewBanner(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.city.trim()) {
      setError('Full name and city are required.');
      return;
    }
    if (parseInt(form.minAge) >= parseInt(form.maxAge)) {
      setError('Minimum age must be less than maximum age.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const formData = new FormData();
      formData.append('fullName', form.fullName.trim());
      formData.append('bio', form.bio);
      formData.append('city', form.city.trim());
      formData.append('phoneNumber', form.phoneNumber.trim());
      formData.append('interestedIn', form.interestedIn);
      formData.append('minAge', form.minAge);
      formData.append('maxAge', form.maxAge);
      if (newPicFile) formData.append('profilePicture', newPicFile);
      if (newBannerFile) formData.append('bannerImage', newBannerFile);

      const res = await API.put('/users/profile', formData);

      if (res.data.success) {
        updateProfileLocally(res.data.user);
        setEditing(false);
        setSaveSuccess(true);
        setPreviewPic(null);
        setNewPicFile(null);
        setPreviewBanner(null);
        setNewBannerFile(null);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(res.data.message || 'Failed to save changes.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-romantic-soft dark:bg-romantic-dark">
        <Heart className="h-12 w-12 text-pink-500 fill-pink-500 animate-heartbeat" />
      </div>
    );
  }

  const age = calculateAge(user.dateOfBirth);
  const displayPic = previewPic || avatarSrc(user.profilePicture);
  const displayBanner = previewBanner || bannerSrc(user.bannerImage);

  return (
    <>
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* Ambient glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-3xl pointer-events-none -z-0" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none -z-0" />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">

        {/* Success toast */}
        {saveSuccess && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-green-500 text-white font-bold px-4 py-3 rounded-2xl shadow-xl animate-fade-in">
            <CheckCircle2 className="h-5 w-5" />
            Profile updated successfully!
          </div>
        )}

        {/* Profile header card */}
        <GlassCard className="relative overflow-hidden border border-pink-100/10">
          {/* Banner Image */}
          <div className="absolute inset-x-0 top-0 h-32 w-full rounded-t-2xl overflow-hidden group/banner bg-slate-200 dark:bg-slate-800">
            <img
              src={displayBanner}
              alt="Profile Banner"
              className="w-full h-full object-cover"
            />
            {editing && (
              <>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity duration-200"
                >
                  <div className="flex flex-col items-center gap-1 text-white">
                    <Camera className="h-6 w-6" />
                    <span className="text-xs font-bold">Change Banner</span>
                  </div>
                </button>
              </>
            )}
          </div>

          <div className="relative pt-12 pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {/* Avatar with edit overlay */}
              <div className="relative group">
                <img
                  src={displayPic}
                  alt={user.fullName}
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl ring-2 ring-pink-400/30"
                />
                {editing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePicChange}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="h-7 w-7 text-white" />
                    </button>
                  </>
                )}
                {/* Online badge */}
                <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 bg-green-500" />
              </div>

              {/* Name + meta */}
              <div className="flex-grow text-center sm:text-left space-y-1 pb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-2">
                  {user.fullName}
                  <Sparkles className="h-5 w-5 text-pink-500" />
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-pink-400" />
                    Age {age}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    {user.gender}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-pink-400" />
                    {user.city}
                  </span>
                </p>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Administrator
                  </span>
                )}
              </div>

              {/* Edit / Save / Cancel */}
              <div className="flex gap-2 flex-shrink-0">
                {!editing ? (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition transform hover:scale-105 text-sm"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-3 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition transform hover:scale-105 text-sm disabled:opacity-70"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-400/20 text-rose-600 dark:text-rose-400 text-sm font-medium px-4 py-3 rounded-xl">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Personal Info + Bio */}
          <div className="lg:col-span-2 space-y-6">

            {/* Bio / About */}
            <GlassCard className="border border-pink-100/10">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                About Me
              </h2>
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell potential matches about yourself — your personality, hobbies, dreams..."
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none"
                />
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed min-h-[60px]">
                  {user.bio || (
                    <span className="italic text-slate-400">
                      No biography written yet. Click "Edit Profile" to add one!
                    </span>
                  )}
                </p>
              )}
              {editing && (
                <p className="text-[10px] text-slate-400 mt-1.5 text-right">{form.bio.length}/500</p>
              )}
            </GlassCard>

            {/* Personal Details */}
            <GlassCard className="border border-pink-100/10">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                Personal Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100"
                      placeholder="Your full name"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.fullName}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    City
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100"
                      placeholder="Your city"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-pink-400" />
                      {user.city}
                    </p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    {user.email}
                    <span className="text-[10px] text-slate-400 ml-1">(locked)</span>
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100"
                      placeholder="e.g. 0300-1234567"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-pink-400" />
                      {user.phoneNumber || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Gender (read-only) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Gender
                  </label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-400" />
                    {user.gender}
                    <span className="text-[10px] text-slate-400 ml-1">(locked)</span>
                  </p>
                </div>

                {/* Date of Birth (read-only) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Date of Birth
                  </label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-pink-400" />
                    {formatDate(user.dateOfBirth)}
                    <span className="text-[10px] text-slate-400 ml-1">(locked)</span>
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right: Match Preferences + Stats */}
          <div className="space-y-6">

            {/* Match Preferences */}
            <GlassCard className="border border-pink-100/10">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-500" />
                Match Preferences
              </h2>

              <div className="space-y-4">
                {/* Interested In */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Interested In
                  </label>
                  {editing ? (
                    <select
                      value={form.interestedIn}
                      onChange={(e) => setForm({ ...form, interestedIn: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="All">All genders</option>
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {user.relationshipPreferences?.interestedIn || 'All'}
                    </p>
                  )}
                </div>

                {/* Age Range */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Age Range
                  </label>
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="18"
                        max="99"
                        value={form.minAge}
                        onChange={(e) => setForm({ ...form, minAge: e.target.value })}
                        className="w-full glass-input rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 text-center"
                      />
                      <span className="text-slate-400 font-bold text-xs flex-shrink-0">to</span>
                      <input
                        type="number"
                        min="18"
                        max="100"
                        value={form.maxAge}
                        onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
                        className="w-full glass-input rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 text-center"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {user.relationshipPreferences?.minAge || 18} – {user.relationshipPreferences?.maxAge || 60} years
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Profile Stats */}
            <GlassCard className="border border-indigo-400/10">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                My Connections
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center bg-pink-500/5 rounded-xl p-3 border border-pink-100/10">
                  <p className="text-2xl font-extrabold text-pink-500">{user.friends?.length || 0}</p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Matches</p>
                </div>
                <div className="text-center bg-indigo-500/5 rounded-xl p-3 border border-indigo-100/10">
                  <p className="text-2xl font-extrabold text-indigo-500">{user.friendRequests?.length || 0}</p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Requests</p>
                </div>
              </div>
            </GlassCard>

            {/* Security Badge */}
            <GlassCard className="border border-green-500/10 bg-green-500/5">
              <div className="flex gap-3">
                <ShieldCheck className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-green-600 uppercase tracking-wider">
                    Verified Account
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your account is secured with bcrypt-hashed credentials and a unique CNIC identity check.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ── Photo Gallery ──────────────────────────────────────────────── */}
        <GlassCard className="border border-pink-100/10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Images className="h-4 w-4 text-pink-500" />
              My Photo Gallery
              <span className="text-xs font-semibold text-slate-400 ml-1">({photos.length}/12)</span>
            </h2>
            {photos.length < 12 && (
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-md transition transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
          />

          {/* Photo upload error */}
          {photoError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-400/20 text-rose-600 dark:text-rose-400 text-xs font-medium px-3 py-2.5 rounded-xl mb-4">
              <X className="h-3.5 w-3.5 flex-shrink-0" />
              {photoError}
            </div>
          )}

          {/* Drag & Drop Upload Zone (shown when gallery has space) */}
          {photos.length < 12 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onPhotoDrop}
              onClick={() => photoInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 mb-5 ${
                isDragOver
                  ? 'border-pink-500 bg-pink-500/10 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-pink-400 hover:bg-pink-500/5'
              }`}
            >
              {uploadingPhoto ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
                  <p className="text-sm font-semibold text-slate-500">Uploading your photo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-indigo-500/20 flex items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-pink-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isDragOver ? 'Drop to upload!' : 'Drag & drop or click to add a photo'}
                  </p>
                  <p className="text-xs text-slate-400">JPEG · PNG · WEBP &nbsp;·&nbsp; max 5 MB</p>
                </div>
              )}
            </div>
          )}

          {/* Photo Grid */}
          {photos.length === 0 ? (
            <div className="text-center py-10">
              <Camera className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No photos yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload photos to make your profile shine!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo._id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <img
                    src={getPhotoSrc(photo.url)}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = '/uploads/default-avatar.svg'; }}
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                    <div className="flex gap-2 justify-center mb-1">
                      <button
                        onClick={() => openLightbox(idx)}
                        className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-xl transition"
                        title="View fullscreen"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePhotoDelete(photo._id)}
                        disabled={deletingPhotoId === photo._id}
                        className="bg-rose-500/80 hover:bg-rose-600 backdrop-blur-sm text-white p-2 rounded-xl transition disabled:opacity-60"
                        title="Delete photo"
                      >
                        {deletingPhotoId === photo._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length === 12 && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Gallery is full (12/12). Delete a photo to upload a new one.
            </p>
          )}
        </GlassCard>

      </main>
    </div>

    {/* ── Lightbox Modal ────────────────────────────────────────────────── */}
    {lightboxIndex !== null && photos[lightboxIndex] && (
      <div
        className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
        onClick={closeLightbox}
      >
        {/* Close */}
        <button
          onClick={closeLightbox}
          className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-2xl transition z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Prev */}
        {photos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <div
          className="relative max-w-4xl max-h-[85vh] mx-8 rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={getPhotoSrc(photos[lightboxIndex].url)}
            alt={`Photo ${lightboxIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain"
          />
          {/* Delete from lightbox */}
          <button
            onClick={() => handlePhotoDelete(photos[lightboxIndex]._id)}
            disabled={deletingPhotoId === photos[lightboxIndex]._id}
            className="absolute bottom-4 right-4 bg-rose-500/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl transition disabled:opacity-60 backdrop-blur-sm"
          >
            {deletingPhotoId === photos[lightboxIndex]._id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete Photo
          </button>
          {/* Counter */}
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Next */}
        {photos.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    )}
    </>
  );
}
