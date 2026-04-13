"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, CheckCircle, Lock, Loader2, AlertTriangle,
    Users, BookOpen, Award, DollarSign, Unlock, Star,
    Play, Clock, UserCheck, Mail, ChevronDown,
    Target, GraduationCap, Lightbulb, BookMarked, FileQuestion,
    Crosshair, ListChecks, MessageSquare, FolderOpen, Sparkles
} from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import paymentService from '@/lib/api/paymentService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

const FELLOWSHIP_EMAIL = process.env.NEXT_PUBLIC_FELLOWSHIP_EMAIL || 'fellowship@arinlearning.org';

function getInstructorName(mod) {
    if (mod.instructorIds && mod.instructorIds.length > 0) {
        const lead = mod.instructorIds[0];
        if (lead) {
            const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
            if (name) return name;
            if (lead.email) return lead.email;
        }
    }
    return 'Instructor';
}

function getInstructorInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0]?.toUpperCase() || '?';
}

function stripHtml(html) {
    if (!html) return '';
    return String(html)
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function resolveCategoryAccess(cat) {
    if (!cat) return { isPaid: false, isFellowOnly: false, isFree: true };
    const at = cat.accessType?.toLowerCase();
    if (at === 'free') return { isPaid: false, isFellowOnly: true, isFree: false };
    if (cat.isPaid === true || at === 'paid') return { isPaid: true, isFellowOnly: false, isFree: false };
    if (at === 'restricted' && cat.price > 0) return { isPaid: true, isFellowOnly: false, isFree: false };
    return { isPaid: false, isFellowOnly: false, isFree: true };
}

const INFO_SECTIONS = [
    { key: 'welcomeMessage', label: 'Welcome Message', icon: MessageSquare, color: 'blue' },
    { key: 'moduleAim', label: 'Module Aim', icon: Crosshair, color: 'indigo' },
    { key: 'moduleObjectives', label: 'Module Objectives', icon: ListChecks, color: 'green' },
    { key: 'capstoneProjectDescription', label: 'Capstone Project', icon: Target, color: 'purple' },
];

const COLOR_MAP = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   label: 'text-blue-700',   text: 'text-blue-900' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', label: 'text-indigo-700', text: 'text-indigo-900' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  icon: 'text-green-600',  label: 'text-green-700',  text: 'text-green-900' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', label: 'text-purple-700', text: 'text-purple-900' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-600',  label: 'text-amber-700',  text: 'text-amber-900' },
    rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   icon: 'text-rose-600',   label: 'text-rose-700',   text: 'text-rose-900' },
};

export default function ModuleDetailPage() {
    const { id: moduleId } = useParams();
    const router = useRouter();

    const [mod, setMod] = useState(null);
    const [category, setCategory] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [hasPaid, setHasPaid] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [fellowCategoryIds, setFellowCategoryIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [expandedTopics, setExpandedTopics] = useState([0]);

    const showToast = (msg, type = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const user = authService.getCurrentUser();
        setIsLoggedIn(!!user);
        if (user?.fellowData?.assignedCategories) {
            setFellowCategoryIds(
                user.fellowData.assignedCategories.map(id => id?.toString?.() || String(id))
            );
        }
        loadData(!!user);
    }, [moduleId]);

    const loadData = async (loggedIn) => {
        try {
            setLoading(true);
            setError('');
            const modData = await moduleService.getModuleById(moduleId);
            setMod(modData);

            const catId = modData.categoryId?._id || modData.categoryId;
            let catData = null;
            if (catId) {
                catData = await categoryService.getCategoryById(catId);
                setCategory(catData);
            }

            if (loggedIn) {
                try {
                    const enrollData = await moduleEnrollmentService.getMyEnrollmentForModule(moduleId);
                    setEnrollment(enrollData);
                } catch (err) {
                    if (err?.response?.status !== 404) console.error('Enrollment check error:', err);
                    setEnrollment(null);
                }

                if (catData) {
                    const { isPaid } = resolveCategoryAccess(catData);
                    if (isPaid) {
                        try {
                            const payStatus = await paymentService.checkModulePaymentStatus(moduleId);
                            setHasPaid(payStatus?.hasPaid === true || payStatus?.status === 'completed');
                        } catch {
                            setHasPaid(false);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading module:', err);
            setError(err?.response?.data?.message || 'Failed to load module details.');
        } finally {
            setLoading(false);
        }
    };

    const { isPaid, isFellowOnly, isFree } = resolveCategoryAccess(category);
    const catPrice = category?.price;
    const catId = category?._id?.toString() || category?.id?.toString();
    const isFellow = catId ? fellowCategoryIds.includes(catId) : false;
    const hasFellowAccess = isFellow;
    const isFellowBlocked = isFellowOnly && !hasFellowAccess && !hasPaid && !enrollment;
    const effectivelyFree = isFree || (isFellowOnly && hasFellowAccess) || (isPaid && hasFellowAccess) || hasPaid;
    const effectivelyPaid = isPaid && !hasFellowAccess && !hasPaid;

    const handleEnroll = async () => {
        if (!isLoggedIn) {
            router.push(`/login?redirect=/modules/${moduleId}`);
            return;
        }
        if (enrollment) {
            router.push(`/student/modules/${moduleId}`);
            return;
        }
        if (effectivelyPaid) {
            try {
                setEnrolling(true);
                const payData = await paymentService.initializeModulePayment(moduleId);
                paymentService.redirectToPaystack(payData.authorizationUrl);
            } catch (payErr) {
                showToast(payErr?.response?.data?.message || 'Payment initialization failed.', 'error');
                setEnrolling(false);
            }
            return;
        }
        try {
            setEnrolling(true);
            const enrollResult = await moduleEnrollmentService.enrollInModule(moduleId);
            if (enrollResult?.requiresPayment) {
                const payData = await paymentService.initializeModulePayment(moduleId);
                paymentService.redirectToPaystack(payData.authorizationUrl);
                return;
            }
            showToast('Successfully enrolled! Starting module...', 'success');
            setTimeout(() => router.push(`/student/modules/${moduleId}`), 1200);
        } catch (err) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message || '';
            if (status === 403) {
                showToast(msg || 'Access restricted. Contact the admin for access.', 'error');
            } else {
                showToast(msg || 'Enrollment failed. Please try again.', 'error');
            }
        } finally {
            setEnrolling(false);
        }
    };

    const getCTA = () => {
        if (isFellowBlocked) return { label: 'Fellows Only', icon: Award, style: 'bg-purple-200 text-purple-800 cursor-not-allowed', disabled: true };
        if (enrollment) {
            const lastLesson = enrollment.lastAccessedLesson ?? 0;
            return { label: `Resume from Lesson ${lastLesson + 1}`, icon: Play, style: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white' };
        }
        if (!isLoggedIn) return { label: isFellowOnly ? 'Sign In (Fellows Only)' : effectivelyPaid ? 'Sign In' : 'Sign In to Enroll for Free', icon: UserCheck, style: 'bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white' };
        if (effectivelyFree) return { label: 'Enroll for Free', icon: Unlock, style: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white' };
        if (effectivelyPaid) return { label: catPrice ? `Pay KES ${catPrice.toLocaleString()} to Access` : 'Purchase Access', icon: DollarSign, style: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white' };
        return { label: 'Access Restricted', icon: Lock, style: 'bg-gray-300 text-gray-600 cursor-not-allowed', disabled: true };
    };

    if (loading) return (
        <>
            <Navbar />
            <main className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#021d49] mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">Loading module details...</p>
                </div>
            </main>
            <Footer />
        </>
    );

    if (error || !mod) return (
        <>
            <Navbar />
            <main className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'This module could not be loaded.'}</p>
                    <button onClick={() => router.push('/modules')} className="bg-[#021d49] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#032e6b]">Browse Modules</button>
                </div>
            </main>
            <Footer />
        </>
    );

    const instructorName = getInstructorName(mod);
    const initials = getInstructorInitials(instructorName);
    const lessons = mod.lessons || [];
    const topics = mod.topics || [];
    const cta = getCTA();
    const CTA = cta;
    const visibleInfoSections = INFO_SECTIONS.filter(s => stripHtml(mod[s.key]));
    const totalLessons = topics.length > 0 ? topics.reduce((acc, t) => acc + (t.lessons?.length || 0), 0) : lessons.length;
    const totalTopics = topics.length;

    const toggleTopic = (i) => setExpandedTopics(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

    return (
        <>
            <Navbar />
            {toast && (
                <div className={`fixed top-24 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-semibold text-sm transition-all ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-[#021d49]'}`}>
                    {toast.msg}
                </div>
            )}

            <main className="pt-20 pb-16 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-8 group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Modules
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ── MAIN CONTENT ── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Hero Card */}
                            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                                {(mod.bannerUrl || mod.thumbnailUrl) && (
                                    <img src={mod.bannerUrl || mod.thumbnailUrl} alt={mod.title} className="w-full h-72 object-cover" />
                                )}
                                <div className="p-8">
                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {mod.level && (
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${mod.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' : mod.level === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {mod.level}
                                            </span>
                                        )}
                                        {(category?.name || mod.categoryId?.name) && (
                                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700">
                                                {category?.name || mod.categoryId?.name}
                                            </span>
                                        )}
                                        {isFellowOnly && (
                                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                                                <Award className="w-3 h-3" /> Fellows Only
                                            </span>
                                        )}
                                        {enrollment && (
                                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Enrolled
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{mod.title}</h1>

                                    {stripHtml(mod.description) && (
                                        <p className="text-gray-600 text-lg leading-relaxed mb-6">{stripHtml(mod.description)}</p>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                        <div className="bg-blue-50 rounded-2xl p-4 text-center">
                                            <BookOpen className="w-5 h-5 text-[#021d49] mx-auto mb-1" />
                                            <p className="text-xl font-bold text-gray-900">{totalTopics || totalLessons}</p>
                                            <p className="text-xs text-gray-500">{totalTopics ? 'Topics' : 'Lessons'}</p>
                                        </div>
                                        {totalTopics > 0 && (
                                            <div className="bg-violet-50 rounded-2xl p-4 text-center">
                                                <ListChecks className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                                                <p className="text-xl font-bold text-gray-900">{totalLessons}</p>
                                                <p className="text-xs text-gray-500">Lessons</p>
                                            </div>
                                        )}
                                        <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                                            <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                                            <p className="text-xl font-bold text-gray-900">{(mod.enrollmentCount || 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">Students</p>
                                        </div>
                                        <div className="bg-amber-50 rounded-2xl p-4 text-center">
                                            <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                                            <p className="text-xl font-bold text-gray-900">{(mod.avgRating || 0).toFixed(1)}</p>
                                            <p className="text-xs text-gray-500">Rating</p>
                                        </div>
                                        {totalTopics === 0 && (
                                            <div className="bg-green-50 rounded-2xl p-4 text-center">
                                                <Award className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                                <p className="text-xl font-bold text-gray-900">{mod.finalAssessment ? 'Yes' : 'No'}</p>
                                                <p className="text-xs text-gray-500">Certificate</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Duration + Category row */}
                                    <div className="flex flex-wrap gap-4 text-sm mb-6">
                                        {mod.duration && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4 text-[#021d49]" />
                                                <span><strong>Duration:</strong> {mod.duration}</span>
                                            </div>
                                        )}
                                        {(category?.name || mod.categoryId?.name) && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <FolderOpen className="w-4 h-4 text-[#021d49]" />
                                                <span><strong>Category:</strong> {category?.name || mod.categoryId?.name}</span>
                                            </div>
                                        )}
                                        {mod.finalAssessment && (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <Award className="w-4 h-4" />
                                                <span><strong>Certificate</strong> upon completion</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Instructor */}
                                    <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-blue-100">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#021d49] to-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md flex-shrink-0">
                                            {initials}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Lead Instructor</p>
                                            <p className="text-base font-bold text-gray-900">{instructorName}</p>
                                        </div>
                                    </div>

                                    {/* Progress if enrolled */}
                                    {enrollment && (
                                        <div className="mt-6 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-gray-700">Your Progress</span>
                                                <span className="text-sm font-bold text-emerald-600">
                                                    {enrollment.progress || 0}% — Lesson {(enrollment.lastAccessedLesson || 0) + 1}/{totalLessons || 1}
                                                </span>
                                            </div>
                                            <div className="w-full bg-emerald-200 rounded-full h-3">
                                                <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all" style={{ width: `${enrollment.progress || 0}%` }} />
                                            </div>
                                            <p className="text-xs text-emerald-700 mt-2 font-medium">
                                                {enrollment.completedLessons || 0} of {enrollment.totalLessons || totalLessons} lessons completed
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category Welcome Message */}
                            {category?.welcomeMessage?.trim() && (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Header strip */}
                                    <div className="bg-gradient-to-r from-[#021d49] to-blue-700 px-8 py-5 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest leading-none mb-0.5">Programme Welcome</p>
                                            <p className="text-white font-bold text-base leading-tight">{category.name}</p>
                                        </div>
                                    </div>
                                    {/* Body */}
                                    <div
                                        className="px-8 py-6 prose prose-base max-w-none
                                            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-3
                                            prose-li:text-gray-600 prose-li:leading-relaxed
                                            prose-strong:text-gray-800 prose-strong:font-semibold
                                            prose-h1:text-gray-900 prose-h2:text-gray-900 prose-h3:text-gray-800
                                            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                            prose-ol:pl-5 prose-ul:pl-5"
                                        dangerouslySetInnerHTML={{ __html: category.welcomeMessage }}
                                    />
                                </div>
                            )}

                            {/* Info sections: welcome, aim, objectives, capstone */}
                            {visibleInfoSections.length > 0 && (
                                <div className="space-y-4">
                                    {visibleInfoSections.map(section => {
                                        const c = COLOR_MAP[section.color];
                                        const Icon = section.icon;
                                        const text = stripHtml(mod[section.key]);
                                        return (
                                            <div key={section.key} className={`${c.bg} border ${c.border} rounded-2xl p-6`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Icon className={`w-5 h-5 ${c.icon} flex-shrink-0`} />
                                                    <h3 className={`font-bold text-base ${c.label}`}>{section.label}</h3>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${c.text} whitespace-pre-line`}>{text}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Learning Outcomes */}
                            {(() => {
                                const val = mod.learningOutcomes;
                                const hasData = Array.isArray(val) ? val.length > 0 : stripHtml(val);
                                if (!hasData) return null;
                                return (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Lightbulb className="w-5 h-5 text-amber-600" />
                                            <h3 className="font-bold text-amber-700">Learning Outcomes</h3>
                                        </div>
                                        {Array.isArray(val) ? (
                                            <ul className="space-y-2">
                                                {val.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                                                        <CheckCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                        <span>{typeof item === 'string' ? item : item.text || item.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm leading-relaxed text-amber-900 whitespace-pre-line">{stripHtml(val)}</p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Target Audience */}
                            {(() => {
                                const val = mod.targetAudience;
                                const hasData = Array.isArray(val) ? val.length > 0 : stripHtml(val);
                                if (!hasData) return null;
                                return (
                                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            <h3 className="font-bold text-purple-700">Target Audience</h3>
                                        </div>
                                        {Array.isArray(val) ? (
                                            <ul className="space-y-2">
                                                {val.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-purple-900">
                                                        <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                        <span>{typeof item === 'string' ? item : item.text || item.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm leading-relaxed text-purple-900 whitespace-pre-line">{stripHtml(val)}</p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Prerequisites */}
                            {(() => {
                                const val = mod.prerequisites;
                                const hasData = Array.isArray(val) ? val.length > 0 : stripHtml(val);
                                if (!hasData) return null;
                                return (
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BookMarked className="w-5 h-5 text-rose-600" />
                                            <h3 className="font-bold text-rose-700">Prerequisites</h3>
                                        </div>
                                        {Array.isArray(val) ? (
                                            <ul className="space-y-2">
                                                {val.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-rose-900">
                                                        <CheckCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                                        <span>{typeof item === 'string' ? item : item.text || item.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm leading-relaxed text-rose-900 whitespace-pre-line">{stripHtml(val)}</p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Topics (locked) - show if topics exist */}
                            {topics.length > 0 && (
                                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-[#021d49]" />
                                            <h3 className="text-xl font-bold text-gray-900">
                                                Module Content
                                                <span className="ml-2 text-sm font-normal text-gray-500">({topics.length} Topics · {totalLessons} Lessons)</span>
                                            </h3>
                                        </div>
                                        {!enrollment && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                                <Lock className="w-3.5 h-3.5" />
                                                <span>Enroll to unlock</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {topics.map((topic, ti) => {
                                            const isOpen = expandedTopics.includes(ti);
                                            const topicLessons = topic.lessons || [];
                                            return (
                                                <div key={ti}>
                                                    <button onClick={() => toggleTopic(ti)} className="w-full flex items-center gap-4 px-8 py-5 hover:bg-gray-50 text-left transition-colors">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#021d49] to-blue-700 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-md">
                                                            {ti + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-900 text-base">{topic.name || topic.title || `Topic ${ti + 1}`}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {topicLessons.length} {topicLessons.length === 1 ? 'lesson' : 'lessons'}
                                                                {topic.duration && ` · ${topic.duration}`}
                                                            </p>
                                                        </div>
                                                        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {isOpen && topicLessons.length > 0 && (
                                                        <div className="px-8 pb-4 space-y-2 bg-gray-50/60">
                                                            {topicLessons.map((lesson, li) => {
                                                                const lessonProg = enrollment?.lessonProgress?.find(lp => lp.lessonIndex === (topics.slice(0, ti).reduce((a, t) => a + (t.lessons?.length || 0), 0) + li));
                                                                const done = lessonProg?.isCompleted;
                                                                return (
                                                                    <div key={li} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                                            {done ? <CheckCircle className="w-4 h-4" /> : li + 1}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold text-gray-800 text-sm truncate">{lesson.title || `Lesson ${li + 1}`}</p>
                                                                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                                                {lesson.duration && (
                                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                                        <Clock className="w-3 h-3" /> {lesson.duration}
                                                                                    </span>
                                                                                )}
                                                                                {lesson.assessment?.questions?.length > 0 && (
                                                                                    <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                                                                        <FileQuestion className="w-3 h-3" /> Quiz
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {!enrollment && <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Flat lesson list fallback if no topics */}
                            {topics.length === 0 && lessons.length > 0 && (
                                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-[#021d49]" />
                                        Module Content ({lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'})
                                    </h3>
                                    <div className="space-y-2">
                                        {lessons.map((lesson, idx) => {
                                            const lessonProg = enrollment?.lessonProgress?.find(lp => lp.lessonIndex === idx);
                                            const done = lessonProg?.isCompleted;
                                            return (
                                                <div key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-[#021d49] text-white'}`}>
                                                        {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm truncate">{lesson.title}</p>
                                                        <div className="flex items-center gap-3 mt-0.5">
                                                            {lesson.duration && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.duration}</span>}
                                                            {lesson.assessment?.questions?.length > 0 && <span className="text-xs text-indigo-600 font-medium">Has Quiz</span>}
                                                        </div>
                                                    </div>
                                                    {!enrollment && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── SIDEBAR ── */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7 sticky top-24 space-y-5">
                                {isFellowBlocked && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Award className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                            <p className="text-purple-800 font-bold text-sm">Fellows-Only Module</p>
                                        </div>
                                        <p className="text-purple-700 text-xs leading-relaxed mb-3">This module is free only for fellows added by the admin. Non-fellows must pay to access.</p>
                                        <a href={`mailto:${FELLOWSHIP_EMAIL}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 underline">
                                            <Mail className="w-3.5 h-3.5" /> Contact: {FELLOWSHIP_EMAIL}
                                        </a>
                                    </div>
                                )}
                                {hasFellowAccess && !enrollment && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1"><Award className="w-5 h-5 text-purple-600" /><p className="text-purple-700 font-bold">Fellow Access</p></div>
                                        <p className="text-sm text-gray-500">You have free access as an approved fellow.</p>
                                    </div>
                                )}
                                {isFree && !enrollment && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1"><Unlock className="w-5 h-5 text-emerald-600" /><p className="text-emerald-600 font-bold text-lg">Free Access</p></div>
                                        <p className="text-sm text-gray-500">No payment required. Sign in to enroll.</p>
                                    </div>
                                )}
                                {hasPaid && !enrollment && !hasFellowAccess && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-5 h-5 text-emerald-600" /><p className="text-emerald-600 font-bold">Payment confirmed</p></div>
                                        <p className="text-sm text-gray-500">You have category access. Enroll to start learning.</p>
                                    </div>
                                )}
                                {enrollment && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-5 h-5 text-emerald-600" /><p className="text-emerald-600 font-bold">You are enrolled</p></div>
                                        <p className="text-sm text-gray-500">{enrollment.progress || 0}% complete · Resume from Lesson {(enrollment.lastAccessedLesson || 0) + 1}</p>
                                    </div>
                                )}
                                {effectivelyPaid && !enrollment && !hasPaid && (
                                    <div className="pb-5 border-b border-gray-100 text-center">
                                        <p className="text-3xl font-extrabold text-[#021d49]">KES {catPrice?.toLocaleString() || '—'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Category access · All modules included</p>
                                    </div>
                                )}

                                {/* CTA */}
                                <button
                                    onClick={CTA?.disabled ? undefined : handleEnroll}
                                    disabled={enrolling || CTA?.disabled}
                                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${CTA?.style || 'bg-[#021d49] text-white'}`}
                                >
                                    {enrolling ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                    ) : (
                                        <>{CTA?.icon && <CTA.icon className="w-5 h-5" />}{CTA?.label || 'Get Started'}</>
                                    )}
                                </button>

                                {!isLoggedIn && (
                                    <p className="text-center text-sm text-gray-500">
                                        Already have an account?{' '}
                                        <a href="/login" className="text-[#021d49] font-semibold hover:underline">Sign in</a>
                                    </p>
                                )}

                                {/* What's Included */}
                                <div className="pt-5 border-t border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-3 text-sm">What's Included</h4>
                                    <ul className="space-y-2.5 text-sm text-gray-600">
                                        {totalTopics > 0 && (
                                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{totalTopics} topics with {totalLessons} lessons</li>
                                        )}
                                        {totalTopics === 0 && (
                                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{totalLessons} comprehensive {totalLessons === 1 ? 'lesson' : 'lessons'}</li>
                                        )}
                                        {mod.finalAssessment && <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />Final assessment + Certificate</li>}
                                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />Resume from where you left off</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />Downloadable resources</li>
                                        <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />Expert instructor guidance</li>
                                    </ul>
                                </div>

                                {/* Instructor card */}
                                <div className="pt-5 border-t border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-3 text-sm">Your Instructor</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#021d49] to-blue-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">{initials}</div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{instructorName}</p>
                                            <p className="text-xs text-gray-500">Lead Instructor</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
