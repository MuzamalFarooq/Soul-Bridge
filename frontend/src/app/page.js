'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import BrandLogo from '../components/BrandLogo';
import { APP_COPYRIGHT } from '../config/app';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-romantic-soft dark:bg-romantic-dark">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-[-20%] left-[-10%] w-150 h-150 rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <BrandLogo className="text-2xl" iconClass="h-7 w-7" />
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-linear-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-bold text-slate-600 dark:text-slate-200 hover:text-pink-500 transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-linear-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition transform hover:scale-105"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and description */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold text-xs uppercase px-3 py-1.5 rounded-full tracking-widest animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              Your Soul Match Awaits
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
              Bridge Hearts,<br />
              <span className="text-gradient">Build Lasting Bonds</span>
            </h1>
            
            <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl max-w-xl mx-auto lg:mx-0">
              Welcome to Soul Bridge — the premium destination for meaningful connections. Experience smart matching, real-time private conversations, and find your perfect companion.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-linear-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-lg px-8 py-3.5 rounded-2xl shadow-xl transition transform hover:scale-105"
                >
                  Enter Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="flex items-center gap-2 bg-linear-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-lg px-8 py-3.5 rounded-2xl shadow-xl transition transform hover:scale-105"
                  >
                    Start Your Journey
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur text-slate-700 dark:text-slate-200 font-bold text-lg px-8 py-3.5 rounded-2xl shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    Join Free
                  </Link>
                </>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/50 dark:border-slate-800/50 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-pink-500">10k+</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Active Hearts</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">98%</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Match Accuracy</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-pink-500">2,500+</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pure Matches</p>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Glassmorphic Card Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <GlassCard className="max-w-100 border-2 border-pink-400/20 relative" glow={true}>
              <div className="absolute -top-3 -left-3 bg-pink-500 text-white p-2 rounded-xl shadow-md transform -rotate-12 animate-heartbeat">
                <Heart className="h-6 w-6 fill-white" />
              </div>
              
              <div className="aspect-4/5 rounded-xl overflow-hidden relative border border-white/20 mb-4 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80"
                  alt="Soul Bridge Premium Matching"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold">Ayesha Khan, 24</span>
                    <div className="bg-green-500 h-2.5 w-2.5 rounded-full" />
                  </div>
                  <p className="text-xs text-slate-350 mt-1">Lahore, Pakistan</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Suggested Match</span>
                  <span className="text-xs font-bold bg-pink-500/10 text-pink-600 px-2 py-0.5 rounded">95% Match</span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  "Looking for a pure soul who values family, shares interests in traveling and deep conversations."
                </p>

                <div className="flex justify-center gap-3 pt-2">
                  <Link
                    href="/signup"
                    className="flex-1 text-center bg-linear-to-r from-pink-500 to-indigo-600 text-white font-bold py-3 rounded-xl shadow transition transform hover:scale-105"
                  >
                    Match Now
                  </Link>
                </div>
              </div>
            </GlassCard>
          </div>

        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="hover:-translate-y-1 transition duration-300">
            <div className="bg-pink-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-pink-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Smart Matchmaking</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
              Find partners matching your demographic criteria, cities, and relationship preferences through location score index.
            </p>
          </GlassCard>

          <GlassCard className="hover:-translate-y-1 transition duration-300">
            <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Real-Time WebSocket Chat</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
              Transmit secure messages, images, and emojis instantly. Watch indicators for real-time online status and typing actions.
            </p>
          </GlassCard>

          <GlassCard className="hover:-translate-y-1 transition duration-300">
            <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Pure & Protected Space</h3>
            <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
              Security built-in with hashed bcrypt credentials, JWT auth layers, unique CNIC checks, reporting, and moderation blocks.
            </p>
          </GlassCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40 mt-12 z-10 bg-white/10 dark:bg-slate-900/10">
        <p>{APP_COPYRIGHT}</p>
        <p className="mt-1">Crafted to connect souls across every bridge.</p>
      </footer>
    </div>
  );
}
