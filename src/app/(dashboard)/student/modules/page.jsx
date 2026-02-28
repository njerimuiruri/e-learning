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

// Get fellow-assigned category IDs from stored user data
function getFellowCategoryIds() {
    try {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem('user');
        if (!raw) return [];
        const user = JSON.parse(raw);
        return (user?.fellowData?.assignedCategories || []).map((id) => id?.toString?.() || String(id));
    } catch {
        return [];
    }
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

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchModules();
    }, [selectedCategory, selectedLevel, searchQuery, currentPage]);

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
        } catch (err) {
            console.error('Error fetching initial data:', err);
        }
    };

    const fetchModules = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (selectedCategory) filters.category = selectedCategory;
            if (selectedLevel) filters.level = selectedLevel;
            if (searchQuery) filters.search = searchQuery;
            filters.page = currentPage;
            filters.limit = 12;

            const result = await moduleService.getAllModules(filters);
            const moduleList = result?.modules || (Array.isArray(result) ? result : []);
            setModules(moduleList);
            setTotalPages(result?.pages || 1);
        } catch (err) {
            console.error('Failed to load modules:', err);
        } finally {
            setLoading(false);
        }
    };

    const getLevelBadge = (level) => {
        const badges = {
            beginner: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Beginner', icon: 'Sprout' },
            intermediate: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Intermediate', icon: 'Flame' },
            advanced: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Advanced', icon: 'Rocket' },
        };
        return badges[level] || badges.beginner;
    };

    const checkLevelAccess = (module) => {
        const categoryId = module.categoryId?._id || module.categoryId;
        const prog = progressions.find(p => {
            const pCatId = p.categoryId?._id || p.categoryId;
            return pCatId?.toString() === categoryId?.toString();
        });

        if (!prog) {
            // No progression = beginner only
            return module.level === 'beginner';
        }

        const levels = ['beginner', 'intermediate', 'advanced'];
        const currentIndex = levels.indexOf(prog.currentLevel || 'beginner');
        const moduleIndex = levels.indexOf(module.level || 'beginner');
        return moduleIndex <= currentIndex;
    };

    const getEnrollmentForModule = (moduleId) => {
        return myEnrollments.find(e => {
            const enrollModId = e.moduleId?._id || e.moduleId;
            return enrollModId?.toString() === moduleId?.toString();
        });
    };

    const getCategoryPricing = (module) => {
        const cat = module.categoryId;
        if (!cat || typeof cat === 'string') {
            const found = categories.find(c => c._id === (cat || module.categoryId));
            return found;
        }
        return cat;
    };

    // Returns the access state for a module given the current user
    // - 'fellow_free'   : fellow-only free category AND user is assigned → free access
    // - 'fellow_blocked': fellow-only free category AND user is NOT a fellow → blocked
    // - 'paid_free'     : paid category AND user is a fellow → free access
    // - 'paid'          : paid category, user must pay
    // - 'open'          : no payment required for this category
    const getAccessState = (module) => {
        const cat = getCategoryPricing(module);
        if (!cat) return 'open';

        const catId = (cat._id || cat)?.toString?.();
        const isFellowAssigned = catId ? fellowCategoryIds.includes(catId) : false;

        // Fellow-only free category
        if (cat.accessType === 'free') {
            return isFellowAssigned ? 'fellow_free' : 'fellow_blocked';
        }

        // Paid category
        if (cat.isPaid || cat.accessType === 'paid') {
            return isFellowAssigned ? 'paid_free' : 'paid';
        }

        return 'open';
    };

    // Convenience wrapper – true when user can enroll for free
    const hasFreeAccess = (module) => {
        const state = getAccessState(module);
        return state === 'fellow_free' || state === 'paid_free' || state === 'open';
    };

    const handleEnroll = async (module) => {
        try {
            setEnrollingId(module._id);
            const result = await moduleEnrollmentService.enrollInModule(module._id);

            if (result.requiresPayment) {
                // Redirect to payment
                router.push(`/student/modules/${module._id}?payment=required&category=${result.categoryId}&price=${result.price}`);
                return;
            }

            // Enrolled successfully - navigate to learning page
            router.push(`/student/modules/${module._id}`);
        } catch (err) {
            console.error('Enrollment failed:', err);
            const msg = err.response?.data?.message || 'Failed to enroll';
            alert(msg);
        } finally {
            setEnrollingId(null);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchModules();
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                                Browse Modules
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Discover learning modules across categories and difficulty levels
                            </p>
                        </div>

                        {/* Search & Filters */}
                        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 mb-8">
                            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="flex-1 relative">
                                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search modules by title or description..."
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#021d49] focus:ring-0 outline-none transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-[#021d49] to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:from-[#032e6b] hover:to-blue-800 transition-all shadow-md"
                                >
                                    Search
                                </button>
                            </form>

                            <div className="flex flex-wrap gap-3">
                                {/* Category Filter */}
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                                    className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-[#021d49] outline-none bg-white"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>

                                {/* Level Filter */}
                                <select
                                    value={selectedLevel}
                                    onChange={(e) => { setSelectedLevel(e.target.value); setCurrentPage(1); }}
                                    className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-[#021d49] outline-none bg-white"
                                >
                                    <option value="">All Levels</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>

                                {/* Clear filters */}
                                {(selectedCategory || selectedLevel || searchQuery) && (
                                    <button
                                        onClick={() => { setSelectedCategory(''); setSelectedLevel(''); setSearchQuery(''); setCurrentPage(1); }}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                    >
                                        <Icons.X className="w-4 h-4" />
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-t-4 border-[#021d49] mx-auto mb-4"></div>
                                    <p className="text-gray-600 font-medium">Loading modules...</p>
                                </div>
                            </div>
                        )}

                        {/* Modules Grid */}
                        {!loading && modules.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {modules.map((mod) => {
                                    const levelBadge = getLevelBadge(mod.level);
                                    const LevelIcon = Icons[levelBadge.icon] || Icons.BookOpen;
                                    const hasLevelAccess = checkLevelAccess(mod);
                                    const enrollment = getEnrollmentForModule(mod._id);
                                    const isEnrolled = !!enrollment;
                                    const category = getCategoryPricing(mod);
                                    const accessState = getAccessState(mod); // 'open' | 'fellow_free' | 'paid_free' | 'paid' | 'fellow_blocked'
                                    const isFellowBlocked = accessState === 'fellow_blocked';
                                    const isFree = accessState === 'fellow_free' || accessState === 'paid_free' || accessState === 'open';
                                    const isPaid = accessState === 'paid';
                                    const hasAccess = hasLevelAccess && !isFellowBlocked;
                                    const price = category?.price || 0;
                                    const categoryName = typeof mod.categoryId === 'object' ? mod.categoryId?.name : categories.find(c => c._id === mod.categoryId)?.name || '';

                                    return (
                                        <div
                                            key={mod._id}
                                            className={`group bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${hasAccess
                                                ? 'border-gray-200 hover:border-[#021d49]/30 hover:shadow-xl'
                                                : 'border-gray-200 opacity-75'
                                                }`}
                                        >
                                            {/* Banner */}
                                            <div className="relative h-44 overflow-hidden">
                                                {mod.bannerUrl ? (
                                                    <img
                                                        src={mod.bannerUrl}
                                                        alt={mod.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center">
                                                        <Icons.Layers className="w-16 h-16 text-white/60" />
                                                    </div>
                                                )}

                                                {/* Level Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border ${levelBadge.color}`}>
                                                        <LevelIcon className="w-3 h-3" />
                                                        {levelBadge.label}
                                                    </span>
                                                </div>

                                                {/* Status Badges */}
                                                <div className="absolute top-3 right-3 flex flex-col gap-1">
                                                    {isFellowBlocked && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-purple-700 text-white">
                                                            <Icons.Award className="w-3 h-3" />
                                                            Fellows Only
                                                        </span>
                                                    )}
                                                    {!isFellowBlocked && !hasLevelAccess && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-gray-800 text-white">
                                                            <Icons.Lock className="w-3 h-3" />
                                                            Level Locked
                                                        </span>
                                                    )}
                                                    {isEnrolled && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
                                                            <Icons.BookOpen className="w-3 h-3" />
                                                            Enrolled
                                                        </span>
                                                    )}
                                                    {!isEnrolled && isPaid && hasAccess && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-amber-500 text-white">
                                                            NGN {price.toLocaleString()}
                                                        </span>
                                                    )}
                                                    {!isEnrolled && isFree && hasAccess && (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-green-500 text-white">
                                                            <Icons.Unlock className="w-3 h-3" /> Free
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                {categoryName && (
                                                    <span className="text-xs font-semibold text-[#021d49] uppercase tracking-wide mb-1 block">
                                                        {categoryName}
                                                    </span>
                                                )}
                                                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-[#021d49] transition-colors">
                                                    {mod.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                    {mod.description}
                                                </p>

                                                {/* Meta */}
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                                                    <span className="flex items-center gap-1">
                                                        <Icons.BookOpen className="w-3.5 h-3.5" />
                                                        {mod.lessons?.length || 0} lessons
                                                    </span>
                                                    {mod.duration && (
                                                        <span className="flex items-center gap-1">
                                                            <Icons.Clock className="w-3.5 h-3.5" />
                                                            {mod.duration}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Users className="w-3.5 h-3.5" />
                                                        {mod.enrollmentCount || 0} students
                                                    </span>
                                                </div>

                                                {/* Rating */}
                                                {(mod.avgRating > 0 || mod.totalRatings > 0) && (
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Icons.Star
                                                                    key={s}
                                                                    className={`w-3.5 h-3.5 ${s <= Math.round(mod.avgRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-800">
                                                            {(mod.avgRating || 0).toFixed(1)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            ({mod.totalRatings || 0} review{(mod.totalRatings || 0) !== 1 ? 's' : ''})
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Instructors */}
                                                {mod.instructorIds && mod.instructorIds.length > 0 && (
                                                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
                                                        <Icons.GraduationCap className="w-3.5 h-3.5" />
                                                        <span>
                                                            {mod.instructorIds
                                                                .map(i => typeof i === 'object' ? `${i.firstName || ''} ${i.lastName || ''}`.trim() : '')
                                                                .filter(Boolean)
                                                                .join(', ') || 'Instructor'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                {isFellowBlocked ? (
                                                    <div className="rounded-xl overflow-hidden">
                                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                                                            <div className="flex items-start gap-2">
                                                                <Icons.Award className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                                                <p className="text-xs text-purple-800 leading-snug">
                                                                    <span className="font-bold block mb-0.5">Fellows-only module</span>
                                                                    This module is free only for fellows added by the admin. Non-fellows must pay to access.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : !hasLevelAccess ? (
                                                    <div className="bg-gray-100 rounded-xl p-3 text-center">
                                                        <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                                                            <Icons.Lock className="w-4 h-4" />
                                                            Complete {mod.level === 'advanced' ? 'intermediate' : 'beginner'} level first
                                                        </p>
                                                    </div>
                                                ) : isEnrolled ? (
                                                    <button
                                                        onClick={() => router.push(`/student/modules/${mod._id}`)}
                                                        className="w-full bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.Play className="w-4 h-4" />
                                                        {enrollment.isCompleted ? 'Review Module' : 'Continue Learning'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEnroll(mod)}
                                                        disabled={enrollingId === mod._id}
                                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {enrollingId === mod._id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                                Enrolling...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Icons.PlusCircle className="w-4 h-4" />
                                                                {isFree ? 'Start Learning - Free' : `Enroll - NGN ${price.toLocaleString()}`}
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && modules.length === 0 && (
                            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-12 text-center">
                                <Icons.SearchX className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Modules Found</h3>
                                <p className="text-gray-600 mb-6">
                                    {searchQuery || selectedCategory || selectedLevel
                                        ? 'Try adjusting your filters or search query'
                                        : 'No published modules are available yet'}
                                </p>
                                {(searchQuery || selectedCategory || selectedLevel) && (
                                    <button
                                        onClick={() => { setSelectedCategory(''); setSelectedLevel(''); setSearchQuery(''); setCurrentPage(1); }}
                                        className="bg-[#021d49] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#032e6b] transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium disabled:opacity-50 hover:border-[#021d49] transition-colors"
                                >
                                    <Icons.ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${page === currentPage
                                            ? 'bg-[#021d49] text-white'
                                            : 'border-2 border-gray-200 hover:border-[#021d49]'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium disabled:opacity-50 hover:border-[#021d49] transition-colors"
                                >
                                    <Icons.ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
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
