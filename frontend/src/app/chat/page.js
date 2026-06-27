'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send, Image as ImageIcon, Trash2, Heart, MessageSquare, MapPin,
  Check, CheckCheck, Loader2, X, Phone, Video, MoreVertical, Smile
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Navbar from '../../components/Navbar';
import API from '../../utils/api';
import { avatarSrc, BACKEND_URL } from '../../utils/avatar';

// ── Helper: format timestamp ──────────────────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ── Conversation List Item ────────────────────────────────────────────────────
const ConvoItem = ({ convo, isActive, onSelect, onlineUsers, currentUserId }) => {
  const partner = convo.chatPartner;
  if (!partner) return null;
  const isOnline = onlineUsers?.has(partner._id);
  const lastMsg = convo.lastMessage;
  const unread = lastMsg && !lastMsg.isRead && lastMsg.sender !== currentUserId;

  return (
    <button
      onClick={() => onSelect(convo)}
      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-all duration-200 rounded-2xl mb-1 group ${
        isActive
          ? 'bg-gradient-to-r from-pink-500/15 to-indigo-600/15 border border-pink-400/20 shadow-sm'
          : 'hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarSrc(partner.profilePicture)}
          alt={partner.fullName}
          className={`h-12 w-12 rounded-full object-cover border-2 ${
            isActive ? 'border-pink-400' : 'border-pink-400/30 group-hover:border-pink-400/60'
          } transition-all`}
        />
        <div
          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
            isOnline ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`font-bold text-sm truncate ${
            isActive ? 'text-pink-600 dark:text-pink-400' : 'text-slate-800 dark:text-slate-100'
          }`}>
            {partner.fullName}
          </h4>
          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
            {formatTime(lastMsg?.createdAt || convo.updatedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className={`text-xs truncate ${
            unread ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-400'
          }`}>
            {lastMsg?.isDeleted
              ? '🗑 Message deleted'
              : lastMsg?.image
              ? '📷 Photo'
              : lastMsg?.content || 'Say hello! 👋'}
          </p>
          {unread && (
            <span className="ml-1 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse" />
          )}
        </div>
      </div>
    </button>
  );
};

// ── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn, onDelete, partnerName, partnerAvatar }) => {
  const [showActions, setShowActions] = useState(false);

  if (msg.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        {!isOwn && (
          <div className="flex-shrink-0 mr-2 self-start">
            <img
              src={avatarSrc(partnerAvatar)}
              alt={partnerName}
              className="h-7 w-7 rounded-full object-cover border border-pink-400/20 shadow-sm"
            />
          </div>
        )}
        <div className="px-3 py-2 rounded-2xl text-xs italic text-slate-400 bg-white/30 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30">
          🗑 This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Partner Avatar for incoming messages */}
      {!isOwn && (
        <div className="flex-shrink-0 mr-2 self-start mt-0.5">
          <img
            src={avatarSrc(partnerAvatar)}
            alt={partnerName}
            className="h-7 w-7 rounded-full object-cover border border-pink-400/20 shadow-sm"
          />
        </div>
      )}

      {/* Delete action (own messages only, shown on hover) */}
      {isOwn && showActions && (
        <button
          onClick={() => onDelete(msg._id)}
          className="mr-2 self-center p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition opacity-0 group-hover:opacity-100"
          title="Delete message"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Image message */}
        {msg.image && (
          <a href={`${BACKEND_URL}${msg.image}`} target="_blank" rel="noopener noreferrer">
            <img
              src={`${BACKEND_URL}${msg.image}`}
              alt="Shared image"
              className={`rounded-2xl mb-1 max-h-56 w-auto object-cover shadow-md ${
                isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}
            />
          </a>
        )}

        {/* Text message */}
        {msg.content && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              isOwn
                ? 'bg-gradient-to-br from-pink-500 to-indigo-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700/50'
            }`}
          >
            {msg.content}
          </div>
        )}

        {/* Meta: time + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
          {isOwn && (
            msg.isRead
              ? <CheckCheck className="h-3 w-3 text-pink-400" />
              : <Check className="h-3 w-3 text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Chat Page ────────────────────────────────────────────────────────────
function ChatContent() {
  const { user, loading } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConvoId = searchParams.get('convo');

  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingConvos(true);
      const res = await API.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
        // Auto-select from query param
        if (initialConvoId && !activeConvo) {
          const target = res.data.conversations.find((c) => c._id === initialConvoId);
          if (target) setActiveConvo(target);
        } else if (!activeConvo && res.data.conversations.length > 0 && !initialConvoId) {
          // Auto-select first conversation on desktop load
          // (commented out to avoid confusion on mobile)
        }
      }
    } catch (err) {
      console.error('Fetch convos error:', err);
    } finally {
      setLoadingConvos(false);
    }
  }, [user, initialConvoId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convoId) => {
    try {
      setLoadingMessages(true);
      const res = await API.get(`/chat/messages/${convoId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
        // Emit seen event
        if (socket && activeConvo) {
          const partner = activeConvo.chatPartner;
          socket.emit('message_seen', {
            conversationId: convoId,
            readerId: user._id,
            senderId: partner._id
          });
        }
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [socket, activeConvo, user]);

  useEffect(() => {
    if (activeConvo) {
      fetchMessages(activeConvo._id);
      setMobileSidebarOpen(false);
    }
  }, [activeConvo?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket: incoming message
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMsg) => {
      // Update message thread if it's the active conversation
      if (activeConvo && newMsg.conversationId === activeConvo._id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        // Mark as seen immediately if we're looking at it
        if (newMsg.sender !== user._id) {
          socket.emit('message_seen', {
            conversationId: activeConvo._id,
            readerId: user._id,
            senderId: activeConvo.chatPartner._id
          });
        }
      }

      // Update last message preview in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversationId
            ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted', image: '' } : m
        )
      );
    };

    const handleMessagesRead = ({ conversationId }) => {
      if (activeConvo?._id === conversationId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    const handleTyping = ({ senderId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(senderId);
        else next.delete(senderId);
        return next;
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, activeConvo, user]);

  // Handle selecting a conversation
  const handleSelectConvo = (convo) => {
    setActiveConvo(convo);
    setMessages([]);
    setTypingUsers(new Set());
    setText('');
  };

  // Handle typing indicator
  const handleTypingInput = (e) => {
    setText(e.target.value);
    if (!socket || !activeConvo) return;
    socket.emit('typing', {
      senderId: user._id,
      recipientId: activeConvo.chatPartner._id,
      isTyping: true
    });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing', {
        senderId: user._id,
        recipientId: activeConvo.chatPartner._id,
        isTyping: false
      });
    }, 1500);
  };

  // Send text message
  const handleSend = () => {
    if (!text.trim() || !socket || !activeConvo || sending) return;
    const msgPayload = {
      conversationId: activeConvo._id,
      senderId: user._id,
      recipientId: activeConvo.chatPartner._id,
      content: text.trim(),
      image: ''
    };
    setSending(true);
    socket.emit('send_message', msgPayload);
    setText('');
    // Stop typing indicator
    socket.emit('typing', {
      senderId: user._id,
      recipientId: activeConvo.chatPartner._id,
      isTyping: false
    });
    clearTimeout(typingTimerRef.current);
    setSending(false);
    textareaRef.current?.focus();
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Upload image and send as message
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !activeConvo) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await API.post('/chat/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        socket.emit('send_message', {
          conversationId: activeConvo._id,
          senderId: user._id,
          recipientId: activeConvo.chatPartner._id,
          content: '',
          image: res.data.imageUrl
        });
      }
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete a message (REST + socket relay)
  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await API.delete(`/chat/message/${msgId}`);
      if (res.data.success && socket && activeConvo) {
        socket.emit('delete_message', {
          messageId: msgId,
          conversationId: activeConvo._id,
          senderId: user._id,
          recipientId: activeConvo.chatPartner._id
        });
        // Update locally
        setMessages((prev) =>
          prev.map((m) =>
            m._id === msgId ? { ...m, isDeleted: true, content: 'This message was deleted', image: '' } : m
          )
        );
      }
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  const partner = activeConvo?.chatPartner;
  const partnerIsOnline = partner && onlineUsers?.has(partner._id);
  const partnerIsTyping = partner && typingUsers.has(partner._id);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-romantic-soft dark:bg-romantic-dark">
        <Heart className="h-12 w-12 text-pink-500 fill-pink-500 animate-heartbeat" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden max-w-7xl w-full mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-4 gap-0 sm:gap-4">
        
        {/* ── Conversation Sidebar ─────────────────────────────────────────── */}
        <aside
          className={`
            ${mobileSidebarOpen ? 'flex' : 'hidden'} sm:flex
            flex-col w-full sm:w-80 lg:w-96 flex-shrink-0
            bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl
            border border-pink-100/10 dark:border-slate-700/20
            sm:rounded-3xl overflow-hidden shadow-xl
            absolute sm:relative inset-0 sm:inset-auto z-20 sm:z-auto
          `}
        >
          {/* Sidebar header */}
          <div className="px-5 py-4 border-b border-pink-100/10 dark:border-slate-800/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500 animate-heartbeat" />
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Messages</h2>
              {conversations.length > 0 && (
                <span className="text-xs bg-pink-500/10 text-pink-500 font-bold px-2 py-0.5 rounded-full">
                  {conversations.length}
                </span>
              )}
            </div>
            <button
              className="sm:hidden p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingConvos ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-7 w-7 text-pink-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="font-bold text-slate-600 dark:text-slate-400 text-sm">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Accept a match request from the Dashboard to start chatting!
                </p>
              </div>
            ) : (
              conversations.map((convo) => (
                <ConvoItem
                  key={convo._id}
                  convo={convo}
                  isActive={activeConvo?._id === convo._id}
                  onSelect={handleSelectConvo}
                  onlineUsers={onlineUsers}
                  currentUserId={user._id}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Chat Main Area ───────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-pink-100/10 dark:border-slate-700/20 sm:rounded-3xl shadow-xl">
          
          {activeConvo && partner ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-pink-100/10 dark:border-slate-800/50 flex-shrink-0">
                {/* Mobile: back to sidebar */}
                <button
                  className="sm:hidden mr-1 p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <MessageSquare className="h-5 w-5" />
                </button>

                {/* Partner avatar + status */}
                <div className="relative">
                  <img
                    src={avatarSrc(partner.profilePicture)}
                    alt={partner.fullName}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-pink-400"
                  />
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      partnerIsOnline ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                    {partner.fullName}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    {partnerIsTyping ? (
                      <span className="text-pink-500 font-medium flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        Typing...
                      </span>
                    ) : partnerIsOnline ? (
                      <><span className="h-1.5 w-1.5 bg-green-500 rounded-full" /> Active now</>
                    ) : (
                      <><MapPin className="h-3 w-3" />{partner.city}</>
                    )}
                  </p>
                </div>

                {/* Call actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors"
                    title="Voice Call (coming soon)"
                  >
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-pink-500/10 hover:text-pink-500 transition-colors"
                    title="Video Call (coming soon)"
                  >
                    <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-7 w-7 text-pink-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="bg-pink-500/10 p-5 rounded-full mb-4">
                      <Heart className="h-10 w-10 text-pink-500 fill-pink-500 animate-heartbeat" />
                    </div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-lg">
                      You matched with {partner.fullName}! 🎉
                    </h4>
                    <p className="text-sm text-slate-400 mt-1 max-w-xs">
                      Say hello and start your beautiful journey together.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg._id}
                      msg={msg}
                      isOwn={msg.sender === user._id || msg.sender?._id === user._id}
                      onDelete={handleDeleteMessage}
                      partnerName={partner.fullName}
                      partnerAvatar={partner.profilePicture}
                    />
                  ))
                )}

                {/* Typing indicator bubble */}
                {partnerIsTyping && (
                  <div className="flex justify-start mb-2">
                    <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-700/50 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <span className="h-2 w-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message composer */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-pink-100/10 dark:border-slate-800/50 flex-shrink-0">
                <div className="flex items-end gap-2 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl px-3 py-2 border border-pink-100/10 dark:border-slate-700/30 focus-within:border-pink-400/30 focus-within:shadow-[0_0_0_2px_rgba(236,72,153,0.08)] transition-all">
                  {/* Image upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-pink-500 hover:bg-pink-500/10 transition-colors disabled:opacity-50 flex-shrink-0 self-end mb-0.5"
                    title="Send image"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </button>

                  {/* Text input */}
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTypingInput}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${partner.fullName.split(' ')[0]}...`}
                    rows={1}
                    className="flex-1 bg-transparent resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none leading-relaxed py-1.5 max-h-28 overflow-y-auto"
                    style={{ minHeight: '36px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
                    }}
                  />

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="flex-shrink-0 self-end mb-0.5 p-2 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-600 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:from-pink-600 hover:to-indigo-700 active:scale-95 transition-all duration-150"
                    title="Send message (Enter)"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">Shift+Enter</kbd> for new line
                </p>
              </div>
            </>
          ) : (
            /* No conversation selected — empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
              {/* Background glows */}
              <div className="absolute top-[-15%] left-[-10%] w-80 h-80 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
              <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

              {/* Mobile: open sidebar button */}
              <button
                className="sm:hidden mb-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg hover:scale-105 transition transform"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                View Conversations
              </button>

              <div className="bg-gradient-to-br from-pink-500/10 to-indigo-500/10 p-6 rounded-3xl mb-6 border border-pink-200/20">
                <Heart className="h-14 w-14 text-pink-500 fill-pink-500 animate-heartbeat mx-auto" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                Your Love Inbox
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed text-sm">
                Select a conversation from the sidebar to begin chatting with your match. Every great love story starts with a single message. 💌
              </p>

              {conversations.length === 0 && !loadingConvos && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-6 flex items-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg hover:from-pink-600 hover:to-indigo-700 transition transform hover:scale-105"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  Find Your Match
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-romantic-soft dark:bg-romantic-dark">
        <Loader2 className="h-12 w-12 text-pink-500 animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
