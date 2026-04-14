'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageCircle, ArrowLeft, Shield } from 'lucide-react';
import messageService from '@/lib/api/messageService';

/* ─── Helpers ─── */
function formatTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getIdStr(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    // Handle { $oid: "..." } Mongoose JSON serialization
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

function initials(first, last) {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';
}

/* ─── Avatar ─── */
function UserAvatar({ user, size = 'md', isAdmin = false }) {
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    const bg = isAdmin
        ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
        : 'bg-gradient-to-br from-blue-500 to-indigo-600';
    return (
        <div className={`${sz} ${bg} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
            {isAdmin ? <Shield className="w-4 h-4" /> : initials(user?.firstName, user?.lastName)}
        </div>
    );
}

/* ─── Conversation Row ─── */
function ConvRow({ conv, isActive, onClick }) {
    const name = conv.isAdmin
        ? 'Admin Support'
        : conv.user?.fullName || `${conv.user?.firstName || ''} ${conv.user?.lastName || ''}`.trim() || 'Instructor';
    const time = conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : '';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0 ${isActive ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}
        >
            <UserAvatar user={conv.user} isAdmin={conv.isAdmin} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{name}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{time}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate flex-1">{conv.lastMessage?.content || 'Start a conversation'}</p>
                    {conv.unreadCount > 0 && (
                        <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                        </span>
                    )}
                </div>
                {conv.isAdmin && (
                    <p className="text-[10px] text-purple-600 mt-0.5 font-medium">Support</p>
                )}
            </div>
        </button>
    );
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, currentUserId }) {
    const senderId = getIdStr(message.senderId);
    const isOwn = senderId === currentUserId;
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm ${isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                }`}>
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
export default function StudentMessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [adminContact, setAdminContact] = useState(null);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);

    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    useEffect(() => {
        init();
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    useEffect(() => {
        if (selected) {
            fetchMessages(selected.userId);
            // Poll for new messages every 5s while a chat is open
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => fetchMessages(selected.userId, false), 5000);
        } else {
            if (pollRef.current) clearInterval(pollRef.current);
        }
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
            const raw = Array.isArray(convData) ? convData : [];
            const mapped = raw.map(conv => {
                const user = conv.user || {};
                return { ...conv, userId: getIdStr(user), isAdmin: user.role === 'admin' };
            });
            setConversations(mapped);
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId, scrollToBottom = true) => {
        if (!userId || typeof userId !== 'string') {
            console.warn('fetchMessages: invalid userId', userId);
            return;
        }
        try {
            const data = await messageService.getConversation(userId, 100);
            setMessages(Array.isArray(data) ? data : []);
            if (scrollToBottom) await messageService.markConversationAsRead(userId);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selected) return;
        const receiverId = selected.userId;
        if (!receiverId) {
            console.error('handleSend: no receiverId on selected conversation', selected);
            return;
        }
        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);
        try {
            await messageService.sendMessage({ receiverId, content: text });
            await fetchMessages(receiverId);
            // Refresh conversations list so last message updates
            const data = await messageService.getConversations();
            const raw = Array.isArray(data) ? data : [];
            setConversations(raw.map(conv => {
                const user = conv.user || {};
                return { ...conv, userId: getIdStr(user), isAdmin: user.role === 'admin' };
            }));
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleSelectConv = (conv) => {
        setSelected(conv);
        setMobileShowChat(true);
    };

    const handleStartAdminChat = () => {
        if (!adminContact) return;
        const adminId = getIdStr(adminContact);
        if (!adminId) {
            console.error('handleStartAdminChat: could not extract admin ID from', adminContact);
            return;
        }
        // Check if we already have this convo in the list
        const existing = conversations.find(c => c.userId === adminId);
        if (existing) {
            handleSelectConv(existing);
        } else {
            // Create a virtual conversation entry
            handleSelectConv({
                userId: adminId,
                user: adminContact,
                isAdmin: true,
                lastMessage: null,
                unreadCount: 0,
            });
        }
    };

    // Build the full conversation list: admin support pinned at top, then others
    const adminId = adminContact ? getIdStr(adminContact) : null;
    const hasAdminConv = adminId ? conversations.some(c => c.userId === adminId) : false;

    const allConvs = [
        // Pin admin support at top if exists in convs, or always show if admin is available
        ...(adminContact && adminId && !hasAdminConv
            ? [{ userId: adminId, user: adminContact, isAdmin: true, lastMessage: null, unreadCount: 0 }]
            : []),
        ...conversations,
    ];

    const filtered = allConvs.filter(conv => {
        const name = conv.isAdmin ? 'admin support' : `${conv.user?.firstName || ''} ${conv.user?.lastName || ''}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase()) ||
            (conv.lastMessage?.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    const selectedUser = selected?.user || {};
    const selectedName = selected?.isAdmin
        ? 'Admin Support'
        : `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'User';

    return (
        <div className="h-[calc(100vh-5rem)] bg-gray-50 flex">
            <div className="flex flex-1 overflow-hidden bg-white shadow-sm rounded-none border-0">

                {/* ── Sidebar ── */}
                <div className={`w-full sm:w-80 flex-shrink-0 border-r bg-white flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="p-4 border-b">
                        <h1 className="text-lg font-bold text-gray-900 mb-3">Messages</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-3">
                                {[...Array(4)].map((_, i) => (
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
                                <p className="text-sm text-gray-500 mb-3">No conversations yet</p>
                                {adminContact && (
                                    <button
                                        onClick={handleStartAdminChat}
                                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                                    >
                                        Contact Admin
                                    </button>
                                )}
                            </div>
                        ) : (
                            filtered.map(conv => (
                                <ConvRow
                                    key={conv.userId}
                                    conv={conv}
                                    isActive={selected?.userId === conv.userId}
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
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm">
                                <button
                                    className="sm:hidden p-1 rounded-lg hover:bg-gray-100"
                                    onClick={() => { setMobileShowChat(false); setSelected(null); }}
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <UserAvatar user={selectedUser} isAdmin={selected.isAdmin} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{selectedName}</p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {selected.isAdmin ? 'Administrator · Support' : selectedUser.role || 'Instructor'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                                        <MessageCircle className="w-8 h-8 text-gray-300" />
                                        <p className="text-sm text-gray-400">
                                            {selected.isAdmin
                                                ? 'Send a message to get support from the admin.'
                                                : 'No messages yet. Say hi!'}
                                        </p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <MessageBubble key={msg._id} message={msg} currentUserId={currentUserId} />
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="border-t bg-white p-3">
                                <form onSubmit={handleSend} className="flex items-center gap-2">
                                    <input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder={selected.isAdmin ? 'Message admin support...' : 'Type a message...'}
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
                                <h3 className="text-lg font-semibold text-gray-700 mb-1">Your Messages</h3>
                                <p className="text-sm text-gray-400 mb-4">Select a conversation or contact admin for support</p>
                                {adminContact && (
                                    <button
                                        onClick={handleStartAdminChat}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                                    >
                                        <Shield className="w-4 h-4" /> Contact Admin Support
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
