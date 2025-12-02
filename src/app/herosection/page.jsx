"use client";
import React from 'react';
import { BookOpen, BarChart3, FileText, Microscope, Users, Award, TrendingUp, Lightbulb } from 'lucide-react';

const HeroSection = () => {
    const floatingIcons = [
        { Icon: BookOpen, color: 'bg-green-500', position: 'top-8 -left-4', delay: '0s' },
        { Icon: BarChart3, color: 'bg-blue-500', position: 'top-20 -right-4', delay: '0.5s' },
        { Icon: FileText, color: 'bg-red-500', position: 'top-40 -left-6', delay: '1s' },
        { Icon: Microscope, color: 'bg-purple-500', position: 'bottom-32 -right-6', delay: '1.5s' },
        { Icon: Award, color: 'bg-yellow-500', position: 'bottom-16 -left-4', delay: '2s' },
        { Icon: TrendingUp, color: 'bg-orange-500', position: 'bottom-8 right-2', delay: '2.5s' },
    ];

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 overflow-hidden">
            <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-200 rounded-full opacity-20 blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Content */}
                    <div className="space-y-8 z-10">
                        <div className="inline-block">
                            <span className="text-[#f65e14] font-semibold text-sm uppercase tracking-wider bg-orange-100 px-4 py-2 rounded-full">
                                Welcome to Arin Publishing Academy
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Master Research,
                            <br />
                            <span className="text-[#f65e14]">Data Analysis</span>
                            <br />
                            & Publishing
                        </h1>

                        <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                            Learn how to conduct quality research, analyze data effectively, and write
                            impactful research papers from expert academics and published researchers.
                        </p>

                        {/* Features List */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Lightbulb className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-gray-700 font-medium">Research Methods</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-gray-700 font-medium">Data Analysis</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="text-gray-700 font-medium">Academic Writing</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-gray-700 font-medium">Publication Support</span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="bg-[#f65e14] hover:bg-[#e54d03] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                                Get Started
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>

                            <button className="border-2 border-gray-300 hover:border-[#f65e14] text-gray-700 hover:text-[#f65e14] px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group">
                                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Join Community
                            </button>
                        </div>

                        {/* Stats */}
                        {/* <div className="flex flex-wrap gap-8 pt-8 border-t border-gray-200">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">50+</div>
                                <div className="text-sm text-gray-600">Expert Researchers</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">500+</div>
                                <div className="text-sm text-gray-600">Published Papers</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">2k+</div>
                                <div className="text-sm text-gray-600">Active Students</div>
                            </div>
                        </div> */}
                    </div>

                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative h-full">
                            {/* Main Image Container with Thin Black Border */}
                            <div className="relative bg-white p-1 rounded-[3rem] shadow-2xl border-2 border-black w-full lg:w-[550px] h-[600px]">
                                <div className="rounded-[2.8rem] overflow-hidden h-full">
                                    <img
                                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                                        alt="Students researching and learning"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Static Icons Around the Image */}
                            {floatingIcons.map((item, index) => (
                                <div
                                    key={index}
                                    className={`absolute ${item.position} hidden lg:block`}
                                >
                                    <div className={`${item.color} p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-transform cursor-pointer`}>
                                        <item.Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>


        </div>
    );
};

export default HeroSection;