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
    Library, Sparkles,
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
    ListOrdered, Grid, MessageSquare, FolderOpen, Library, Sparkles,
};
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import progressionService from '@/lib/api/progressionService';
import studentVerificationService from '@/lib/api/studentVerificationService';
import api from '@/lib/api/config';
import moduleService from '@/lib/api/moduleService';
import authService from '@/lib/api/authService';
import notificationService from '@/lib/api/notificationService';
import messageService from '@/lib/api/messageService';
import paymentService from '@/lib/api/paymentService';
import categoryService from '@/lib/api/categoryService';
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


/* Category tab switcher — shown only when student is enrolled in 2+ programmes */
function CategorySwitcher({ categories, active, onSelect }) {
    if (!categories || categories.length <= 1) return null;
    return (
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-0">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {categories.map((cat) => {
                        const isActive = active?._id === cat._id;
                        const isPaid = cat.hasTieredPricing && cat.isPaid;
                        return (
                            <button
                                key={cat._id}
                                onClick={() => onSelect(cat)}
                                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-semibold transition-all shrink-0 border-b-2 ${
                                    isActive
                                        ? 'border-[#021d49] text-[#021d49]'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                                }`}
                            >
                                {isPaid ? (
                                    <Icons.GraduationCap className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#021d49]' : 'text-gray-400'}`} />
                                ) : (
                                    <Icons.BookOpen className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#021d49]' : 'text-gray-400'}`} />
                                )}
                                <span className="max-w-[200px] truncate">{cat.name}</span>
                                {isPaid && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                        isActive ? 'bg-[#021d49] text-white' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        PAID
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* Empty/coming-soon dashboard for paid categories with no published modules yet */
function PublishingAcademyView({ category, paymentStatus, router }) {
    const tier = paymentStatus?.userTier;
    const tierLabel = tier === 'student' ? 'Student' : tier === 'non-student' ? 'Non-Student' : null;

    const benefits = [
        { icon: 'Award',        text: 'Certificate upon programme completion' },
        { icon: 'Users',        text: 'Mentorship from senior scholars & editors' },
        { icon: 'Star',         text: 'Alumni network for co-authorship & peer learning' },
        { icon: 'FileText',     text: 'Opportunity to publish in a high-impact journal' },
        { icon: 'ArrowRight',   text: 'Linkages to funding calls & fellowships' },
        { icon: 'Trophy',       text: 'Competitive recognition for outstanding outputs' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left / Main column ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Registration confirmation card */}
                    <div className="bg-gradient-to-br from-[#021d49] to-[#0a3070] rounded-2xl p-6 text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-400/20 rounded-xl flex items-center justify-center shrink-0">
                                <Icons.CheckCircle className="w-6 h-6 text-emerald-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">Registration Confirmed</p>
                                <h2 className="text-xl font-bold text-white leading-tight mb-1">{category?.name}</h2>
                                <p className="text-blue-200 text-sm">In partnership with <span className="font-semibold text-white">Taylor &amp; Francis</span></p>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full border border-white/20">
                                        First Cohort · 2026
                                    </span>
                                    {tierLabel && (
                                        <span className="bg-amber-400/20 text-amber-200 text-xs font-semibold px-3 py-1 rounded-full border border-amber-300/30">
                                            {tierLabel} Tier
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modules coming soon card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Icons.BookOpen className="w-8 h-8 text-[#021d49]" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Modules Are Being Prepared</h3>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto mb-6">
                                Content for the first cohort is currently being developed by our expert team.
                                You will receive an email notification as soon as modules go live.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-6">
                                {[
                                    { icon: 'Calendar', label: 'Programme Start', value: '2026' },
                                    { icon: 'Clock',    label: 'Duration',        value: '2–3 months' },
                                    { icon: 'Globe',    label: 'Delivery',        value: 'Blended / Online' },
                                ].map(({ icon, label, value }) => {
                                    const Ic = Icons[icon];
                                    return (
                                        <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                                            {Ic && <Ic className="w-4 h-4 text-[#021d49] shrink-0" />}
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                                                <p className="text-sm font-semibold text-gray-800">{value}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => router.push('/arin-publishing-academy')}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#021d49] hover:text-[#032a66] transition-colors"
                            >
                                View Programme Details <Icons.ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* What to expect / learning structure */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Sparkles className="w-4 h-4 text-amber-500" />
                            What to Expect
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                { title: 'Live Webinars',             sub: 'Virtual instructor-led sessions' },
                                { title: 'Self-paced Modules',        sub: 'Flexible e-learning on this platform' },
                                { title: 'Mentorship Clinics',        sub: 'One-on-one & small group coaching' },
                                { title: 'Peer Learning Circles',     sub: 'Collaborative feedback sessions' },
                                { title: 'Practical Writing Labs',    sub: 'Real-time manuscript development' },
                                { title: 'Policy Brief Workshops',    sub: 'Transform evidence into policy outputs' },
                            ].map((item) => (
                                <div key={item.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                    <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">

                    {/* Benefits card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Trophy className="w-4 h-4 text-amber-500" />
                            What's Included
                        </h3>
                        <ul className="space-y-3">
                            {benefits.map(({ icon, text }) => {
                                const Ic = Icons[icon];
                                return (
                                    <li key={text} className="flex items-start gap-3">
                                        <div className="w-7 h-7 bg-[#021d49]/8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                            {Ic && <Ic className="w-3.5 h-3.5 text-[#021d49]" />}
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Stay tuned card */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <Icons.Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-900 mb-1">Stay Tuned</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    We'll send you an email to <strong>your registered address</strong> the moment modules are published.
                                    No action needed — just check your inbox.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Partner card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Programme Partner</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                <Icons.BookMarked className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Taylor &amp; Francis</p>
                                <p className="text-xs text-gray-400">Academic publishing partner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [issuedCerts, setIssuedCerts] = useState([]);
    const [certBannerDismissed, setCertBannerDismissed] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const [accessibleCategories, setAccessibleCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeCategoryPaymentStatus, setActiveCategoryPaymentStatus] = useState(null);

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

        fetchAll(u);
        messageService.getUnreadCount().then((r) => setUnreadMessages(r?.count ?? 0)).catch(() => {});

        // Check student verification status
        studentVerificationService.getMyStatus()
          .then((s) => { if (s?.status && s.status !== 'none') setVerificationStatus(s); })
          .catch(() => {});

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

    const fetchAll = useCallback(async (u) => {
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

            // Derive which categories this user can access and build the switcher
            fetchAccessibleCategories(u);

            // Check sessionStorage for dismissed cert banner
            try {
                if (sessionStorage.getItem('cert_banner_dismissed')) setCertBannerDismissed(true);
            } catch (_) {}

            // Step 2 — fetch secondary data in background (non-blocking)
            Promise.allSettled([
                moduleService.getAllModules({ limit: 20 }),
                notificationService.getMyNotifications(20),
                notificationService.getMyReminders(),
                api.get('/api/certificates/module/student/my-certificates'),
            ]).then(([modsData, notifData, remindData, certsData]) => {
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
                if (certsData.status === 'fulfilled') {
                    const c = certsData.value?.data;
                    setIssuedCerts(Array.isArray(c) ? c : []);
                }
            });

        } catch (err) {
            console.error(err);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAccessibleCategories = useCallback(async (u) => {
        try {
            const currentUser = u || authService.getCurrentUser?.();
            const allCats = await categoryService.getAllCategories();
            if (!Array.isArray(allCats) || allCats.length === 0) return;

            const accessible = [];

            for (const cat of allCats) {
                if (cat.hasTieredPricing && cat.isPaid) {
                    // Paid/tiered category — check if user has paid
                    try {
                        const status = await paymentService.checkCategoryStatus(cat._id);
                        if (status?.hasAccess || status?.awaitingPayment) {
                            accessible.push({ ...cat, _paymentStatus: status });
                        }
                    } catch { /* user hasn't paid — skip */ }
                } else {
                    // Free/fellow category — check if user is assigned
                    const assignedCats = currentUser?.fellowData?.assignedCategories || [];
                    const isAssigned = assignedCats.some((ac) => {
                        const id = typeof ac === 'object' ? (ac._id || ac.id || ac) : ac;
                        return id?.toString() === cat._id?.toString();
                    });
                    if (isAssigned) accessible.push(cat);
                }
            }

            setAccessibleCategories(accessible);

            // Default to first category; restore last active from sessionStorage
            if (accessible.length > 0) {
                try {
                    const saved = sessionStorage.getItem('activeCategoryId');
                    const restored = saved ? accessible.find(c => c._id === saved) : null;
                    const defaultCat = restored || accessible[0];
                    setActiveCategory(defaultCat);
                    if (defaultCat._paymentStatus) setActiveCategoryPaymentStatus(defaultCat._paymentStatus);
                } catch {
                    setActiveCategory(accessible[0]);
                }
            }
        } catch (err) {
            console.error('[Categories] Failed to load accessible categories:', err);
        }
    }, []);

    const handleCategorySelect = (cat) => {
        setActiveCategory(cat);
        setActiveCategoryPaymentStatus(cat._paymentStatus || null);
        try { sessionStorage.setItem('activeCategoryId', cat._id); } catch { /* ignore */ }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (_) { }
    };

    /* ── Per-category filtering ── */
    const activeCatId = activeCategory?._id?.toString();
    const filteredEnrollments = activeCatId
        ? enrollments.filter(e => {
            const catId = e.moduleId?.categoryId?._id?.toString()
                       || e.moduleId?.categoryId?.toString();
            return catId === activeCatId;
        })
        : enrollments;

    const filteredProgressions = activeCatId
        ? progressions.filter(p => {
            const catId = p.categoryId?._id?.toString() || p.categoryId?.toString();
            return catId === activeCatId;
        })
        : progressions;

    const filteredAvailableModules = activeCatId
        ? availableModules.filter(m => {
            const catId = m.categoryId?._id?.toString() || m.categoryId?.toString();
            return catId === activeCatId;
        })
        : availableModules;

    /* ── Derived data (scoped to active category) ── */
    const { totalLessons, completedLessons, overallProgress } = summarizeEnrollments(filteredEnrollments);
    const inProgress = filteredEnrollments.filter(e => {
        if (e.isCompleted) return false;
        // Any enrollment where all lessons are done is no longer "in progress" —
        // it's either pending assessment or completed.
        if (e.allLessonsCompleted) return false;
        return true;
    });

    const pendingAssessments = filteredEnrollments.filter(e => {
        if (e.isCompleted) return false;
        const hasSubmitted = (e.finalAssessmentAttempts || 0) > 0;
        const hasPending = (e.pendingManualGradingCount || 0) > 0;
        const allDone = e.allLessonsCompleted;
        const contentFinalized = e.moduleId?.isContentFinalized ?? false;
        return (allDone && contentFinalized && !hasSubmitted) ||
            (hasSubmitted && !e.finalAssessmentPassed) ||
            hasPending;
    });

    const completed = filteredEnrollments.filter(e => e.isCompleted);
    const certsEarned = completed.filter(e => e.certificateEarned).length;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const visibleNotifs = showAllActivity ? notifications : notifications.slice(0, 5);

    /* Paid/tiered category with no modules yet → show PublishingAcademyView */
    const isActivePaidCategory = activeCategory?.hasTieredPricing && activeCategory?.isPaid;
    const activeCategoryHasContent = filteredEnrollments.length > 0 || filteredAvailableModules.length > 0;
    const showPaidEmptyView = isActivePaidCategory && !activeCategoryHasContent;

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
            <div className="min-h-screen bg-gray-50">

                {/* ════════════════════════════════
                    PAGE HEADER — clean white
                ════════════════════════════════ */}
                <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-5">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            {/* Left: Identity */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-11 w-11 border border-gray-200 shrink-0">
                                    <AvatarFallback className="bg-[#021d49] text-white text-sm font-bold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Welcome back</p>
                                    <h1 className="text-base font-bold text-gray-900 leading-tight">{fullName || firstName}</h1>
                                    {activeCategory && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            <span className="text-xs font-medium text-gray-500 truncate max-w-[240px]">{activeCategory.name}</span>
                                            {activeCategory.isPaid && activeCategory.hasTieredPricing && (
                                                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full shrink-0">PAID</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Stats */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {[
                                    { label: 'Enrolled',    value: filteredEnrollments.length, color: 'text-[#021d49]',  bg: 'bg-blue-50'   },
                                    { label: 'In Progress', value: inProgress.length,           color: 'text-amber-600', bg: 'bg-amber-50'  },
                                    { label: 'Completed',   value: completed.length,             color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'Certificates',value: certsEarned,                 color: 'text-violet-600', bg: 'bg-violet-50' },
                                ].map(({ label, value, color, bg }) => (
                                    <div key={label} className={`flex flex-col items-center justify-center ${bg} rounded-xl px-4 py-2.5 min-w-[68px]`}>
                                        <span className={`text-xl font-extrabold ${color} leading-none`}>{value}</span>
                                        <span className="text-[10px] text-gray-500 mt-1 font-medium text-center">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {filteredEnrollments.length > 0 && (
                            <div className="mt-4 flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-gray-400">Overall progress</span>
                                        <span className="text-xs font-bold text-gray-700">{overallProgress}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-[#021d49] transition-all duration-700"
                                            style={{ width: `${Math.min(100, overallProgress)}%` }}
                                        />
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0 border-gray-200 text-gray-600 hover:text-[#021d49] hover:border-[#021d49] text-xs h-8"
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
                    PROGRAMME SWITCHER
                ════════════════════════════════ */}
                <CategorySwitcher
                    categories={accessibleCategories}
                    active={activeCategory}
                    onSelect={handleCategorySelect}
                />

                {/* ════════════════════════════════
                    STUDENT VERIFICATION BANNER
                ════════════════════════════════ */}
                {verificationStatus && verificationStatus.status === 'pending' && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-3">
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <Icons.Clock className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Student ID Under Review</p>
                                    <p className="text-xs text-amber-700">Your student ID is being reviewed. You'll get access to Arin Publishing Academy once approved.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {verificationStatus && verificationStatus.status === 'rejected' && (
                    <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 lg:px-8 py-3">
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <Icons.XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-red-800">Student ID Rejected</p>
                                    <p className="text-xs text-red-700">
                                        Reason: {verificationStatus.rejectionReason || 'Invalid or unreadable ID'}. Please re-upload.
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 shrink-0"
                                onClick={() => router.push('/student-verification/upload')}>
                                Re-upload ID
                            </Button>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════
                    CERTIFICATE READY BANNER
                ════════════════════════════════ */}
                {issuedCerts.length > 0 && !certBannerDismissed && (
                    <div className="relative overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 sm:px-6 lg:px-8 py-4 shadow-md">
                            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center shrink-0 shadow-sm">
                                        <Award className="w-5 h-5 text-amber-900" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-amber-900 text-sm leading-tight">
                                            🎓 Your {issuedCerts[0]?.moduleLevel
                                                ? issuedCerts[0].moduleLevel.charAt(0).toUpperCase() + issuedCerts[0].moduleLevel.slice(1)
                                                : 'Level'} Certificate is ready!
                                        </p>
                                        <p className="text-amber-800/80 text-xs mt-0.5 leading-tight">
                                            {issuedCerts.length === 1
                                                ? 'Download your certificate and transcript now.'
                                                : `You have ${issuedCerts.length} certificates available to download.`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => router.push('/student/certificates')}
                                        className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                                    >
                                        View Certificates →
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCertBannerDismissed(true);
                                            try { sessionStorage.setItem('cert_banner_dismissed', '1'); } catch (_) {}
                                        }}
                                        className="w-7 h-7 rounded-full bg-amber-900/20 hover:bg-amber-900/30 flex items-center justify-center text-amber-900 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════
                    INSTALLMENT BALANCE BANNER
                ════════════════════════════════ */}
                {(() => {
                    const inst = activeCategoryPaymentStatus?.installmentInfo;
                    if (!inst?.installment1Paid || inst?.installment2Paid) return null;
                    return (
                        <div className="px-4 sm:px-6 lg:px-8 pt-4">
                            <div className="max-w-7xl mx-auto">
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                                <Icons.CreditCard className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Balance Due</p>
                                                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                    {activeCategory?.name} — Installment 2 of 2
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-2 border border-amber-100">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-400 font-medium">Paid</p>
                                                    <p className="text-sm font-bold text-emerald-600">USD {inst.paidAmount?.toLocaleString()}</p>
                                                </div>
                                                <div className="w-px h-8 bg-gray-200" />
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-400 font-medium">Balance</p>
                                                    <p className="text-sm font-bold text-amber-600">USD {inst.balanceDue?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => router.push('/arin-publishing-academy?action=pay-installment2')}
                                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                                            >
                                                Pay Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ════════════════════════════════
                    MAIN CONTENT
                ════════════════════════════════ */}
                {showPaidEmptyView ? (
                    <PublishingAcademyView
                        category={activeCategory}
                        paymentStatus={activeCategoryPaymentStatus}
                        router={router}
                    />
                ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ══ LEFT / MAIN COLUMN ══ */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Programme title */}
                            {activeCategory && (
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 bg-[#021d49] rounded-full shrink-0" />
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{activeCategory.name}</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">Your learning dashboard for this programme</p>
                                    </div>
                                </div>
                            )}

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
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                        {[
                                            { icon: 'BookOpen',     label: 'Browse',       sub: 'All modules',  color: 'text-blue-600',   bgColor: 'bg-blue-50',   href: '/student/modules' },
                                            { icon: 'MessageSquare',label: 'Discussions',   sub: 'Forums',       color: 'text-teal-600',   bgColor: 'bg-teal-50',   href: '/student/modules' },
                                            { icon: 'Library',      label: 'Resource Hub', sub: 'Docs & files', color: 'text-violet-600', bgColor: 'bg-violet-50', href: '/student/projects' },
                                            { icon: 'Award',        label: 'Certificates', sub: 'My awards',    color: 'text-indigo-600', bgColor: 'bg-indigo-50', href: '/student/certificates' },
                                            { icon: 'Trophy',       label: 'Achievements', sub: 'Progress',     color: 'text-amber-600',  bgColor: 'bg-amber-50',  href: '/student/achievements' },
                                            { icon: 'User',         label: 'Profile',      sub: 'My account',   color: 'text-gray-600',   bgColor: 'bg-gray-100',  href: '/student/profile' },
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
                                                {filteredAvailableModules.length > 0 && (
                                                    <span className="ml-1.5 bg-[#021d49] text-white text-[10px] rounded-full px-1.5 py-0.5">{filteredAvailableModules.length}</span>
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
                                        filteredAvailableModules.length > 0 ? (
                                            <>
                                                {/* Sequential learning notice */}
                                                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-3">
                                                    <Icons.ListOrdered className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-amber-800 leading-relaxed">
                                                        <span className="font-semibold">Sequential Learning:</span> You must complete Module 1 before accessing Module 2, and so on within each programme.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                    {filteredAvailableModules.slice(0, 6).map((mod) => (
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
                                                    {filteredAvailableModules.length > 6 && (
                                                        <Badge className="ml-2 h-4 px-1.5 text-[10px] bg-gray-200 text-gray-600 border-0">
                                                            +{filteredAvailableModules.length - 6} more
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </>
                                        ) : (
                                            <Empty icon="BookOpen" title="All caught up!" sub="You're enrolled in all available modules." />
                                        )
                                    ) : (
                                        /* Progress view */
                                        filteredEnrollments.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredEnrollments.map((e) => {
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
                            {filteredProgressions.length > 0 && (
                                <Card className="border-gray-100 shadow-sm">
                                    <CardHeader className="px-5 pt-5 pb-3">
                                        <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.TrendingUp className="w-4 h-4 text-[#021d49]" />
                                            Level Progression
                                        </CardTitle>
                                        <p className="text-xs text-gray-400 mt-0.5">Your journey through each category — complete a level to unlock the next</p>
                                    </CardHeader>
                                    <CardContent className="px-5 pb-5 space-y-4">
                                        {filteredProgressions.map((prog) => {
                                            const catName = prog.categoryId?.name || prog.categoryName || 'Category';
                                            const catId   = prog.categoryId?._id || prog.categoryId;
                                            const levels = ['beginner', 'intermediate', 'advanced'];
                                            const currentIdx = levels.indexOf(prog.currentLevel || 'beginner');

                                            // Derive per-level counts from enrollment data when the progression
                                            // record has 0 totalModules (backend may not populate levels map).
                                            const levelStats = (level) => {
                                                const backend = prog.levels?.[level] || {};
                                                if (backend.totalModules > 0) return backend;
                                                const matching = filteredEnrollments.filter(e => {
                                                    const modLevel = (e.moduleId?.level || '').toLowerCase();
                                                    const modCat   = e.moduleId?.categoryId?._id?.toString()
                                                                  || e.moduleId?.categoryId?.toString();
                                                    return modLevel === level && (!catId || modCat === catId?.toString());
                                                });
                                                return {
                                                    totalModules: matching.length,
                                                    completedModules: matching.filter(e => e.isCompleted).length,
                                                };
                                            };
                                            const levelCfg = {
                                                beginner: {
                                                    active: 'bg-blue-700 text-white border-blue-800 shadow-md shadow-blue-200',
                                                    done: 'bg-blue-50 text-blue-700 border-blue-200',
                                                    locked: 'bg-gray-50 text-gray-400 border-gray-200',
                                                    bar: 'bg-blue-300',
                                                    dot: 'bg-blue-700',
                                                    connectorDone: 'bg-blue-700',
                                                },
                                                intermediate: {
                                                    active: 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200',
                                                    done: 'bg-amber-50 text-amber-700 border-amber-200',
                                                    locked: 'bg-gray-50 text-gray-400 border-gray-200',
                                                    bar: 'bg-amber-300',
                                                    dot: 'bg-amber-500',
                                                    connectorDone: 'bg-amber-500',
                                                },
                                                advanced: {
                                                    active: 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-200',
                                                    done: 'bg-rose-50 text-rose-700 border-rose-200',
                                                    locked: 'bg-gray-50 text-gray-400 border-gray-200',
                                                    bar: 'bg-rose-300',
                                                    dot: 'bg-rose-600',
                                                    connectorDone: 'bg-rose-600',
                                                },
                                            };
                                            const isAtIntermediate = prog.currentLevel === 'intermediate';
                                            return (
                                                <div key={prog._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    {/* Category header with connector dots */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{catName}</p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                                                                Current level: <span className="font-bold text-gray-600">{prog.currentLevel || 'beginner'}</span>
                                                            </p>
                                                        </div>
                                                        {/* Step connector dots */}
                                                        <div className="flex items-center gap-1">
                                                            {levels.map((l, i) => (
                                                                <React.Fragment key={l}>
                                                                    <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${i < currentIdx ? `${levelCfg[l].dot} border-transparent` : i === currentIdx ? `${levelCfg[l].dot} border-white ring-2 ring-offset-1 ring-current` : 'bg-white border-gray-300'}`} />
                                                                    {i < 2 && <div className={`w-5 h-0.5 rounded-full transition-colors ${i < currentIdx ? levelCfg[l].connectorDone : 'bg-gray-200'}`} />}
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Level tiles */}
                                                    <div className="grid grid-cols-3 gap-3 items-end">
                                                        {levels.map((level, li) => {
                                                            const isPast    = li < currentIdx;
                                                            const isCurrent = li === currentIdx;
                                                            const isLocked  = li > currentIdx;
                                                            const ld  = levelStats(level);
                                                            const cfg = levelCfg[level];
                                                            const pct = ld.totalModules > 0 ? Math.round(((ld.completedModules || 0) / ld.totalModules) * 100) : 0;
                                                            const tileClass = isCurrent ? cfg.active : isPast ? cfg.done : cfg.locked;
                                                            return (
                                                                <div key={level} className="flex flex-col items-center gap-1">
                                                                    {/* "Active" badge above current level */}
                                                                    {isCurrent && (
                                                                        <span className="px-2 py-0.5 bg-[#021d49] text-white text-[9px] font-bold rounded-full tracking-wide uppercase animate-pulse">
                                                                            Active
                                                                        </span>
                                                                    )}
                                                                    {isPast && (
                                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded-full tracking-wide uppercase">
                                                                            Done
                                                                        </span>
                                                                    )}
                                                                    {isLocked && (
                                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-bold rounded-full tracking-wide uppercase">
                                                                            Locked
                                                                        </span>
                                                                    )}
                                                                    <div className={`w-full rounded-2xl border-2 p-4 transition-all duration-300 ${tileClass} ${isCurrent ? 'scale-105 shadow-xl' : 'scale-100'}`}>
                                                                        <div className="flex justify-center mb-2">
                                                                            {isCurrent
                                                                                ? <Icons.Zap className="w-6 h-6" />
                                                                                : isPast
                                                                                    ? <Icons.CheckCircle className="w-5 h-5" />
                                                                                    : <Icons.Lock className="w-5 h-5 opacity-40" />}
                                                                        </div>
                                                                        <p className="text-[11px] font-bold capitalize text-center leading-tight tracking-wide">{level}</p>
                                                                        <p className={`text-sm font-bold text-center mt-1 ${isCurrent ? 'text-white' : ''}`}>
                                                                            {ld.completedModules || 0}<span className="text-[10px] font-normal opacity-70">/{ld.totalModules || 0}</span>
                                                                        </p>
                                                                        {(isCurrent || isPast) && ld.totalModules > 0 && (
                                                                            <div className="mt-2 h-1.5 rounded-full bg-white/30 overflow-hidden">
                                                                                <div className={`h-full rounded-full transition-all duration-700 ${isCurrent ? 'bg-white/80' : cfg.bar}`} style={{ width: `${pct}%` }} />
                                                                            </div>
                                                                        )}
                                                                        {isLocked && (
                                                                            <p className="text-[8px] text-center mt-1.5 opacity-40 leading-tight">Complete {levels[li - 1]}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Capstone optional note — shown when student is at intermediate */}
                                                    {isAtIntermediate && (
                                                        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                                                            <Icons.Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-[11px] font-semibold text-amber-800">Capstone Project (Module 7) is optional</p>
                                                                <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                                                                    You can proceed to the next module without completing the Capstone Project. It is available for extra credit and deeper learning.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Empty state: no enrollments at all */}
                            {filteredEnrollments.length === 0 && filteredAvailableModules.length === 0 && (
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
                            <Card className="border-gray-100 shadow-sm">
                                <CardContent className="p-5">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Programme Summary</p>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Lessons Completed', value: `${completedLessons}/${totalLessons}`, icon: 'BookOpen',    color: 'text-[#021d49]'   },
                                            { label: 'Overall Progress',   value: `${overallProgress}%`,                icon: 'BarChart2',   color: 'text-[#021d49]'   },
                                            { label: 'Certificates',       value: certsEarned,                         icon: 'Award',       color: 'text-violet-500'  },
                                            { label: 'Completed Modules',  value: completed.length,                    icon: 'CheckCircle', color: 'text-emerald-500' },
                                        ].map(({ label, value, icon, color }) => {
                                            const Ic = Icons[icon];
                                            return (
                                                <div key={label} className="flex items-center justify-between py-0.5">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        {Ic && <Ic className={`w-3.5 h-3.5 ${color}`} />}
                                                        {label}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline"
                                            className="flex-1 text-xs border-gray-200 text-gray-600 hover:text-[#021d49] hover:border-[#021d49] h-8"
                                            onClick={() => router.push('/student/certificates')}>
                                            <Icons.Award className="w-3.5 h-3.5 mr-1.5" /> Certificates
                                        </Button>
                                        <Button size="sm" variant="outline"
                                            className="flex-1 text-xs border-gray-200 text-gray-600 hover:text-[#021d49] hover:border-[#021d49] h-8"
                                            onClick={() => router.push('/student/achievements')}>
                                            <Icons.Trophy className="w-3.5 h-3.5 mr-1.5" /> Achievements
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Unread Messages Banner */}
                            {unreadMessages > 0 && (
                                <Card
                                    className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                                    onClick={() => router.push('/student/messages')}
                                >
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center relative shrink-0 group-hover:bg-blue-200 transition-colors">
                                            <Icons.Inbox className="w-5 h-5 text-blue-600" />
                                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                                {unreadMessages > 9 ? '9+' : unreadMessages}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-blue-900">
                                                {unreadMessages === 1 ? '1 new message' : `${unreadMessages} new messages`}
                                            </p>
                                            <p className="text-xs text-blue-500">Open your inbox to read</p>
                                        </div>
                                        <Icons.ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors shrink-0" />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Resource Hub CTA */}
                            <Card
                                className="border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                                onClick={() => router.push('/student/projects')}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
                                            <Icons.Library className="w-5 h-5 text-violet-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">Resource Hub</p>
                                            <p className="text-xs text-gray-500">Share &amp; explore documents</p>
                                        </div>
                                        <Icons.ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors shrink-0" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-relaxed pl-[52px]">
                                        Upload research, reports &amp; data files. Approved submissions are visible to all students.
                                    </p>
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
                )} {/* end showPaidEmptyView ternary */}
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
