'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, MessageCircle, X, CheckCheck, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import notificationService from '@/lib/api/notificationService';

const TYPE_STYLES = {
    new_message:         { bg: 'bg-blue-100',   icon: '💬', text: 'text-blue-600' },
    discussion_post:     { bg: 'bg-purple-100',  icon: '💬', text: 'text-purple-600' },
    discussion_reply:    { bg: 'bg-purple-100',  icon: '↩️', text: 'text-purple-600' },
    essay_graded:        { bg: 'bg-green-100',   icon: '✅', text: 'text-green-600' },
    certificate_earned:  { bg: 'bg-yellow-100',  icon: '🏆', text: 'text-yellow-600' },
    level_unlocked:      { bg: 'bg-indigo-100',  icon: '🔓', text: 'text-indigo-600' },
    instructor_reminder: { bg: 'bg-orange-100',  icon: '🔔', text: 'text-orange-600' },
    admin_reminder:      { bg: 'bg-red-100',     icon: '📢', text: 'text-red-600' },
};

function timeAgo(date) {
    const d    = new Date(date);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ color = 'gray' }) {
    const router = useRouter();
    const [open, setOpen]               = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading]         = useState(false);
    const ref                           = useRef(null);
    const pollRef                       = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchCount = useCallback(async () => {
        try {
            const res = await notificationService.getUnreadCount();
            setUnreadCount(res?.count ?? res?.data?.count ?? 0);
        } catch {}
    }, []);

    // Poll unread count every 30s
    useEffect(() => {
        fetchCount();
        pollRef.current = setInterval(fetchCount, 30000);
        return () => clearInterval(pollRef.current);
    }, [fetchCount]);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await notificationService.getMyNotifications(20);
            setNotifications(res?.data ?? res ?? []);
            // Refresh count after loading
            fetchCount();
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [fetchCount]);

    const handleOpen = () => {
        setOpen(v => {
            if (!v) fetchNotifications();
            return !v;
        });
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {}
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await notificationService.markAsRead(notif._id);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch {}
        }
        if (notif.link) {
            setOpen(false);
            router.push(notif.link);
        }
    };

    const iconColor = color === 'white' ? 'text-white' : 'text-gray-600';
    const btnHover  = color === 'white' ? 'hover:bg-white/10' : 'hover:bg-gray-100';

    return (
        <div className="relative" ref={ref}>
            {/* Bell button */}
            <button
                onClick={handleOpen}
                className={`relative p-2 ${btnHover} rounded-lg transition-colors`}
                aria-label="Notifications"
            >
                <Bell className={`w-5 h-5 ${iconColor}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[200] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gray-600" />
                            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{unreadCount} new</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const style = TYPE_STYLES[notif.type] || TYPE_STYLES.admin_reminder;
                                return (
                                    <button
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                                    >
                                        <div className={`w-9 h-9 ${style.bg} rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5`}>
                                            {style.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium text-gray-900 leading-snug ${!notif.isRead ? 'font-semibold' : ''}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                                                {notif.link && <ExternalLink className="w-3 h-3 text-gray-400" />}
                                                {!notif.isRead && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                            <p className="text-xs text-gray-400 text-center">Showing last 20 notifications</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
