'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Bell, MessageSquare, User, Settings, Shield, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationPanel from './NotificationPanel';
import BrandLogo from './BrandLogo';
import AvatarImage from './AvatarImage';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadNotificationsCount } = useSocket();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null; // Only show for logged in users

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Heart },
    { href: '/members', label: 'Members', icon: User },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowProfileDropdown(false);
  };

  return (
    <nav className="glass sticky top-0 z-40 border-b border-pink-100/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo / Brand Name */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
              <BrandLogo className="text-xl sm:text-2xl" iconClass="h-6 sm:h-7 w-6 sm:w-7" />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-pink-500/10 hover:text-pink-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Dashboard link if user is administrator */}
            {user.isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  pathname === '/admin'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600'
                }`}
              >
                <Shield className="h-4 w-4" />
                Moderation
              </Link>
            )}
          </div>

          {/* Right Action Icons (Notifications + Profile dropdown) */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileDropdown(false);
                }}
                className="relative rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="h-5 sm:h-6 w-5 sm:w-6" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 sm:h-5 w-4 sm:w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] sm:text-xs font-bold text-white animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-pink-100/10 z-50">
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-pink-100/10"
              >
                <AvatarImage
                  src={user.profilePicture}
                  alt={user.fullName}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-pink-400"
                />
                <span className="hidden sm:inline text-sm font-semibold max-w-[100px] truncate">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl border border-pink-100/10 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">
                      {user.fullName}
                    </p>
                  </div>
                  
                  <Link
                    href="/profile"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-2 mt-1.5 rounded-xl text-sm text-slate-600 dark:text-slate-350 hover:bg-pink-500/5 hover:text-pink-600 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-350 hover:bg-pink-500/5 hover:text-pink-600 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <button
                    onClick={() => {
                      handleLinkClick();
                      logout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 mt-1 rounded-xl text-sm text-rose-600 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl p-2 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-pink-500/10 hover:text-pink-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}

          {user.isAdmin && (
            <Link
              href="/admin"
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                pathname === '/admin'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600'
              }`}
            >
              <Shield className="h-5 w-5" />
              Moderation Area
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
