'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import API from '../utils/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Load user's notifications initially
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await API.get('/users/notifications');
        if (res.data.success) {
          setNotifications(res.data.notifications);
          const unread = res.data.notifications.filter(n => !n.isRead).length;
          setUnreadNotificationsCount(unread);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  // Connect socket when user is logged in
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      upgrade: false
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.IO Connected to Server');
      // Register currently logged-in user
      newSocket.emit('register_user', user._id);
    });

    // Listen for online status updates from others
    newSocket.on('user_status_change', (data) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.isOnline) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    // Listen for new incoming system alerts/notifications (friend request, match, etc.)
    newSocket.on('new_notification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadNotificationsCount((prev) => prev + 1);
    });

    // Clean up connections on unmount/logout
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await API.put('/users/notifications/read');
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadNotificationsCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        unreadNotificationsCount,
        markAllNotificationsAsRead,
        setNotifications,
        setUnreadNotificationsCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
