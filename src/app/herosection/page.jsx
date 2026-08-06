"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Award, ArrowRight, Sparkles, Leaf, BarChart3, FileText, Lightbulb } from 'lucide-react';
import categoryService from '@/lib/api/categoryService';
import moduleService from '@/lib/api/moduleService';

const PROGRAMS = [
    {
        key: 'publishing',
        match: /publishing academy/i,
        name: 'Publishing Academy',
        blurb: 'Scholarly writing, editorial support, and publication pathways for African researchers.',
        href: '/arin-publishing-academy',
        icon: BookOpen,
        accent: 'from-[#021d49] to-[#1e40af]',
    },
    {
        key: 'climate',
        match: /climate/i,
        name: 'AI for Climate Resilience',
        blurb: 'Applied AI and machine learning skills for climate risk analysis and adaptation.',
        href: '/ai-climate-resilience',
        icon: Leaf,
        accent: 'from-[#039e8e] to-[#00c4b3]',
    },
];

const HeroSection = () => {
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
        <div className="relative overflow-hidden">
            {/* Background Blurs */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-[#021d49] rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#00c4b3] rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#039e8e] rounded-full opacity-5 blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Content */}
                    <div className="space-y-8 z-10">
                        <div className="inline-block">
                            <span className="text-[#021d49] font-semibold text-sm uppercase tracking-wider bg-[#00c4b3] bg-opacity-10 px-4 py-2 rounded-full border border-[#00c4b3] border-opacity-20">
                                Welcome to Arin Publishing Academy
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Strengthening Africa's
                            <br />
                            <span className="text-[#021d49]">
                                Research, Writing
                            </span>
                            <br />
                            & Policy Translation
                        </h1>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium text-[#021d49]">An ARIN Press Initiative</span>
                            <span className="text-gray-400">|</span>
                            <span>In Collaboration with Taylor & Francis</span>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                            Recognizing the urgent need to enhance the visibility of African research and
                            strengthen scholarly communication, ARIN proposes the establishment of the
                            ARIN Publishing Academy a continental initiative to support both emerging and
                            established scholars in producing high-quality academic and policy-relevant outputs.
                        </p>

                        {/* Features List */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#021d49] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Lightbulb className="w-5 h-5 text-[#021d49]" />
                                </div>
                                <span className="text-gray-700 font-medium">Scholarly Writing</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#00c4b3] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BarChart3 className="w-5 h-5 text-[#00c4b3]" />
                                </div>
                                <span className="text-gray-700 font-medium">Publishing Support</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#021d49] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-[#021d49]" />
                                </div>
                                <span className="text-gray-700 font-medium">Policy Communication</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#039e8e] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5 text-[#039e8e]" />
                                </div>
                                <span className="text-gray-700 font-medium">Mentorship & Coaching</span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href="/register"
                                className="group bg-gradient-to-r from-[#021d49] to-[#021d49] hover:from-[#03275f] hover:to-[#03275f] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2">
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link href="/about"
                                className="group border-2 border-[#021d49] hover:bg-[#021d49] text-[#021d49] hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Join Community
                            </Link>
                        </div>
                    </div>

                    {/* Right Content  Two program pathways, replacing the old event flyer */}
                    <div className="relative flex flex-col gap-5">
                        {PROGRAMS.map((program) => {
                            const Icon = program.icon;
                            const count = moduleCounts[program.key];
                            return (
                                <Link
                                    key={program.key}
                                    href={program.href}
                                    className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 flex items-center gap-5"
                                >
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${program.accent} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{program.name}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed mb-2">{program.blurb}</p>
                                        {typeof count === 'number' && count > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                                                <Sparkles className="w-3 h-3" /> {count} module{count !== 1 ? 's' : ''} available
                                            </span>
                                        )}
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#021d49] group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </Link>
                            );
                        })}

                        {/* Floating Badge */}
                        <div className="self-center bg-white px-6 py-3 rounded-2xl shadow-lg border border-[#021d49] border-opacity-10 flex items-center gap-3">
                            <div className="flex -space-x-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-[#021d49] to-[#021d49] rounded-full border-2 border-white flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                                <div className="w-9 h-9 bg-gradient-to-br from-[#00c4b3] to-[#039e8e] rounded-full border-2 border-white flex items-center justify-center">
                                    <Award className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">An ARIN Press Initiative</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HeroSection;
