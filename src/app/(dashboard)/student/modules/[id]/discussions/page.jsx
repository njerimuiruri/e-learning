'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import discussionService from '@/lib/api/discussionService';
import moduleService from '@/lib/api/moduleService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString();
}

function RoleBadge({ role }) {
    if (role === 'instructor') {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                <Icons.GraduationCap className="w-3 h-3" />
                Instructor
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            <Icons.User className="w-3 h-3" />
            Student
        </span>
    );
}

// ─── New Discussion Modal ────────────────────────────────────────────────────

function NewDiscussionModal({ moduleId, onClose, onCreated }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        try {
            setSubmitting(true);
            setError('');
            const result = await discussionService.createDiscussion({ moduleId, title: title.trim(), content: content.trim() });
            onCreated(result.data);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to create discussion');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">New Discussion</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's your question or topic?"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                            maxLength={150}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Describe your question or topic in detail..."
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !title.trim() || !content.trim()}
                            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                                <Icons.Send className="w-4 h-4" />
                            )}
                            Post Discussion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Reply Form ──────────────────────────────────────────────────────────────

function ReplyForm({ discussionId, onReplied }) {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        try {
            setSubmitting(true);
            setError('');
            const result = await discussionService.addReply(discussionId, content.trim());
            onReplied(result.data);
            setContent('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
            {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                    {error}
                </div>
            )}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm resize-none"
            />
            <div className="flex justify-end mt-2">
                <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                    {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                        <Icons.CornerDownRight className="w-4 h-4" />
                    )}
                    Reply
                </button>
            </div>
        </form>
    );
}

// ─── Discussion Card ─────────────────────────────────────────────────────────

function DiscussionCard({ discussion, currentUser, onUpdated }) {
    const [expanded, setExpanded] = useState(false);

    const handleReplied = (updatedDiscussion) => {
        onUpdated(updatedDiscussion);
        setExpanded(true);
    };

    const replyCount = discussion.replies?.length ?? 0;
    const isInstructor = currentUser?.role === 'instructor';
    const isCreator = currentUser?.id === discussion.createdById || currentUser?._id === discussion.createdById;

    return (
        <div className={`bg-white rounded-2xl border-2 transition-all ${discussion.isPinned ? 'border-indigo-300 shadow-indigo-50 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
            {/* Pin banner */}
            {discussion.isPinned && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-t-2xl border-b border-indigo-200">
                    <Icons.Pin className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-600">Pinned by instructor</span>
                </div>
            )}

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 break-words">
                            {discussion.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <RoleBadge role={discussion.createdByRole} />
                            <span>•</span>
                            <span>{timeAgo(discussion.createdAt)}</span>
                            {discussion.views > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Icons.Eye className="w-3 h-3" />
                                        {discussion.views}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors"
                    >
                        <Icons.MessageSquare className="w-4 h-4" />
                        <span>{replyCount}</span>
                        {expanded
                            ? <Icons.ChevronUp className="w-4 h-4" />
                            : <Icons.ChevronDown className="w-4 h-4" />
                        }
                    </button>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                    {discussion.content}
                </p>

                {/* Status badge */}
                {discussion.status !== 'open' && (
                    <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${discussion.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {discussion.status}
                    </span>
                )}
            </div>

            {/* Replies panel */}
            {expanded && (
                <div className="px-5 pb-5 border-t">
                    {replyCount === 0 ? (
                        <p className="text-sm text-gray-400 italic pt-4">No replies yet. Be the first to reply!</p>
                    ) : (
                        <div className="space-y-4 pt-4">
                            {discussion.replies.map((reply, idx) => (
                                <div key={idx} className={`flex gap-3 p-4 rounded-xl ${reply.authorRole === 'instructor' ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${reply.authorRole === 'instructor' ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                                        {(reply.authorName || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-gray-900">{reply.authorName}</span>
                                            <RoleBadge role={reply.authorRole} />
                                            <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                            {reply.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <ReplyForm discussionId={discussion._id} onReplied={handleReplied} />
                </div>
            )}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ModuleDiscussionsPage() {
    const { id: moduleId } = useParams();
    const router = useRouter();

    const [moduleData, setModuleData] = useState(null);
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sort, setSort] = useState('recent');
    const [showNewModal, setShowNewModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        setCurrentUser(authService.getCurrentUser());
    }, []);

    const fetchData = useCallback(async () => {
        if (!moduleId) return;
        try {
            setLoading(true);
            setError('');

            const [mod, disc] = await Promise.allSettled([
                moduleService.getModuleById(moduleId),
                discussionService.getModuleDiscussions(moduleId, sort),
            ]);

            if (mod.status === 'fulfilled') setModuleData(mod.value);
            if (disc.status === 'fulfilled') {
                setDiscussions(disc.value?.data || []);
            } else {
                const status = disc.reason?.response?.status;
                if (status === 403) {
                    setError('You must be enrolled in this module to access the discussion forum.');
                } else {
                    setError('Failed to load discussions.');
                }
            }
        } catch (err) {
            setError('Failed to load module data.');
        } finally {
            setLoading(false);
        }
    }, [moduleId, sort]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDiscussionCreated = (newDiscussion) => {
        setDiscussions((prev) => [newDiscussion, ...prev]);
    };

    const handleDiscussionUpdated = (updatedDiscussion) => {
        setDiscussions((prev) =>
            prev.map((d) => (d._id === updatedDiscussion._id ? updatedDiscussion : d))
        );
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                {/* Header */}
                <div className="bg-white border-b sticky top-0 z-30">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
                        <button
                            onClick={() => router.push(`/student/modules/${moduleId}`)}
                            className="text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <Icons.ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-bold text-gray-900 text-lg truncate">
                                {moduleData?.title || 'Module'} — Discussions
                            </h1>
                            <p className="text-xs text-gray-500">{discussions.length} thread{discussions.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                        >
                            <Icons.Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Discussion</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-t-4 border-indigo-600" />
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-2xl border-2 border-orange-200 p-8 text-center">
                            <Icons.Lock className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <button
                                onClick={() => router.push(`/student/modules/${moduleId}`)}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
                            >
                                Go to Module
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Sort controls */}
                            <div className="flex items-center justify-between mb-5">
                                <p className="text-sm text-gray-500 font-medium">
                                    {discussions.length === 0 ? 'No discussions yet.' : `Showing ${discussions.length} thread${discussions.length !== 1 ? 's' : ''}`}
                                </p>
                                <div className="flex items-center gap-1 bg-white border-2 border-gray-100 rounded-xl p-1">
                                    {[
                                        { key: 'recent', label: 'Recent', icon: Icons.Clock },
                                        { key: 'active', label: 'Most Active', icon: Icons.TrendingUp },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setSort(key)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${sort === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {discussions.length === 0 ? (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                    <Icons.MessageCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-700 mb-2">No discussions yet</h3>
                                    <p className="text-gray-500 mb-6 text-sm">
                                        Be the first to start a discussion in this module.
                                    </p>
                                    <button
                                        onClick={() => setShowNewModal(true)}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
                                    >
                                        <Icons.Plus className="w-4 h-4" />
                                        Start a Discussion
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {discussions.map((discussion) => (
                                        <DiscussionCard
                                            key={discussion._id}
                                            discussion={discussion}
                                            currentUser={currentUser}
                                            onUpdated={handleDiscussionUpdated}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* New Discussion Modal */}
            {showNewModal && (
                <NewDiscussionModal
                    moduleId={moduleId}
                    onClose={() => setShowNewModal(false)}
                    onCreated={handleDiscussionCreated}
                />
            )}
        </>
    );
}
