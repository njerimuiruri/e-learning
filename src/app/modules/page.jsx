"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight, Layers, BookOpen, Users, Star, Award,
    DollarSign, Unlock, Search, Filter, ChevronDown,
    CheckCircle, Target, FileText, X, GraduationCap, Clock
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import authService from '@/lib/api/authService';

/* ─── Helpers ─── */
const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
};

function getInstructorName(mod) {
    if (mod.instructorIds && mod.instructorIds.length > 0) {
        const instructor = mod.instructorIds[0];
        if (instructor && typeof instructor === 'object') {
            const name = `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim();
            if (name) return name;
            if (instructor.email) return instructor.email;
        }
    }
    return 'Instructor';
}

function getInstructorInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0]?.toUpperCase() || '?';
}

function resolveAccess(cat) {
    if (!cat) return { isPaid: false, isFellowOnly: false, isRestricted: false };
    const at = cat.accessType?.toLowerCase();
    if (at === 'free') return { isPaid: false, isFellowOnly: true, isRestricted: false };
    if (at === 'restricted') return { isPaid: true, isFellowOnly: false, isRestricted: true };
    if (cat.isPaid === true || at === 'paid') return { isPaid: true, isFellowOnly: false, isRestricted: false };
    return { isPaid: false, isFellowOnly: false, isRestricted: false };
}

const ModulesPage = () => {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeCategoryFull, setActiveCategoryFull] = useState(null);
    const [activeLevel, setActiveLevel] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [modules, setModules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [enrollmentsMap, setEnrollmentsMap] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const user = authService.getCurrentUser();
        setIsLoggedIn(!!user);
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const [modulesData, categoriesData] = await Promise.all([
                    moduleService.getAllModules({ status: 'published' }),
                    categoryService.getAllCategories()
                ]);
                if (mounted) {
                    const modList = Array.isArray(modulesData)
                        ? modulesData
                        : modulesData?.modules || modulesData?.data || [];
                    setModules(modList);
                    setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                }
            } catch (err) {
                console.error('Failed to load modules', err);
                if (mounted) setError('Unable to load modules right now.');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchData();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (activeCategory) {
            categoryService.getCategoryById(activeCategory)
                .then(data => setActiveCategoryFull(data || null))
                .catch(() => setActiveCategoryFull(null));
        } else {
            setActiveCategoryFull(null);
        }
    }, [activeCategory]);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        let mounted = true;
        const fetchEnrollments = async () => {
            try {
                const data = await moduleEnrollmentService.getMyEnrollments();
                if (!mounted) return;
                const map = {};
                (data || []).forEach(en => {
                    const id = en.moduleId?._id || en.moduleId;
                    if (id) map[id] = en;
                });
                setEnrollmentsMap(map);
            } catch (err) {
                console.log('Could not load enrollments', err);
            }
        };
        fetchEnrollments();
        return () => { mounted = false; };
    }, [isLoggedIn]);

    const filteredModules = useMemo(() => {
        let list = modules;
        if (activeCategory) {
            list = list.filter(m => (m.categoryId?._id || m.categoryId) === activeCategory);
        }
        if (activeLevel !== 'all') {
            list = list.filter(m => m.level === activeLevel);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(m =>
                m.title?.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [modules, activeCategory, activeLevel, searchQuery]);

    const handleModuleClick = (mod) => {
        const enrolled = enrollmentsMap[mod._id];
        router.push(enrolled ? `/student/modules/${mod._id}` : `/modules/${mod._id}`);
    };

    const handleCategorySelect = (catId) => {
        if (activeCategory === catId) {
            setActiveCategory(null);
        } else {
            setActiveCategory(catId);
            setTimeout(() => {
                document.getElementById('category-info-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-white pt-24 pb-16">

                {/* ─── Page Header ──────────────────────────────────────── */}
                <div className="bg-gray-50 border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                            <div>
                                <p className="text-sm font-semibold text-[#021d49] uppercase tracking-widest mb-2">
                                    ARIN Publishing Academy
                                </p>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                                    Learning Modules
                                </h1>
                                <p className="text-gray-500 text-base max-w-xl">
                                    Choose a category below to explore its modules, description, and pricing.
                                </p>
                            </div>
                            {/* Search + Level */}
                            <div className="flex gap-2 flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#021d49] focus:outline-none bg-white text-sm w-48"
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={activeLevel}
                                        onChange={e => setActiveLevel(e.target.value)}
                                        className="pl-3 pr-8 py-2.5 rounded-lg border border-gray-200 focus:border-[#021d49] focus:outline-none bg-white text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

                    {/* ─── Browse by Category ───────────────────────────── */}
                    {categories.length > 0 && (
                        <div className="mb-10">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-gray-800">Browse by Category</h2>
                                {activeCategory && (
                                    <button
                                        onClick={() => setActiveCategory(null)}
                                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" /> Clear selection
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {/* All Categories */}
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={`group flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-150 ${
                                        !activeCategory
                                            ? 'bg-[#021d49] border-[#021d49] shadow-md'
                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        !activeCategory ? 'bg-white/20' : 'bg-gray-100'
                                    }`}>
                                        <Layers className={`w-4 h-4 ${!activeCategory ? 'text-white' : 'text-gray-500'}`} />
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm leading-snug ${!activeCategory ? 'text-white' : 'text-gray-800'}`}>
                                            All Categories
                                        </p>
                                        <p className={`text-xs mt-0.5 ${!activeCategory ? 'text-white/60' : 'text-gray-400'}`}>
                                            {modules.length} modules
                                        </p>
                                    </div>
                                </button>

                                {categories.map(cat => {
                                    const isActive = activeCategory === cat._id;
                                    const { isPaid, isFellowOnly, isRestricted } = resolveAccess(cat);
                                    const catModCount = modules.filter(m => (m.categoryId?._id || m.categoryId) === cat._id).length;

                                    return (
                                        <button
                                            key={cat._id}
                                            onClick={() => handleCategorySelect(cat._id)}
                                            className={`group flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-150 ${
                                                isActive
                                                    ? 'bg-[#021d49] border-[#021d49] shadow-md'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                isActive ? 'bg-white/20' : 'bg-blue-50'
                                            }`}>
                                                <BookOpen className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#021d49]'}`} />
                                            </div>
                                            <div>
                                                <p className={`font-semibold text-sm leading-snug line-clamp-2 ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                                    {cat.name}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    <span className={`text-xs ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                                                        {catModCount} module{catModCount !== 1 ? 's' : ''}
                                                    </span>
                                                    {(isFellowOnly || isRestricted) && (
                                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                                            isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'
                                                        }`}>Fellows</span>
                                                    )}
                                                    {isPaid && cat.price > 0 && (
                                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                                            isActive ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                                                        }`}>KES {cat.price.toLocaleString()}</span>
                                                    )}
                                                    {!isPaid && !isFellowOnly && !isRestricted && (
                                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                                            isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                                                        }`}>Free</span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Category Info Panel ──────────────────────────────── */}
                {activeCategory && (() => {
                    const baseCat = categories.find(c => c._id === activeCategory);
                    const cat = activeCategoryFull || baseCat;
                    if (!cat) return null;

                    const { isPaid, isFellowOnly, isRestricted } = resolveAccess(cat);
                    const catPrice = cat.price;
                    const catModCount = modules.filter(m => (m.categoryId?._id || m.categoryId) === activeCategory).length;

                    const desc = stripHtml(cat.description || '');
                    const programmeDesc = stripHtml(cat.courseDescription || '');
                    const objectives = stripHtml(cat.overallObjectives || '');
                    const outcomes = stripHtml(cat.learningOutcomes || '');
                    const hasRichContent = programmeDesc || objectives || outcomes;

                    return (
                        <div
                            id="category-info-panel"
                            className="bg-gray-50 border-y border-gray-200 mb-10 scroll-mt-24"
                        >
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                                {/* Top: title + access card */}
                                <div className="flex flex-col lg:flex-row gap-8">

                                    {/* Left */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                                    Category
                                                </p>
                                                <h2 className="text-2xl font-extrabold text-gray-900">{cat.name}</h2>
                                            </div>
                                            <button
                                                onClick={() => setActiveCategory(null)}
                                                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {desc && (
                                            <p className="text-gray-600 leading-relaxed max-w-2xl">{desc}</p>
                                        )}

                                        {/* Stat chips */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
                                                <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                                {catModCount} module{catModCount !== 1 ? 's' : ''}
                                            </span>
                                            {(isFellowOnly || isRestricted) && (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
                                                    <Award className="w-3.5 h-3.5" />
                                                    {isFellowOnly ? 'Fellows Only' : 'Fellows Priority'}
                                                </span>
                                            )}
                                            {isPaid && catPrice > 0 && (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    KES {catPrice.toLocaleString()} one-time
                                                </span>
                                            )}
                                            {!isPaid && !isFellowOnly && !isRestricted && (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                                    <Unlock className="w-3.5 h-3.5" />
                                                    Free Access
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: pricing / access card */}
                                    <div className="lg:w-72 flex-shrink-0">
                                        {(isFellowOnly || isRestricted) && (
                                            <div className="bg-white border border-purple-200 rounded-2xl p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                        <Award className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <p className="font-bold text-gray-900">
                                                        {isFellowOnly ? 'Fellows Only' : 'Fellows Priority'}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-500 leading-relaxed mb-3">
                                                    {isFellowOnly
                                                        ? 'This category is exclusively available to ARIN Fellows.'
                                                        : 'ARIN Fellows get free access. Others can join by making a one-time payment.'}
                                                </p>
                                                {isPaid && catPrice > 0 && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Non-Fellow Price</p>
                                                        <p className="text-2xl font-extrabold text-gray-900">KES {catPrice.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-500 mt-1">One-time · Unlocks all modules in this category</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!isFellowOnly && !isRestricted && isPaid && catPrice > 0 && (
                                            <div className="bg-white border border-amber-200 rounded-2xl p-5">
                                                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-2">Category Price</p>
                                                <p className="text-3xl font-extrabold text-gray-900 mb-1">KES {catPrice.toLocaleString()}</p>
                                                <p className="text-sm text-gray-500 mb-4">One-time payment</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                        Access all {catModCount} modules in this category
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                        Pay once, learn at your own pace
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!isFellowOnly && !isRestricted && !isPaid && (
                                            <div className="bg-white border border-emerald-200 rounded-2xl p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                        <Unlock className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <p className="font-bold text-gray-900">Free Access</p>
                                                </div>
                                                <p className="text-sm text-gray-500">All modules in this category are freely accessible after creating an account.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Rich content grid */}
                                {hasRichContent && (
                                    <div className="mt-8 grid md:grid-cols-3 gap-4">
                                        {programmeDesc && (
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FileText className="w-4 h-4 text-[#021d49]" />
                                                    <h4 className="font-semibold text-sm text-gray-700">Programme Description</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{programmeDesc}</p>
                                            </div>
                                        )}
                                        {objectives && (
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Target className="w-4 h-4 text-[#021d49]" />
                                                    <h4 className="font-semibold text-sm text-gray-700">Objectives</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{objectives}</p>
                                            </div>
                                        )}
                                        {outcomes && (
                                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <GraduationCap className="w-4 h-4 text-[#021d49]" />
                                                    <h4 className="font-semibold text-sm text-gray-700">Learning Outcomes</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{outcomes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer */}
                                <p className="text-xs text-gray-400 mt-6">
                                    Scroll down to see {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} in this category
                                </p>
                            </div>
                        </div>
                    );
                })()}

                {/* ─── Module Grid ──────────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#021d49] rounded-full animate-spin" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-10 text-red-500 font-medium">{error}</div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm font-medium text-gray-500">
                                    {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} found
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredModules.map(mod => {
                                    const rating = mod.avgRating ?? 0;
                                    const lessonCount = mod.lessons?.length || 0;
                                    const enrollmentCount = mod.enrollmentCount ?? 0;
                                    const instructorName = getInstructorName(mod);
                                    const initials = getInstructorInitials(instructorName);
                                    const cat = categories.find(c => c._id === (mod.categoryId?._id || mod.categoryId));
                                    const catName = cat?.name || mod.categoryId?.name || 'General';
                                    const enrolled = enrollmentsMap[mod._id];
                                    const { isPaid, isFellowOnly, isRestricted } = resolveAccess(cat);
                                    const catPrice = cat?.price;

                                    return (
                                        <div
                                            key={mod._id}
                                            className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                                        >
                                            {/* Banner image */}
                                            <div className="relative h-44 overflow-hidden bg-gray-100">
                                                {mod.bannerUrl || mod.thumbnailUrl ? (
                                                    <img
                                                        src={mod.bannerUrl || mod.thumbnailUrl}
                                                        alt={mod.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
                                                        <BookOpen className="w-12 h-12 text-gray-300" />
                                                    </div>
                                                )}
                                                {/* Level badge */}
                                                {mod.level && (
                                                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                                                        mod.level === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
                                                        mod.level === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {mod.level}
                                                    </span>
                                                )}
                                                {/* Enrolled badge */}
                                                {enrolled && (
                                                    <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Enrolled
                                                    </span>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 flex flex-col flex-1">
                                                {/* Category + access */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-[#021d49] uppercase tracking-wide">
                                                        {catName}
                                                    </span>
                                                    {(isFellowOnly || isRestricted) ? (
                                                        <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Fellows</span>
                                                    ) : isPaid && catPrice > 0 ? (
                                                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                                            KES {catPrice.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Free</span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-bold text-gray-900 text-base leading-snug mb-3 line-clamp-2 group-hover:text-[#021d49] transition-colors">
                                                    {mod.title}
                                                </h3>

                                                {/* Instructor */}
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-7 h-7 rounded-full bg-[#021d49] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-400">Instructor</p>
                                                        <p className="text-xs font-semibold text-gray-700 truncate">{instructorName}</p>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-xs text-gray-500 pb-4 border-b border-gray-100 mb-4">
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        {lessonCount} lesson{lessonCount !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {enrollmentCount.toLocaleString()} enrolled
                                                    </span>
                                                    {rating > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                            {rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* CTA */}
                                                <button
                                                    onClick={() => handleModuleClick(mod)}
                                                    className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                                        enrolled
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-[#021d49] text-white hover:bg-[#032a5e]'
                                                    }`}
                                                >
                                                    {enrolled ? (
                                                        <>Continue Learning <ArrowRight className="w-3.5 h-3.5" /></>
                                                    ) : (
                                                        <>View Details <ArrowRight className="w-3.5 h-3.5" /></>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredModules.length === 0 && (
                                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
                                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-600 font-semibold">No modules found</p>
                                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or selecting a different category.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ModulesPage;
