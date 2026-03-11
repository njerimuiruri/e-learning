'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Trophy, ChevronLeft, Zap, BookOpen, Award,
    BookCheck, TrendingUp, Loader2, Star, Flame,
    Target, GraduationCap, Medal, LayoutDashboard,
} from 'lucide-react';
import courseService from '@/lib/api/courseService';
import Navbar from '@/components/navbar/navbar';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';

/* ─── helpers ─── */
const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const typeConfig = {
    course_completion: {
        label: 'Course',
        icon: Award,
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    module_completion: {
        label: 'Module',
        icon: BookCheck,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    xp_boost: {
        label: 'XP Boost',
        icon: Zap,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
    },
};
const getCfg = (type) => typeConfig[type] || typeConfig.xp_boost;

/* ─── Stat card ─── */
function StatCard({ icon: Icon, label, value, iconClass, valueClass }) {
    return (
        <Card className="border border-border">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

/* ─── Achievement row ─── */
function AchievementRow({ achievement, index }) {
    const cfg = getCfg(achievement.type);
    const Icon = cfg.icon;
    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl border ${cfg.border} ${cfg.bg} transition-all hover:shadow-sm`}>
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <p className="font-semibold text-sm text-foreground">
                            {achievement.title || 'Achievement Unlocked'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {achievement.description || achievement.moduleTitle || 'Great work!'}
                        </p>
                    </div>
                    <Badge variant="outline" className={`text-[11px] shrink-0 ${cfg.badge}`}>
                        <Zap className="w-2.5 h-2.5 mr-1" />
                        +{achievement.xpAwarded} XP
                    </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{fmtDate(achievement.createdAt)}</p>
            </div>
        </div>
    );
}

/* ─── Empty state ─── */
function EmptyAchievements({ onAction }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No achievements yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Complete modules and courses to earn XP and unlock achievements.
            </p>
            <Button className="bg-[#021d49] hover:bg-[#032a66]" onClick={onAction}>
                <BookOpen className="w-4 h-4 mr-2" /> Start Learning
            </Button>
        </div>
    );
}

/* ─── Main ─── */
export default function AchievementsPage() {
    const router = useRouter();
    const [achievementsData, setAchievementsData] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchAchievements(); }, []);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            setError('');
            const [achievements, dashboard] = await Promise.all([
                courseService.getStudentAchievements(),
                courseService.getStudentDashboard(),
            ]);
            setAchievementsData(achievements);
            setDashboardData(dashboard);
        } catch (err) {
            setError('Failed to load achievements');
        } finally {
            setLoading(false);
        }
    };

    /* derived data */
    const totalXP = achievementsData?.totalXp || achievementsData?.totalPoints || 0;
    const achievements = achievementsData?.achievements || [];
    const moduleCompletions = achievements.filter(a => a.type === 'module_completion');
    const courseCompletions = achievements.filter(a => a.type === 'course_completion');
    const xpBoosts = achievements.filter(a => a.type === 'xp_boost');

    const inProgressCourses = dashboardData?.enrollments
        ?.filter(e => !e.isCompleted)
        .map(e => ({
            _id: e._id,
            title: e.courseId?.title || 'Untitled Course',
            progress: Math.round(e.progress || 0),
        })) || [];

    /* ── Loading ── */
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
                        <p className="text-sm text-muted-foreground">Loading achievements…</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                    {/* ── Page header ── */}
                    <div className="mb-7">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground mb-5 -ml-2"
                            onClick={() => router.push('/student')}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#021d49] flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
                                <p className="text-sm text-muted-foreground">Your learning milestones and XP history</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Stats row ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
                        <StatCard
                            icon={Zap}
                            label="Total XP"
                            value={totalXP}
                            iconClass="bg-amber-100 text-amber-600"
                            valueClass="text-amber-600"
                        />
                        <StatCard
                            icon={BookCheck}
                            label="Modules Done"
                            value={moduleCompletions.length}
                            iconClass="bg-blue-100 text-blue-600"
                            valueClass="text-blue-600"
                        />
                        <StatCard
                            icon={GraduationCap}
                            label="Courses Done"
                            value={courseCompletions.length}
                            iconClass="bg-emerald-100 text-emerald-600"
                            valueClass="text-emerald-600"
                        />
                        <StatCard
                            icon={Flame}
                            label="XP Boosts"
                            value={xpBoosts.length}
                            iconClass="bg-rose-100 text-rose-600"
                            valueClass="text-rose-600"
                        />
                    </div>

                    {/* ── Main content ── */}
                    <div className="grid lg:grid-cols-3 gap-5">

                        {/* Left: Achievement list */}
                        <div className="lg:col-span-2">
                            <Card className="border border-border">
                                <CardHeader className="px-5 pt-5 pb-4 border-b border-border">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Medal className="w-4 h-4 text-[#021d49]" />
                                        Achievement History
                                        {achievements.length > 0 && (
                                            <Badge variant="secondary" className="ml-auto font-normal">
                                                {achievements.length}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>

                                {achievements.length === 0 ? (
                                    <EmptyAchievements onAction={() => router.push('/courses')} />
                                ) : (
                                    <Tabs defaultValue="all">
                                        <div className="px-5 pt-3">
                                            <TabsList className="h-8 text-xs">
                                                <TabsTrigger value="all" className="text-xs px-3">All ({achievements.length})</TabsTrigger>
                                                <TabsTrigger value="courses" className="text-xs px-3">Courses ({courseCompletions.length})</TabsTrigger>
                                                <TabsTrigger value="modules" className="text-xs px-3">Modules ({moduleCompletions.length})</TabsTrigger>
                                                <TabsTrigger value="xp" className="text-xs px-3">XP ({xpBoosts.length})</TabsTrigger>
                                            </TabsList>
                                        </div>

                                        {[
                                            { value: 'all', data: achievements },
                                            { value: 'courses', data: courseCompletions },
                                            { value: 'modules', data: moduleCompletions },
                                            { value: 'xp', data: xpBoosts },
                                        ].map(({ value, data }) => (
                                            <TabsContent key={value} value={value} className="mt-0">
                                                <ScrollArea className="h-[420px]">
                                                    <div className="p-5 space-y-3">
                                                        {data.length === 0 ? (
                                                            <div className="text-center py-10 text-sm text-muted-foreground">
                                                                No achievements in this category yet.
                                                            </div>
                                                        ) : (
                                                            data.map((a, i) => (
                                                                <AchievementRow key={a._id || i} achievement={a} index={i} />
                                                            ))
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                )}
                            </Card>
                        </div>

                        {/* Right: sidebar */}
                        <div className="space-y-4">

                            {/* XP Summary */}
                            <Card className="border border-border">
                                <CardHeader className="px-5 pt-5 pb-3 border-b border-border">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-amber-500" />
                                        XP Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    {[
                                        { label: 'From courses', value: courseCompletions.reduce((s, a) => s + (a.xpAwarded || 0), 0), color: 'bg-emerald-500' },
                                        { label: 'From modules', value: moduleCompletions.reduce((s, a) => s + (a.xpAwarded || 0), 0), color: 'bg-blue-500' },
                                        { label: 'XP boosts', value: xpBoosts.reduce((s, a) => s + (a.xpAwarded || 0), 0), color: 'bg-amber-500' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs text-muted-foreground">{label}</span>
                                                <span className="text-xs font-bold">{value} XP</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${color} transition-all`}
                                                    style={{ width: totalXP ? `${Math.round((value / totalXP) * 100)}%` : '0%' }}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground">Total XP</span>
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs font-bold">
                                            <Zap className="w-3 h-3 mr-1" /> {totalXP} XP
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Continue Learning */}
                            {inProgressCourses.length > 0 && (
                                <Card className="border border-border">
                                    <CardHeader className="px-5 pt-5 pb-3 border-b border-border">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-[#021d49]" />
                                            Continue Learning
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {inProgressCourses.slice(0, 4).map((course) => (
                                            <div
                                                key={course._id}
                                                className="p-3 rounded-lg border border-border hover:border-[#021d49]/40 hover:bg-muted/40 cursor-pointer transition-all group"
                                                onClick={() => router.push(`/courses/${course._id}`)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs font-medium text-foreground group-hover:text-[#021d49] line-clamp-1 transition-colors flex-1 mr-2">
                                                        {course.title}
                                                    </p>
                                                    <span className="text-[11px] font-bold text-[#021d49] shrink-0">
                                                        {course.progress}%
                                                    </span>
                                                </div>
                                                <Progress value={course.progress} className="h-1.5" />
                                            </div>
                                        ))}
                                        {inProgressCourses.length > 4 && (
                                            <p className="text-xs text-muted-foreground text-center pt-1">
                                                +{inProgressCourses.length - 4} more courses
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Quick nav */}
                            <Button
                                variant="outline"
                                className="w-full gap-2 border-border text-sm"
                                onClick={() => router.push('/student')}
                            >
                                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}