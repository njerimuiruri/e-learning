"use client";
import React from 'react';
import { BookOpen, TrendingUp, Award, Users } from 'lucide-react';

const AboutSection = () => {
    const features = [
        {
            icon: BookOpen,
            color: 'bg-[#021d49]',
            title: 'Scholarly Writing Training',
            description: 'Structured programs on academic writing, peer-reviewed publishing, and policy-oriented communication'
        },
        {
            icon: TrendingUp,
            color: 'bg-purple-500',
            title: 'Editorial Support',
            description: 'Continuous feedback and editorial mentorship to improve manuscript quality and readiness'
        },
        {
            icon: Award,
            color: 'bg-green-500',
            title: 'Publication Pathways',
            description: 'Strategic partnership with Taylor & Francis to amplify African voices and promote open-access knowledge'
        },
        {
            icon: Users,
            color: 'bg-pink-500',
            title: 'Mentorship & Coaching',
            description: 'Connecting early-career researchers with experienced academics, editors, and published scholars'
        }
    ];

    return (
        <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Top Section - Title and Description */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-12 lg:mb-16">
                    {/* Left - About Badge + Title + Description */}
                    <div className="lg:max-w-2xl">
                        <span className="text-[#021d49] font-semibold text-sm uppercase tracking-wider">
                            About the Academy
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 leading-tight">
                            A Continental Platform for
                            <br />
                            African Research Excellence
                        </h2>
                        <p className="text-lg text-gray-600 mt-6 leading-relaxed">
                            Building on ARIN's robust foundation, including its Science-Policy Fellowship Program
                            and strategic partnership with Taylor & Francis Group, the Academy aligns with ARIN's
                            broader mission of strengthening the science-policy-practice interface.
                        </p>
                    </div>

                    {/* Right - Learn More Button */}
                    <div className="lg:pt-8">
                        <button className="bg-[#021d49] hover:bg-[#03275f] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2">
                            Learn More
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* Left Side - Image */}
                    <div>
                        <div className="relative">
                            <div className="bg-white p-1 rounded-[3rem] shadow-xl border-2 border-black h-[450px] lg:h-[520px]">
                                <div className="rounded-[2.8rem] overflow-hidden h-full">
                                    <img
                                        src="/image/1.png"
                                        alt="African researchers collaborating"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Features Grid */}
                    <div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {features.map((feature, index) => (
                                <div key={index} className="space-y-3">
                                    <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center`}>
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
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
            </div>
        </section>
    );
};

export default AboutSection;