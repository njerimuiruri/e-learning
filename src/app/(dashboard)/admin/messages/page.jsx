'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Send, MessageCircle, ArrowLeft, Shield, RefreshCw,
  BookOpen, FileText, TrendingUp, ClipboardCheck, Video,
  Users, Eye, Inbox,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import messageService from '@/lib/api/messageService';
import authService from '@/lib/api/authService';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const mins = Math.floor((now - d) / 60000);
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
  if (val._id) { const s = String(val._id); return s !== '[object Object]' ? s : ''; }
  if (val.id)  { const s = String(val.id);  return s !== '[object Object]' ? s : ''; }
  return '';
}

function initials(user) {
  return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
}

// ── context config ────────────────────────────────────────────────────────────

const CTX = {
  module:     { Icon: BookOpen,       bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',    label: 'Module'     },
  lesson:     { Icon: Video,          bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-700',    label: 'Lesson'     },
  essay:      { Icon: FileText,       bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  label: 'Essay'      },
  progress:   { Icon: TrendingUp,     bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  label: 'Progress'   },
  assessment: { Icon: ClipboardCheck, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700',label: 'Assessment' },
  general:    { Icon: MessageCircle,  bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-600',    label: 'General'    },
};

function ContextBadge({ type }) {
  const c = CTX[type] ?? CTX.general;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.badge}`}>
      <c.Icon className="w-2.5 h-2.5" />{c.label}
    </span>
  );
}

function ContextHeader({ context }) {
  if (!context?.type) return null;
  const c = CTX[context.type] ?? CTX.general;
  return (
    <div className={`mx-4 mt-3 mb-1 rounded-xl border p-3 flex items-start gap-3 ${c.bg} ${c.border}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
        <c.Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-bold uppercase tracking-wide mb-0.5 ${c.text}`}>{c.label}</p>
        <p className="text-sm font-semibold text-gray-800">{context.title}</p>
        {context.metadata?.description && (
          <p className="text-xs text-gray-500 mt-0.5">{context.metadata.description}</p>
        )}
      </div>
    </div>
  );
}

// ── avatar ────────────────────────────────────────────────────────────────────

const ROLE_GRAD = {
  admin:      'bg-gradient-to-br from-purple-600 to-violet-700',
  instructor: 'bg-gradient-to-br from-green-500 to-emerald-700',
  student:    'bg-gradient-to-br from-blue-500 to-indigo-600',
};

function Avatar({ user, size = 'md', forceAdmin = false }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const bg = forceAdmin ? ROLE_GRAD.admin : ROLE_GRAD[user?.role] ?? 'bg-gradient-to-br from-gray-400 to-gray-500';
  return (
    <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {forceAdmin ? <Shield className="w-4 h-4" /> : initials(user)}
    </div>
  );
}

// ── role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const map = {
    admin:      'bg-purple-100 text-purple-700',
    instructor: 'bg-green-100 text-green-700',
    student:    'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role || 'user'}
    </span>
  );
}

// ── message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, currentUserId }) {
  const senderId = getIdStr(message.senderId);
  const isOwn = senderId === currentUserId;
  const sender = typeof message.senderId === 'object' ? message.senderId : null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 gap-2 px-1`}>
      {!isOwn && <Avatar user={sender} size="sm" />}
      <div className={`max-w-xs sm:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'Unknown'}
            </span>
            <RoleBadge role={sender?.role} />
          </div>
        )}
        {isOwn && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-full flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" /> Admin
            </span>
          </div>
        )}
        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-purple-600 text-white rounded-br-sm'
            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-purple-200' : 'text-gray-400'}`}>
            {formatTime(message.createdAt)}
            {message.isRead && isOwn && ' · Read'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── conversation row (my chats) ───────────────────────────────────────────────

function MyConvRow({ conv, isActive, onClick }) {
  const user = conv.user || {};
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
  const time = conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : '';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${
        isActive ? 'bg-purple-50 border-r-[3px] border-r-purple-600' : ''
      }`}
    >
      <div className="relative shrink-0">
        <Avatar user={user} />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>{name}</p>
          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{time}</span>
        </div>
        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
          {conv.lastMessage?.content || 'No messages yet'}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <RoleBadge role={user.role} />
          {conv.context?.type && <ContextBadge type={conv.context.type} />}
        </div>
      </div>
    </button>
  );
}

// ── conversation row (oversight — between two other users) ────────────────────

function OversightConvRow({ conv, isActive, onClick }) {
  const p1 = conv.users?.[0] || conv.participants?.[0] || conv.user1 || {};
  const p2 = conv.users?.[1] || conv.participants?.[1] || conv.user2 || {};
  const name1 = `${p1.firstName || ''} ${p1.lastName || ''}`.trim() || 'User';
  const name2 = `${p2.firstName || ''} ${p2.lastName || ''}`.trim() || 'User';
  const time = conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : '';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${
        isActive ? 'bg-purple-50 border-r-[3px] border-r-purple-600' : ''
      }`}
    >
      {/* Stacked avatars */}
      <div className="relative w-10 h-10 shrink-0">
        <Avatar user={p1} size="sm" />
        <div className="absolute -bottom-1 -right-1">
          <Avatar user={p2} size="sm" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>
            {name1} ↔ {name2}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{time}</span>
        </div>
        <p className="text-xs truncate text-gray-500">
          {conv.lastMessage?.content || 'No messages'}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <RoleBadge role={p1.role} />
          <span className="text-[10px] text-gray-400">↔</span>
          <RoleBadge role={p2.role} />
          {conv.context?.type && <ContextBadge type={conv.context.type} />}
        </div>
      </div>
    </button>
  );
}

// ── monitoring banner ─────────────────────────────────────────────────────────

function MonitoringBanner({ p1, p2 }) {
  const name1 = p1 ? `${p1.firstName || ''} ${p1.lastName || ''}`.trim() : 'User';
  const name2 = p2 ? `${p2.firstName || ''} ${p2.lastName || ''}`.trim() : 'User';
  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-purple-200 bg-purple-50 p-3 flex items-center gap-2">
      <Eye className="w-4 h-4 text-purple-600 shrink-0" />
      <p className="text-xs text-purple-700">
        <span className="font-semibold">Monitoring:</span> Conversation between{' '}
        <span className="font-medium">{name1}</span> and{' '}
        <span className="font-medium">{name2}</span>
      </p>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
  const { showToast } = useToast();
  const [mode, setMode] = useState('mine'); // 'mine' | 'all'

  // My conversations
  const [myConvs, setMyConvs] = useState([]);
  const [myLoading, setMyLoading] = useState(true);

  // Oversight conversations
  const [allConvs, setAllConvs] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const currentUser = typeof window !== 'undefined'
    ? (authService.getCurrentUser() ?? JSON.parse(localStorage.getItem('user') || 'null'))
    : null;
  const currentUserId = currentUser?._id || currentUser?.id || localStorage.getItem?.('userId') || '';

  useEffect(() => {
    fetchMyConvs();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (mode === 'all' && allConvs.length === 0 && !allError) {
      fetchAllConvs();
    }
  }, [mode]);

  useEffect(() => {
    if (selected?.mode === 'mine') {
      const userId = getIdStr(selected.conv.user);
      fetchMyMessages(userId, true);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMyMessages(userId, false), 5000);
    } else if (selected?.mode === 'oversight') {
      const p1 = selected.conv?.users?.[0] || selected.conv?.participants?.[0];
      const p2 = selected.conv?.users?.[1] || selected.conv?.participants?.[1];
      const u1 = getIdStr(p1) || p1?._id?.toString?.();
      const u2 = getIdStr(p2) || p2?._id?.toString?.();
      fetchOversightMessages(u1, u2);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected?.conv?._id ?? selected?.conv?.user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMyConvs = async (silent = false) => {
    if (!silent) setMyLoading(true);
    try {
      const data = await messageService.getConversations();
      setMyConvs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchMyConvs:', err);
    } finally {
      setMyLoading(false);
    }
  };

  const fetchAllConvs = async () => {
    setAllLoading(true);
    setAllError(null);
    try {
      const data = await messageService.adminGetAllConversations();
      setAllConvs(Array.isArray(data) ? data : (data?.conversations ?? []));
    } catch (err) {
      setAllError(err.response?.data?.message || 'Oversight view not available');
    } finally {
      setAllLoading(false);
    }
  };

  const fetchMyMessages = async (userId, scroll = true) => {
    if (!userId) return;
    try {
      const data = await messageService.getConversation(userId, 100);
      setMessages(Array.isArray(data) ? data : []);
      if (scroll) {
        await messageService.markConversationAsRead(userId);
        setMyConvs((prev) =>
          prev.map((c) => (getIdStr(c.user) === userId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('fetchMyMessages:', err);
    }
  };

  const fetchOversightMessages = async (user1Id, user2Id) => {
    if (!user1Id || !user2Id) return;
    try {
      const data = await messageService.adminGetConversation(user1Id, user2Id, 100);
      setMessages(Array.isArray(data) ? data : (data?.messages ?? []));
    } catch (err) {
      console.error('fetchOversightMessages:', err);
      setMessages([]);
    }
  };

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selected) return;
    if (selected.mode === 'oversight') {
      showToast('You cannot reply in oversight mode. Switch to My Chats to send as Admin.', { type: 'warning' });
      return;
    }
    const receiverId = getIdStr(selected.conv.user);
    if (!receiverId) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { _id: `tmp-${Date.now()}`, senderId: currentUserId, content: text, createdAt: new Date().toISOString() },
    ]);
    try {
      await messageService.sendMessage({ receiverId, content: text });
      await fetchMyMessages(receiverId, false);
      fetchMyConvs(true);
    } catch (err) {
      showToast('Failed to send message', { type: 'error' });
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  }, [selected, newMessage, currentUserId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (mode === 'mine') await fetchMyConvs();
    else { setAllConvs([]); setAllError(null); await fetchAllConvs(); }
    setRefreshing(false);
  };

  // Filtered lists
  const filteredMine = myConvs.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.toLowerCase().includes(q) ||
      (c.lastMessage?.content || '').toLowerCase().includes(q)
    );
  });

  const filteredAll = allConvs.filter((c) => {
    const q = searchQuery.toLowerCase();
    const p1 = c.users?.[0] || c.participants?.[0] || c.user1 || {};
    const p2 = c.users?.[1] || c.participants?.[1] || c.user2 || {};
    return (
      `${p1.firstName || ''} ${p1.lastName || ''}`.toLowerCase().includes(q) ||
      `${p2.firstName || ''} ${p2.lastName || ''}`.toLowerCase().includes(q) ||
      (c.lastMessage?.content || '').toLowerCase().includes(q)
    );
  });

  const totalUnread = myConvs.reduce((s, c) => s + (c.unreadCount || 0), 0);
  const isOversight = selected?.mode === 'oversight';
  const selectedContext = selected?.conv?.context ?? null;
  const oversightP1 = selected?.conv?.users?.[0] || selected?.conv?.participants?.[0] || selected?.conv?.user1;
  const oversightP2 = selected?.conv?.users?.[1] || selected?.conv?.participants?.[1] || selected?.conv?.user2;

  // Header name for current chat
  const chatHeaderName = isOversight
    ? `${initials(oversightP1)} ↔ ${initials(oversightP2)}`
    : `${selected?.conv?.user?.firstName || ''} ${selected?.conv?.user?.lastName || ''}`.trim() || 'User';

  const chatHeaderSub = isOversight
    ? `${oversightP1?.firstName || ''} ${oversightP1?.lastName || ''} ↔ ${oversightP2?.firstName || ''} ${oversightP2?.lastName || ''}`
    : (selected?.conv?.user?.email || '');

  return (
    <div className="h-[calc(100vh-5rem)] bg-gray-50 flex overflow-hidden">
      <div className="flex flex-1 overflow-hidden bg-white shadow-sm">

        {/* ── Sidebar ── */}
        <div className={`w-full sm:w-80 md:w-[340px] flex-shrink-0 border-r bg-white flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">Messages</h1>
                {totalUnread > 0 && (
                  <span className="min-w-[22px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-3">
              <button
                onClick={() => { setMode('mine'); setSelected(null); setMessages([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'mine' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                My Chats
              </button>
              <button
                onClick={() => { setMode('all'); setSelected(null); setMessages([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Oversight
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={mode === 'mine' ? 'Search conversations…' : 'Search participants…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {mode === 'mine' ? (
              myLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                        <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMine.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No direct chats yet</p>
                  <p className="text-xs text-gray-400 mt-1">Users can contact admin support from their dashboards</p>
                </div>
              ) : (
                filteredMine.map((conv) => (
                  <MyConvRow
                    key={getIdStr(conv.user)}
                    conv={conv}
                    isActive={selected?.mode === 'mine' && getIdStr(selected.conv.user) === getIdStr(conv.user)}
                    onClick={() => { setSelected({ conv, mode: 'mine' }); setMobileShowChat(true); }}
                  />
                ))
              )
            ) : (
              // Oversight
              allLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allError ? (
                <div className="p-6 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Oversight unavailable</p>
                  <p className="text-xs text-gray-400">{allError}</p>
                  <button
                    onClick={fetchAllConvs}
                    className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredAll.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No conversations found</p>
                  <p className="text-xs text-gray-400 mt-1">Platform conversations will appear here</p>
                </div>
              ) : (
                filteredAll.map((conv, idx) => {
                  const u1 = getIdStr(conv.users?.[0]) || '';
                  const u2 = getIdStr(conv.users?.[1]) || '';
                  const id = (u1 && u2) ? `${u1}-${u2}` : (conv._id || conv.id || `conv-${idx}`);
                  const enriched = { ...conv, _oversightId: id };
                  return (
                    <OversightConvRow
                      key={id}
                      conv={enriched}
                      isActive={selected?.mode === 'oversight' && selected.conv?._oversightId === id}
                      onClick={() => { setSelected({ conv: enriched, mode: 'oversight' }); setMobileShowChat(true); }}
                    />
                  );
                })
              )
            )}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 ${!mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
          {selected ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm">
                <button
                  className="sm:hidden p-1.5 rounded-xl hover:bg-gray-100"
                  onClick={() => { setMobileShowChat(false); setSelected(null); }}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                {isOversight ? (
                  <div className="flex items-center -space-x-2 shrink-0">
                    <Avatar user={oversightP1} size="sm" />
                    <Avatar user={oversightP2} size="sm" />
                  </div>
                ) : (
                  <Avatar user={selected.conv.user} />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {isOversight
                        ? `${oversightP1?.firstName || ''} ${oversightP1?.lastName || ''} ↔ ${oversightP2?.firstName || ''} ${oversightP2?.lastName || ''}`
                        : chatHeaderName}
                    </p>
                    {isOversight ? (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5" /> Monitoring
                      </span>
                    ) : (
                      <>
                        <RoleBadge role={selected.conv.user?.role} />
                        {selectedContext?.type && <ContextBadge type={selectedContext.type} />}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{chatHeaderSub}</p>
                </div>
              </div>

              {/* Oversight monitoring banner */}
              {isOversight && <MonitoringBanner p1={oversightP1} p2={oversightP2} />}

              {/* Context header (my chats only) */}
              {!isOversight && selectedContext && <ContextHeader context={selectedContext} />}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {isOversight ? 'No messages in this conversation' : 'No messages yet'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg._id || msg.id} message={msg} currentUserId={currentUserId} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {isOversight ? (
                <div className="border-t bg-purple-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Eye className="w-4 h-4 shrink-0" />
                    <p>You are in <span className="font-semibold">monitoring mode</span>. Switch to <button onClick={() => { setMode('mine'); setSelected(null); setMessages([]); }} className="underline font-semibold">My Chats</button> to send messages as Admin.</p>
                  </div>
                </div>
              ) : (
                <div className="border-t bg-white p-3">
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-violet-700 rounded-full flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-purple-700">Admin</span>
                    </div>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                      placeholder="Reply as Admin…"
                      disabled={sending}
                      rows={1}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="h-11 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 flex items-center gap-2 text-sm font-medium shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                  <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Messages sent here appear with an Admin badge to the recipient</p>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="max-w-xs">
                <div className="inline-flex p-5 bg-purple-50 rounded-full mb-4">
                  {mode === 'mine' ? (
                    <MessageCircle className="w-10 h-10 text-purple-400" />
                  ) : (
                    <Eye className="w-10 h-10 text-purple-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {mode === 'mine' ? 'Admin Messaging' : 'Conversation Oversight'}
                </h3>
                <p className="text-sm text-gray-400">
                  {mode === 'mine'
                    ? 'Select a conversation to reply as Admin. Your messages will show a purple Admin badge.'
                    : 'Monitor conversations between instructors and students across the platform.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
