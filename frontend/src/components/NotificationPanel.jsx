'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Heart, UserPlus, ShieldAlert, Check, X, Eye } from 'lucide-react';
import API from '../utils/api';
import { avatarSrc } from '../utils/avatar';
import { useSocket } from '../context/SocketContext';

const NotificationPanel = ({ onClose }) => {
  const { notifications, setNotifications, markAllNotificationsAsRead, setUnreadNotificationsCount } = useSocket();
  const [processingId, setProcessingId] = useState(null);
  const router = useRouter();

  const handleAcceptRequest = async (senderId, notifId) => {
    try {
      setProcessingId(notifId);
      const res = await API.post(`/users/friend-request/accept/${senderId}`);
      if (res.data.success) {
        // Remove friend request notification from active list
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
        setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
        
        // Navigate to chat automatically
        if (res.data.conversationId) {
          router.push(`/chat?convo=${res.data.conversationId}`);
        } else {
          router.push('/chat');
        }
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (senderId, notifId) => {
    try {
      setProcessingId(notifId);
      const res = await API.post(`/users/friend-request/reject/${senderId}`);
      if (res.data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== notifId));
        setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-indigo-500" />;
      case 'match':
        return <Heart className="h-5 w-5 text-pink-500 fill-pink-500 animate-heartbeat" />;
      case 'report':
        return <ShieldAlert className="h-5 w-5 text-rose-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col max-h-112.5">
      {/* Header panel */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Bell className="h-4 w-4 text-pink-500" />
          Alerts & Notifications
        </h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-xs font-semibold text-pink-500 hover:text-pink-600 cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications scroll list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/40">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
            <Heart className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium">No alerts yet</p>
            <p className="text-xs text-slate-400 max-w-50 mt-1">
              Mutual matches and requests will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`flex gap-3 p-3 transition-colors rounded-xl ${
                notif.isRead ? 'bg-transparent' : 'bg-pink-500/5 dark:bg-pink-500/3 border-l-2 border-pink-500'
              }`}
            >
              {/* Profile Avatar / Icon */}
              <div className="relative shrink-0 mt-0.5">
                <img
                  src={avatarSrc(notif.sender?.profilePicture)}
                  alt={notif.sender?.fullName || 'User'}
                  className="h-10 w-10 rounded-full object-cover border border-slate-200"
                />
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 border shadow-sm">
                  {getIcon(notif.type)}
                </div>
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-350 leading-snug">
                  {notif.content}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(notif.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>

                {/* Inline Action Triggers for Friend Request */}
                {notif.type === 'friend_request' && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleAcceptRequest(notif.sender._id, notif._id)}
                      className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Accept
                    </button>
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleRejectRequest(notif.sender._id, notif._id)}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Ignore
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer view profile redirection */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-2 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-b-2xl">
        <button
          onClick={() => {
            router.push('/dashboard');
            if (onClose) onClose();
          }}
          className="text-xs font-bold text-indigo-500 hover:text-indigo-600 inline-flex items-center gap-1.5 py-1.5 cursor-pointer"
        >
          <Eye className="h-3 w-3" />
          View Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
