'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import categoryService from '@/lib/api/categoryService';
import moduleService from '@/lib/api/moduleService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import progressionService from '@/lib/api/progressionService';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';
import { useToast } from '@/components/ui/ToastProvider';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

/* ─── Helpers ─── */
const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
};

// Convert relative /uploads/... paths to absolute URLs
const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_URL}${url}` : url;
};

const levelConfig = {
    beginner: { badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Beginner', icon: 'Sprout' },
    intermediate: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Intermediate', icon: 'Flame' },
    advanced: { badge: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Advanced', icon: 'Rocket' },
};
const getLvl = (level) => levelConfig[level] || levelConfig.beginner;

function getFellowCategoryIds() {
    try {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem('user');
        if (!raw) return [];
        const user = JSON.parse(raw);
        return (user?.fellowData?.assignedCategories || []).map((id) => id?.toString?.() || String(id));
    } catch { return []; }
}

/* ─── Main component ─── */
function CategoryPageContent() {
    const router = useRouter();
    const { id: categoryId } = useParams();

    const [category, setCategory] = useState(null);
    const [modules, setModules] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [error, setError] = useState(false);
    const [fellowCategoryIds] = useState(() => getFellowCategoryIds());
    const [welcomeExpanded, setWelcomeExpanded] = useState(false);
    const { showToast } = useToast();

    const fetchAll = useCallback(async () => {
        if (!categoryId) return;
        try {
            setLoading(true);
            setError(false);
            const [cat, modsResult, enrollResult, progResult] = await Promise.allSettled([
                categoryService.getCategoryById(categoryId),
                moduleService.getAllModules({ category: categoryId, limit: 100 }),
                moduleEnrollmentService.getMyEnrollments(),
                progressionService.getMyProgressions(),
            ]);

            if (cat.status === 'fulfilled' && cat.value) {
                setCategory(cat.value);
            }
            else setError(true);

            if (modsResult.status === 'fulfilled') {
                const v = modsResult.value;
                let mods = Array.isArray(v) ? v : v?.modules || [];
                // Sort modules by order field
                mods = mods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                setModules(mods);
            }

            if (enrollResult.status === 'fulfilled') {
                const v = enrollResult.value;
                setEnrollments(Array.isArray(v) ? v : v?.enrollments || []);
            }

            if (progResult.status === 'fulfilled') {
                const v = progResult.value;
                setProgressions(Array.isArray(v) ? v : v?.progressions || []);
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [categoryId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const getEnrollment = (moduleId) =>
        enrollments.find(e => (e.moduleId?._id || e.moduleId)?.toString() === moduleId?.toString());

    // Sequential locking: if a module has order > 1, the previous module must be completed first
    const isSequentiallyLocked = (mod) => {
        if (!mod.order || mod.order <= 1) return false;
        const prevMod = modules.find(m => m.order === mod.order - 1);
        if (!prevMod) return false;
        const prevEnrollment = getEnrollment(prevMod._id);
        return !prevEnrollment?.isCompleted;
    };

    const getPreviousModuleTitle = (mod) => {
        if (!mod.order || mod.order <= 1) return null;
        const prevMod = modules.find(m => m.order === mod.order - 1);
        return prevMod?.title || `Module ${mod.order - 1}`;
    };

    const checkLevelAccess = (mod) => {
        const catId = mod.categoryId?._id || mod.categoryId;
        const prog = progressions.find(p => (p.categoryId?._id || p.categoryId)?.toString() === catId?.toString());
        if (!prog) return mod.level === 'beginner';
        const levels = ['beginner', 'intermediate', 'advanced'];
        return levels.indexOf(mod.level || 'beginner') <= levels.indexOf(prog.currentLevel || 'beginner');
    };

    const getAccessState = () => {
        if (!category) return 'open';
        const catId = category._id?.toString?.();
        const isFellow = catId ? fellowCategoryIds.includes(catId) : false;
        if (category.accessType === 'free') return isFellow ? 'fellow_free' : 'fellow_blocked';
        if (category.isPaid || category.accessType === 'paid') return isFellow ? 'paid_free' : 'paid';
        return 'open';
    };

    const handleEnroll = async (mod) => {
        try {
            setEnrollingId(mod._id);
            const result = await moduleEnrollmentService.enrollInModule(mod._id);
            if (result.requiresPayment) {
                router.push(`/student/modules/${mod._id}?payment=required&category=${result.categoryId}&price=${result.price}`);
                return;
            }
            router.push(`/student/modules/${mod._id}`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to enroll. Please try again.';
            showToast(msg, { type: 'error' });
        } finally {
            setEnrollingId(null);
        }
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#021d49]/20 border-t-[#021d49] rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Loading category…</p>
                    </div>
                </div>
            </>
        );
    }

    /* ── Error / not found ── */
    if (error || !category) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
                    <div className="text-center px-6">
                        <Icons.AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-gray-800 mb-1">Category not found</h3>
                        <p className="text-sm text-gray-500 mb-5">This category may not exist or is unavailable.</p>
                        <Button className="bg-[#021d49] hover:bg-[#032a66] text-white" onClick={() => router.push('/student/modules')}>
                            <Icons.ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    const catIsFellowRestricted = category.accessType === 'free' || category.accessType === 'restricted';
    const catIsPaid = category.isPaid || category.accessType === 'paid';
    const welcomeMsg = category.welcomeMessage?.trim() || '';
    const desc = stripHtml(category.description || '');

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50/80 pt-20">

                {/* ── Hero header ── */}
                <div className="bg-gradient-to-r from-[#021d49] via-[#0a2d6e] to-[#1e40af]">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                        {/* Breadcrumb */}
                        <button
                            onClick={() => router.push('/student/modules')}
                            className="flex items-center gap-1.5 text-blue-200/70 hover:text-white text-xs font-medium mb-4 transition-colors group"
                        >
                            <Icons.ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            Browse Modules
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {catIsFellowRestricted && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/30 text-purple-100 px-2.5 py-1 rounded-full">
                                            <Icons.Award className="w-3 h-3" /> Fellows Priority
                                        </span>
                                    )}
                                    {catIsPaid && category.price > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/30 text-amber-100 px-2.5 py-1 rounded-full">
                                            KES {category.price?.toLocaleString()}
                                        </span>
                                    )}
                                    {!catIsPaid && !catIsFellowRestricted && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">
                                            <Icons.Unlock className="w-3 h-3" /> Free Access
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{category.name}</h1>
                                {desc && <p className="text-blue-200/70 text-sm mt-1.5 leading-relaxed max-w-2xl">{desc}</p>}
                            </div>

                            {/* Module count pill */}
                            <div className="shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center min-w-[80px]">
                                <p className="text-2xl font-black text-white">{modules.length}</p>
                                <p className="text-[10px] text-blue-200/70 font-medium uppercase tracking-wide">
                                    {modules.length === 1 ? 'Module' : 'Modules'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

                    {/* ── Welcome / Programme message (collapsible) ── */}
                    {welcomeMsg && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between gap-2.5 px-5 sm:px-6 py-3 bg-[#021d49]/4 border-b border-gray-100 hover:bg-[#021d49]/8 transition-colors"
                                onClick={() => setWelcomeExpanded(v => !v)}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icons.Sparkles className="w-4 h-4 text-[#021d49] shrink-0" />
                                    <p className="text-[#021d49] text-[11px] font-bold uppercase tracking-widest">Programme Welcome</p>
                                </div>
                                <Icons.ChevronDown className={`w-4 h-4 text-[#021d49] transition-transform duration-200 ${welcomeExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {welcomeExpanded && (
                                <div
                                    className="px-5 sm:px-6 py-4 prose prose-sm max-w-none
                                        prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-1.5
                                        prose-li:text-gray-600 prose-strong:text-gray-800
                                        prose-headings:text-gray-900 prose-a:text-[#1e40af] prose-a:no-underline
                                        hover:prose-a:underline prose-ol:pl-5 prose-ul:pl-5"
                                    dangerouslySetInnerHTML={{ __html: welcomeMsg }}
                                />
                            )}
                        </div>
                    )}

                    {/* ── Modules section ── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Icons.BookOpen className="w-4 h-4 text-[#021d49]" />
                                Modules in this Category
                                <Badge className="ml-1 bg-[#021d49] text-white border-0 text-[10px] h-4 px-1.5">{modules.length}</Badge>
                            </h2>
                            <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-[#021d49] gap-1"
                                onClick={() => router.push('/student/modules')}>
                                <Icons.ArrowLeft className="w-3 h-3" /> All categories
                            </Button>
                        </div>

                        {/* Sequential learning notice */}
                        {modules.some(m => m.order > 0) && (
                            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                                <Icons.ListOrdered className="w-4 h-4 text-[#1e40af] shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    <span className="font-semibold">Sequential Learning:</span> Modules in this programme must be completed in order — you must finish each module before unlocking the next one.
                                </p>
                            </div>
                        )}

                        {modules.length === 0 ? (
                            /* Empty state */
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
                                <Icons.BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-base font-semibold text-gray-800 mb-1">No modules yet</h3>
                                <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                                    No modules have been published in this category yet. Check back soon.
                                </p>
                                <Button className="bg-[#021d49] hover:bg-[#032a66] text-white"
                                    onClick={() => router.push('/student/modules')}>
                                    <Icons.ArrowLeft className="w-4 h-4 mr-2" /> Browse All Modules
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {modules.map((mod) => {
                                    const lvl = getLvl(mod.level);
                                    const LvlIcon = Icons[lvl.icon] || Icons.BookOpen;
                                    const enrollment = getEnrollment(mod._id);
                                    const isEnrolled = !!enrollment;
                                    const hasAccess = checkLevelAccess(mod);
                                    const seqLocked = isSequentiallyLocked(mod);
                                    const isLocked = !hasAccess || seqLocked;
                                    const prevTitle = seqLocked ? getPreviousModuleTitle(mod) : null;
                                    const accessState = getAccessState();
                                    const isFellowBlocked = accessState === 'fellow_blocked';
                                    const isPaid = accessState === 'paid';
                                    const isFree = accessState === 'open' || accessState === 'fellow_free' || accessState === 'paid_free';
                                    const price = category.price || 0;
                                    const desc = stripHtml(mod.description || '');
                                    const instructors = (mod.instructorIds || []).map(
                                        i => `${i.firstName || ''} ${i.lastName || ''}`.trim()
                                    ).filter(Boolean);

                                    return (
                                        <Card key={mod._id}
                                            className={`group overflow-hidden border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col ${isLocked ? 'opacity-70' : 'hover:border-[#021d49]/20'}`}>
                                            {/* Banner */}
                                            <div className="relative h-36 overflow-hidden shrink-0">
                                                {mod.bannerUrl ? (
                                                    <img src={toAbsoluteUrl(mod.bannerUrl)} alt={mod.title}
                                                        className={`w-full h-full object-cover transition-transform duration-300 ${!isLocked ? 'group-hover:scale-105' : 'grayscale-[30%]'}`} />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center ${mod.level === 'advanced' ? 'bg-gradient-to-br from-rose-200 to-rose-300'
                                                        : mod.level === 'intermediate' ? 'bg-gradient-to-br from-amber-100 to-amber-200'
                                                            : 'bg-gradient-to-br from-blue-100 to-indigo-200'
                                                        }`}>
                                                        <Icons.Layers className="w-12 h-12 text-white/50" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                                {/* Module order badge (bottom-left) */}
                                                {mod.order > 0 && (
                                                    <div className="absolute bottom-2 left-2.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                        Module {mod.order}
                                                    </div>
                                                )}
                                                <div className="absolute top-2.5 left-2.5">
                                                    <Badge variant="outline" className={`text-[10px] font-bold border ${lvl.badge} bg-white/90`}>
                                                        <LvlIcon className="w-2.5 h-2.5 mr-1" />{lvl.label}
                                                    </Badge>
                                                </div>
                                                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                                                    {isEnrolled && enrollment.isCompleted && (
                                                        <Badge className="text-[10px] bg-green-700 text-white border-0">
                                                            <Icons.CheckCircle className="w-2.5 h-2.5 mr-1" /> Completed
                                                        </Badge>
                                                    )}
                                                    {isEnrolled && !enrollment.isCompleted && (
                                                        <Badge className="text-[10px] bg-[#021d49] text-white border-0">
                                                            <Icons.BookOpen className="w-2.5 h-2.5 mr-1" /> In Progress
                                                        </Badge>
                                                    )}
                                                    {!isEnrolled && isFellowBlocked && (
                                                        <Badge className="text-[10px] bg-purple-700 text-white border-0">
                                                            <Icons.Award className="w-2.5 h-2.5 mr-1" /> Fellows Only
                                                        </Badge>
                                                    )}
                                                    {!isEnrolled && seqLocked && (
                                                        <Badge className="text-[10px] bg-gray-800 text-white border-0">
                                                            <Icons.Lock className="w-2.5 h-2.5 mr-1" /> Locked
                                                        </Badge>
                                                    )}
                                                    {!isEnrolled && !seqLocked && !hasAccess && (
                                                        <Badge className="text-[10px] bg-gray-800 text-white border-0">
                                                            <Icons.Lock className="w-2.5 h-2.5 mr-1" /> Locked
                                                        </Badge>
                                                    )}
                                                    {!isEnrolled && isPaid && !seqLocked && (
                                                        <Badge className="text-[10px] bg-amber-500 text-white border-0">
                                                            KES {price.toLocaleString()}
                                                        </Badge>
                                                    )}
                                                    {!isEnrolled && hasAccess && isFree && !seqLocked && (
                                                        <Badge className="text-[10px] bg-blue-700 text-white border-0">
                                                            <Icons.Unlock className="w-2.5 h-2.5 mr-1" /> Free
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <CardContent className="p-4 flex flex-col flex-1">
                                                {/* Module Order Badge */}
                                                {mod.order > 0 && (
                                                    <div className="inline-flex items-center gap-1.5 mb-2 w-fit">
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#021d49] text-white px-2.5 py-1 rounded-md">
                                                            <Icons.ListOrdered className="w-3 h-3" />
                                                            Module {mod.order}
                                                        </span>
                                                    </div>
                                                )}

                                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-[#021d49] transition-colors leading-snug">
                                                    {mod.title}
                                                </h3>
                                                {desc && <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{desc}</p>}

                                                {/* Meta */}
                                                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Icons.BookOpen className="w-3 h-3" />
                                                        {mod.lessons?.length || mod.totalLessons || 0} lessons
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Users className="w-3 h-3" />
                                                        {mod.enrollmentCount || 0}
                                                    </span>
                                                    {(mod.avgRating || 0) > 0 && (
                                                        <span className="flex items-center gap-0.5 text-amber-500">
                                                            <Icons.Star className="w-3 h-3 fill-current" />
                                                            {(mod.avgRating || 0).toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>

                                                {instructors.length > 0 && (
                                                    <div className="flex items-center gap-1.5 mb-3">
                                                        <Icons.GraduationCap className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <p className="text-xs text-gray-500 truncate">{instructors.join(', ')}</p>
                                                    </div>
                                                )}

                                                <Separator className="mb-3" />

                                                {/* Progress if enrolled */}
                                                {isEnrolled && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] text-gray-500">Your progress</span>
                                                            <span className="text-[10px] font-bold text-[#021d49]">
                                                                {Math.min(100, Math.round(enrollment.progress || 0))}%
                                                            </span>
                                                        </div>
                                                        <Progress value={Math.min(100, Math.round(enrollment.progress || 0))} className="h-1.5" />
                                                    </div>
                                                )}

                                                {/* Action */}
                                                {isFellowBlocked ? (
                                                    <div className="rounded-lg bg-purple-50 border border-purple-100 p-2.5 flex items-start gap-2">
                                                        <Icons.Award className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] text-purple-700 leading-snug">Fellows-only. Non-fellows must pay to access.</p>
                                                    </div>
                                                ) : isLocked ? (
                                                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 flex items-start gap-2">
                                                        <Icons.Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-gray-500 leading-snug">
                                                            {seqLocked
                                                                ? <>Complete <span className="font-medium text-gray-700">&ldquo;{prevTitle}&rdquo;</span> first</>
                                                                : <>Complete {mod.level === 'advanced' ? 'intermediate' : 'beginner'} level first</>
                                                            }
                                                        </p>
                                                    </div>
                                                ) : isEnrolled ? (
                                                    <Button className="w-full h-8 text-xs bg-[#021d49] hover:bg-[#032a66] text-white mt-auto"
                                                        onClick={() => router.push(`/student/modules/${mod._id}`)}>
                                                        <Icons.Play className="w-3.5 h-3.5 mr-1.5" />
                                                        {enrollment.isCompleted ? 'Review Module' : 'Continue Learning'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="w-full h-8 text-xs bg-[#1e40af] hover:bg-[#1a35a0] text-white mt-auto"
                                                        disabled={enrollingId === mod._id}
                                                        onClick={() => handleEnroll(mod)}>
                                                        {enrollingId === mod._id ? (
                                                            <><Icons.Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Enrolling…</>
                                                        ) : (
                                                            <><Icons.PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                                                                {isFree ? 'Enroll Free' : `Enroll · KES ${price.toLocaleString()}`}</>
                                                        )}
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Bottom back button ── */}
                    <div className="pt-2 pb-8">
                        <Button variant="outline" className="border-gray-200 text-gray-600 hover:border-[#021d49] hover:text-[#021d49] gap-2"
                            onClick={() => router.push('/student/modules')}>
                            <Icons.ArrowLeft className="w-4 h-4" /> Back to Browse Modules
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function CategoryPage() {
    return (
        <ProtectedStudentRoute>
            <CategoryPageContent />
        </ProtectedStudentRoute>
    );
}
