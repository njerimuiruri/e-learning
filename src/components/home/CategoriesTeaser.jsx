"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Leaf, ArrowRight, Sparkles } from 'lucide-react';
import categoryService from '@/lib/api/categoryService';
import moduleService from '@/lib/api/moduleService';

const PROGRAMS = [
    {
        key: 'publishing',
        match: /publishing academy/i,
        name: 'Publishing Academy',
        blurb: 'Structured training in scholarly writing, peer-reviewed publishing, and policy-oriented communication for African researchers.',
        href: '/arin-publishing-academy',
        icon: BookOpen,
        accent: 'from-[#021d49] to-[#1e40af]',
    },
    {
        key: 'climate',
        match: /climate/i,
        name: 'AI for Climate Resilience',
        blurb: 'Applied AI and machine learning training for climate risk analysis, adaptation, and evidence-based decision support.',
        href: '/ai-climate-resilience',
        icon: Leaf,
        accent: 'from-[#039e8e] to-[#00c4b3]',
    },
];

const CategoriesTeaser = () => {
    const [moduleCounts, setModuleCounts] = useState({});

    useEffect(() => {
        let mounted = true;
        Promise.all([
            categoryService.getAllCategories(),
            moduleService.getAllModules({ limit: 500 }),
        ]).then(([categoriesData, modulesData]) => {
            if (!mounted) return;
            const categories = Array.isArray(categoriesData) ? categoriesData : [];
            const modules = Array.isArray(modulesData) ? modulesData : modulesData?.modules || modulesData?.data || [];

            const counts = {};
            PROGRAMS.forEach(p => {
                const cat = categories.find(c => p.match.test(c.name || ''));
                if (!cat) return;
                counts[p.key] = modules.filter(m => (m.categoryId?._id || m.categoryId) === cat._id).length;
            });
            setModuleCounts(counts);
        }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    return (
        <section className="py-16 lg:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <p className="text-sm font-semibold text-[#021d49] uppercase tracking-widest mb-2">Our Programmes</p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Explore What We Offer</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {PROGRAMS.map((program) => {
                        const Icon = program.icon;
                        const count = moduleCounts[program.key];
                        return (
                            <Link
                                key={program.key}
                                href={program.href}
                                className="group bg-white p-7 rounded-3xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${program.accent} flex items-center justify-center mb-5`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{program.name}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-4">{program.blurb}</p>
                                <div className="flex items-center justify-between">
                                    {typeof count === 'number' && count > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                                            <Sparkles className="w-3.5 h-3.5" /> {count} module{count !== 1 ? 's' : ''}
                                        </span>
                                    ) : <span />}
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#021d49] group-hover:gap-2.5 transition-all">
                                        Explore <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CategoriesTeaser;
