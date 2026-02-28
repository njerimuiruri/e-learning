"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, CheckCircle, Lock, Loader2, AlertTriangle,
    Users, BookOpen, Award, DollarSign, Unlock, Star,
    Play, ChevronRight, Layers, Clock, UserCheck, Mail,
    Target, GraduationCap, Lightbulb
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
    if (html === null || html === undefined || html === '') return '';
    const str = String(html);
    return str
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

// "free" category = fellows-only in the new access logic
function resolveCategoryAccess(cat) {
    if (!cat) return { isPaid: false, isFellowOnly: false, isFree: true };
    const at = cat.accessType?.toLowerCase();
    if (at === 'free') return { isPaid: false, isFellowOnly: true, isFree: false };
    if (cat.isPaid === true || at === 'paid') return { isPaid: true, isFellowOnly: false, isFree: false };
    if (at === 'restricted' && cat.price > 0) return { isPaid: true, isFellowOnly: false, isFree: false };
    return { isPaid: false, isFellowOnly: false, isFree: true };
}

const INFO_SECTIONS = [
    { key: 'welcomeMessage', label: 'Welcome Message', icon: GraduationCap, color: 'blue' },
    { key: 'moduleAim', label: 'Module Aim', icon: Target, color: 'indigo' },
    { key: 'moduleObjectives', label: 'Module Objectives', icon: CheckCircle, color: 'green' },
    { key: 'targetAudience', label: 'Target Audience', icon: Users, color: 'purple' },
    { key: 'learningOutcomes', label: 'Learning Outcomes', icon: Lightbulb, color: 'amber' },
];

const COLOR_MAP = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   label: 'text-blue-700',   text: 'text-blue-900' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', label: 'text-indigo-700', text: 'text-indigo-900' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  icon: 'text-green-600',  label: 'text-green-700',  text: 'text-green-900' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', label: 'text-purple-700', text: 'text-purple-900' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-600',  label: 'text-amber-700',  text: 'text-amber-900' },
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

    // ─── Access determination ─────────────────────────────────────────────
    const { isPaid, isFellowOnly, isFree } = resolveCategoryAccess(category);
    const catPrice = category?.price;
    const catId = category?._id?.toString() || category?.id?.toString();
    const isFellow = catId ? fellowCategoryIds.includes(catId) : false;

    const hasFellowAccess = isFellow;
    const isFellowBlocked = isFellowOnly && !hasFellowAccess && !hasPaid && !enrollment;
    const effectivelyFree = isFree || (isFellowOnly && hasFellowAccess) || (isPaid && hasFellowAccess) || hasPaid;
    const effectivelyPaid = isPaid && !hasFellowAccess && !hasPaid;

    // ─── Enrollment handler ───────────────────────────────────────────────
    const handleEnroll = async () => {
        if (!isLoggedIn) {
            router.push(`/login?redirect=/modules/${moduleId}`);
            return;
        }
        if (enrollment) {
            router.push(`/student/modules/${moduleId}`);
            return;
        }

        try {
            setEnrolling(true);
            const result = await moduleEnrollmentService.enrollInModule(moduleId);
            if (result?.requiresPayment) {
                try {
                    const payData = await paymentService.initializeModulePayment(moduleId);
                    paymentService.redirectToPaystack(payData.authorizationUrl);
                } catch (payErr) {
                    showToast(payErr?.response?.data?.message || 'Payment initialization failed.', 'error');
                }
                return;
            }
            showToast('Successfully enrolled! Starting module...', 'success');
            setTimeout(() => router.push(`/student/modules/${moduleId}`), 1200);
        } catch (err) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message || '';
            if (status === 403) {
                showToast(msg || 'Access restricted. Contact the admin for access.', 'error');
            } else if (effectivelyPaid) {
                try {
                    const payData = await paymentService.initializeModulePayment(moduleId);
                    paymentService.redirectToPaystack(payData.authorizationUrl);
                } catch (payErr) {
                    showToast(payErr?.response?.data?.message || 'Payment initialization failed.', 'error');
                }
            } else {
                showToast(msg || 'Enrollment failed. Please try again.', 'error');
            }
        } finally {
            setEnrolling(false);
        }
    };

    // ─── CTA config ───────────────────────────────────────────────────────
    const getCTA = () => {
        if (isFellowBlocked) {
            return { label: 'Fellows Only', icon: Award, style: 'bg-purple-200 text-purple-800 cursor-not-allowed', disabled: true };
        }
        if (enrollment) {
            const lastLesson = enrollment.lastAccessedLesson ?? 0;
            return {
                label: `Resume from Lesson ${lastLesson + 1}`,
                icon: Play,
                style: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white',
            };
        }
        if (!isLoggedIn) {
            return {
                label: isFellowOnly ? 'Sign In (Fellows Only)' : effectivelyPaid ? 'Sign In to Purchase' : 'Sign In to Enroll for Free',
                icon: UserCheck,
                style: 'bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white',
            };
        }
        if (effectivelyFree) {
            return {
                label: 'Enroll for Free',
                icon: Unlock,
                style: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white',
            };
        }
        if (effectivelyPaid) {
            return {
                label: catPrice ? `Pay USD ${catPrice.toLocaleString()} to Access` : 'Purchase Access',
                icon: DollarSign,
                style: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white',
            };
        }
        return { label: 'Access Restricted', icon: Lock, style: 'bg-gray-300 text-gray-600 cursor-not-allowed', disabled: true };
    };

    const cta = mod ? getCTA() : null;

    // ─── Loading ──────────────────────────────────────────────────────────
    if (loading) {
        return (
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
    }

    // ─── Error ────────────────────────────────────────────────────────────
    if (error || !mod) {
        return (
            <>
                <Navbar />
                <main className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center px-4">
                    <div className="text-center">
                        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Not Found</h2>
                        <p className="text-gray-600 mb-6">{error || 'This module could not be loaded.'}</p>
                        <button
                            onClick={() => router.push('/modules')}
                            className="bg-[#021d49] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#032e6b] transition-colors"
                        >
                            Browse Modules
                        </button>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const instructorName = getInstructorName(mod);
    const initials = getInstructorInitials(instructorName);
    const lessons = mod.lessons || [];
    const CTA = cta;
    const visibleInfoSections = INFO_SECTIONS.filter(s => stripHtml(mod[s.key]));

    return (
        <>
            <Navbar />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-24 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-semibold text-sm transition-all ${
                    toast.type === 'success' ? 'bg-emerald-600' :
                    toast.type === 'error'   ? 'bg-red-600'     : 'bg-[#021d49]'
                }`}>
                    {toast.msg}
                </div>
            )}

            <main className="pt-20 pb-16 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Back */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-8 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Modules
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* ══════════════ LEFT / MAIN CONTENT ══════════════ */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* ─── Category Card ───────────────────────────── */}
                            {category && (
                                <div className="bg-gradient-to-r from-[#021d49] via-blue-800 to-indigo-700 rounded-3xl overflow-hidden shadow-xl">
                                    <div className="p-8 text-white">
                                        {/* Breadcrumb */}
                                        <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
                                            <Layers className="w-4 h-4" />
                                            <span>Category</span>
                                            <ChevronRight className="w-3 h-3" />
                                            <span className="text-white font-semibold">{category.name}</span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex-1">
                                                <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">{category.name}</h2>
                                                {category.description && (
                                                    <p className="text-blue-200 leading-relaxed text-sm sm:text-base max-w-xl">
                                                        {category.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Access type badge */}
                                            <div className="flex-shrink-0">
                                                {category?.accessType === 'restricted' && (
                                                    <div className="space-y-2 text-center">
                                                        <div className="bg-purple-500/20 border border-purple-400/40 rounded-2xl px-5 py-4">
                                                            <Award className="w-6 h-6 text-purple-300 mx-auto mb-1" />
                                                            <p className="text-purple-300 font-bold text-sm">Fellows Priority</p>
                                                            <p className="text-purple-200 text-xs">Fellows get free access</p>
                                                        </div>
                                                        {catPrice > 0 && (
                                                            <div className="bg-orange-500/20 border border-orange-400/40 rounded-2xl px-5 py-3">
                                                                <p className="text-orange-300 font-bold text-sm">USD {catPrice.toLocaleString()}</p>
                                                                <p className="text-orange-200 text-xs">Public price</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {category?.accessType === 'paid' && (
                                                    <div className="bg-orange-500/20 border border-orange-400/40 rounded-2xl px-5 py-4 text-center">
                                                        <DollarSign className="w-6 h-6 text-orange-300 mx-auto mb-1" />
                                                        <p className="text-orange-300 font-bold text-sm">Paid</p>
                                                        <p className="text-orange-300 font-bold text-base">
                                                            {catPrice ? `USD ${catPrice.toLocaleString()}` : ''}
                                                        </p>
                                                        <p className="text-orange-200 text-xs">Open enrollment</p>
                                                    </div>
                                                )}
                                                {category?.accessType === 'free' && (
                                                    <div className="bg-purple-500/20 border border-purple-400/40 rounded-2xl px-5 py-4 text-center">
                                                        <Award className="w-6 h-6 text-purple-300 mx-auto mb-1" />
                                                        <p className="text-purple-300 font-bold text-sm">Fellows Only</p>
                                                        <p className="text-purple-200 text-xs">Admin-approved access</p>
                                                    </div>
                                                )}
                                                {isFree && !category?.accessType && (
                                                    <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl px-5 py-4 text-center">
                                                        <Unlock className="w-6 h-6 text-emerald-300 mx-auto mb-1" />
                                                        <p className="text-emerald-300 font-bold text-sm">Open Access</p>
                                                        <p className="text-emerald-200 text-xs">No payment needed</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Category rich-text fields */}
                                        {[
                                            { key: 'courseDescription', label: 'Programme Description' },
                                            { key: 'overallObjectives',  label: 'Objectives' },
                                            { key: 'learningOutcomes',   label: 'Learning Outcomes' },
                                        ].map(f => {
                                            if (!category[f.key]?.replace(/<[^>]*>/g, '').trim()) return null;
                                            return (
                                                <div key={f.key} className="mt-5 pt-5 border-t border-white/20">
                                                    <h4 className="text-blue-300 text-xs font-bold uppercase tracking-wide mb-2">{f.label}</h4>
                                                    <div
                                                        className="text-blue-100 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: category[f.key] }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ─── Module Info Card ─────────────────────────── */}
                            <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                                {(mod.bannerUrl || mod.thumbnailUrl) && (
                                    <img
                                        src={mod.bannerUrl || mod.thumbnailUrl}
                                        alt={mod.title}
                                        className="w-full h-64 object-cover"
                                    />
                                )}

                                <div className="p-8">
                                    {/* Tag pills */}
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {mod.level && (
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                                                mod.level === 'beginner'     ? 'bg-green-100 text-green-700' :
                                                mod.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                                               'bg-red-100 text-red-700'
                                            }`}>
                                                {mod.level}
                                            </span>
                                        )}
                                        {isFellowOnly && (
                                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                                                <Award className="w-3 h-3" /> Fellows Only
                                            </span>
                                        )}
                                        {enrollment && (
                                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Enrolled
                                            </span>
                                        )}
                                        {hasPaid && !enrollment && (
                                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Access Paid
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                                        {mod.title}
                                    </h1>

                                    {stripHtml(mod.description) && (
                                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                            {stripHtml(mod.description)}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-2xl p-4 text-center">
                                            <BookOpen className="w-5 h-5 text-[#021d49] mx-auto mb-1" />
                                            <p className="text-xl font-bold text-gray-900">{lessons.length}</p>
                                            <p className="text-xs text-gray-500">Lessons</p>
                                        </div>
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
                                        <div className="bg-green-50 rounded-2xl p-4 text-center">
                                            <Award className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                            <p className="text-xl font-bold text-gray-900">{mod.finalAssessment ? 'Yes' : 'No'}</p>
                                            <p className="text-xs text-gray-500">Certificate</p>
                                        </div>
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

                                    {/* Progress (if enrolled) */}
                                    {enrollment && (
                                        <div className="mt-6 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-gray-700">Your Progress</span>
                                                <span className="text-sm font-bold text-emerald-600">
                                                    {enrollment.progress || 0}% — Lesson {(enrollment.lastAccessedLesson || 0) + 1}/{lessons.length || 1}
                                                </span>
                                            </div>
                                            <div className="w-full bg-emerald-200 rounded-full h-3">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all"
                                                    style={{ width: `${enrollment.progress || 0}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-emerald-700 mt-2 font-medium">
                                                {enrollment.completedLessons || 0} of {enrollment.totalLessons || lessons.length} lessons completed
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─── Module Detail Sections ───────────────────── */}
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

                            {/* ─── Lesson Overview ──────────────────────────── */}
                            {lessons.length > 0 && (
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
                                                <div
                                                    key={idx}
                                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                                                        done ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                                        done ? 'bg-emerald-500 text-white' : 'bg-[#021d49] text-white'
                                                    }`}>
                                                        {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm truncate">{lesson.title}</p>
                                                        <div className="flex items-center gap-3 mt-0.5">
                                                            {lesson.duration && (
                                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> {lesson.duration}
                                                                </span>
                                                            )}
                                                            {lesson.assessment?.questions?.length > 0 && (
                                                                <span className="text-xs text-indigo-600 font-medium">Has Quiz</span>
                                                            )}
                                                            {lesson.resources?.length > 0 && (
                                                                <span className="text-xs text-purple-600 font-medium">
                                                                    {lesson.resources.length} Resource{lesson.resources.length !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
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

                        {/* ══════════════ RIGHT / SIDEBAR ══════════════════ */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7 sticky top-24 space-y-5">

                                {/* Fellows-only disclaimer */}
                                {isFellowBlocked && (
                                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Award className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                            <p className="text-purple-800 font-bold text-sm">Fellows-Only Module</p>
                                        </div>
                                        <p className="text-purple-700 text-xs leading-relaxed mb-3">
                                            This module is free only for fellows added by the admin. Non-fellows must pay to access.
                                        </p>
                                        <a
                                            href={`mailto:${FELLOWSHIP_EMAIL}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 underline"
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                            Contact: {FELLOWSHIP_EMAIL}
                                        </a>
                                    </div>
                                )}

                                {/* Fellow access badge */}
                                {hasFellowAccess && !enrollment && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Award className="w-5 h-5 text-purple-600" />
                                            <p className="text-purple-700 font-bold">Fellow Access</p>
                                        </div>
                                        <p className="text-sm text-gray-500">You have free access as an approved fellow.</p>
                                    </div>
                                )}

                                {/* Open / free */}
                                {isFree && !enrollment && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Unlock className="w-5 h-5 text-emerald-600" />
                                            <p className="text-emerald-600 font-bold text-lg">Free Access</p>
                                        </div>
                                        <p className="text-sm text-gray-500">No payment required. Sign in to enroll.</p>
                                    </div>
                                )}

                                {/* Paid category price */}
                                {effectivelyPaid && !enrollment && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Category Price</p>
                                        <p className="text-4xl font-extrabold text-[#021d49]">
                                            {catPrice ? `USD ${catPrice.toLocaleString()}` : 'Paid'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            One-time payment · all modules in "{category?.name}"
                                        </p>
                                    </div>
                                )}

                                {/* Already paid */}
                                {hasPaid && !enrollment && !hasFellowAccess && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <p className="text-emerald-600 font-bold">Payment confirmed</p>
                                        </div>
                                        <p className="text-sm text-gray-500">You have category access. Enroll to start learning.</p>
                                    </div>
                                )}

                                {/* Enrolled */}
                                {enrollment && (
                                    <div className="pb-5 border-b border-gray-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            <p className="text-emerald-600 font-bold">You are enrolled</p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {enrollment.progress || 0}% complete · Resume from Lesson {(enrollment.lastAccessedLesson || 0) + 1}
                                        </p>
                                    </div>
                                )}

                                {/* CTA Button */}
                                <button
                                    onClick={CTA?.disabled ? undefined : handleEnroll}
                                    disabled={enrolling || CTA?.disabled}
                                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${CTA?.style || 'bg-[#021d49] text-white'}`}
                                >
                                    {enrolling ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                    ) : (
                                        <>
                                            {CTA?.icon && <CTA.icon className="w-5 h-5" />}
                                            {CTA?.label || 'Get Started'}
                                        </>
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
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            {lessons.length} comprehensive {lessons.length === 1 ? 'lesson' : 'lessons'}
                                        </li>
                                        {mod.finalAssessment && (
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                Final assessment
                                            </li>
                                        )}
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            Certificate upon completion
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            Resume from where you left off
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            Downloadable lesson resources
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            Expert instructor guidance
                                        </li>
                                    </ul>
                                </div>

                                {/* Instructor card */}
                                <div className="pt-5 border-t border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-3 text-sm">Your Instructor</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#021d49] to-blue-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                                            {initials}
                                        </div>
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
