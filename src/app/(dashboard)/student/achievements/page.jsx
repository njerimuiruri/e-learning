'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Trophy, ChevronLeft, BookOpen, CheckCircle,
    BookCheck, TrendingUp, Loader2, Flame,
    Target, Medal, LayoutDashboard, Lock, Unlock,
    Crown, Star, Zap, ArrowRight, GraduationCap,
    Calendar, ChevronRight, Award,
} from 'lucide-react';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import progressionService from '@/lib/api/progressionService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import { normalizeEnrollment, summarizeEnrollments } from '@/lib/utils/enrollmentProgress';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

/* ── constants ── */
const LEVEL_CFG = {
    beginner:     { label: 'Beginner',     color: 'text-blue-700',   bg: 'bg-blue-600',   light: 'bg-blue-50',   border: 'border-blue-200',  stripe: 'bg-blue-500',  ring: 'ring-blue-300'  },
    intermediate: { label: 'Intermediate', color: 'text-amber-700',  bg: 'bg-amber-500',  light: 'bg-amber-50',  border: 'border-amber-200', stripe: 'bg-amber-500', ring: 'ring-amber-300' },
    advanced:     { label: 'Advanced',     color: 'text-rose-700',   bg: 'bg-rose-600',   light: 'bg-rose-50',   border: 'border-rose-200',  stripe: 'bg-rose-500',  ring: 'ring-rose-300'  },
};
const getLvl = (l) => LEVEL_CFG[(l || '').toLowerCase()] || LEVEL_CFG.beginner;

const MILESTONES = [
    { key: 'first',   min: 1,  icon: BookOpen,    label: 'First Step',       sub: 'Completed 1st module',    color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200'   },
    { key: 'three',   min: 3,  icon: BookCheck,   label: 'On a Roll',        sub: 'Completed 3 modules',     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
    { key: 'five',    min: 5,  icon: Flame,       label: 'On Fire',          sub: 'Completed 5 modules',     color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { key: 'halfway', min: -1, icon: TrendingUp,  label: 'Halfway There',    sub: '50% overall progress',    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    { key: 'scholar', min: -1, icon: GraduationCap,label:'Scholar',          sub: '75% overall progress',    color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { key: 'crown',   min: -1, icon: Crown,       label: 'Top of the Class', sub: '100% overall progress',   color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const ordinal  = (n) => n + (['th','st','nd','rd'][(n%100>10&&n%100<20)?0:Math.min(n%10,4)] || 'th');

/* ── Completed module card ── */
function CompletedCard({ enrollment, index }) {
    const mod = enrollment.moduleId || {};
    const lvl = getLvl(mod.level);
    const order = mod.order || (index + 1);
    return (
        <div className="flex gap-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group bg-white">
            {/* Colored left stripe */}
            <div className={`w-1.5 shrink-0 ${lvl.stripe}`} />
            <div className="flex flex-1 items-start gap-4 p-4">
                {/* Order circle */}
                <div className={`w-11 h-11 rounded-xl ${lvl.light} ${lvl.border} border flex flex-col items-center justify-center shrink-0`}>
                    <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">MOD</span>
                    <span className={`text-base font-black leading-none ${lvl.color}`}>{order}</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 leading-tight line-clamp-1 group-hover:text-[#021d49] transition-colors">
                                {mod.title || 'Module'}
                            </p>
                            {mod.categoryId?.name && (
                                <p className="text-[11px] text-gray-400 mt-0.5">{mod.categoryId.name}</p>
                            )}
                        </div>
                        <Badge className={`text-[10px] shrink-0 capitalize font-semibold border ${lvl.light} ${lvl.color} ${lvl.border} shadow-none`}>
                            {lvl.label}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                            <CheckCircle className="w-3 h-3" />
                            <span className="text-[11px] font-semibold">Completed</span>
                        </div>
                        {fmtDate(enrollment.completedAt || enrollment.updatedAt) && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {fmtDate(enrollment.completedAt || enrollment.updatedAt)}
                            </div>
                        )}
                    </div>
                </div>
                {/* Trophy */}
                <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-500" />
                </div>
            </div>
        </div>
    );
}

/* ── In-progress module card ── */
function InProgressCard({ enrollment, onClick }) {
    const mod = enrollment.moduleId || {};
    const lvl = getLvl(mod.level);
    const prog = enrollment.progress || 0;
    return (
        <div
            className="flex gap-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group bg-white"
            onClick={onClick}
        >
            <div className={`w-1.5 shrink-0 ${lvl.stripe} opacity-40`} />
            <div className="flex flex-1 items-start gap-4 p-4">
                <div className={`w-11 h-11 rounded-xl ${lvl.light} ${lvl.border} border flex flex-col items-center justify-center shrink-0`}>
                    <BookOpen className={`w-4 h-4 ${lvl.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-800 line-clamp-1 group-hover:text-[#021d49] transition-colors">
                            {mod.title || 'Module'}
                        </p>
                        <Badge className={`text-[10px] shrink-0 capitalize font-semibold border ${lvl.light} ${lvl.color} ${lvl.border} shadow-none`}>
                            {lvl.label}
                        </Badge>
                    </div>
                    {mod.categoryId?.name && (
                        <p className="text-[11px] text-gray-400 mt-0.5 mb-2">{mod.categoryId.name}</p>
                    )}
                    <div className="flex items-center gap-2">
                        <Progress value={prog} className="flex-1 h-1.5" />
                        <span className="text-[11px] font-bold text-[#021d49] shrink-0">{prog}%</span>
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1 group-hover:text-[#021d49] transition-colors" />
            </div>
        </div>
    );
}

/* ── Milestone badge ── */
function MilestoneBadge({ icon: Icon, label, sub, color, bg, border, earned }) {
    return (
        <div className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 ${
            earned ? `${bg} ${border} shadow-sm` : 'bg-gray-50 border-gray-100 opacity-50'
        }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${earned ? bg : 'bg-gray-100'}`}>
                <Icon className={`w-6 h-6 ${earned ? color : 'text-gray-300'}`} />
            </div>
            <div>
                <p className={`text-xs font-bold ${earned ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
                <p className={`text-[10px] mt-0.5 ${earned ? 'text-gray-500' : 'text-gray-300'}`}>{sub}</p>
            </div>
            {earned && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                    <CheckCircle className="w-3 h-3 text-white" />
                </div>
            )}
            {!earned && (
                <Lock className="absolute -top-1.5 -right-1.5 w-4 h-4 text-gray-300" />
            )}
        </div>
    );
}

/* ── Level journey step ── */
function LevelStep({ level, status, catName }) {
    const cfg = getLvl(level);
    const isDone    = status === 'done';
    const isActive  = status === 'active';
    const isLocked  = status === 'locked';
    return (
        <div className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                isDone   ? `${cfg.bg} border-transparent shadow-md` :
                isActive ? `${cfg.light} ${cfg.border} ring-2 ${cfg.ring} ring-offset-1 shadow-md` :
                           'bg-gray-50 border-gray-200'
            }`}>
                {isDone   ? <CheckCircle className="w-7 h-7 text-white" />
                : isActive ? <Zap className={`w-7 h-7 ${cfg.color}`} />
                :            <Lock className="w-5 h-5 text-gray-300" />}
            </div>
            <p className={`text-xs font-bold capitalize ${isDone ? cfg.color : isActive ? cfg.color : 'text-gray-400'}`}>
                {level}
            </p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isDone   ? 'bg-green-100 text-green-700' :
                isActive ? `${cfg.light} ${cfg.color}` :
                           'bg-gray-100 text-gray-400'
            }`}>
                {isDone ? 'Done' : isActive ? 'Active' : 'Locked'}
            </span>
        </div>
    );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function AchievementsPage() {
    const router = useRouter();
    const [enrollments, setEnrollments]   = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [user, setUser]                 = useState(null);

    useEffect(() => {
        setUser(authService.getCurrentUser?.() || null);
        (async () => {
            const [e, p] = await Promise.allSettled([
                moduleEnrollmentService.getMyEnrollments(),
                progressionService.getMyProgressions(),
            ]);
            if (e.status === 'fulfilled') {
                const raw = Array.isArray(e.value) ? e.value : e.value?.enrollments || [];
                setEnrollments(raw.map(normalizeEnrollment));
            }
            if (p.status === 'fulfilled') {
                const raw = p.value;
                setProgressions(Array.isArray(raw) ? raw : raw?.progressions || []);
            }
            setLoading(false);
        })();
    }, []);

    const { overallProgress } = summarizeEnrollments(enrollments);
    const completed   = useMemo(() => enrollments.filter(e => e.isCompleted), [enrollments]);
    const inProgress  = useMemo(() => enrollments.filter(e => !e.isCompleted), [enrollments]);

    const milestonesEarned = useMemo(() => MILESTONES.map(m => ({
        ...m,
        earned: m.key === 'halfway'  ? overallProgress >= 50
              : m.key === 'scholar'  ? overallProgress >= 75
              : m.key === 'crown'    ? overallProgress >= 100
              : completed.length >= m.min,
    })), [completed.length, overallProgress]);

    const earnedCount = milestonesEarned.filter(m => m.earned).length;

    const firstName = user?.firstName || user?.fullName?.split(' ')[0] || '';

    if (loading) return (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
            </div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50/70">

                {/* ══ HERO BANNER ══ */}
                <div className="bg-gradient-to-br from-[#021d49] via-[#0a2d6e] to-[#0f3a8a] px-4 sm:px-6 lg:px-8 py-10">
                    <div className="max-w-5xl mx-auto">
                        <Button
                            variant="ghost" size="sm"
                            className="gap-1.5 text-blue-200/70 hover:text-white hover:bg-white/10 mb-6 -ml-2"
                            onClick={() => router.push('/student')}
                        >
                            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                        </Button>

                        <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shrink-0">
                                    <Trophy className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-blue-200/70 text-xs font-medium mb-0.5">Achievement Board</p>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                        {firstName ? `${firstName}'s Journey` : 'My Journey'}
                                    </h1>
                                    <p className="text-blue-200/60 text-sm mt-1">
                                        {completed.length === 0
                                            ? 'Start learning to earn your first achievement'
                                            : `${completed.length} module${completed.length > 1 ? 's' : ''} completed · ${overallProgress}% overall progress`}
                                    </p>
                                </div>
                            </div>

                            {/* Mini stat chips */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {[
                                    { label: 'Completed', value: completed.length,  color: 'bg-green-500/20 text-green-200' },
                                    { label: 'In Progress', value: inProgress.length, color: 'bg-blue-400/20 text-blue-200'  },
                                    { label: 'Badges',    value: `${earnedCount}/${MILESTONES.length}`, color: 'bg-amber-400/20 text-amber-200' },
                                ].map(s => (
                                    <div key={s.label} className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-sm ${s.color}`}>
                                        <span className="font-black text-sm mr-1">{s.value}</span>{s.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {enrollments.length > 0 && (
                            <div className="mt-6 bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-blue-200/70">Overall learning progress</span>
                                    <span className="text-xs font-bold text-white">{overallProgress}%</span>
                                </div>
                                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-300 transition-all duration-700"
                                        style={{ width: `${overallProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {enrollments.length === 0 ? (
                        /* Empty state */
                        <Card className="border-gray-100 shadow-sm">
                            <CardContent className="py-20 flex flex-col items-center text-center px-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#021d49]/10 to-blue-100 flex items-center justify-center mb-5">
                                    <Trophy className="w-10 h-10 text-[#021d49]/30" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">No achievements yet</h3>
                                <p className="text-sm text-gray-500 mb-7 max-w-xs leading-relaxed">
                                    Complete your first module to earn your first achievement badge and start your learning journey.
                                </p>
                                <Button className="bg-[#021d49] hover:bg-[#032a66] gap-2" onClick={() => router.push('/student/modules')}>
                                    <BookOpen className="w-4 h-4" /> Browse Modules
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">

                            {/* ══ LEVEL JOURNEY ══ */}
                            {progressions.length > 0 && (
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-[#021d49]" />
                                        Level Journey
                                    </h2>
                                    <div className="space-y-4">
                                        {progressions.map(prog => {
                                            const levels = ['beginner', 'intermediate', 'advanced'];
                                            const currentIdx = levels.indexOf(prog.currentLevel || 'beginner');
                                            const catName = prog.categoryId?.name || 'Category';
                                            return (
                                                <Card key={prog._id} className="border-gray-100 shadow-sm overflow-hidden">
                                                    <div className="h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500" />
                                                    <CardContent className="px-6 py-5">
                                                        <p className="text-sm font-bold text-gray-900 mb-1">{catName}</p>
                                                        <p className="text-xs text-gray-400 mb-5">
                                                            Current level: <span className="font-semibold text-gray-600 capitalize">{prog.currentLevel || 'beginner'}</span>
                                                        </p>
                                                        <div className="flex items-start gap-2">
                                                            {levels.map((lvl, i) => (
                                                                <React.Fragment key={lvl}>
                                                                    <LevelStep
                                                                        level={lvl}
                                                                        status={i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'locked'}
                                                                        catName={catName}
                                                                    />
                                                                    {i < 2 && (
                                                                        <div className={`flex-shrink-0 h-0.5 flex-1 mt-7 mx-1 rounded-full ${
                                                                            i < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                                                                        }`} />
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="grid lg:grid-cols-3 gap-6">

                                {/* ══ LEFT: MODULES ══ */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Completed modules */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                Completed Modules
                                                {completed.length > 0 && (
                                                    <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">{completed.length}</span>
                                                )}
                                            </h2>
                                        </div>

                                        {completed.length === 0 ? (
                                            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center">
                                                <BookCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                <p className="text-sm font-semibold text-gray-500">No completed modules yet</p>
                                                <p className="text-xs text-gray-400 mt-1">Keep learning  you're on your way!</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {completed.map((e, i) => (
                                                    <CompletedCard key={e._id} enrollment={e} index={i} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* In-progress modules */}
                                    {inProgress.length > 0 && (
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                                                <BookOpen className="w-4 h-4 text-[#021d49]" />
                                                In Progress
                                                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{inProgress.length}</span>
                                            </h2>
                                            <div className="space-y-3">
                                                {inProgress.map(e => (
                                                    <InProgressCard
                                                        key={e._id}
                                                        enrollment={e}
                                                        onClick={() => router.push(`/student/modules/${e.moduleId?._id || e.moduleId}`)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ══ RIGHT SIDEBAR ══ */}
                                <div className="space-y-5">

                                    {/* Achievement milestones */}
                                    <Card className="border-gray-100 shadow-sm">
                                        <CardHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                <Medal className="w-4 h-4 text-amber-500" />
                                                Milestone Badges
                                                <span className="ml-auto text-xs font-normal text-gray-400">
                                                    {earnedCount}/{MILESTONES.length} earned
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="grid grid-cols-3 gap-2">
                                                {milestonesEarned.map(m => (
                                                    <MilestoneBadge key={m.key} {...m} />
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Summary stats */}
                                    <Card className="border-gray-100 shadow-sm">
                                        <CardHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-[#021d49]" />
                                                My Stats
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-3">
                                            {[
                                                { label: 'Modules Completed', value: completed.length,    color: 'text-green-600', bg: 'bg-green-50' },
                                                { label: 'Modules Enrolled',  value: enrollments.length,  color: 'text-blue-600',  bg: 'bg-blue-50'  },
                                                { label: 'Overall Progress',  value: `${overallProgress}%`, color: 'text-violet-600', bg: 'bg-violet-50' },
                                            ].map(({ label, value, color, bg }) => (
                                                <div key={label} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${bg}`}>
                                                    <span className="text-xs font-medium text-gray-600">{label}</span>
                                                    <span className={`text-sm font-black ${color}`}>{value}</span>
                                                </div>
                                            ))}

                                            <Separator />

                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs text-gray-500">Overall progress</span>
                                                    <span className="text-xs font-bold text-[#021d49]">{overallProgress}%</span>
                                                </div>
                                                <Progress value={overallProgress} className="h-2" />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Next goal */}
                                    {overallProgress < 100 && (
                                        <div className="rounded-2xl bg-gradient-to-br from-[#021d49] to-[#1e40af] p-5 text-white">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Target className="w-4 h-4 text-blue-300" />
                                                <span className="text-xs font-bold text-blue-200">Next Goal</span>
                                            </div>
                                            {(() => {
                                                const nextModule = inProgress[0];
                                                const nextMilestone = milestonesEarned.find(m => !m.earned);
                                                return (
                                                    <div className="space-y-3">
                                                        {nextModule && (
                                                            <button
                                                                onClick={() => router.push(`/student/modules/${nextModule.moduleId?._id || nextModule.moduleId}`)}
                                                                className="w-full text-left bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-colors"
                                                            >
                                                                <p className="text-[11px] text-blue-300 mb-0.5">Continue learning</p>
                                                                <p className="text-xs font-semibold line-clamp-1">
                                                                    {nextModule.moduleId?.title || 'Current module'}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-teal-400 rounded-full" style={{ width: `${nextModule.progress || 0}%` }} />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold">{nextModule.progress || 0}%</span>
                                                                </div>
                                                            </button>
                                                        )}
                                                        {nextMilestone && (
                                                            <div className="bg-white/10 rounded-xl px-3 py-2.5">
                                                                <p className="text-[11px] text-blue-300 mb-0.5">Next badge to earn</p>
                                                                <p className="text-xs font-semibold">{nextMilestone.label}</p>
                                                                <p className="text-[10px] text-blue-300 mt-0.5">{nextMilestone.sub}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 border-gray-200 text-sm"
                                        onClick={() => router.push('/student')}
                                    >
                                        <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
