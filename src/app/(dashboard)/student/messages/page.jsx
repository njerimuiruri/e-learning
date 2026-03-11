'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageCircle, ArrowLeft, MoreVertical } from 'lucide-react';
import messageService from '@/lib/api/messageService';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

/* ─── Helpers ─── */
function formatTime(date) {
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

function getIdValue(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val._id?.toString() || val.id?.toString() || val.toString?.() || '';
}

function initials(first, last) {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '?';
}

/* ─── Conversation Item ─── */
function ConversationItem({ conv, isActive, onClick }) {
    const instructor = conv.instructorId || {};
    const name = `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Instructor';
    const time = conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : '';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}
        >
            <Avatar className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
                <AvatarFallback className="text-white text-sm font-semibold bg-gradient-to-br from-blue-500 to-indigo-600">
                    {initials(instructor.firstName, instructor.lastName)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{name}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{time}</span>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate flex-1">{conv.lastMessage?.content || 'No messages yet'}</p>
                    {conv.unreadCount > 0 && (
                        <Badge className="ml-2 h-4 min-w-[1rem] px-1 text-[10px] bg-blue-600 border-0 flex-shrink-0">
                            {conv.unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </button>
    );
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, currentUserId }) {
    const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
    const isOwn = senderId === currentUserId;

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl shadow-sm ${
                isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
            }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
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
    const [conversations, setConversations]           = useState([]);
    const [selected, setSelected]                     = useState(null);
    const [messages, setMessages]                     = useState([]);
    const [newMessage, setNewMessage]                 = useState('');
    const [loading, setLoading]                       = useState(true);
    const [sending, setSending]                       = useState(false);
    const [searchQuery, setSearchQuery]               = useState('');
    const [mobileShowChat, setMobileShowChat]         = useState(false);
    const messagesEndRef                              = useRef(null);

    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    useEffect(() => { fetchConversations(); }, []);
    useEffect(() => { if (selected?.instructorIdValue) fetchMessages(selected.instructorIdValue); }, [selected]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const data = await messageService.getConversations();
            const raw = Array.isArray(data) ? data : data?.conversations || [];
            setConversations(raw.map(conv => {
                const instructor = conv.instructorId || conv.user || {};
                const instructorIdValue = getIdValue(instructor) || getIdValue(conv.instructorId) || getIdValue(conv.user);
                return { ...conv, instructorId: instructor, instructorIdValue };
            }));
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const data = await messageService.getConversation(userId, 100);
            setMessages(Array.isArray(data) ? data : data?.messages || []);
            await messageService.markConversationAsRead(userId);
            fetchConversations();
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selected) return;
        try {
            setSending(true);
            await messageService.sendMessage({ receiverId: selected.instructorIdValue, content: newMessage });
            setNewMessage('');
            await fetchMessages(selected.instructorIdValue);
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

    const filtered = conversations.filter(conv => {
        const instructor = conv.instructorId || {};
        const name = `${instructor.firstName || ''} ${instructor.lastName || ''}`.toLowerCase();
        const last = conv.lastMessage?.content?.toLowerCase() || '';
        return name.includes(searchQuery.toLowerCase()) || last.includes(searchQuery.toLowerCase());
    });

    const selectedInstructor = selected?.instructorId || {};
    const selectedName = `${selectedInstructor.firstName || ''} ${selectedInstructor.lastName || ''}`.trim() || 'Instructor';

    return (
        <div className="h-[calc(100vh-4rem)] bg-gray-50 flex">
            <Card className="flex flex-1 overflow-hidden rounded-none border-0 shadow-none">
                {/* ── Sidebar ── */}
                <div className={`w-full sm:w-80 lg:w-80 flex-shrink-0 border-r bg-white flex flex-col ${mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-4 border-b">
                        <h1 className="text-lg font-bold text-gray-900 mb-3">Messages</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-sm"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <ScrollArea className="flex-1">
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
                                <p className="text-sm text-gray-500">No conversations yet</p>
                            </div>
                        ) : (
                            filtered.map(conv => (
                                <ConversationItem
                                    key={conv.instructorIdValue}
                                    conv={conv}
                                    isActive={selected?.instructorIdValue === conv.instructorIdValue}
                                    onClick={() => handleSelectConv(conv)}
                                />
                            ))
                        )}
                    </ScrollArea>
                </div>

                {/* ── Chat Area ── */}
                <div className={`flex-1 flex flex-col bg-white min-w-0 ${!mobileShowChat ? 'hidden sm:flex' : 'flex'}`}>
                    {selected ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="sm:hidden"
                                    onClick={() => setMobileShowChat(false)}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                                <Avatar className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600">
                                    <AvatarFallback className="text-white text-sm font-semibold bg-gradient-to-br from-blue-500 to-indigo-600">
                                        {initials(selectedInstructor.firstName, selectedInstructor.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{selectedName}</p>
                                    <p className="text-xs text-gray-500 capitalize">Instructor</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 px-4 py-4 bg-gray-50">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                                        <MessageCircle className="w-8 h-8 text-gray-300" />
                                        <p className="text-sm text-gray-400">No messages yet. Say hi!</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <MessageBubble key={msg._id} message={msg} currentUserId={currentUserId} />
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </ScrollArea>

                            {/* Input */}
                            <div className="border-t bg-white p-3">
                                <form onSubmit={handleSend} className="flex items-center gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        disabled={sending}
                                        className="flex-1 h-10"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 h-10 px-4 gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        <span className="hidden sm:inline">Send</span>
                                    </Button>
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
                                <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
