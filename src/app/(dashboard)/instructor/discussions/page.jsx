'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export default function DiscussionsPage() {
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [replyText, setReplyText] = useState('');

    const discussions = [
        {
            id: 1,
            student: 'Alice Johnson',
            course: 'Master Digital Marketing',
            title: 'Question about SEO strategies',
            message: 'I\'m having trouble understanding the difference between on-page and off-page SEO. Could you explain this in more detail?',
            timestamp: '2 hours ago',
            replies: 3,
            status: 'answered'
        },
        {
            id: 2,
            student: 'Bob Smith',
            course: 'Master Digital Marketing',
            title: 'Clarification needed on Module 2',
            message: 'The video on social media marketing mentions several tools, but I couldn\'t find the resources list. Where can I access it?',
            timestamp: '5 hours ago',
            replies: 1,
            status: 'unanswered'
        },
        {
            id: 3,
            student: 'Carol Davis',
            course: 'Master Digital Marketing',
            title: 'Email marketing best practices',
            message: 'What are the current best practices for email marketing in 2025? Are there any specific metrics I should focus on?',
            timestamp: '1 day ago',
            replies: 5,
            status: 'answered'
        },
        {
            id: 4,
            student: 'David Wilson',
            course: 'Master Digital Marketing',
            title: 'Technical issue with assignment submission',
            message: 'I\'m unable to submit my Module 3 assignment. The submit button doesn\'t seem to work. Can you help?',
            timestamp: '2 days ago',
            replies: 2,
            status: 'answered'
        },
    ];

    const discussionReplies = {
        1: [
            { id: 1, author: 'You', message: 'Great question! On-page SEO refers to optimizations you make directly on your website...', timestamp: '1 hour ago' },
            { id: 2, author: 'Alice Johnson', message: 'Thank you! That makes it much clearer now.', timestamp: '30 mins ago' },
            { id: 3, author: 'You', message: 'You\'re welcome! Feel free to ask if you have more questions.', timestamp: '25 mins ago' },
        ],
        2: [
            { id: 1, author: 'You', message: 'The resources list is available in the course materials section...', timestamp: '4 hours ago' },
        ],
    };

    const handleReply = () => {
        if (replyText.trim()) {
            alert('Reply posted successfully!');
            setReplyText('');
        }
    };

    const getStatusColor = (status) => {
        return status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                        Discussions & Q&A
                    </h1>
                    <p className="text-gray-600">Engage with students and answer their questions</p>
                </div>

                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Icons.MessageSquare className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{discussions.length}</p>
                                <p className="text-sm text-gray-600">Total Discussions</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <Icons.AlertCircle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {discussions.filter(d => d.status === 'unanswered').length}
                                </p>
                                <p className="text-sm text-gray-600">Needs Response</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <Icons.CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {discussions.filter(d => d.status === 'answered').length}
                                </p>
                                <p className="text-sm text-gray-600">Answered</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Discussions List */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Icons.List className="w-5 h-5 text-emerald-600" />
                                All Discussions
                            </h2>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                            {discussions.map((discussion) => (
                                <div
                                    key={discussion.id}
                                    onClick={() => setSelectedDiscussion(discussion)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-emerald-50 transition-colors ${selectedDiscussion?.id === discussion.id ? 'bg-emerald-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{discussion.title}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(discussion.status)}`}>
                                            {discussion.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{discussion.message}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Icons.User className="w-3 h-3" />
                                            {discussion.student}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.MessageCircle className="w-3 h-3" />
                                            {discussion.replies}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Discussion Detail */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {selectedDiscussion ? (
                            <>
                                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <h2 className="text-xl font-bold text-gray-900">{selectedDiscussion.title}</h2>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDiscussion.status)}`}>
                                            {selectedDiscussion.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Icons.User className="w-4 h-4" />
                                            {selectedDiscussion.student}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.BookOpen className="w-4 h-4" />
                                            {selectedDiscussion.course}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icons.Clock className="w-4 h-4" />
                                            {selectedDiscussion.timestamp}
                                        </span>
                                    </div>
                                </div>

                                {/* Original Message */}
                                <div className="p-6 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {selectedDiscussion.student.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-700">{selectedDiscussion.message}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Replies */}
                                <div className="p-6 overflow-y-auto max-h-[400px]">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Icons.MessageSquare className="w-4 h-4 text-emerald-600" />
                                        Responses ({discussionReplies[selectedDiscussion.id]?.length || 0})
                                    </h3>
                                    <div className="space-y-4">
                                        {discussionReplies[selectedDiscussion.id]?.map((reply) => (
                                            <div key={reply.id} className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${reply.author === 'You'
                                                        ? 'bg-gradient-to-br from-[#16a34a] to-emerald-700'
                                                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                    }`}>
                                                    {reply.author.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-semibold text-sm text-gray-900">{reply.author}</span>
                                                            <span className="text-xs text-gray-500">{reply.timestamp}</span>
                                                        </div>
                                                        <p className="text-gray-700 text-sm">{reply.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Reply Form */}
                                <div className="p-6 border-t border-gray-200 bg-gray-50">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16a34a] to-emerald-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            IN
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type your response..."
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => setReplyText('')}
                                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleReply}
                                                    disabled={!replyText.trim()}
                                                    className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                                                >
                                                    <Icons.Send className="w-4 h-4" />
                                                    Post Reply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                                <Icons.MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Discussion Selected</h3>
                                <p className="text-gray-600">Select a discussion from the list to view and respond</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
