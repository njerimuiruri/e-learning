"use client";
import React from 'react';
import Link from 'next/link';
import { BookOpen, TrendingUp, Award, Users, ArrowRight } from 'lucide-react';

const features = [
    {
        icon: BookOpen,
        color: 'bg-[#021d49]',
        title: 'Scholarly Writing Training',
        description: 'Structured programs on academic writing, peer-reviewed publishing, and policy-oriented communication',
    },
    {
        icon: TrendingUp,
        color: 'bg-purple-500',
        title: 'Editorial Support',
        description: 'Continuous feedback and editorial mentorship to improve manuscript quality and readiness',
    },
    {
        icon: Award,
        color: 'bg-green-500',
        title: 'Publication Pathways',
        description: 'Strategic partnership with Taylor & Francis to amplify African voices and promote open-access knowledge',
    },
    {
        icon: Users,
        color: 'bg-pink-500',
        title: 'Mentorship & Coaching',
        description: 'Connecting early-career researchers with experienced academics, editors, and published scholars',
    },
];

const AboutTeaser = () => {
    return (
        <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
                    <div className="lg:max-w-2xl">
                        <span className="text-[#021d49] font-semibold text-sm uppercase tracking-wider">
                            About the Academy
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 leading-tight">
                            A Continental Platform for
                            <br />
                            African Research Excellence
                        </h2>
                        <p className="text-gray-600 mt-4 leading-relaxed">
                            Building on ARIN's robust foundation, including its Science-Policy Fellowship Program
                            and strategic partnership with Taylor & Francis Group, the Academy aligns with ARIN's
                            broader mission of strengthening the science-policy-practice interface.
                        </p>
                    </div>

                    <Link href="/about"
                        className="shrink-0 bg-[#021d49] hover:bg-[#03275f] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 self-start">
                        Learn More
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid lg:grid-cols-2 gap-10 items-start">
                    <div className="rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 h-[320px] lg:h-[360px]">
                        <img
                            src="/image/1.png"
                            alt="African researchers collaborating"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="space-y-2.5">
                                <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutTeaser;
