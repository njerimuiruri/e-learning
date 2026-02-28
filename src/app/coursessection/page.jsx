"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight, Layers, BookOpen, Users, Award,
    DollarSign, Unlock, Tag, LayoutGrid, GraduationCap,
    CheckCircle, ChevronRight,
} from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import categoryService from '@/lib/api/categoryService';

const placeholderGradient = 'bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50';

// Helper to get instructor name from module (field is instructorIds - array of populated User objects)
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

// Helper to get instructor initials
function getInstructorInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0]?.toUpperCase() || '?';
}

// Resolve access type
// - isFellowOnly: category is 'free' (= restricted to fellows; non-fellows cannot access)
// - isPaid: category requires payment (non-fellows can pay)
function resolveAccess(cat) {
    if (!cat) return { isPaid: false, isFellowOnly: false, isRestricted: false };
    const at = cat.accessType?.toLowerCase();
    if (at === 'free') return { isPaid: false, isFellowOnly: true, isRestricted: false };
    if (at === 'restricted') return { isPaid: true, isFellowOnly: false, isRestricted: true };
    if (cat.isPaid === true || at === 'paid') return { isPaid: true, isFellowOnly: false, isRestricted: false };
    return { isPaid: false, isFellowOnly: false, isRestricted: false };
}

const LEVEL_STYLES = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-red-100 text-red-700',
};

const CoursesSection = () => {
    const [activeCategory, setActiveCategory] = useState(null); // null = All
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);

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
                console.error('Failed to load data', err);
                if (mounted) setError('Unable to load modules right now.');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchData();
        return () => { mounted = false; };
    }, []);

    const selectedCategory = useMemo(
        () => categories.find(c => c._id === activeCategory) || null,
        [categories, activeCategory]
    );

    const filteredModules = useMemo(() => {
        if (!activeCategory) return modules;
        return modules.filter(m => {
            const catId = m.categoryId?._id || m.categoryId;
            return catId === activeCategory;
        });
    }, [modules, activeCategory]);

    const moduleCountForCategory = (catId) =>
        modules.filter(m => (m.categoryId?._id || m.categoryId) === catId).length;

    return (
        <section className="relative py-20 lg:py-28 bg-gray-50 overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ─── Section Header ─────────────────────────────────── */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-[#021d49]/10 text-[#021d49] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <Award className="w-4 h-4" />
                        <span>LEARNING MODULES</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                        Explore Our Learning Modules
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Expert-led modules designed to elevate your research and policy skills
                    </p>
                </div>

                {/* ─── Category Tabs ───────────────────────────────────── */}
                {!loading && categories.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="w-4 h-4 text-[#021d49]" />
                            <span className="text-sm font-semibold text-gray-700">Filter by Category</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {/* All tab */}
                            <button
                                onClick={() => setActiveCategory(null)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                                    !activeCategory
                                        ? 'bg-[#021d49] border-[#021d49] text-white shadow-md'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#021d49] hover:text-[#021d49]'
                                }`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                All
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${!activeCategory ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {modules.length}
                                </span>
                            </button>

                            {/* Category tabs */}
                            {categories.map((cat) => {
                                const isActive = activeCategory === cat._id;
                                const count = moduleCountForCategory(cat._id);
                                const { isPaid, isFellowOnly, isRestricted } = resolveAccess(cat);

                                return (
                                    <button
                                        key={cat._id}
                                        onClick={() => setActiveCategory(isActive ? null : cat._id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                                            isActive
                                                ? 'bg-[#021d49] border-[#021d49] text-white shadow-md'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-[#021d49] hover:text-[#021d49]'
                                        }`}
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        {cat.name}
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                                            {count}
                                        </span>
                                        {isFellowOnly ? (
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-purple-400/30 text-purple-100' : 'bg-purple-100 text-purple-700'}`}>
                                                Fellows Only
                                            </span>
                                        ) : isRestricted ? (
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-purple-400/30 text-purple-100' : 'bg-purple-100 text-purple-700'}`}>
                                                Fellows Priority
                                            </span>
                                        ) : isPaid ? (
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-orange-400/30 text-orange-100' : 'bg-orange-100 text-orange-700'}`}>
                                                Paid
                                            </span>
                                        ) : (
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-emerald-100 text-emerald-700'}`}>
                                                Open
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected category summary strip */}
                        {selectedCategory && (() => {
                            const { isPaid, isFellowOnly, isRestricted } = resolveAccess(selectedCategory);
                            return (
                                <div className="mt-4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#021d49]/10 flex items-center justify-center">
                                                <Layers className="w-4 h-4 text-[#021d49]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{selectedCategory.name}</p>
                                                {selectedCategory.description && (
                                                    <p className="text-xs text-gray-500 max-w-md truncate">{selectedCategory.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isFellowOnly ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
                                                    <Award className="w-3 h-3" /> Fellows Only
                                                </span>
                                            ) : isRestricted ? (
                                                <>
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
                                                        <Award className="w-3 h-3" /> Fellows Priority
                                                    </span>
                                                    {selectedCategory.price > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700">
                                                            <DollarSign className="w-3 h-3" /> USD {selectedCategory.price.toLocaleString()}
                                                        </span>
                                                    )}
                                                </>
                                            ) : isPaid ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700">
                                                    <DollarSign className="w-3 h-3" /> Paid{selectedCategory.price > 0 ? ` · USD ${selectedCategory.price.toLocaleString()}` : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
                                                    <Unlock className="w-3 h-3" /> Open Access
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                                                <BookOpen className="w-3 h-3" />
                                                {moduleCountForCategory(selectedCategory._id)} Modules
                                            </span>
                                            <Link
                                                href={`/modules?category=${selectedCategory._id}`}
                                                className="text-xs font-semibold text-[#021d49] hover:underline flex items-center gap-1"
                                            >
                                                View all <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                    {/* Disclaimer for fellow-only categories */}
                                    {isFellowOnly && (
                                        <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5">
                                            <Award className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-purple-800 leading-relaxed">
                                                <span className="font-bold">Fellows-only access:</span> Modules in this category are free only for fellows added by the admin. Non-fellows must pay to access them.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ─── Loading ─────────────────────────────────────────── */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#021d49] rounded-full animate-spin" />
                    </div>
                )}

                {/* ─── Error ───────────────────────────────────────────── */}
                {error && !loading && (
                    <div className="text-center bg-red-50 border border-red-200 rounded-2xl p-8 mb-8">
                        <p className="text-red-600 font-semibold">{error}</p>
                    </div>
                )}

                {/* ─── Section label ───────────────────────────────────── */}
                {!loading && !error && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            {selectedCategory ? `Modules in "${selectedCategory.name}"` : 'All Modules'}
                            <span className="ml-2 text-sm font-normal text-gray-400">({filteredModules.length})</span>
                        </h3>
                        <Link
                            href="/modules"
                            className="text-sm font-semibold text-[#021d49] hover:underline flex items-center gap-1"
                        >
                            Browse all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* ─── Modules Grid ─────────────────────────────────────── */}
                {!loading && !error && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
                        {filteredModules.map((mod) => {
                            const instructorName = getInstructorName(mod);
                            const initials = getInstructorInitials(instructorName);
                            const lessonCount = mod.lessons?.length || 0;
                            const enrollmentCount = mod.enrollmentCount ?? 0;

                            // Category info
                            const cat = categories.find(c => c._id === (mod.categoryId?._id || mod.categoryId));
                            const catName = cat?.name || mod.categoryId?.name || '';
                            const { isPaid, isFellowOnly, isRestricted } = resolveAccess(cat);
                            const catPrice = cat?.price;
                            const levelStyle = LEVEL_STYLES[mod.level] || LEVEL_STYLES.beginner;

                            return (
                                <div
                                    key={mod._id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                                >
                                    {/* Banner */}
                                    <div className="relative h-44 overflow-hidden">
                                        {mod.bannerUrl || mod.thumbnailUrl ? (
                                            <img
                                                src={mod.bannerUrl || mod.thumbnailUrl}
                                                alt={mod.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-full h-full ${placeholderGradient} flex items-center justify-center`}>
                                                <Layers className="w-14 h-14 text-gray-300" />
                                            </div>
                                        )}

                                        {/* Overlay badges */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                            {/* Level badge */}
                                            {mod.level && (
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${levelStyle}`}>
                                                    {mod.level}
                                                </span>
                                            )}
                                            {/* Access badge */}
                                            {isFellowOnly ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-600 text-white">
                                                    <Award className="w-3 h-3" /> Fellows Only
                                                </span>
                                            ) : isRestricted ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-600 text-white">
                                                    <Award className="w-3 h-3" /> Fellows Priority{catPrice ? ` · USD ${catPrice.toLocaleString()}` : ''}
                                                </span>
                                            ) : isPaid ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white">
                                                    <DollarSign className="w-3 h-3" />
                                                    Paid{catPrice ? ` · USD ${catPrice.toLocaleString()}` : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white">
                                                    <Unlock className="w-3 h-3" /> Open
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col flex-1">
                                        {/* Category */}
                                        {catName && (
                                            <span className="text-xs font-semibold text-[#021d49] uppercase tracking-wide mb-1.5">
                                                {catName}
                                            </span>
                                        )}

                                        {/* Module name */}
                                        <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2 line-clamp-2">
                                            {mod.title}
                                        </h3>

                                        {/* Fellow-only disclaimer */}
                                        {(isFellowOnly || isRestricted) && (
                                            <div className="flex items-start gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3">
                                                <Award className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-purple-800 leading-snug">
                                                    {isRestricted
                                                        ? `Fellows get free access. Public can pay USD ${catPrice?.toLocaleString() || ''} to access.`
                                                        : 'Free for fellows only. Non-fellows must pay to access.'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Instructor */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-7 h-7 rounded-full bg-[#021d49] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {initials}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-500">Instructor</p>
                                                <p className="text-sm font-semibold text-gray-900 truncate">{instructorName}</p>
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                                {lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-blue-500" />
                                                {enrollmentCount.toLocaleString()} enrolled
                                            </span>
                                            {mod.finalAssessment && (
                                                <span className="flex items-center gap-1 text-emerald-600">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Certificate
                                                </span>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <div className="mt-auto">
                                            <Link
                                                href={`/modules/${mod._id}`}
                                                className="flex items-center justify-center gap-2 w-full bg-[#021d49] hover:bg-[#032a5e] text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                                            >
                                                View Module
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredModules.length === 0 && (
                            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <Layers className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">
                                    {selectedCategory
                                        ? `No modules available in "${selectedCategory.name}" yet.`
                                        : 'No modules available yet.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Bottom CTA ───────────────────────────────────────── */}
                {!loading && (
                    <div className="text-center bg-white rounded-2xl border-2 border-gray-200 p-10">
                        <GraduationCap className="w-10 h-10 text-[#021d49] mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Start Learning?</h3>
                        <p className="text-gray-500 mb-5 text-sm">
                            Browse all modules and unlock your full potential
                        </p>
                        <Link
                            href="/modules"
                            className="inline-flex items-center gap-2 bg-[#021d49] hover:bg-[#032a5e] text-white px-8 py-3 rounded-full font-bold transition-colors"
                        >
                            Browse All Modules
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CoursesSection;
