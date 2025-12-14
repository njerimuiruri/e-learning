'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import messageService from '@/lib/api/messageService';

export default function StudentMessagesPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation?.instructorIdValue) {
            fetchMessages(selectedConversation.instructorIdValue);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const getIdValue = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            if (val._id) return val._id.toString();
            if (val.id) return val.id.toString();
            if (val.toString) return val.toString();
        }
        return '';
    };

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const data = await messageService.getConversations();
            const raw = Array.isArray(data) ? data : data?.conversations || [];
            const normalized = raw.map((conv) => {
                const instructor = conv.instructorId || conv.user || {};
                const instructorIdValue = getIdValue(instructor) || getIdValue(conv.instructorId) || getIdValue(conv.user);
                return {
                    ...conv,
                    instructorId: instructor,
                    instructorIdValue,
                };
            });
            setConversations(normalized);
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

            // Mark conversation as read
            await messageService.markConversationAsRead(userId);

            // Update conversation list
            fetchConversations();
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            setSending(true);
            const instructorId = selectedConversation.instructorIdValue;
            await messageService.sendMessage({
                receiverId: instructorId,
                content: newMessage
            });
            setNewMessage('');
            await fetchMessages(instructorId);
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const instructor = conv.instructorId || {};
        const instructorName = `${instructor.firstName || ''} ${instructor.lastName || ''}`.toLowerCase();
        const lastContent = conv.lastMessage?.content?.toLowerCase() || '';
        return instructorName.includes(searchQuery.toLowerCase()) || lastContent.includes(searchQuery.toLowerCase());
    });

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes < 1 ? 'Just now' : `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            <div className="flex-1 flex overflow-hidden">
                {/* Conversations Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>
                        <div className="relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No conversations yet</div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const instructorId = conv.instructorIdValue;
                                return (
                                    <div
                                        key={instructorId}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            selectedConversation?.instructorIdValue === instructorId ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {conv.instructorId?.firstName?.[0]}{conv.instructorId?.lastName?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {conv.instructorId?.firstName} {conv.instructorId?.lastName}
                                                    </h3>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(conv.lastMessage?.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-gray-600 truncate flex-1">
                                                        {conv.lastMessage?.content}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        {selectedConversation.instructorId?.firstName?.[0]}{selectedConversation.instructorId?.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            {selectedConversation.instructorId?.firstName} {selectedConversation.instructorId?.lastName}
                                        </h2>
                                        <p className="text-sm text-gray-600 capitalize">Instructor</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((message) => {
                                    const currentUserId = localStorage.getItem('userId');
                                    const senderIdValue = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
                                    const isOwn = senderIdValue === currentUserId;
                                    return (
                                        <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-md ${isOwn ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'} rounded-lg px-4 py-2 shadow-sm`}>
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                                    {formatTime(message.createdAt)}
                                                    {message.isRead && isOwn && ' • Read'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Icons.Send className="w-4 h-4" />
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Icons.MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
