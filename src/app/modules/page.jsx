"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight, Layers, BookOpen, Users, Star, Award,
    Tag, DollarSign, Unlock, Search, Filter, ChevronDown
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import authService from '@/lib/api/authService';

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

const ModulesPage = () => {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(null);
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

    // Load enrolled modules for logged-in users
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
            list = list.filter(m => {
                const catId = m.categoryId?._id || m.categoryId;
                return catId === activeCategory;
            });
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
        if (enrolled) {
            // Already enrolled — go to learning page
            router.push(`/student/modules/${mod._id}`);
        } else {
            // Go to module detail page
            router.push(`/modules/${mod._id}`);
        }
    };

    // DB stores accessType as lowercase ('paid','free','restricted') + isPaid boolean
    const resolvePaid = (cat) => {
        if (!cat) return false;
        if (cat.isPaid === true) return true;
        const at = cat.accessType?.toLowerCase();
        if (at === 'paid') return true;
        if (at === 'restricted' && cat.price > 0) return true;
        return false;
    };

    const getAccessBadge = (cat) => {
        if (!cat) return null;
        const at = cat.accessType?.toLowerCase();

        if (at === 'restricted') {
            return (
                <>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        <Award className="w-3 h-3" /> Fellows Priority
                    </span>
                    {cat.price > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                            <DollarSign className="w-3 h-3" /> USD {cat.price.toLocaleString()}
                        </span>
                    )}
                </>
            );
        }

        if (at === 'paid' || cat.isPaid) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    <DollarSign className="w-3 h-3" /> Paid{cat.price ? ` · USD ${cat.price.toLocaleString()}` : ''}
                </span>
            );
        }

        if (at === 'free') {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    <Award className="w-3 h-3" /> Fellows Only
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                <Unlock className="w-3 h-3" /> Free
            </span>
        );
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pt-24 pb-16">

                {/* ─── Page Header ──────────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-[#021d49] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                            <Award className="w-4 h-4" />
                            <span>ALL LEARNING MODULES</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                            Explore Modules
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Browse all available learning modules organized by category. Sign in to enroll and start learning.
                        </p>
                    </div>

                    {/* ─── Search + Filters ─────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#021d49] focus:outline-none bg-white text-sm font-medium"
                            />
                        </div>

                        {/* Level filter */}
                        <div className="relative">
                            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={activeLevel}
                                onChange={e => setActiveLevel(e.target.value)}
                                className="pl-10 pr-8 py-3 rounded-xl border-2 border-gray-200 focus:border-[#021d49] focus:outline-none bg-white text-sm font-medium appearance-none cursor-pointer"
                            >
                                <option value="all">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* ─── Category Pills ───────────────────────────────── */}
                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            <button
                                onClick={() => setActiveCategory(null)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                                    !activeCategory
                                        ? 'bg-[#021d49] text-white shadow-md'
                                        : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#021d49]/40'
                                }`}
                            >
                                All Categories
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat._id}
                                    onClick={() => setActiveCategory(activeCategory === cat._id ? null : cat._id)}
                                    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                                        activeCategory === cat._id
                                            ? 'bg-[#021d49] text-white shadow-md'
                                            : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#021d49]/40'
                                    }`}
                                >
                                    {cat.name}
                                    {resolvePaid(cat) ? (
                                        <DollarSign className="w-3 h-3 opacity-70" />
                                    ) : (
                                        <Unlock className="w-3 h-3 opacity-70" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Content ──────────────────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-14 h-14 border-4 border-blue-200 border-t-[#021d49] rounded-full animate-spin" />
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-10 text-red-600 font-semibold">{error}</div>
                    )}

                    {!loading && !error && (
                        <>
                            <p className="text-sm text-gray-500 font-medium mb-6">
                                {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''} found
                            </p>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredModules.map(mod => {
                                    const rating = mod.avgRating ?? 0;
                                    const lessonCount = mod.lessons?.length || 0;
                                    const enrollmentCount = mod.enrollmentCount ?? 0;
                                    const instructorName = getInstructorName(mod);
                                    const initials = getInstructorInitials(instructorName);
                                    const cat = categories.find(c => c._id === (mod.categoryId?._id || mod.categoryId));
                                    const catName = cat?.name || mod.categoryId?.name || 'General';
                                    const enrolled = enrollmentsMap[mod._id];

                                    return (
                                        <div
                                            key={mod._id}
                                            className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-300 hover:-translate-y-2"
                                        >
                                            {/* Banner */}
                                            <div className="relative overflow-hidden h-52">
                                                <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                                                    <span className="bg-gradient-to-r from-[#021d49] to-blue-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                        {catName}
                                                    </span>
                                                    {cat && getAccessBadge(cat)}
                                                </div>
                                                {enrolled && (
                                                    <div className="absolute top-3 right-3 z-10 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                        <BookOpen className="w-3 h-3" /> Enrolled
                                                    </div>
                                                )}
                                                {mod.bannerUrl || mod.thumbnailUrl ? (
                                                    <img
                                                        src={mod.bannerUrl || mod.thumbnailUrl}
                                                        alt={mod.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50 flex items-center justify-center">
                                                        <Layers className="w-16 h-16 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 space-y-4">
                                                {mod.level && (
                                                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                                                        mod.level === 'beginner' ? 'bg-green-100 text-green-700' :
                                                        mod.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {mod.level}
                                                    </span>
                                                )}

                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#021d49] transition-colors line-clamp-2 min-h-[3.5rem]">
                                                    {mod.title}
                                                </h3>

                                                <div className="flex items-center justify-between text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <BookOpen className="w-4 h-4 text-indigo-500" />
                                                        <span>{lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-4 h-4 text-blue-500" />
                                                        <span>{enrollmentCount.toLocaleString()} enrolled</span>
                                                    </div>
                                                </div>

                                                {/* Rating */}
                                                <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-xl">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? 'fill-indigo-500 text-indigo-500' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
                                                    <span className="text-xs text-gray-500">rating</span>
                                                </div>

                                                {/* Instructor */}
                                                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#021d49] to-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500">Instructor</p>
                                                        <p className="text-sm font-bold text-gray-900 truncate">{instructorName}</p>
                                                    </div>
                                                </div>

                                                {/* CTA */}
                                                <button
                                                    onClick={() => handleModuleClick(mod)}
                                                    className={`w-full py-3.5 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
                                                        enrolled
                                                            ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md'
                                                            : 'bg-gradient-to-r from-[#021d49] via-blue-700 to-indigo-600 hover:from-indigo-600 hover:via-blue-700 hover:to-[#021d49] text-white shadow-md'
                                                    }`}
                                                >
                                                    {enrolled ? (
                                                        <>Continue Learning <ArrowRight className="w-4 h-4" /></>
                                                    ) : (
                                                        <>View Module Details <ArrowRight className="w-4 h-4" /></>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredModules.length === 0 && (
                                    <div className="col-span-full text-center py-16">
                                        <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600 text-lg font-medium">No modules found.</p>
                                        <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters.</p>
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
