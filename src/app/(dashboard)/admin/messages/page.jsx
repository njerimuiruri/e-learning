'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, MessageCircle, ArrowLeft, RefreshCw, Users } from 'lucide-react';
import messageService from '@/lib/api/messageService';

/* ─── Helpers ─── */
function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
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
        const str = String(id);
        if (str && str !== '[object Object]') return str;
    }
    if (val.id !== undefined) {
        const id = val.id;
        if (!id) return '';
        if (typeof id === 'string') return id;
        const str = String(id);
        if (str && str !== '[object Object]') return str;
    }
    return '';
}

function initials(user) {
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
}

const ROLE_COLORS = {
    student:    'bg-gradient-to-br from-green-500 to-emerald-600',
    instructor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    admin:      'bg-gradient-to-br from-purple-600 to-indigo-700',
};

function Avatar({ user, size = 'md' }) {
    const sz   = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    const bg   = ROLE_COLORS[user?.role] || 'bg-gradient-to-br from-gray-400 to-gray-500';
    return (
        <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
            {initials(user)}
        </div>
    );
}

/* ─── Conversation Row ─── */
function ConvRow({ conv, isActive, onClick }) {
    // The API returns conv.user as the "other" participant
    const other   = conv.user || {};
    const name    = `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'Unknown';
    const lastMsg = conv.lastMessage?.content || '';
    const time    = formatTime(conv.lastMessage?.createdAt);

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${isActive ? 'bg-blue-50 border-r-2 border-r-blue-600' : ''}`}
        >
            <Avatar user={other} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{name}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{time}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate flex-1">{lastMsg || 'No messages yet'}</p>
                    {conv.unreadCount > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                        </span>
                    )}
                </div>
                <span className={`text-[10px] font-medium capitalize mt-0.5 inline-block px-1.5 py-0.5 rounded ${
                    other?.role === 'student' ? 'bg-green-100 text-green-700'
                    : other?.role === 'instructor' ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>{other?.role || 'user'}</span>
            </div>
        </button>
    );
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, currentUserId }) {
    const senderId = getIdStr(message.senderId);
    const isOwn    = senderId === currentUserId;
    const sender   = typeof message.senderId === 'object' ? message.senderId : null;

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 gap-2`}>
            {!isOwn && <Avatar user={sender} size="sm" />}
            <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm ${
                isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
            }`}>
                {!isOwn && sender && (
                    <p className="text-[10px] font-semibold text-blue-600 mb-1">
                        {sender.firstName} {sender.lastName}
                        <span className="text-gray-400 font-normal ml-1 capitalize">· {sender.role}</span>
                    </p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'} text-right`}>
                    {formatTime(message.createdAt)}
                    {message.isRead && isOwn && ' · Read'}
                </p>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected]           = useState(null); // full conv object
    const [messages, setMessages]           = useState([]);
    const [newMessage, setNewMessage]       = useState('');
    const [loading, setLoading]             = useState(true);
    const [sending, setSending]             = useState(false);
    const [refreshing, setRefreshing]       = useState(false);
    const [searchQuery, setSearchQuery]     = useState('');
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const messagesEndRef                    = useRef(null);
    const pollRef                           = useRef(null);

    // Admin's own userId (needed to identify which side of the conversation they're on)
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    useEffect(() => {
        fetchConversations();
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            // Admin uses their own conversations endpoint (not admin/all) so they can reply
            const data = await messageService.getConversations();
            const raw  = Array.isArray(data) ? data : [];
            setConversations(raw);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchMessages = useCallback(async (userId, markRead = true) => {
        if (!userId || typeof userId !== 'string') {
            console.warn('fetchMessages: invalid userId', userId);
            return;
        }
        try {
            const data = await messageService.getConversation(userId, 150);
            setMessages(Array.isArray(data) ? data : []);
            if (markRead) await messageService.markConversationAsRead(userId);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    }, []);

    const handleSelectConv = (conv) => {
        const otherUser = conv.user || {};
        const otherId   = getIdStr(otherUser);
        if (!otherId) { console.error('handleSelectConv: no otherId', conv); return; }
        setSelected({ ...conv, otherId, otherUser });
        setMobileShowChat(true);
        fetchMessages(otherId);
        // Poll for new messages every 5s while chat is open
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => fetchMessages(otherId, false), 5000);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selected?.otherId) return;
        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);
        try {
            await messageService.sendMessage({ receiverId: selected.otherId, content: text });
            await fetchMessages(selected.otherId);
            fetchConversations(true);
        } catch (err) {
            console.error('Error sending message:', err);
            setNewMessage(text); // restore on error
        } finally {
            setSending(false);
        }
    };

    const handleBack = () => {
        setMobileShowChat(false);
        setSelected(null);
        setMessages([]);
        if (pollRef.current) clearInterval(pollRef.current);
    };

    const filtered = conversations.filter(conv => {
        const u = conv.user || {};
        const q = searchQuery.toLowerCase();
        return `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(q) ||
               (u.email || '').toLowerCase().includes(q) ||
               (conv.lastMessage?.content || '').toLowerCase().includes(q);
    });

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const otherUser   = selected?.otherUser;
    const otherName   = otherUser
        ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim()
        : 'User';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-[calc(100vh-4rem)] flex flex-col">

                {/* Page Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Support Messages
                            {totalUnread > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{totalUnread}</span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">Reply to students and instructors</p>
                    </div>
                    <button
                        onClick={() => fetchConversations(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Chat Layout */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Sidebar ── */}
                    <div className={`w-full sm:w-80 flex-shrink-0 border-r bg-white flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 animate-pulse">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                                                <div className="h-3 bg-gray-200 rounded w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No conversations yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Messages from students will appear here</p>
                                </div>
                            ) : (
                                filtered.map((conv, idx) => (
                                    <ConvRow
                                        key={conv.user ? getIdStr(conv.user) : idx}
                                        conv={conv}
                                        isActive={selected?.otherId === getIdStr(conv.user)}
                                        onClick={() => handleSelectConv(conv)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Chat Area ── */}
                    <div className={`flex-1 flex flex-col min-w-0 bg-gray-50 ${!mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
                        {selected ? (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm flex-shrink-0">
                                    <button
                                        className="sm:hidden p-1 rounded-lg hover:bg-gray-100"
                                        onClick={handleBack}
                                    >
                                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <Avatar user={otherUser} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{otherName}</p>
                                        <p className="text-xs text-gray-500">
                                            <span className="capitalize">{otherUser?.role || 'User'}</span>
                                            {otherUser?.email && <span className="ml-1">· {otherUser.email}</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-4 py-4">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                                            <MessageCircle className="w-8 h-8 text-gray-300" />
                                            <p className="text-sm text-gray-400">No messages yet. Send a reply below.</p>
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <MessageBubble key={msg._id} message={msg} currentUserId={currentUserId} />
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="border-t bg-white p-3 flex-shrink-0">
                                    <form onSubmit={handleSend} className="flex items-center gap-2">
                                        <input
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder={`Reply to ${otherName}...`}
                                            disabled={sending}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                            className="flex-1 h-10 px-4 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span className="hidden sm:inline">Send</span>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center p-8">
                                <div>
                                    <div className="inline-flex p-5 bg-gray-100 rounded-full mb-4">
                                        <MessageCircle className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Support Inbox</h3>
                                    <p className="text-sm text-gray-400">Select a conversation to read and reply</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
