'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Send, MessageCircle, ArrowLeft, Shield, BookOpen,
  FileText, TrendingUp, ClipboardCheck, Video, Bell, X,
  ChevronRight, RefreshCw, Inbox,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import messageService from '@/lib/api/messageService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getIdStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val.$oid) return val.$oid;
  if (val._id !== undefined) {
    const id = val._id;
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    const s = String(id);
    return s !== '[object Object]' ? s : '';
  }
  if (val.id !== undefined) {
    const id = val.id;
    if (!id) return '';
    if (typeof id === 'string') return id;
    const s = String(id);
    return s !== '[object Object]' ? s : '';
  }
  return '';
}

function initials(user) {
  return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
}

// ── context config ────────────────────────────────────────────────────────────

const CTX = {
  module:     { icon: BookOpen,       bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   label: 'Module'     },
  lesson:     { icon: Video,          bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   badge: 'bg-cyan-100 text-cyan-700',   label: 'Lesson'     },
  essay:      { icon: FileText,       bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700', label: 'Essay'      },
  progress:   { icon: TrendingUp,     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700', label: 'Progress'   },
  assessment: { icon: ClipboardCheck, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700',label: 'Assessment' },
  general:    { icon: MessageCircle,  bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   badge: 'bg-gray-100 text-gray-600',   label: 'General'    },
};

function ContextBadge({ type }) {
  const c = CTX[type] ?? CTX.general;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.badge}`}>
      <Icon className="w-2.5 h-2.5" />{c.label}
    </span>
  );
}

function ContextHeader({ context }) {
  if (!context?.type) return null;
  const c = CTX[context.type] ?? CTX.general;
  const Icon = c.icon;
  return (
    <div className={`mx-4 mt-3 mb-1 rounded-xl border p-3 flex items-start gap-3 ${c.bg} ${c.border}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${c.text}`}>{c.label}</span>
        </div>
        <p className="text-sm font-semibold text-gray-800 truncate">{context.title}</p>
        {context.metadata?.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{context.metadata.description}</p>
        )}
      </div>
    </div>
  );
}

// ── avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md', isAdmin = false }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const bg = isAdmin
    ? 'bg-gradient-to-br from-purple-600 to-violet-700'
    : user?.role === 'instructor'
    ? 'bg-gradient-to-br from-[#021d49] to-blue-700'
    : 'bg-gradient-to-br from-green-500 to-emerald-600';
  return (
    <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {isAdmin ? <Shield className="w-4 h-4" /> : initials(user)}
    </div>
  );
}

// ── conversation row ──────────────────────────────────────────────────────────

function ConvRow({ conv, isActive, onClick }) {
  const name = conv.isAdmin
    ? 'Admin Support'
    : `${conv.user?.firstName || ''} ${conv.user?.lastName || ''}`.trim() || 'Instructor';
  const time = conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : '';
  const roleLabel = conv.isAdmin ? 'Admin' : conv.user?.role || 'instructor';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 group ${
        isActive ? 'bg-blue-50 border-r-[3px] border-r-[#021d49]' : ''
      }`}
    >
      <div className="relative shrink-0">
        <Avatar user={conv.user} isAdmin={conv.isAdmin} />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none pt-[1px]">
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#021d49]' : 'text-gray-900'} ${conv.unreadCount > 0 ? 'font-bold' : ''}`}>
            {name}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{time}</span>
        </div>
        <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
          {conv.lastMessage?.content || 'Start a conversation'}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            conv.isAdmin ? 'bg-purple-100 text-purple-700' :
            roleLabel === 'instructor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {conv.isAdmin ? 'Admin' : 'Instructor'}
          </span>
          {conv.context?.type && <ContextBadge type={conv.context.type} />}
        </div>
      </div>
    </button>
  );
}

// ── message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, currentUserId }) {
  const senderId = getIdStr(message.senderId);
  const isOwn = senderId === currentUserId;
  const sender = typeof message.senderId === 'object' ? message.senderId : null;
  const isAdmin = sender?.role === 'admin';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 gap-2 px-1`}>
      {!isOwn && <Avatar user={sender} isAdmin={isAdmin} size="sm" />}
      <div className={`max-w-xs sm:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {isAdmin ? 'Admin Support' : sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'Instructor'}
            </span>
            {isAdmin && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" /> Admin
              </span>
            )}
          </div>
        )}
        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-[#021d49] text-white rounded-br-sm'
            : isAdmin
            ? 'bg-purple-50 text-gray-900 border border-purple-200 rounded-bl-sm'
            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
            {formatTime(message.createdAt)}
            {message.isRead && isOwn && ' · Read'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── new message toast (floating) ─────────────────────────────────────────────

function NewMessageToast({ sender, preview, onView, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-sm w-full flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#021d49] to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {initials(sender) || <Bell className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="font-semibold text-gray-900 text-sm">
              {sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'New message' : 'New message'}
            </p>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 truncate">{preview}</p>
          <button
            onClick={onView}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#021d49] hover:text-blue-700"
          >
            View message <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function StudentMessagesPage() {
  const { showToast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [adminContact, setAdminContact] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [floatToast, setFloatToast] = useState(null); // { sender, preview, userId }
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const prevCountRef = useRef(0);
  const selectedRef = useRef(null);

  const currentUser = typeof window !== 'undefined'
    ? (authService.getCurrentUser() ?? JSON.parse(localStorage.getItem('user') || 'null'))
    : null;
  const currentUserId = currentUser?._id || currentUser?.id || localStorage.getItem?.('userId') || '';

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    init();
    // Global poll: every 15s check for new messages / unread count
    const globalPoll = setInterval(globalPollFn, 15000);
    return () => {
      clearInterval(globalPoll);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (selected) {
      fetchMessages(selected.userId, true);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(selected.userId, false), 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected?.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const init = async () => {
    setLoading(true);
    try {
      const [convData, admin] = await Promise.all([
        messageService.getConversations(),
        messageService.getAdminContact().catch(() => null),
      ]);
      setAdminContact(admin);
      const list = normalizeConvs(Array.isArray(convData) ? convData : []);
      setConversations(list);
      prevCountRef.current = list.reduce((s, c) => s + (c.unreadCount || 0), 0);
    } catch (err) {
      console.error('init messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeConvs = (raw) =>
    raw.map((conv) => {
      const user = conv.user || {};
      return { ...conv, userId: getIdStr(user), isAdmin: user.role === 'admin' };
    });

  const globalPollFn = useCallback(async () => {
    try {
      const convData = await messageService.getConversations();
      const list = normalizeConvs(Array.isArray(convData) ? convData : []);
      const newTotal = list.reduce((s, c) => s + (c.unreadCount || 0), 0);

      if (newTotal > prevCountRef.current) {
        // Find conversation that gained unread
        const gained = list.find((c) => {
          const prev = conversations.find((p) => p.userId === c.userId);
          return (c.unreadCount || 0) > (prev?.unreadCount || 0);
        });
        // Show float toast only if not currently viewing that conversation
        if (gained && selectedRef.current?.userId !== gained.userId) {
          setFloatToast({
            sender: gained.user,
            preview: gained.lastMessage?.content || 'New message',
            userId: gained.userId,
          });
          setTimeout(() => setFloatToast(null), 8000);
        }
      }
      prevCountRef.current = newTotal;
      setConversations(list);
    } catch {}
  }, [conversations]);

  const fetchMessages = async (userId, scroll = true) => {
    if (!userId) return;
    try {
      const data = await messageService.getConversation(userId, 100);
      setMessages(Array.isArray(data) ? data : []);
      if (scroll) {
        await messageService.markConversationAsRead(userId);
        // Clear unread count locally
        setConversations((prev) =>
          prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('fetchMessages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selected) return;
    const text = newMessage.trim();
    const receiverId = selected.userId;
    if (!receiverId) return;
    setNewMessage('');
    setSending(true);
    // Optimistic add
    setMessages((prev) => [
      ...prev,
      {
        _id: `tmp-${Date.now()}`,
        senderId: currentUserId,
        content: text,
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ]);
    try {
      await messageService.sendMessage({ receiverId, content: text });
      await fetchMessages(receiverId, false);
      const data = await messageService.getConversations();
      setConversations(normalizeConvs(Array.isArray(data) ? data : []));
    } catch (err) {
      showToast('Failed to send message', { type: 'error' });
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConv = (conv) => {
    setSelected(conv);
    setMobileShowChat(true);
    if (floatToast?.userId === conv.userId) setFloatToast(null);
  };

  const handleStartAdminChat = () => {
    if (!adminContact) return;
    const adminId = getIdStr(adminContact);
    if (!adminId) return;
    const existing = conversations.find((c) => c.userId === adminId);
    handleSelectConv(
      existing || { userId: adminId, user: adminContact, isAdmin: true, lastMessage: null, unreadCount: 0 }
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  };

  // Build conversation list (admin pinned at top)
  const adminId = adminContact ? getIdStr(adminContact) : null;
  const hasAdminConv = adminId ? conversations.some((c) => c.userId === adminId) : false;
  const allConvs = [
    ...(adminContact && adminId && !hasAdminConv
      ? [{ userId: adminId, user: adminContact, isAdmin: true, lastMessage: null, unreadCount: 0 }]
      : []),
    ...conversations,
  ];
  const filtered = allConvs.filter((c) => {
    const name = c.isAdmin ? 'admin support' : `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || (c.lastMessage?.content || '').toLowerCase().includes(q);
  });

  const totalUnread = allConvs.reduce((s, c) => s + (c.unreadCount || 0), 0);
  const selectedUser = selected?.user || {};
  const selectedName = selected?.isAdmin
    ? 'Admin Support'
    : `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Instructor';

  // Find context for selected conversation
  const selectedContext = selected?.context ?? null;

  return (
    <>
      <Navbar />
      <div className="h-[calc(100vh-5rem)] bg-gray-100 flex overflow-hidden">
        {/* Float toast */}
        {floatToast && (
          <NewMessageToast
            sender={floatToast.sender}
            preview={floatToast.preview}
            onView={() => {
              const conv = allConvs.find((c) => c.userId === floatToast.userId);
              if (conv) handleSelectConv(conv);
              setFloatToast(null);
            }}
            onClose={() => setFloatToast(null)}
          />
        )}

        <div className="flex flex-1 overflow-hidden m-3 rounded-2xl shadow-sm border border-gray-200 bg-white">

          {/* ── Conversation Sidebar ── */}
          <div className={`w-full sm:w-[300px] md:w-[340px] flex-shrink-0 border-r border-gray-100 bg-white flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>

            {/* Sidebar Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#021d49] rounded-xl flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-gray-900 leading-none">Inbox</h1>
                    <p className="text-[10px] text-gray-400 mt-0.5">Messages from instructors &amp; admin</p>
                  </div>
                  {totalUnread > 0 && (
                    <span className="min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh"
                  className="p-1.5 text-gray-400 hover:text-[#021d49] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/20 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Info strip */}
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <MessageCircle className="w-3 h-3 text-blue-500 shrink-0" />
              <p className="text-[10px] text-blue-700">
                Instructors &amp; admins can start conversations with you here
              </p>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No messages yet</p>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Your instructors and admin will appear here when they message you
                  </p>
                  {adminContact && (
                    <button
                      onClick={handleStartAdminChat}
                      className="px-4 py-2 bg-[#021d49] text-white text-xs font-semibold rounded-xl hover:bg-[#032a66] transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Shield className="w-3.5 h-3.5" /> Contact Admin Support
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((conv) => (
                  <ConvRow
                    key={conv.userId}
                    conv={conv}
                    isActive={selected?.userId === conv.userId}
                    onClick={() => handleSelectConv(conv)}
                  />
                ))
              )}
            </div>

            {/* Admin CTA pinned at bottom */}
            {adminContact && (
              <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={handleStartAdminChat}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors text-sm font-semibold text-purple-700"
                >
                  <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  Contact Admin Support
                </button>
              </div>
            )}
          </div>

          {/* ── Chat Panel ── */}
          <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 ${!mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
            {selected ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-white shadow-sm">
                  <button
                    className="sm:hidden p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                    onClick={() => { setMobileShowChat(false); setSelected(null); }}
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <Avatar user={selectedUser} isAdmin={selected.isAdmin} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{selectedName}</p>
                      {selected.isAdmin ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-[#021d49]/10 text-[#021d49] text-[10px] font-semibold rounded-full capitalize">
                          Instructor
                        </span>
                      )}
                      {selectedContext?.type && <ContextBadge type={selectedContext.type} />}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selected.isAdmin ? 'Platform administration & support' : selectedUser.email || 'Your instructor'}
                    </p>
                  </div>
                </div>

                {selectedContext && <ContextHeader context={selectedContext} />}

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto py-4 px-1">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                      <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                        <MessageCircle className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600">No messages yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {selected.isAdmin ? 'Send a message to reach admin support.' : 'Your instructor will reply here.'}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble key={msg._id} message={msg} currentUserId={currentUserId} />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="border-t border-gray-100 bg-white p-3">
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                        }}
                        placeholder={selected.isAdmin ? 'Message admin support…' : 'Reply to your instructor…'}
                        disabled={sending}
                        rows={1}
                        className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/20 focus:bg-white outline-none resize-none leading-relaxed transition-all"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="h-11 px-4 bg-[#021d49] text-white rounded-xl hover:bg-[#032a66] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold transition-colors shrink-0 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                  <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
                </div>
              </>
            ) : (
              /* Empty / welcome state */
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="max-w-sm">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#021d49] to-[#1e40af] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
                    <Inbox className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Your Inbox</h3>
                  <p className="text-sm text-gray-500 mb-2 leading-relaxed">
                    Receive and reply to messages from your <strong>instructors</strong> and <strong>admin support</strong>.
                  </p>
                  <p className="text-xs text-gray-400 mb-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 leading-relaxed">
                    When an instructor messages you about a module, lesson, or essay  it will appear here automatically.
                  </p>
                  {adminContact && (
                    <button
                      onClick={handleStartAdminChat}
                      className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#021d49] text-white text-sm font-semibold rounded-xl hover:bg-[#032a66] transition-colors shadow-sm"
                    >
                      <Shield className="w-4 h-4" />
                      Contact Admin Support
                    </button>
                  )}
                  <p className="text-[10px] text-gray-400 mt-4">
                    Select a conversation from the left to read &amp; reply
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
