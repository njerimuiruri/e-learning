'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAllConversations();
    }, []);

    const fetchAllConversations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/messages/admin/all-conversations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch conversations');

            const data = await response.json();
            console.log('Admin conversations:', data);
            setConversations(data.data || []);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const searchLower = searchQuery.toLowerCase();
        return conv.users.some(user => 
            user?.firstName?.toLowerCase().includes(searchLower) ||
            user?.lastName?.toLowerCase().includes(searchLower) ||
            user?.email?.toLowerCase().includes(searchLower)
        );
    });

    const formatTime = (date) => {
        if (!date) return '';
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">All Messages</h1>
                    <p className="text-gray-600">Monitor all conversations between students and instructors</p>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading conversations...</div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Icons.MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>No conversations found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredConversations.map((conv, idx) => {
                                const [user1, user2] = conv.users || [];
                                return (
                                    <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-2">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-white">
                                                        {user1?.firstName?.[0]}{user1?.lastName?.[0]}
                                                    </div>
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold border-2 border-white">
                                                        {user2?.firstName?.[0]}{user2?.lastName?.[0]}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {user1?.firstName} {user1?.lastName}
                                                        </h3>
                                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">
                                                            {user1?.role}
                                                        </span>
                                                        <Icons.ArrowRight className="w-4 h-4 text-gray-400" />
                                                        <h3 className="font-semibold text-gray-900">
                                                            {user2?.firstName} {user2?.lastName}
                                                        </h3>
                                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full capitalize">
                                                            {user2?.role}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <span>{user1?.email}</span>
                                                        <span>•</span>
                                                        <span>{user2?.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-500 block mb-2">
                                                    {formatTime(conv.lastMessage?.createdAt)}
                                                </span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                        {conv.unreadCount} unread
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-20">
                                            <p className="text-sm text-gray-600 mb-2">
                                                <strong>Last message:</strong> {conv.lastMessage?.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Icons.MessageSquare className="w-3 h-3" />
                                                    {conv.totalMessages} messages
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Icons.Clock className="w-3 h-3" />
                                                    {formatTime(conv.lastMessage?.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
