'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import ProtectedInstructorRoute from '@/components/ProtectedInstructorRoute';

function InstructorMessagesContent() {
    const router = useRouter();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toast, setToast] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.user._id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);
        fetchUnreadCount();
        return () => clearInterval(interval);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('https://api.elearning.arin-africa.orgmessages/conversations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error('Failed to fetch conversations');
            }

            const result = await response.json();
            console.log('Conversations response:', result);

            const conversationsData = result.data || result.conversations || [];
            console.log('Parsed conversations:', conversationsData);

            setConversations(conversationsData);
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        if (!userId) {
            console.error('No userId provided to fetchMessages');
            return;
        }

        try {
            console.log('Fetching messages for user:', userId);
            const token = localStorage.getItem('token');
            const response = await fetch(`https://api.elearning.arin-africa.orgmessages/conversation/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error fetching messages:', response.status, errorText);
                throw new Error('Failed to fetch messages');
            }

            const result = await response.json();
            console.log('Messages response:', result);

            const messagesData = result.data || result.messages || [];
            console.log('Parsed messages:', messagesData);
            setMessages(messagesData);

            // Mark conversation as read
            await fetch(`https://api.elearning.arin-africa.orgmessages/conversation/${userId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchConversations();
        } catch (err) {
            console.error('Error fetching messages:', err);
            setMessages([]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            setSending(true);
            const token = localStorage.getItem('token');
            const response = await fetch('https://api.elearning.arin-africa.orgmessages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiverId: selectedConversation.user._id,
                    content: newMessage,
                    attachments: attachments.length > 0 ? attachments : undefined
                })
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            setMessages([...messages, data.data]);
            setNewMessage('');
            setAttachments([]);
            fetchConversations();
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const uploadedUrls = [];

            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('https://api.elearning.arin-africa.orgupload/document', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    uploadedUrls.push(data.url);
                }
            }

            setAttachments([...attachments, ...uploadedUrls]);
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://api.elearning.arin-africa.orgmessages/unread-count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) return;
            const data = await response.json();
            const count = data?.data?.count ?? data?.count ?? 0;
            if (count > unreadCount) {
                setToast({
                    title: 'New message',
                    body: `You have ${count} unread message${count === 1 ? '' : 's'}.`,
                });
                setTimeout(() => setToast(null), 4500);
            }
            setUnreadCount(count);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        `${conv.user?.firstName} ${conv.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            {toast && (
                <div className="fixed top-4 right-4 bg-white border border-green-200 shadow-lg rounded-lg px-4 py-3 z-50 max-w-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                            <Icons.Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{toast.body}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
                            <Icons.X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            <div className="flex-1 flex overflow-hidden">
                {/* Conversations Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-900 mb-3">Student Messages</h1>
                        <div className="relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
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
                            <div className="p-4 text-center text-gray-500">
                                <Icons.MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No messages yet</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const user = conv.user || {};
                                const userId = user._id || user.id || '';
                                const firstName = user.firstName || 'Unknown';
                                const lastName = user.lastName || 'User';

                                return (
                                    <div
                                        key={userId || Math.random()}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.user?._id === userId ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {firstName[0]}{lastName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {firstName} {lastName}
                                                    </h3>
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(conv.lastMessage?.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-gray-600 truncate flex-1">
                                                        {conv.lastMessage?.content || 'No messages yet'}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                        {selectedConversation.user?.firstName?.[0]}{selectedConversation.user?.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900">
                                            {selectedConversation.user?.firstName} {selectedConversation.user?.lastName}
                                        </h2>
                                        <p className="text-sm text-gray-600">Student</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-8">
                                        <Icons.MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No messages in this conversation yet</p>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
                                        const currentUserId = localStorage.getItem('userId');
                                        const isOwn = senderId === currentUserId;

                                        return (
                                            <div key={message._id || Math.random()} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-md ${isOwn ? 'bg-green-600 text-white' : 'bg-white text-gray-900'} rounded-lg px-4 py-2 shadow-sm`}>
                                                    <p className="text-sm">{message.content}</p>
                                                    {message.attachments && message.attachments.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {message.attachments.map((url, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-2 text-xs ${isOwn ? 'text-green-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'} underline`}
                                                                >
                                                                    <Icons.Paperclip className="w-3 h-3" />
                                                                    {url.split('/').pop()}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
                                                        {formatTime(message.createdAt)}
                                                        {message.isRead && isOwn && ' • Read'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                                {attachments.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {attachments.map((url, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg text-sm">
                                                <Icons.Paperclip className="w-4 h-4 text-green-600" />
                                                <span className="text-green-700">{url.split('/').pop()}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(idx)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Icons.X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        multiple
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                        title="Attach file"
                                    >
                                        <Icons.Paperclip className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message to your student..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
                                <p className="text-lg font-medium">Select a student to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InstructorMessagesPage() {
    return (
        <ProtectedInstructorRoute>
            <InstructorMessagesContent />
        </ProtectedInstructorRoute>
    );
}
