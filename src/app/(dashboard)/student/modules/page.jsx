'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import progressionService from '@/lib/api/progressionService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
/* ─── Helpers ─── */
const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
};

const levelConfig = {
    beginner: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Beginner', icon: 'Sprout' },
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

function ModuleBrowsingContent() {
    const router = useRouter();
    const [modules, setModules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [fellowCategoryIds] = useState(() => getFellowCategoryIds());

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalModules, setTotalModules] = useState(0);
    const [selectedCategoryFull, setSelectedCategoryFull] = useState(null);

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { fetchModules(); }, [selectedCategory, selectedLevel, searchQuery, currentPage]);
    useEffect(() => {
        if (selectedCategory) {
            categoryService.getCategoryById(selectedCategory)
                .then(data => setSelectedCategoryFull(data || null))
                .catch(() => setSelectedCategoryFull(null));
        } else {
            setSelectedCategoryFull(null);
        }
    }, [selectedCategory]);

    const fetchInitialData = async () => {
        try {
            const [cats, progs, enrollments] = await Promise.all([
                categoryService.getAllCategories(),
                progressionService.getMyProgressions().catch(() => []),
                moduleEnrollmentService.getMyEnrollments().catch(() => []),
            ]);
            setCategories(Array.isArray(cats) ? cats : []);
            setProgressions(Array.isArray(progs) ? progs : progs?.progressions || []);
            const enrollList = Array.isArray(enrollments) ? enrollments : enrollments?.enrollments || [];
            setMyEnrollments(enrollList);
        } catch (err) { console.error(err); }
    };

    const fetchModules = async () => {
        try {
            setLoading(true);
            const filters = { page: currentPage, limit: 12 };
            if (selectedCategory) filters.category = selectedCategory;
            if (selectedLevel) filters.level = selectedLevel;
            if (searchQuery) filters.search = searchQuery;
            const result = await moduleService.getAllModules(filters);
            const moduleList = result?.modules || (Array.isArray(result) ? result : []);
            setModules(moduleList);
            setTotalPages(result?.pages || 1);
            setTotalModules(result?.total || moduleList.length);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const checkLevelAccess = (module) => {
        const categoryId = module.categoryId?._id || module.categoryId;
        const prog = progressions.find(p => {
            const pId = p.categoryId?._id || p.categoryId;
            return pId?.toString() === categoryId?.toString();
        });
        if (!prog) return module.level === 'beginner';
        const levels = ['beginner', 'intermediate', 'advanced'];
        return levels.indexOf(module.level || 'beginner') <= levels.indexOf(prog.currentLevel || 'beginner');
    };

    const getEnrollmentForModule = (moduleId) =>
        myEnrollments.find(e => (e.moduleId?._id || e.moduleId)?.toString() === moduleId?.toString());

    const getCategoryPricing = (module) => {
        const cat = module.categoryId;
        if (!cat || typeof cat === 'string') return categories.find(c => c._id === (cat || module.categoryId));
        return cat;
    };

    const getAccessState = (module) => {
        const cat = getCategoryPricing(module);
        if (!cat) return 'open';
        const catId = (cat._id || cat)?.toString?.();
        const isFellow = catId ? fellowCategoryIds.includes(catId) : false;
        if (cat.accessType === 'free') return isFellow ? 'fellow_free' : 'fellow_blocked';
        if (cat.isPaid || cat.accessType === 'paid') return isFellow ? 'paid_free' : 'paid';
        return 'open';
    };

    const handleEnroll = async (module) => {
        try {
            setEnrollingId(module._id);
            const result = await moduleEnrollmentService.enrollInModule(module._id);
            if (result.requiresPayment) {
                router.push(`/student/modules/${module._id}?payment=required&category=${result.categoryId}&price=${result.price}`);
                return;
            }
            router.push(`/student/modules/${module._id}`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to enroll';
            alert(msg);
        } finally { setEnrollingId(null); }
    };

    const clearFilters = () => {
        setSelectedCategory(''); setSelectedLevel('');
        setSearchInput(''); setSearchQuery(''); setCurrentPage(1);
    };
    const hasFilters = !!(selectedCategory || selectedLevel || searchQuery);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50/80">

                {/* ── Page header ── */}
                <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Browse Modules</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {selectedCategory
                                        ? `${totalModules} module${totalModules !== 1 ? 's' : ''} in this category`
                                        : searchQuery || selectedLevel
                                            ? `${totalModules} result${totalModules !== 1 ? 's' : ''} found`
                                            : 'Select a category below to explore its modules'}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gray-500 gap-1.5"
                                onClick={() => router.push('/student')}>
                                <Icons.LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

                    {/* ── Search + Level ── */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder="Search modules..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { setSearchQuery(searchInput); setCurrentPage(1); } }}
                                className="pl-9 h-10 text-sm border-gray-200 bg-white focus:border-[#021d49] focus:ring-[#021d49]/10"
                            />
                        </div>
                        <Select value={selectedLevel || '__all__'}
                            onValueChange={(v) => { setSelectedLevel(v === '__all__' ? '' : v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40 h-10 text-sm border-gray-200 bg-white">
                                <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All Levels</SelectItem>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="h-10 bg-[#021d49] hover:bg-[#032a66] text-white text-sm shrink-0 px-5"
                            onClick={() => { setSearchQuery(searchInput); setCurrentPage(1); }}>
                            <Icons.Search className="w-3.5 h-3.5 mr-1.5" /> Search
                        </Button>
                        {(searchQuery || selectedLevel) && (
                            <Button variant="ghost" size="sm" className="h-10 text-gray-500 hover:text-red-500 shrink-0 px-3"
                                onClick={() => { setSelectedLevel(''); setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}>
                                <Icons.X className="w-4 h-4 mr-1" /> Clear
                            </Button>
                        )}
                    </div>

                    {/* ── Browse by Category ── */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Icons.Layers className="w-4 h-4" /> Browse by Category
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                            {/* All Categories card */}
                            <button
                                onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
                                className={`group text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                                    !selectedCategory
                                        ? 'border-[#021d49] bg-[#021d49] shadow-md'
                                        : 'border-gray-200 bg-white hover:border-[#021d49]/40 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            !selectedCategory ? 'bg-white/20' : 'bg-[#021d49]/10'
                                        }`}>
                                            <Icons.LayoutGrid className={`w-4 h-4 ${!selectedCategory ? 'text-white' : 'text-[#021d49]'}`} />
                                        </div>
                                        <span className={`font-semibold text-sm ${!selectedCategory ? 'text-white' : 'text-gray-900'}`}>
                                            All Categories
                                        </span>
                                    </div>
                                    {!selectedCategory && <Icons.CheckCircle className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />}
                                </div>
                                <p className={`text-xs mt-2 ml-10 ${!selectedCategory ? 'text-blue-200' : 'text-gray-500'}`}>
                                    Browse all {totalModules} available modules
                                </p>
                            </button>

                            {/* Per-category cards */}
                            {categories.map((cat) => {
                                const isActive = selectedCategory === cat._id;
                                const isCatPaid = cat.isPaid || cat.accessType === 'paid' || cat.accessType === 'restricted';
                                const isCatFellows = cat.accessType === 'free' || cat.accessType === 'restricted';
                                const isCatFree = !isCatPaid && !isCatFellows;
                                const catIsFellowId = fellowCategoryIds.includes(cat._id?.toString());

                                return (
                                    <button
                                        key={cat._id}
                                        onClick={() => {
                                            setSelectedCategory(cat._id);
                                            setCurrentPage(1);
                                            setTimeout(() => {
                                                document.getElementById('category-info-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }, 80);
                                        }}
                                        className={`group text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                                            isActive
                                                ? 'border-[#021d49] bg-[#021d49] shadow-md'
                                                : 'border-gray-200 bg-white hover:border-[#021d49]/40 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isActive ? 'bg-white/20' : 'bg-[#021d49]/10'
                                                }`}>
                                                    <Icons.Layers className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#021d49]'}`} />
                                                </div>
                                                <span className={`font-semibold text-sm leading-tight line-clamp-2 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                                    {cat.name}
                                                </span>
                                            </div>
                                            {isActive && <Icons.CheckCircle className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />}
                                        </div>

                                        {/* Access + price badges */}
                                        <div className="flex flex-wrap gap-1.5 mt-3 ml-10">
                                            {isCatFellows && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    isActive ? 'bg-purple-400/30 text-purple-100' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                    <Icons.Award className="w-2.5 h-2.5" /> Fellows Priority
                                                </span>
                                            )}
                                            {isCatPaid && cat.price > 0 && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    isActive ? 'bg-amber-400/30 text-amber-100' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    KES {cat.price.toLocaleString()}
                                                </span>
                                            )}
                                            {isCatFree && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    <Icons.Unlock className="w-2.5 h-2.5" /> Free
                                                </span>
                                            )}
                                            {catIsFellowId && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-[#021d49]/10 text-[#021d49]'
                                                }`}>
                                                    <Icons.CheckCircle className="w-2.5 h-2.5" /> You're a Fellow
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Selected Category Info ── */}
                    {selectedCategory && (() => {
                        const baseCat = categories.find(c => c._id === selectedCategory);
                        const cat = selectedCategoryFull || baseCat;
                        if (!cat) return null;

                        const catIsFellowRestricted = cat.accessType === 'free' || cat.accessType === 'restricted';
                        const catIsPaid = cat.isPaid || cat.accessType === 'paid' || cat.accessType === 'restricted';
                        const catPrice = cat.price;
                        const desc = stripHtml(cat.description || '');
                        const programmeDesc = stripHtml(cat.courseDescription || '');
                        const objectives = stripHtml(cat.overallObjectives || '');
                        const outcomes = stripHtml(cat.learningOutcomes || '');
                        const hasRichContent = programmeDesc || objectives || outcomes;
                        return (
                            <div id="category-info-panel" className="rounded-2xl overflow-hidden shadow-xl border border-white/10" style={{ background: 'linear-gradient(135deg, #021d49 0%, #0a2d6e 50%, #1e3a8a 100%)' }}>

                                {/* ── Top section ── */}
                                <div className="p-6">
                                    {/* Breadcrumb */}
                                    <div className="flex items-center gap-1.5 text-blue-300 text-xs mb-4">
                                        <Icons.Layers className="w-3.5 h-3.5" />
                                        <span>Category</span>
                                        <Icons.ChevronRight className="w-3 h-3" />
                                        <span className="text-white font-semibold">{cat.name}</span>
                                    </div>

                                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                                        {/* Left: name + description + stats */}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
                                                {cat.name}
                                            </h2>
                                            {desc && (
                                                <p className="text-blue-200 text-sm leading-relaxed mb-4">{desc}</p>
                                            )}

                                            {/* Quick stats row */}
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                                                    <Icons.BookOpen className="w-3.5 h-3.5 text-blue-300" />
                                                    <span className="text-white text-xs font-semibold">
                                                        {totalModules} Module{totalModules !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                {catIsFellowRestricted && (
                                                    <div className="flex items-center gap-1.5 bg-purple-500/20 rounded-lg px-3 py-1.5">
                                                        <Icons.Award className="w-3.5 h-3.5 text-purple-300" />
                                                        <span className="text-purple-200 text-xs font-semibold">Fellows Priority</span>
                                                    </div>
                                                )}
                                                {catIsPaid && catPrice > 0 && (
                                                    <div className="flex items-center gap-1.5 bg-amber-500/20 rounded-lg px-3 py-1.5">
                                                        <Icons.DollarSign className="w-3.5 h-3.5 text-amber-300" />
                                                        <span className="text-amber-200 text-xs font-semibold">KES {catPrice.toLocaleString()} one-time</span>
                                                    </div>
                                                )}
                                                {!catIsPaid && !catIsFellowRestricted && (
                                                    <div className="flex items-center gap-1.5 bg-emerald-500/20 rounded-lg px-3 py-1.5">
                                                        <Icons.Unlock className="w-3.5 h-3.5 text-emerald-300" />
                                                        <span className="text-emerald-200 text-xs font-semibold">Free Access</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Pricing card */}
                                        <div className="flex-shrink-0 w-full lg:w-60 space-y-3">
                                            {/* Fellows badge */}
                                            {catIsFellowRestricted && cat.accessType !== 'paid' && (
                                                <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Icons.Award className="w-4 h-4 text-purple-300 flex-shrink-0" />
                                                        <p className="text-purple-200 font-bold text-sm">Fellows Priority</p>
                                                    </div>
                                                    <p className="text-purple-300 text-xs leading-relaxed">
                                                        Approved fellows get <strong className="text-purple-100">free access</strong> to all modules in this category.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Paid pricing card */}
                                            {catIsPaid && catPrice > 0 && (
                                                <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                                                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-1">
                                                        One-Time Category Price
                                                    </p>
                                                    <p className="text-4xl font-extrabold text-white mb-0.5">
                                                        KES {catPrice.toLocaleString()}
                                                    </p>
                                                    <p className="text-blue-200 text-xs mb-3">
                                                        Pay once · unlock <strong className="text-white">all {totalModules} modules</strong>
                                                    </p>
                                                    <div className="bg-amber-500/15 border border-amber-400/25 rounded-lg px-3 py-2">
                                                        <p className="text-amber-200 text-[10px] leading-relaxed">
                                                            💡 You will <strong className="text-amber-100">not be charged again</strong> for other modules in <strong className="text-amber-100">{cat.name}</strong> once paid.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Free / open access card */}
                                            {!catIsPaid && !catIsFellowRestricted && (
                                                <div className="bg-emerald-500/15 border border-emerald-400/25 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Icons.Unlock className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                                                        <p className="text-emerald-200 font-bold text-sm">Free Open Access</p>
                                                    </div>
                                                    <p className="text-emerald-300 text-xs leading-relaxed">
                                                        No payment required. Sign in and enroll in any module for free.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Rich content sections ── */}
                                {hasRichContent && (
                                    <div className="border-t border-white/15 px-6 py-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {programmeDesc && (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Icons.FileText className="w-3.5 h-3.5 text-blue-300" />
                                                    <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wider">Programme Description</p>
                                                </div>
                                                <p className="text-blue-100 text-xs leading-relaxed">{programmeDesc}</p>
                                            </div>
                                        )}
                                        {objectives && (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Icons.Target className="w-3.5 h-3.5 text-indigo-300" />
                                                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Objectives</p>
                                                </div>
                                                <p className="text-blue-100 text-xs leading-relaxed">{objectives}</p>
                                            </div>
                                        )}
                                        {outcomes && (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Icons.Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                                                    <p className="text-amber-300 text-[10px] font-bold uppercase tracking-wider">Learning Outcomes</p>
                                                </div>
                                                <p className="text-blue-100 text-xs leading-relaxed">{outcomes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Footer hint ── */}
                                <div className="border-t border-white/10 bg-black/15 px-6 py-3 flex items-center justify-between">
                                    <p className="text-blue-300 text-xs flex items-center gap-2">
                                        <Icons.ChevronDown className="w-3.5 h-3.5" />
                                        {totalModules} module{totalModules !== 1 ? 's' : ''} available below — click any to view details
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="text-blue-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                                    >
                                        <Icons.X className="w-3 h-3" /> Clear filter
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Loading ── */}
                    {loading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="border-gray-100 overflow-hidden">
                                    <div className="h-40 bg-gray-100 animate-pulse" />
                                    <CardContent className="p-4 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                                        <div className="h-8 bg-gray-100 rounded animate-pulse mt-3" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* ── Modules Grid ── */}
                    {!loading && modules.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {modules.map((mod) => {
                                const lvl = getLvl(mod.level);
                                const LvlIcon = Icons[lvl.icon] || Icons.BookOpen;
                                const hasLevelAccess = checkLevelAccess(mod);
                                const enrollment = getEnrollmentForModule(mod._id);
                                const isEnrolled = !!enrollment;
                                const category = getCategoryPricing(mod);
                                const accessState = getAccessState(mod);
                                const isFellowBlocked = accessState === 'fellow_blocked';
                                const isFree = ['fellow_free', 'paid_free', 'open'].includes(accessState);
                                const isPaid = accessState === 'paid';
                                const hasAccess = hasLevelAccess && !isFellowBlocked;
                                const price = category?.price || 0;
                                const categoryName = typeof mod.categoryId === 'object'
                                    ? mod.categoryId?.name
                                    : categories.find(c => c._id === mod.categoryId)?.name || '';
                                const isLocked = !hasLevelAccess && !isFellowBlocked;
                                const desc = stripHtml(mod.description);
                                const instructors = (mod.instructorIds || [])
                                    .filter(i => typeof i === 'object')
                                    .map(i => `${i.firstName || ''} ${i.lastName || ''}`.trim())
                                    .filter(Boolean);

                                return (
                                    <Card
                                        key={mod._id}
                                        className={`group overflow-hidden border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col ${!hasAccess ? 'opacity-75' : 'hover:border-[#021d49]/20'}`}
                                    >
                                        {/* Banner */}
                                        <div className="relative h-36 overflow-hidden shrink-0">
                                            {mod.bannerUrl ? (
                                                <img src={mod.bannerUrl} alt={mod.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${mod.level === 'advanced' ? 'bg-gradient-to-br from-rose-200 to-rose-300' :
                                                    mod.level === 'intermediate' ? 'bg-gradient-to-br from-amber-100 to-amber-200' :
                                                        'bg-gradient-to-br from-blue-100 to-indigo-200'
                                                    }`}>
                                                    <Icons.Layers className="w-12 h-12 text-white/50" />
                                                </div>
                                            )}
                                            {/* Overlay badges */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                            <div className="absolute top-2.5 left-2.5">
                                                <Badge variant="outline" className={`text-[10px] font-bold border ${lvl.badge} bg-white/90`}>
                                                    <LvlIcon className="w-2.5 h-2.5 mr-1" />
                                                    {lvl.label}
                                                </Badge>
                                            </div>
                                            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                                                {isEnrolled && (
                                                    <Badge className="text-[10px] bg-[#021d49] text-white border-0">
                                                        <Icons.BookOpen className="w-2.5 h-2.5 mr-1" /> Enrolled
                                                    </Badge>
                                                )}
                                                {!isEnrolled && isFellowBlocked && (
                                                    <Badge className="text-[10px] bg-purple-700 text-white border-0">
                                                        <Icons.Award className="w-2.5 h-2.5 mr-1" /> Fellows Only
                                                    </Badge>
                                                )}
                                                {!isEnrolled && isLocked && (
                                                    <Badge className="text-[10px] bg-gray-800 text-white border-0">
                                                        <Icons.Lock className="w-2.5 h-2.5 mr-1" /> Locked
                                                    </Badge>
                                                )}
                                                {!isEnrolled && isPaid && (
                                                    <Badge className="text-[10px] bg-amber-500 text-white border-0">
                                                        KES {price.toLocaleString()}
                                                    </Badge>
                                                )}
                                                {!isEnrolled && hasAccess && isFree && (
                                                    <Badge className="text-[10px] bg-emerald-600 text-white border-0">
                                                        <Icons.Unlock className="w-2.5 h-2.5 mr-1" /> Free
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <CardContent className="p-4 flex flex-col flex-1">
                                            {categoryName && (
                                                <p className="text-[10px] font-bold text-[#021d49] uppercase tracking-wider mb-1">{categoryName}</p>
                                            )}
                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-[#021d49] transition-colors flex-1 leading-snug">
                                                {mod.title}
                                            </h3>
                                            {desc && (
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{desc}</p>
                                            )}

                                            {/* Meta row */}
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

                                            {/* Instructors */}
                                            {instructors.length > 0 && (
                                                <div className="flex items-center gap-1.5 mb-3">
                                                    <Icons.GraduationCap className="w-3 h-3 text-gray-400 shrink-0" />
                                                    <p className="text-xs text-gray-500 truncate">{instructors.join(', ')}</p>
                                                </div>
                                            )}

                                            <Separator className="mb-3" />

                                            {/* Enrollment progress if enrolled */}
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

                                            {/* Action button */}
                                            {isFellowBlocked ? (
                                                <div className="rounded-lg bg-purple-50 border border-purple-100 p-2.5 flex items-start gap-2">
                                                    <Icons.Award className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                                                    <p className="text-[10px] text-purple-700 leading-snug">
                                                        Fellows-only module. Non-fellows must pay to access.
                                                    </p>
                                                </div>
                                            ) : isLocked ? (
                                                <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 flex items-center gap-2">
                                                    <Icons.Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <p className="text-xs text-gray-500">
                                                        Complete {mod.level === 'advanced' ? 'intermediate' : 'beginner'} level first
                                                    </p>
                                                </div>
                                            ) : isEnrolled ? (
                                                <Button className="w-full h-8 text-xs bg-[#021d49] hover:bg-[#032a66] text-white"
                                                    onClick={() => router.push(`/student/modules/${mod._id}`)}>
                                                    <Icons.Play className="w-3.5 h-3.5 mr-1.5" />
                                                    {enrollment.isCompleted ? 'Review Module' : 'Continue Learning'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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

                    {/* ── Empty state ── */}
                    {!loading && modules.length === 0 && (
                        <Card className="border-gray-100 shadow-sm">
                            <CardContent className="py-16 text-center">
                                <Icons.SearchX className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-base font-semibold text-gray-900 mb-1">No modules found</h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    {hasFilters ? 'Try adjusting your search or filters' : 'No modules are available yet'}
                                </p>
                                {hasFilters && (
                                    <Button className="bg-[#021d49] hover:bg-[#032a66] text-white" onClick={clearFilters}>
                                        Clear All Filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Pagination ── */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1.5">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                                <Icons.ChevronLeft className="w-4 h-4" />
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let page;
                                if (totalPages <= 7) {
                                    page = i + 1;
                                } else if (currentPage <= 4) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 3) {
                                    page = totalPages - 6 + i;
                                } else {
                                    page = currentPage - 3 + i;
                                }
                                return (
                                    <Button key={page} variant={page === currentPage ? 'default' : 'outline'}
                                        size="sm" className={`h-8 w-8 p-0 text-xs ${page === currentPage ? 'bg-[#021d49] hover:bg-[#032a66]' : 'border-gray-200'}`}
                                        onClick={() => setCurrentPage(page)}>
                                        {page}
                                    </Button>
                                );
                            })}
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                                <Icons.ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function StudentModuleBrowsingPage() {
    return (
        <ProtectedStudentRoute>
            <ModuleBrowsingContent />
        </ProtectedStudentRoute>
    );
}
