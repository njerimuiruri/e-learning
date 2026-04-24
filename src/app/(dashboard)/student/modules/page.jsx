'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

/* ─── Helpers ─── */
const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
};

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
    const [selectedCategoryFull, setSelectedCategoryFull] = useState(null);

    useEffect(() => { fetchInitialData(); }, []);
    // Reset to first page whenever filters change
    useEffect(() => { setCurrentPage(1); }, [selectedCategory, selectedLevel, searchQuery]);
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
            const [cats, mods, progs, enrollments] = await Promise.all([
                categoryService.getAllCategories(),
                moduleService.getAllModules({ limit: 500 }),
                progressionService.getMyProgressions().catch(() => []),
                moduleEnrollmentService.getMyEnrollments().catch(() => []),
            ]);
            setCategories(Array.isArray(cats) ? cats : []);

            // Normalize module response (handle array, { modules: [] }, or { data: [] })
            let moduleList = [];
            if (Array.isArray(mods)) {
                moduleList = mods;
            } else if (mods?.modules && Array.isArray(mods.modules)) {
                moduleList = mods.modules;
            } else if (mods?.data && Array.isArray(mods.data)) {
                moduleList = mods.data;
            }
            setModules(moduleList);

            setProgressions(Array.isArray(progs) ? progs : progs?.progressions || []);
            const enrollList = Array.isArray(enrollments) ? enrollments : enrollments?.enrollments || [];
            setMyEnrollments(enrollList);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    /* ─── Client-side filtering (mirrors the homepage approach) ─── */
    const PAGE_SIZE = 12;

    const filteredModules = useMemo(() => {
        let list = modules;
        if (selectedCategory) {
            list = list.filter(m => {
                const modCatId = (m.categoryId?._id || m.categoryId)?.toString?.() || String(m.categoryId?._id || m.categoryId);
                return modCatId === selectedCategory?.toString();
            });
        }
        if (selectedLevel) {
            list = list.filter(m => m.level === selectedLevel);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(m =>
                m.title?.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [modules, selectedCategory, selectedLevel, searchQuery]);

    const totalModules = filteredModules.length;
    const totalPages = Math.ceil(totalModules / PAGE_SIZE) || 1;
    const displayedModules = filteredModules.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

    const isSequentiallyLocked = (mod) => {
        // Optional modules are never sequentially locked — students can always choose to access them.
        if (mod.isOptional) return false;
        if (!mod.order || mod.order <= 1) return false;
        const catId = (mod.categoryId?._id || mod.categoryId)?.toString();
        // Find the nearest lower-order compulsory module in the same category.
        // Optional modules in between are skipped — they don't gate progression.
        const prevCompulsory = modules
            .filter(m => {
                const mCatId = (m.categoryId?._id || m.categoryId)?.toString();
                return mCatId === catId && m.order < mod.order && !m.isOptional;
            })
            .sort((a, b) => b.order - a.order)[0];
        if (!prevCompulsory) return false;
        return !getEnrollmentForModule(prevCompulsory._id)?.isCompleted;
    };

    const getPrevModuleTitle = (mod) => {
        if (!mod.order || mod.order <= 1) return null;
        const catId = (mod.categoryId?._id || mod.categoryId)?.toString();
        // Show the title of the nearest lower-order compulsory module.
        const prevCompulsory = modules
            .filter(m => {
                const mCatId = (m.categoryId?._id || m.categoryId)?.toString();
                return mCatId === catId && m.order < mod.order && !m.isOptional;
            })
            .sort((a, b) => b.order - a.order)[0];
        return prevCompulsory?.title || `Module ${mod.order - 1}`;
    };

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
        if (!module.isOptional && isSequentiallyLocked(module)) {
            const prevTitle = getPrevModuleTitle(module);
            alert(`You must complete "${prevTitle}" before enrolling in this module.`);
            return;
        }
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
                                className={`group text-left rounded-xl border-2 p-4 transition-all duration-200 ${!selectedCategory
                                    ? 'border-[#021d49] bg-[#021d49] shadow-md'
                                    : 'border-gray-200 bg-white hover:border-[#021d49]/40 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!selectedCategory ? 'bg-white/20' : 'bg-[#021d49]/10'
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
                                    Browse all {modules.length} available modules
                                </p>
                            </button>

                            {/* Per-category cards */}
                            {categories.map((cat) => {
                                const catIdStr = cat._id?.toString();
                                const isActive = selectedCategory === cat._id;
                                const isCatPaid = cat.isPaid || cat.accessType === 'paid' || cat.accessType === 'restricted';
                                const isCatFellows = cat.accessType === 'free' || cat.accessType === 'restricted';
                                const isCatFree = !isCatPaid && !isCatFellows;
                                const catIsFellowId = fellowCategoryIds.includes(catIdStr);
                                const catModCount = modules.filter(m => {
                                    const modCatId = (m.categoryId?._id || m.categoryId)?.toString?.();
                                    return modCatId === catIdStr;
                                }).length;

                                return (
                                    <button
                                        key={cat._id}
                                        onClick={() => { setSelectedCategory(cat._id); setCurrentPage(1); }}
                                        className={`group text-left rounded-xl border-2 p-4 transition-all duration-200 ${isActive
                                            ? 'border-[#021d49] bg-[#021d49] shadow-md'
                                            : 'border-gray-200 bg-white hover:border-[#021d49]/40 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20' : 'bg-[#021d49]/10'
                                                    }`}>
                                                    <Icons.Layers className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#021d49]'}`} />
                                                </div>
                                                <div>
                                                    <span className={`font-semibold text-sm leading-tight line-clamp-2 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                                        {cat.name}
                                                    </span>
                                                    <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {catModCount} module{catModCount !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            {isActive && <Icons.CheckCircle className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />}
                                        </div>

                                        {/* Access + price badges */}
                                        <div className="flex flex-wrap gap-1.5 mt-3 ml-10">
                                            {isCatFellows && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-purple-400/30 text-purple-100' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    <Icons.Award className="w-2.5 h-2.5" /> Fellows Priority
                                                </span>
                                            )}
                                            {isCatPaid && cat.price > 0 && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-400/30 text-amber-100' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    KES {cat.price.toLocaleString()}
                                                </span>
                                            )}
                                            {isCatFree && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-400/30 text-blue-100' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    <Icons.Unlock className="w-2.5 h-2.5" /> Free
                                                </span>
                                            )}
                                            {catIsFellowId && (
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#021d49]/10 text-[#021d49]'
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
                        const welcomeMsg = cat.welcomeMessage?.trim() || '';
                        const programmeDesc = stripHtml(cat.courseDescription || '');
                        const objectives = stripHtml(cat.overallObjectives || '');
                        const outcomes = stripHtml(cat.learningOutcomes || '');
                        const hasRichContent = programmeDesc || objectives || outcomes;
                        return (
                            <div id="category-info-panel" className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">

                                {/* ── Header bar ── */}
                                <div className="bg-gradient-to-r from-[#021d49] to-blue-700 px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white/70 text-xs">
                                        <Icons.Layers className="w-3.5 h-3.5" />
                                        <span>Category</span>
                                        <Icons.ChevronRight className="w-3 h-3" />
                                        <span className="text-white font-semibold">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={clearFilters}
                                        className="text-white/60 hover:text-white text-xs flex items-center gap-1 transition-colors"
                                    >
                                        <Icons.X className="w-3 h-3" /> Clear
                                    </button>
                                </div>

                                {/* ── Welcome Message ── */}
                                {welcomeMsg && (
                                    <div className="mx-6 mt-6 mb-2 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                        <div className="flex items-center gap-2.5 px-5 py-3 bg-gray-50 border-b border-gray-100">
                                            <Icons.Sparkles className="w-4 h-4 text-[#021d49] flex-shrink-0" />
                                            <p className="text-[#021d49] text-[11px] font-bold uppercase tracking-widest">
                                                Programme Welcome
                                            </p>
                                        </div>
                                        <div
                                            className="px-5 py-4 prose prose-sm max-w-none
                                                prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-2
                                                prose-li:text-gray-600 prose-strong:text-gray-800
                                                prose-h1:text-gray-900 prose-h2:text-gray-800 prose-h3:text-gray-800
                                                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                                                prose-ol:pl-5 prose-ul:pl-5"
                                            dangerouslySetInnerHTML={{ __html: welcomeMsg }}
                                        />
                                    </div>
                                )}

                                {/* ── Top section ── */}
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                                        {/* Left: name + description + stats */}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
                                                {cat.name}
                                            </h2>
                                            {desc && (
                                                <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
                                            )}

                                            {/* Quick stats row */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5">
                                                    <Icons.BookOpen className="w-3.5 h-3.5 text-gray-500" />
                                                    <span className="text-gray-700 text-xs font-semibold">
                                                        {totalModules} Module{totalModules !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                {catIsFellowRestricted && (
                                                    <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5">
                                                        <Icons.Award className="w-3.5 h-3.5 text-purple-500" />
                                                        <span className="text-purple-700 text-xs font-semibold">Fellows Priority</span>
                                                    </div>
                                                )}
                                                {catIsPaid && catPrice > 0 && (
                                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                                                        <Icons.DollarSign className="w-3.5 h-3.5 text-amber-600" />
                                                        <span className="text-amber-700 text-xs font-semibold">KES {catPrice.toLocaleString()} one-time</span>
                                                    </div>
                                                )}
                                                {!catIsPaid && !catIsFellowRestricted && (
                                                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                                                        <Icons.Unlock className="w-3.5 h-3.5 text-blue-700" />
                                                        <span className="text-blue-700 text-xs font-semibold">Free Access</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Pricing card */}
                                        <div className="flex-shrink-0 w-full lg:w-60 space-y-3">
                                            {/* Fellows badge */}
                                            {catIsFellowRestricted && cat.accessType !== 'paid' && (
                                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Icons.Award className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                        <p className="text-purple-700 font-bold text-sm">Fellows Priority</p>
                                                    </div>
                                                    <p className="text-purple-600 text-xs leading-relaxed">
                                                        Approved fellows get <strong className="text-purple-800">free access</strong> to all modules in this category.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Paid pricing card */}
                                            {catIsPaid && catPrice > 0 && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                                        One-Time Category Price
                                                    </p>
                                                    <p className="text-4xl font-extrabold text-gray-900 mb-0.5">
                                                        KES {catPrice.toLocaleString()}
                                                    </p>
                                                    <p className="text-gray-500 text-xs mb-3">
                                                        Pay once · unlock <strong className="text-gray-800">all {totalModules} modules</strong>
                                                    </p>
                                                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                                        <p className="text-amber-700 text-[10px] leading-relaxed">
                                                            💡 You will <strong className="text-amber-800">not be charged again</strong> for other modules in <strong className="text-amber-800">{cat.name}</strong> once paid.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Free / open access card */}
                                            {!catIsPaid && !catIsFellowRestricted && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Icons.Unlock className="w-4 h-4 text-blue-700 flex-shrink-0" />
                                                        <p className="text-blue-700 font-bold text-sm">Free Open Access</p>
                                                    </div>
                                                    <p className="text-blue-600 text-xs leading-relaxed">
                                                        No payment required. Sign in and enroll in any module for free.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Rich content sections ── */}
                                {hasRichContent && (
                                    <div className="border-t border-gray-100 px-6 py-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50">
                                        {programmeDesc && (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Icons.FileText className="w-3.5 h-3.5 text-gray-400" />
                                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Programme Description</p>
                                                </div>
                                                <p className="text-gray-600 text-xs leading-relaxed">{programmeDesc}</p>
                                            </div>
                                        )}
                                        {objectives && (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Icons.Target className="w-3.5 h-3.5 text-gray-400" />
                                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Objectives</p>
                                                </div>
                                                <p className="text-gray-600 text-xs leading-relaxed">{objectives}</p>
                                            </div>
                                        )}
                                        {outcomes && (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Icons.Lightbulb className="w-3.5 h-3.5 text-gray-400" />
                                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Learning Outcomes</p>
                                                </div>
                                                <p className="text-gray-600 text-xs leading-relaxed">{outcomes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Footer hint ── */}
                                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between">
                                    <p className="text-gray-400 text-xs flex items-center gap-2">
                                        <Icons.ChevronDown className="w-3.5 h-3.5" />
                                        {totalModules} module{totalModules !== 1 ? 's' : ''} available below — click any to view details
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Sequential Learning Notice ── */}
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <Icons.ListOrdered className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-semibold">Sequential Learning:</span> Modules within each programme must be completed in order — you must finish Module 1 before you can access Module 2, and so on. Locked modules will become available once you complete the preceding one.
                        </p>
                    </div>

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
                    {!loading && displayedModules.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedModules.map((mod) => {
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
                                const seqLocked = !isEnrolled && isSequentiallyLocked(mod);
                                const prevModTitle = seqLocked ? getPrevModuleTitle(mod) : null;
                                const isLocked = (!hasLevelAccess && !isFellowBlocked) || seqLocked;
                                const desc = stripHtml(mod.description);
                                const instructors = (mod.instructorIds || [])
                                    .filter(i => typeof i === 'object')
                                    .map(i => `${i.firstName || ''} ${i.lastName || ''}`.trim())
                                    .filter(Boolean);

                                return (
                                    <Card
                                        key={mod._id}
                                        className={`group overflow-hidden border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col ${isLocked ? 'opacity-75' : 'hover:border-[#021d49]/20'}`}
                                    >
                                        {/* Banner */}
                                        <div className="relative h-36 overflow-hidden shrink-0">
                                            {mod.bannerUrl ? (
                                                <img src={toAbsoluteUrl(mod.bannerUrl)} alt={mod.title}
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
                                                {mod.isOptional && (
                                                    <Badge className="text-[10px] bg-amber-500 text-white border-0">
                                                        <Icons.Star className="w-2.5 h-2.5 mr-1" /> Optional
                                                    </Badge>
                                                )}
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
                                                {!isEnrolled && (seqLocked || (!hasLevelAccess && !isFellowBlocked)) && (
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
                                                <div className="inline-flex items-center gap-1 mb-2 w-fit">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#021d49] text-white px-2.5 py-1 rounded-md">
                                                        <Icons.ListOrdered className="w-3 h-3" />
                                                        Module {mod.order}
                                                    </span>
                                                </div>
                                            )}
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
                                                    {(() => {
                                                        const pct = enrollment.isCompleted ? 100 : Math.min(100, Math.round(enrollment.progress || 0));
                                                        return (
                                                            <>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] text-gray-500">Your progress</span>
                                                                    <span className="text-[10px] font-bold text-[#021d49]">{pct}%</span>
                                                                </div>
                                                                <Progress value={pct} className="h-1.5" />
                                                            </>
                                                        );
                                                    })()}
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
                                            ) : seqLocked ? (
                                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 flex items-start gap-2">
                                                    <Icons.Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs text-amber-700 leading-snug">
                                                        Complete <span className="font-medium">&ldquo;{prevModTitle}&rdquo;</span> first
                                                    </p>
                                                </div>
                                            ) : !hasLevelAccess && !isFellowBlocked ? (
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
                                                    className="w-full h-8 text-xs bg-[#1e40af] hover:bg-[#1a35a0] text-white"
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
                    {!loading && filteredModules.length === 0 && (
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
