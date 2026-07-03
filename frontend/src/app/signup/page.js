'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, User, Shield, Info, Phone, Mail, Lock, Upload, MapPin, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/GlassCard';
import BrandLogo from '../../components/BrandLogo';
import { APP_NAME } from '../../config/app';

export default function Signup() {
  const { user, signup, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Registration States
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [interestedIn, setInterestedIn] = useState('All');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(100);

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Handle profile image local preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return setErrorMsg('File is too large! Maximum limit is 5MB');
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!fullName || !fatherName || !cnicNumber || !dateOfBirth || !city) {
        return setErrorMsg('Please fill in all personal details');
      }
      // Simple CNIC validator (must be text digits)
      if (cnicNumber.replace(/\D/g, '').length < 13) {
        return setErrorMsg('CNIC number must contain at least 13 digits');
      }
      // Age verify (must be at least 18 years old)
      const ageDiff = Date.now() - new Date(dateOfBirth).getTime();
      const ageDate = new Date(ageDiff);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (calculatedAge < 18) {
        return setErrorMsg(`You must be at least 18 years old to join ${APP_NAME}`);
      }
    } else if (step === 2) {
      if (!email || !phoneNumber) {
        return setErrorMsg('Email and phone number are required');
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      return setErrorMsg('Passwords do not match');
    }
    if (password.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long');
    }

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('fatherName', fatherName);
    formData.append('cnicNumber', cnicNumber);
    formData.append('gender', gender);
    formData.append('dateOfBirth', dateOfBirth);
    formData.append('city', city);
    formData.append('email', email);
    formData.append('phoneNumber', phoneNumber);
    formData.append('bio', bio);
    formData.append('password', password);
    
    // Append preferences
    formData.append('relationshipPreferences', JSON.stringify({
      interestedIn,
      minAge: parseInt(minAge),
      maxAge: parseInt(maxAge)
    }));

    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    try {
      const res = await signup(formData);
      if (res && !res.success) {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('Signup failed. Email or CNIC might be taken.');
    }
  };

  return (
    <div className="flex min-h-screen bg-romantic-soft dark:bg-romantic-dark items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[500px] z-10 py-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/" className="flex items-center gap-2 mb-1">
            <BrandLogo className="text-2xl" iconClass="h-7 w-7" />
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-350">
            Join the Soul Bridge community. Step {step} of 3.
          </p>
        </div>

        {/* Signup form card wrapper */}
        <GlassCard glow={true} className="p-5 sm:p-7">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5 text-center border-b border-slate-100 dark:border-slate-850 pb-2">
            Create Free Account
          </h2>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-405 p-3 rounded-xl text-xs font-semibold mb-4 text-center">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1">
                <User className="h-4 w-4" />
                1. Personal Credentials
              </h3>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-input block w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Father's Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Father Name"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="glass-input block w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">CNIC Number</label>
                  <input
                    type="text"
                    required
                    placeholder="35202-XXXXXXX-X"
                    value={cnicNumber}
                    onChange={(e) => setCnicNumber(e.target.value)}
                    className="glass-input block w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="glass-input block w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 dark:bg-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="glass-input block w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="glass-input block w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full flex items-center justify-center bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:scale-103 mt-6 cursor-pointer"
              >
                Continue to Next Step
              </button>
            </div>
          )}

          {/* STEP 2: Contact Info & Upload */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1">
                <Phone className="h-4 w-4" />
                2. Contact & Bio Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input block w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="0300-XXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="glass-input block w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">About Me / Short Bio</label>
                <textarea
                  placeholder="Share details about yourself, hobbies, values, and what kind of relationship partner you search..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="3"
                  className="glass-input block w-full px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Profile Image Drag-n-Drop */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Profile Photo</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl bg-white/5 border border-pink-100/10">
                  <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border-2 border-pink-400">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        <Upload className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full text-center sm:text-left">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow">
                      <Upload className="h-3.5 w-3.5" />
                      Upload Picture
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1.5">Max file size: 5MB. Formats: JPEG, PNG, WEBP</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-250 font-bold px-4 py-3 rounded-xl transition hover:bg-white/5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:scale-103 cursor-pointer"
                >
                  Continue to Preferences
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Dating Preferences & Passwords */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1">
                <Shield className="h-4 w-4" />
                3. Dating Preferences & Password
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Interested In</label>
                  <select
                    value={interestedIn}
                    onChange={(e) => setInterestedIn(e.target.value)}
                    className="glass-input block w-full px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 dark:bg-slate-900"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="All">All</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Age Range Search</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="18"
                      max="100"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value)}
                      className="glass-input block w-full px-2.5 py-2.5 rounded-xl text-sm text-center focus:ring-2 focus:ring-pink-500"
                    />
                    <span className="text-slate-400 text-xs font-bold">to</span>
                    <input
                      type="number"
                      required
                      min="18"
                      max="100"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value)}
                      className="glass-input block w-full px-2.5 py-2.5 rounded-xl text-sm text-center focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input block w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
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
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input block w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-pink-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-pink-500 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-500/5 p-3 rounded-2xl border border-pink-100/5 text-[10px] text-slate-400 flex gap-2">
                <Info className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span>By registering, you confirm that all provided details (including CNIC ID) are verified and authentic. Passwords are securely hashed.</span>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-250 font-bold px-4 py-3 rounded-xl transition hover:bg-white/5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform hover:scale-103 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login footnotes */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-pink-500 font-bold hover:underline">
              Log In
            </Link>
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="hover:underline">Home</Link> • Secure encryption protocols.
        </div>

      </div>
    </div>
  );
}
