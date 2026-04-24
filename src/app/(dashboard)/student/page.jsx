'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Trophy, Award, CheckCircle, XCircle, FileText, MessageCircle,
    Unlock, Bell, AlertCircle, Clock, Play, ChevronRight, ChevronLeft,
    Star, Target, Flame, Zap, TrendingUp, BarChart2, Calendar, RefreshCw,
    Lock, ArrowRight, Filter, Search, X, Check, Info, Loader2,
    GraduationCap, LayoutDashboard, Settings, LogOut, User, Home,
    BookMarked, ListChecks, Activity, Eye, EyeOff, MoreVertical,
    PlusCircle, Download, Share2, Edit, Trash2, Send, Inbox,
    WifiOff, Users, Plus, Megaphone, CreditCard, Compass,
    ListOrdered, Grid2X2 as Grid, MessageSquare, FolderOpen,
} from 'lucide-react';
// Keep a small alias so existing `Icons.Xxx` references still work
const Icons = {
    BookOpen, Trophy, Award, CheckCircle, XCircle, FileText, MessageCircle,
    Unlock, Bell, AlertCircle, Clock, Play, ChevronRight, ChevronLeft,
    Star, Target, Flame, Zap, TrendingUp, BarChart2, Calendar, RefreshCw,
    Lock, ArrowRight, Filter, Search, X, Check, Info, Loader2,
    GraduationCap, LayoutDashboard, Settings, LogOut, User, Home,
    BookMarked, ListChecks, Activity, Eye, EyeOff, MoreVertical,
    PlusCircle, Download, Share2, Edit, Trash2, Send, Inbox,
    WifiOff, Users, Plus, Megaphone, CreditCard, Compass,
    ListOrdered, Grid, MessageSquare, FolderOpen,
};
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import progressionService from '@/lib/api/progressionService';
import moduleService from '@/lib/api/moduleService';
import authService from '@/lib/api/authService';
import notificationService from '@/lib/api/notificationService';
import { normalizeEnrollment, summarizeEnrollments } from '@/lib/utils/enrollmentProgress';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const levelConfig = {
    beginner: { badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', bar: 'bg-blue-500' },
    intermediate: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' },
    advanced: { badge: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', bar: 'bg-rose-500' },
};
const getLvl = (level) => levelConfig[level] || levelConfig.beginner;

/** Clamp a progress value between 0 and 100 */
const clamp = (v) => Math.min(100, Math.max(0, Math.round(v || 0)));

/** Strip HTML tags and decode common HTML entities */
const stripHtml = (html) => {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

const timeAgo = (date) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const getAssessmentStatus = (enrollment) => {
    const hasSubmitted = (enrollment.finalAssessmentAttempts || 0) > 0;
    const hasPending = (enrollment.pendingManualGradingCount || 0) > 0;
    if (hasPending) return 'pending_review';
    if (enrollment.requiresModuleRepeat) return 'repeat_required';
    if (!hasSubmitted) return 'ready';
    if (hasSubmitted && !enrollment.finalAssessmentPassed && enrollment.finalAssessmentAttempts < 3) return 'retry';
    if (enrollment.finalAssessmentAttempts >= 3 && !enrollment.finalAssessmentPassed) return 'failed';
    return 'ready';
};

const notificationIconMap = {
    LESSON_COMPLETED: { icon: 'CheckCircle', color: 'text-blue-500', bg: 'bg-blue-50' },
    ASSESSMENT_PASSED: { icon: 'Trophy', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    ASSESSMENT_FAILED: { icon: 'XCircle', color: 'text-red-500', bg: 'bg-red-50' },
    CERTIFICATE_EARNED: { icon: 'Award', color: 'text-violet-500', bg: 'bg-violet-50' },
    MODULE_ENROLLED: { icon: 'BookOpen', color: 'text-blue-500', bg: 'bg-blue-50' },
    ESSAY_GRADED: { icon: 'FileText', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    DISCUSSION_REPLY: { icon: 'MessageCircle', color: 'text-teal-500', bg: 'bg-teal-50' },
    LEVEL_UNLOCKED: { icon: 'Unlock', color: 'text-purple-500', bg: 'bg-purple-50' },
    INSTRUCTOR_REMINDER: { icon: 'Bell', color: 'text-amber-500', bg: 'bg-amber-50' },
    ADMIN_REMINDER: { icon: 'Megaphone', color: 'text-blue-500', bg: 'bg-blue-50' },
    DEFAULT: { icon: 'Bell', color: 'text-gray-500', bg: 'bg-gray-50' },
};
const getNotifStyle = (type) => notificationIconMap[type] || notificationIconMap.DEFAULT;

/* ══════════════════════════════════════════
   SMALL COMPONENTS
══════════════════════════════════════════ */

/* Stat card in the hero banner */
function HeroStat({ label, value, icon }) {
    const Ic = Icons[icon];
    return (
        <div className="flex flex-col items-center justify-center bg-white/10 rounded-xl px-4 py-3 min-w-[90px] backdrop-blur-sm">
            {Ic && <Ic className="w-4 h-4 text-white/70 mb-1" />}
            <span className="text-xl font-bold text-white leading-none">{value}</span>
            <span className="text-[10px] text-white/60 mt-0.5 text-center">{label}</span>
        </div>
    );
}

/* Quick link card */
function QuickLink({ icon, label, sub, color, bgColor, onClick }) {
    const Ic = Icons[icon];
    return (
        <button
            onClick={onClick}
            className={`group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${bgColor} border-transparent`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-white/70 group-hover:scale-110 transition-transform`}>
                {Ic && <Ic className="w-5 h-5" />}
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{label}</p>
                {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </button>
    );
}

/* Continue learning row card */
function ContinueLearningCard({ enrollment, onClick }) {
    const mod = enrollment.moduleId || {};
    const lvl = getLvl(mod.level);
    const progress = clamp(enrollment.progress);
    return (
        <Card
            className="group cursor-pointer border-gray-100 hover:border-[#021d49]/30 hover:shadow-md transition-all duration-200"
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-[#021d49]/8 flex items-center justify-center flex-shrink-0 group-hover:bg-[#021d49]/15 transition-colors">
                        <Icons.BookOpen className="w-5 h-5 text-[#021d49]" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                                <p className="text-xs text-gray-400 truncate">{mod.categoryId?.name || 'Module'}</p>
                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-[#021d49] transition-colors">
                                    {mod.title}
                                </h3>
                            </div>
                            <Badge variant="outline" className={`text-[10px] shrink-0 font-semibold capitalize border ${lvl.badge}`}>
                                {mod.level}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Progress value={progress} className="flex-1 h-1.5" />
                            <span className="text-xs font-bold text-[#021d49] shrink-0">{progress}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">
                                {enrollment.completedLessons || 0}/{enrollment.totalLessons || 0} lessons
                            </span>
                            <span className="text-[10px] font-semibold text-[#021d49] flex items-center gap-0.5 group-hover:gap-1 transition-all">
                                Continue <Icons.ArrowRight className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* Assessment alert row */
function AssessmentAlertCard({ enrollment, onClick }) {
    const mod = enrollment.moduleId || {};
    const status = getAssessmentStatus(enrollment);
    const configs = {
        ready: { label: 'Take Assessment', color: 'border-l-blue-500 bg-blue-50/50', btn: 'bg-blue-700 hover:bg-blue-800', icon: 'Play' },
        retry: { label: 'Retry Assessment', color: 'border-l-orange-500 bg-orange-50/50', btn: 'bg-orange-500 hover:bg-orange-600', icon: 'RefreshCw' },
        pending_review: { label: 'Under Review', color: 'border-l-amber-500 bg-amber-50/50', btn: 'bg-amber-400 cursor-not-allowed', icon: 'Clock' },
        repeat_required: { label: 'Repeat Module', color: 'border-l-rose-500 bg-rose-50/50', btn: 'bg-rose-500 hover:bg-rose-600', icon: 'RotateCcw' },
        failed: { label: 'Max Attempts', color: 'border-l-red-400 bg-red-50/50', btn: 'bg-gray-400 cursor-not-allowed', icon: 'XCircle' },
    };
    const cfg = configs[status] || configs.ready;
    const Ic = Icons[cfg.icon];
    return (
        <div className={`border-l-4 rounded-r-xl p-3 flex items-center justify-between gap-3 ${cfg.color}`}>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 line-clamp-1">{mod.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{mod.categoryId?.name} · {mod.level}</p>
            </div>
            <button
                onClick={onClick}
                disabled={status === 'pending_review' || status === 'failed'}
                className={`shrink-0 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${cfg.btn}`}
            >
                {Ic && <Ic className="w-3 h-3" />}
                {cfg.label}
            </button>
        </div>
    );
}

/* Available module card (grid) */
function AvailableModuleCard({ mod, onDetails, onEnroll }) {
    const lvl = getLvl(mod.level);
    const clean = stripHtml(mod.description);
    return (
        <Card className="group border-gray-100 hover:border-[#021d49]/20 hover:shadow-md transition-all duration-200 flex flex-col h-full">
            <CardContent className="p-4 flex flex-col flex-1">
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className={`text-[10px] font-semibold capitalize border ${lvl.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${lvl.dot}`} />
                        {mod.level}
                    </Badge>
                    {mod.price > 0
                        ? <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0 font-semibold">Paid</Badge>
                        : <Badge className="text-[10px] bg-blue-100 text-blue-700 border-0 font-semibold">Free</Badge>
                    }
                </div>
                {/* Category and Module Label */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    {mod.categoryId?.name && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{mod.categoryId.name}</p>
                    )}
                    {mod.order && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#021d49]/10 text-[#021d49]">
                            Module {mod.order}
                        </span>
                    )}
                </div>
                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#021d49] transition-colors mb-1.5 break-words">
                    {mod.title}
                </h3>
                {/* Clean description — no HTML */}
                {clean && (
                    <p className="text-xs text-gray-500 line-clamp-3 mb-3 leading-relaxed flex-1 break-words overflow-hidden">{clean}</p>
                )}
                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                        <Icons.Users className="w-3 h-3" />
                        {mod.enrollmentCount || 0} students
                    </span>
                    {(mod.totalLessons || 0) > 0 && (
                        <span className="flex items-center gap-1">
                            <Icons.BookOpen className="w-3 h-3" />
                            {mod.totalLessons} lessons
                        </span>
                    )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2.5 border-t border-gray-100 mt-auto">
                    <Button size="sm" variant="outline"
                        className="flex-1 h-7 text-[10px] border-gray-200 text-gray-600 hover:text-[#021d49] hover:border-[#021d49]"
                        onClick={() => onDetails(mod)}>
                        <Icons.Info className="w-3 h-3 mr-1" /> Details
                    </Button>
                    <Button size="sm"
                        className="flex-1 h-7 text-[10px] bg-[#021d49] hover:bg-[#032a66] text-white"
                        onClick={() => onEnroll(mod._id)}>
                        <Icons.Plus className="w-3 h-3 mr-1" /> Enroll
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/* Notification / Activity feed item */
function ActivityItem({ notification, onRead }) {
    const style = getNotifStyle(notification.type);
    const Ic = Icons[style.icon];
    return (
        <div
            className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/40' : ''}`}
            onClick={() => !notification.isRead && onRead(notification._id)}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                {Ic && <Ic className={`w-4 h-4 ${style.color}`} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 line-clamp-2">{notification.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(notification.createdAt)}</p>
            </div>
            {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
            )}
        </div>
    );
}

/* Reminder card */
function ReminderCard({ reminder }) {
    const isAdmin = reminder.type === 'ADMIN_REMINDER';
    return (
        <div className={`rounded-xl p-3 border-l-4 ${isAdmin ? 'border-l-blue-500 bg-blue-50/50' : 'border-l-amber-500 bg-amber-50/50'}`}>
            <div className="flex items-start gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    {isAdmin
                        ? <Icons.Megaphone className="w-3.5 h-3.5 text-blue-600" />
                        : <Icons.Bell className="w-3.5 h-3.5 text-amber-600" />
                    }
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className={`text-[9px] font-semibold border-0 px-1.5 py-0 h-4 ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isAdmin ? 'Admin' : 'Instructor'}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{timeAgo(reminder.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">{reminder.message}</p>
                </div>
            </div>
        </div>
    );
}

/* Module detail drawer */
function ModuleDrawer({ mod, onClose, onNavigate }) {
    if (!mod) return null;
    const lvl = getLvl(mod.level);
    const clean = stripHtml(mod.description);
    return (
        <Sheet open={!!mod} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-5">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs font-semibold capitalize border ${lvl.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${lvl.dot} inline-block`} />{mod.level}
                        </Badge>
                        {mod.categoryId?.name && <Badge variant="secondary" className="text-xs">{mod.categoryId.name}</Badge>}
                    </div>
                    <SheetTitle className="text-xl leading-snug break-words overflow-wrap-anywhere">{mod.title}</SheetTitle>
                    <SheetDescription className="text-sm text-gray-500 leading-relaxed mt-1 break-words whitespace-pre-wrap overflow-hidden">
                        {clean || 'No description available.'}
                    </SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                        { icon: 'Users', label: 'Students', value: mod.enrollmentCount || 0 },
                        { icon: 'BookOpen', label: 'Lessons', value: mod.totalLessons || 0 },
                    ].map(({ icon, label, value }) => {
                        const Ic = Icons[icon];
                        return (
                            <Card key={label} className="border-gray-100 text-center">
                                <CardContent className="p-3">
                                    {Ic && <Ic className="w-4 h-4 text-[#021d49] mx-auto mb-1" />}
                                    <p className="text-lg font-bold text-gray-900">{value}</p>
                                    <p className="text-xs text-gray-500">{label}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                {mod.price > 0 && (
                    <Card className="border-amber-100 bg-amber-50 mb-5">
                        <CardContent className="p-3 flex items-center gap-2">
                            <Icons.CreditCard className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">
                                {mod.currency || 'NGN'} {mod.price?.toLocaleString()}
                            </span>
                        </CardContent>
                    </Card>
                )}
                <Button className="w-full bg-[#021d49] hover:bg-[#032a66] text-white"
                    onClick={() => { onNavigate(mod._id); onClose(); }}>
                    <Icons.ArrowRight className="w-4 h-4 mr-2" /> View Module
                </Button>
            </SheetContent>
        </Sheet>
    );
}

/* Empty state */
function Empty({ icon, title, sub, action, onAction }) {
    const Ic = Icons[icon];
    return (
        <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                {Ic && <Ic className="w-6 h-6 text-gray-400" />}
            </div>
            <p className="text-sm font-semibold text-gray-700">{title}</p>
            {sub && <p className="text-xs text-gray-400 mt-1 max-w-[200px]">{sub}</p>}
            {action && (
                <Button size="sm" className="mt-3 bg-[#021d49] hover:bg-[#032a66] text-white text-xs h-8"
                    onClick={onAction}>{action}</Button>
            )}
        </div>
    );
}


/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */

/**
 * From an enrollment object, return the index of the first lesson that
 * has NOT been completed, or null if all lessons are done.
 *
 * Returns null (not 0) when lessonProgress is absent or empty so that
 * callers can distinguish "no data" from "genuinely at lesson 0".
 */
function getNextIncompleteLesson(enrollment) {
    const lessonProgress = enrollment.lessonProgress || [];

    // If the list endpoint returned no lessonProgress entries we cannot
    // reliably compute the next lesson — signal that to the caller.
    if (lessonProgress.length === 0) return null;

    const completed = new Set(
        lessonProgress
            .filter(lp => lp.isCompleted)
            .map(lp => lp.lessonIndex)
    );
    const total = enrollment.totalLessons || 0;
    for (let i = 0; i < total; i++) {
        if (!completed.has(i)) return i;
    }
    return null; // all lessons done
}

/**
 * Build the URL to resume a module.
 *
 * Strategy (in priority order):
 *  1. lastAccessedLesson and lastAccessedSlide from the DB (the source of truth for position)
 *  2. First incomplete lesson derived from lessonProgress
 *  3. Fallback to module root
 */
function getContinueLearningUrl(enrollment) {
    const moduleId = enrollment.moduleId?._id || enrollment.moduleId;
    const lessonProgress = enrollment.lessonProgress || [];

    const lastAccessedLesson = typeof enrollment.lastAccessedLesson === 'number'
        ? enrollment.lastAccessedLesson
        : null;

    const lastAccessedSlide = typeof enrollment.lastAccessedSlide === 'number'
        ? enrollment.lastAccessedSlide
        : 0;

    console.log(`[ContinueLearning] Processing resume for module: ${moduleId}`, {
        lastAccessedLesson,
        lastAccessedSlide,
        lessonProgress: lessonProgress.map(lp => ({ idx: lp.lessonIndex, done: lp.isCompleted }))
    });

    const nextIncomplete = getNextIncompleteLesson(enrollment);

    let resumeLesson = null;
    let resumeSlide = 0;

    if (lastAccessedLesson !== null) {
        const lessonStatus = lessonProgress.find(lp => lp.lessonIndex === lastAccessedLesson);
        if (lessonStatus?.isCompleted) {
            // Saved lesson is done, find next
            console.log(`[ContinueLearning] Lesson ${lastAccessedLesson} already completed. Finding next...`);
            resumeLesson = nextIncomplete;
            resumeSlide = 0;
        } else {
            // Resume exactly where they were
            resumeLesson = lastAccessedLesson;
            resumeSlide = lastAccessedSlide;
        }
    } else if (nextIncomplete !== null) {
        resumeLesson = nextIncomplete;
        resumeSlide = 0;
    }

    const isContentFinalized = enrollment.moduleId?.isContentFinalized ?? false;
    const finalUrl = resumeLesson !== null
        ? `/student/modules/${moduleId}?lesson=${resumeLesson}&slide=${resumeSlide}`
        : (isContentFinalized && !enrollment.finalAssessmentPassed
            ? `/student/modules/${moduleId}?showFinalAssessment=true`
            : `/student/modules/${moduleId}`);

    console.log('[ContinueLearning] Final Redirect Target:', finalUrl);
    return finalUrl;
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
function StudentDashboardContent() {
    const router = useRouter();

    const [enrollments, setEnrollments] = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [availableModules, setAvailableModules] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [user, setUser] = useState(null);
    const [drawerMod, setDrawerMod] = useState(null);
    const [modulesTab, setModulesTab] = useState('available'); // 'available' | 'progress'
    const [showAllActivity, setShowAllActivity] = useState(false);

    useEffect(() => {
        const u = authService.getCurrentUser?.() || null;
        setUser(u);

        // Restore cached data instantly so UI shows immediately
        try {
            const cached = sessionStorage.getItem('dashboard_cache');
            if (cached) {
                const { availableModules: cm } = JSON.parse(cached);
                if (cm) setAvailableModules(cm);
            }
        } catch (_) {}

        fetchAll();

        // Only re-fetch critical data (enrollments) on tab focus
        const handleVisibility = () => {
            if (!document.hidden) fetchCritical();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    // Fetch only enrollments + progressions — what the dashboard primarily shows
    const fetchCritical = useCallback(async () => {
        try {
            const [enrollData, progData] = await Promise.all([
                moduleEnrollmentService.getMyEnrollments(),
                progressionService.getMyProgressions(),
            ]);
            const eList = (Array.isArray(enrollData) ? enrollData : enrollData?.enrollments || []).map(normalizeEnrollment);
            const pList = Array.isArray(progData) ? progData : progData?.progressions || [];
            setEnrollments(eList);
            setProgressions(pList);
        } catch (_) {}
    }, []);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setFetchError(false);

            // Step 1 — fetch critical data first, show UI immediately
            const [enrollData, progData] = await Promise.all([
                moduleEnrollmentService.getMyEnrollments(),
                progressionService.getMyProgressions(),
            ]);

            const eList = (Array.isArray(enrollData) ? enrollData : enrollData?.enrollments || []).map(normalizeEnrollment);
            const pList = Array.isArray(progData) ? progData : progData?.progressions || [];
            setEnrollments(eList);
            setProgressions(pList);
            setLoading(false); // ← show dashboard now, don't wait for secondary data

            // Step 2 — fetch secondary data in background (non-blocking)
            Promise.allSettled([
                moduleService.getAllModules({ limit: 20 }),
                notificationService.getMyNotifications(20),
                notificationService.getMyReminders(),
            ]).then(([modsData, notifData, remindData]) => {
                if (modsData.status === 'fulfilled') {
                    const allMods = Array.isArray(modsData.value) ? modsData.value : modsData.value?.modules || [];
                    const enrolledIds = new Set(eList.map(e => e.moduleId?._id?.toString() || e.moduleId?.toString()));
                    const available = allMods.filter(m => !enrolledIds.has(m._id?.toString()));
                    setAvailableModules(available);

                    // Cache for instant next load
                    try {
                        sessionStorage.setItem('dashboard_cache', JSON.stringify({
                            availableModules: available,
                        }));
                    } catch (_) {}
                }
                if (notifData.status === 'fulfilled') {
                    const n = notifData.value;
                    setNotifications(Array.isArray(n) ? n : n?.notifications || []);
                }
                if (remindData.status === 'fulfilled') {
                    const r = remindData.value;
                    setReminders(Array.isArray(r) ? r : r?.reminders || []);
                }
            });

        } catch (err) {
            console.error(err);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (_) { }
    };

    /* ── Derived data ── */
    const { totalLessons, completedLessons, overallProgress } = summarizeEnrollments(enrollments);
    const inProgress = enrollments.filter(e => {
        if (e.isCompleted) return false;
        // Any enrollment where all lessons are done is no longer "in progress" —
        // it's either pending assessment or completed.
        if (e.allLessonsCompleted) return false;
        return true;
    });

    const pendingAssessments = enrollments.filter(e => {
        if (e.isCompleted) return false;
        const hasSubmitted = (e.finalAssessmentAttempts || 0) > 0;
        const hasPending = (e.pendingManualGradingCount || 0) > 0;
        const allDone = e.allLessonsCompleted;
        const contentFinalized = e.moduleId?.isContentFinalized ?? false;
        return (allDone && contentFinalized && !hasSubmitted) ||
            (hasSubmitted && !e.finalAssessmentPassed) ||
            hasPending;
    });

    const completed = enrollments.filter(e => e.isCompleted);
    const certsEarned = completed.filter(e => e.certificateEarned).length;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const visibleNotifs = showAllActivity ? notifications : notifications.slice(0, 5);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <div className="relative w-14 h-14 mx-auto mb-3">
                            <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#021d49]/20 border-t-[#021d49]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Icons.BookOpen className="w-5 h-5 text-[#021d49]" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-600">Loading your dashboard…</p>
                    </div>
                </div>
            </>
        );
    }

    if (fetchError) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center px-6">
                        <Icons.WifiOff className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-base font-bold text-gray-800 mb-1">Couldn't load your dashboard</h3>
                        <p className="text-sm text-gray-500 mb-5">The server may be temporarily unavailable. Please try again.</p>
                        <Button className="bg-[#021d49] hover:bg-[#032a66] text-white" onClick={fetchAll}>
                            <Icons.RefreshCw className="w-4 h-4 mr-2" /> Retry
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    const fullName = user ? (`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || '') : '';
    const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'there';
    const initials = user ? (
        `${(user.firstName || user.fullName || '')[0] || ''}${(user.lastName || (user.fullName || '').split(' ').slice(-1)[0] || '')[0] || ''}`
    ).toUpperCase() || 'S' : 'S';

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50/80">

                {/* ════════════════════════════════
                    HERO WELCOME BANNER
                ════════════════════════════════ */}
                <div className="bg-gradient-to-r from-[#021d49] via-[#0a2d6e] to-[#0f3a8a] px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            {/* Left: Identity */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border-2 border-white/30 shrink-0">
                                    <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-blue-200/80 text-xs font-medium">Welcome back</p>
                                    <h1 className="text-2xl font-bold text-white">{fullName || firstName}</h1>
                                    {user?.email && (
                                        <p className="text-blue-200/60 text-xs mt-0.5">{user.email}</p>
                                    )}
                                </div>
                            </div>
                            {/* Right: Hero stats */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <HeroStat icon="BookOpen" label="Enrolled" value={enrollments.length} />
                                <HeroStat icon="Zap" label="In Progress" value={inProgress.length} />
                                <HeroStat icon="CheckCircle" label="Completed" value={completed.length} />
                                <HeroStat icon="Award" label="Certificates" value={certsEarned} />
                            </div>
                        </div>

                        {/* Progress bar */}
                        {enrollments.length > 0 && (
                            <div className="mt-5 bg-white/10 rounded-xl p-3 flex items-center gap-4 backdrop-blur-sm">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-white/70">Overall learning progress</span>
                                        <span className="text-xs font-bold text-white">{overallProgress}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#00c4b3] to-blue-300 transition-all duration-700"
                                            style={{ width: `${Math.min(100, overallProgress)}%` }}
                                        />
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="shrink-0 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs h-8 backdrop-blur-sm"
                                    onClick={() => router.push('/student/modules')}
                                >
                                    <Icons.Compass className="w-3.5 h-3.5 mr-1.5" />
                                    Browse Modules
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════
                    MAIN CONTENT
                ════════════════════════════════ */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ══ LEFT / MAIN COLUMN ══ */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Quick Links */}
                            <Card className="border-gray-100 shadow-sm">
                                <CardHeader className="px-5 pt-5 pb-3">
                                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Icons.Zap className="w-4 h-4 text-amber-500" />
                                        Quick Links
                                    </CardTitle>
                                    <p className="text-xs text-gray-400 mt-0.5">Frequently accessed resources</p>
                                </CardHeader>
                                <CardContent className="px-5 pb-5">
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {[
                                            { icon: 'BookOpen', label: 'Browse', sub: 'All modules', color: 'text-blue-600', bgColor: 'bg-blue-50', href: '/student/modules' },
                                            { icon: 'MessageSquare', label: 'Discussions', sub: 'Forums', color: 'text-teal-600', bgColor: 'bg-teal-50', href: '/student/modules' },
                                            { icon: 'Award', label: 'Certificates', sub: 'My awards', color: 'text-violet-600', bgColor: 'bg-violet-50', href: '/student/certificates' },
                                            { icon: 'Trophy', label: 'Achievements', sub: 'Progress', color: 'text-amber-600', bgColor: 'bg-amber-50', href: '/student/achievements' },
                                            { icon: 'User', label: 'Profile', sub: 'My account', color: 'text-gray-600', bgColor: 'bg-gray-100', href: '/student/profile' },
                                        ].map((ql) => (
                                            <QuickLink key={ql.label} {...ql} onClick={() => router.push(ql.href)} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Continue Learning */}
                            {inProgress.length > 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardHeader className="px-5 pt-5 pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Icons.Play className="w-4 h-4 text-[#021d49]" />
                                                    Continue Learning
                                                    <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-[#021d49] text-white border-0 rounded-full">
                                                        {inProgress.length}
                                                    </Badge>
                                                </CardTitle>
                                                <p className="text-xs text-gray-400 mt-0.5">Pick up where you left off</p>
                                            </div>
                                            <Button variant="ghost" size="sm"
                                                className="text-xs text-[#021d49] hover:bg-blue-50 h-7 px-2"
                                                onClick={() => router.push('/student/modules')}>
                                                View all <Icons.ChevronRight className="w-3 h-3 ml-0.5" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-5 pb-5 space-y-2.5">
                                        {inProgress.slice(0, 4).map((e) => (
                                            <ContinueLearningCard
                                                key={e._id}
                                                enrollment={e}
                                                onClick={() => router.push(getContinueLearningUrl(e))}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Assessments Due */}
                            {pendingAssessments.length > 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardHeader className="px-5 pt-5 pb-3">
                                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.Target className="w-4 h-4 text-amber-500" />
                                            Assessments
                                            <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-amber-500 text-white border-0 rounded-full">
                                                {pendingAssessments.length}
                                            </Badge>
                                        </CardTitle>
                                        <p className="text-xs text-gray-400 mt-0.5">Modules awaiting your assessment</p>
                                    </CardHeader>
                                    <CardContent className="px-5 pb-5 space-y-2">
                                        {pendingAssessments.slice(0, 4).map((e) => (
                                            <AssessmentAlertCard
                                                key={e._id}
                                                enrollment={e}
                                                onClick={() => router.push(`/student/modules/${e.moduleId?._id || e.moduleId}?showFinalAssessment=true`)}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Modules Section */}
                            <Card className="border-gray-100 shadow-sm">
                                <CardHeader className="px-5 pt-5 pb-0">
                                    {/* Tab-like switcher */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setModulesTab('available')}
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${modulesTab === 'available' ? 'bg-white shadow-sm text-[#021d49]' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Available Modules
                                                {availableModules.length > 0 && (
                                                    <span className="ml-1.5 bg-[#021d49] text-white text-[10px] rounded-full px-1.5 py-0.5">{availableModules.length}</span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setModulesTab('progress')}
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${modulesTab === 'progress' ? 'bg-white shadow-sm text-[#021d49]' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                My Progress
                                            </button>
                                        </div>
                                        <Button variant="ghost" size="sm"
                                            className="text-xs text-[#021d49] hover:bg-blue-50 h-7 px-2"
                                            onClick={() => router.push('/student/modules')}>
                                            Browse all <Icons.ArrowRight className="w-3 h-3 ml-0.5" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-5 pb-5">
                                    {modulesTab === 'available' ? (
                                        availableModules.length > 0 ? (
                                            <>
                                                {/* Sequential learning notice */}
                                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-3">
                                                    <Icons.ListOrdered className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-amber-800 leading-relaxed">
                                                        <span className="font-semibold">Sequential Learning:</span> You must complete Module 1 before accessing Module 2, and so on within each programme.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                    {availableModules.slice(0, 6).map((mod) => (
                                                        <AvailableModuleCard
                                                            key={mod._id}
                                                            mod={mod}
                                                            onDetails={setDrawerMod}
                                                            onEnroll={(id) => router.push(`/student/modules/${id}`)}
                                                        />
                                                    ))}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-dashed border-gray-300 text-gray-600 hover:border-[#021d49] hover:text-[#021d49] text-xs h-9"
                                                    onClick={() => router.push('/student/modules')}>
                                                    <Icons.Grid className="w-3.5 h-3.5 mr-2" />
                                                    View All Modules
                                                    {availableModules.length > 6 && (
                                                        <Badge className="ml-2 h-4 px-1.5 text-[10px] bg-gray-200 text-gray-600 border-0">
                                                            +{availableModules.length - 6} more
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </>
                                        ) : (
                                            <Empty icon="BookOpen" title="All caught up!" sub="You're enrolled in all available modules." />
                                        )
                                    ) : (
                                        /* Progress view */
                                        enrollments.length > 0 ? (
                                            <div className="space-y-2">
                                                {enrollments.map((e) => {
                                                    const mod = e.moduleId || {};
                                                    const lvl = getLvl(mod.level);
                                                    const prog = clamp(e.progress);

                                                    // Status label
                                                    let statusBadge;
                                                    if (e.isCompleted) {
                                                        statusBadge = <Badge className="text-[9px] bg-blue-100 text-blue-700 border-0 font-semibold shrink-0"><Icons.CheckCircle className="w-2.5 h-2.5 mr-0.5 inline" />Done</Badge>;
                                                    } else if ((e.pendingManualGradingCount || 0) > 0) {
                                                        statusBadge = <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0 font-semibold shrink-0"><Icons.Clock className="w-2.5 h-2.5 mr-0.5 inline" />Review</Badge>;
                                                    } else if (e.allLessonsCompleted && (e.moduleId?.isContentFinalized ?? false)) {
                                                        statusBadge = <Badge className="text-[9px] bg-blue-100 text-blue-700 border-0 font-semibold shrink-0"><Icons.Target className="w-2.5 h-2.5 mr-0.5 inline" />Assess</Badge>;
                                                    } else if (e.allLessonsCompleted) {
                                                        statusBadge = <Badge className="text-[9px] bg-teal-100 text-teal-700 border-0 font-semibold shrink-0"><Icons.Clock className="w-2.5 h-2.5 mr-0.5 inline" />Coming Soon</Badge>;
                                                    } else {
                                                        statusBadge = <Badge className="text-[9px] bg-violet-100 text-violet-700 border-0 font-semibold shrink-0"><Icons.Play className="w-2.5 h-2.5 mr-0.5 inline" />Active</Badge>;
                                                    }

                                                    return (
                                                        <div key={e._id}
                                                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                                                            onClick={() => router.push(`/student/modules/${mod._id}`)}>
                                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${e.isCompleted ? 'bg-blue-100' : 'bg-[#021d49]/8'}`}>
                                                                {e.isCompleted
                                                                    ? <Icons.CheckCircle className="w-4 h-4 text-blue-600" />
                                                                    : <Icons.BookOpen className="w-4 h-4 text-[#021d49]" />
                                                                }
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <p className="text-xs font-semibold text-gray-900 line-clamp-1 group-hover:text-[#021d49] transition-colors">{mod.title}</p>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        {statusBadge}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Progress value={prog} className="flex-1 h-1.5" />
                                                                    <span className="text-[10px] font-bold text-[#021d49] shrink-0 w-8 text-right">{prog}%</span>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] text-gray-400">{e.completedLessons || 0}/{e.totalLessons || 0} lessons</span>
                                                                        {mod.order && (
                                                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#021d49]/10 text-[#021d49]">Module {mod.order}</span>
                                                                        )}
                                                                    </div>
                                                                    <Badge variant="outline" className={`text-[9px] border ${lvl.badge}`}>{mod.level}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Empty icon="BookOpen" title="No modules yet"
                                                sub="Enroll in a module to start tracking progress."
                                                action="Browse Modules"
                                                onAction={() => router.push('/student/modules')} />
                                        )
                                    )}
                                </CardContent>
                            </Card>

                            {/* Learning Progression by Level */}
                            {progressions.length > 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardHeader className="px-5 pt-5 pb-3">
                                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.TrendingUp className="w-4 h-4 text-[#021d49]" />
                                            Level Progression
                                        </CardTitle>
                                        <p className="text-xs text-gray-400 mt-0.5">Your journey through each category</p>
                                    </CardHeader>
                                    <CardContent className="px-5 pb-5 space-y-3">
                                        {progressions.map((prog) => {
                                            const catName = prog.categoryId?.name || prog.categoryName || 'Category';
                                            const levels = ['beginner', 'intermediate', 'advanced'];
                                            const currentIdx = levels.indexOf(prog.currentLevel || 'beginner');
                                            const levelColors = {
                                                beginner: { active: 'bg-blue-700 text-white', done: 'bg-blue-100 text-blue-700', locked: 'bg-gray-100 text-gray-400' },
                                                intermediate: { active: 'bg-amber-500 text-white', done: 'bg-amber-100 text-amber-700', locked: 'bg-gray-100 text-gray-400' },
                                                advanced: { active: 'bg-rose-600 text-white', done: 'bg-rose-100 text-rose-700', locked: 'bg-gray-100 text-gray-400' },
                                            };
                                            return (
                                                <div key={prog._id} className="bg-gray-50 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-sm font-semibold text-gray-900">{catName}</p>
                                                        <div className="flex items-center gap-1">
                                                            {levels.map((_, i) => (
                                                                <div key={i} className={`w-2 h-2 rounded-full ${i <= currentIdx ? 'bg-[#021d49]' : 'bg-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {levels.map((level, li) => {
                                                            const isUnlocked = li <= currentIdx;
                                                            const isCurrent = li === currentIdx;
                                                            const ld = prog.levels?.[level] || {};
                                                            const c = levelColors[level];
                                                            return (
                                                                <div key={level} className={`rounded-lg p-3 text-center ${isCurrent ? `${c.active} ring-2 ring-offset-1 shadow-sm` : isUnlocked ? c.done : c.locked}`}>
                                                                    <div className="flex justify-center mb-1">
                                                                        {isCurrent ? <Icons.Zap className="w-3.5 h-3.5" /> :
                                                                            isUnlocked ? <Icons.CheckCircle className="w-3.5 h-3.5" /> :
                                                                                <Icons.Lock className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                    <p className="text-[10px] font-bold capitalize">{level}</p>
                                                                    <p className="text-[10px] opacity-75">{ld.completedModules || 0}/{ld.totalModules || 0}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Empty state: no enrollments at all */}
                            {enrollments.length === 0 && availableModules.length === 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardContent className="p-10 text-center">
                                        <Icons.BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                                        <h3 className="text-base font-bold text-gray-900 mb-1">Start your learning journey</h3>
                                        <p className="text-sm text-gray-500 mb-5">Explore modules and enroll to begin.</p>
                                        <Button className="bg-[#021d49] hover:bg-[#032a66] text-white"
                                            onClick={() => router.push('/student/modules')}>
                                            <Icons.Compass className="w-4 h-4 mr-2" /> Browse Modules
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* ══ RIGHT SIDEBAR ══ */}
                        <div className="space-y-5">

                            {/* Summary Card */}
                            <Card className="border-0 shadow-sm bg-gradient-to-br from-[#021d49] to-[#0a2d6e] text-white overflow-hidden">
                                <CardContent className="p-5">
                                    <p className="text-xs text-white/60 font-medium mb-3">Your Summary</p>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Lessons Completed', value: `${completedLessons}/${totalLessons}`, icon: 'BookOpen' },
                                            { label: 'Overall Progress', value: `${overallProgress}%`, icon: 'BarChart2' },
                                            { label: 'Certificates', value: certsEarned, icon: 'Award' },
                                            { label: 'Completed Modules', value: completed.length, icon: 'CheckCircle' },
                                        ].map(({ label, value, icon }) => {
                                            const Ic = Icons[icon];
                                            return (
                                                <div key={label} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-white/70">
                                                        {Ic && <Ic className="w-3.5 h-3.5 text-white/50" />}
                                                        {label}
                                                    </div>
                                                    <span className="text-sm font-bold text-white">{value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Separator className="my-3 bg-white/10" />
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost"
                                            className="flex-1 text-xs text-white/80 hover:bg-white/15 hover:text-white h-8 border border-white/20"
                                            onClick={() => router.push('/student/certificates')}>
                                            <Icons.Award className="w-3.5 h-3.5 mr-1.5" /> Certificates
                                        </Button>
                                        <Button size="sm" variant="ghost"
                                            className="flex-1 text-xs text-white/80 hover:bg-white/15 hover:text-white h-8 border border-white/20"
                                            onClick={() => router.push('/student/achievements')}>
                                            <Icons.Trophy className="w-3.5 h-3.5 mr-1.5" /> Achievements
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Reminders from Instructors / Admin */}
                            {reminders.length > 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardHeader className="px-4 pt-4 pb-2">
                                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.Bell className="w-4 h-4 text-amber-500" />
                                            Reminders
                                            <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-amber-500 text-white border-0 rounded-full">
                                                {reminders.length}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4 space-y-2">
                                        {reminders.slice(0, 3).map((r, i) => (
                                            <ReminderCard key={r._id || i} reminder={r} />
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recent Activity / Notifications */}
                            <Card className="border-gray-100 shadow-sm">
                                <CardHeader className="px-4 pt-4 pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.Activity className="w-4 h-4 text-[#021d49]" />
                                            Recent Activity
                                            {unreadCount > 0 && (
                                                <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-blue-500 text-white border-0 rounded-full">
                                                    {unreadCount}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        {unreadCount > 0 && (
                                            <button
                                                className="text-[10px] text-gray-400 hover:text-[#021d49] font-medium"
                                                onClick={async () => {
                                                    try {
                                                        await notificationService.markAllAsRead();
                                                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                                    } catch (_) { }
                                                }}>
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 pb-4">
                                    {notifications.length > 0 ? (
                                        <>
                                            <div className="space-y-1">
                                                {visibleNotifs.map((n, i) => (
                                                    <ActivityItem key={n._id || i} notification={n} onRead={handleMarkRead} />
                                                ))}
                                            </div>
                                            {notifications.length > 5 && (
                                                <button
                                                    className="w-full mt-2 text-xs text-[#021d49] font-semibold hover:underline py-1"
                                                    onClick={() => setShowAllActivity(v => !v)}>
                                                    {showAllActivity ? 'Show less' : `Show all ${notifications.length} activities`}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Icons.Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400">No recent activity</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Discussion Shortcuts (per enrolled module) */}
                            {inProgress.length > 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardHeader className="px-4 pt-4 pb-2">
                                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.MessageCircle className="w-4 h-4 text-teal-500" />
                                            Discussions & Resources
                                        </CardTitle>
                                        <p className="text-xs text-gray-400 mt-0.5">Jump into your module discussions</p>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4 space-y-2">
                                        {inProgress.slice(0, 3).map((e) => {
                                            const mod = e.moduleId || {};
                                            const lvl = getLvl(mod.level);
                                            return (
                                                <div key={e._id}
                                                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-teal-50/50 transition-colors group cursor-pointer"
                                                    onClick={() => router.push(`/student/modules/${mod._id}/discussions`)}>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-teal-700 transition-colors">
                                                            {mod.title}
                                                        </p>
                                                        <Badge variant="outline" className={`text-[9px] font-semibold capitalize border mt-0.5 ${lvl.badge}`}>
                                                            {mod.level}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                                        <button
                                                            className="w-7 h-7 rounded-lg bg-teal-100 hover:bg-teal-200 flex items-center justify-center transition-colors"
                                                            onClick={(ev) => { ev.stopPropagation(); router.push(`/student/modules/${mod._id}/discussions`); }}
                                                            title="Discussions">
                                                            <Icons.MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                                                        </button>
                                                        <button
                                                            className="w-7 h-7 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                                                            onClick={(ev) => { ev.stopPropagation(); router.push(`/student/modules/${mod._id}`); }}
                                                            title="Module & Resources">
                                                            <Icons.FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {inProgress.length > 3 && (
                                            <button
                                                className="w-full text-xs text-[#021d49] font-semibold hover:underline py-1"
                                                onClick={() => router.push('/student/modules')}>
                                                +{inProgress.length - 3} more modules
                                            </button>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Completed modules */}
                            {completed.length > 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardHeader className="px-4 pt-4 pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <Icons.CheckCircle className="w-4 h-4 text-blue-600" />
                                                Completed
                                                <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-blue-700 text-white border-0 rounded-full">
                                                    {completed.length}
                                                </Badge>
                                            </CardTitle>
                                            {certsEarned > 0 && (
                                                <button
                                                    className="text-[10px] text-[#021d49] font-semibold hover:underline flex items-center gap-0.5"
                                                    onClick={() => router.push('/student/certificates')}>
                                                    Certificates <Icons.ChevronRight className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4 space-y-1.5">
                                        {completed.slice(0, 4).map((e) => {
                                            const mod = e.moduleId || {};
                                            const lvl = getLvl(mod.level);
                                            return (
                                                <div key={e._id}
                                                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                                    onClick={() => router.push(`/student/modules/${mod._id}`)}>
                                                    <Icons.CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-700 transition-colors">{mod.title}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Badge variant="outline" className={`text-[9px] border ${lvl.badge}`}>{mod.level}</Badge>
                                                        {e.certificateEarned && <Icons.Award className="w-3.5 h-3.5 text-yellow-500" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Module Detail Drawer */}
            <ModuleDrawer
                mod={drawerMod}
                onClose={() => setDrawerMod(null)}
                onNavigate={(id) => router.push(`/student/modules/${id}`)}
            />
        </>
    );
}

export default function StudentDashboardPage() {
    return (
        <ProtectedStudentRoute>
            <StudentDashboardContent />
        </ProtectedStudentRoute>
    );
}
