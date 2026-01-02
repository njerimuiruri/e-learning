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
        { Icon: TrendingUp, color: 'bg-[#021d49]', position: 'bottom-8 right-2', delay: '2.5s' },
    ];

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-slate-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200 rounded-full opacity-10 blur-3xl"></div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Left Content */}
                    <div className="space-y-8 z-10">
                        <div className="inline-block">
                            <span className="text-[#021d49] font-semibold text-sm uppercase tracking-wider bg-blue-100 px-4 py-2 rounded-full">
                                Welcome to Arin Publishing Academy
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                            Strengthening Africa's
                            <br />
                            <span className="bg-gradient-to-r from-[#021d49] to-blue-600 bg-clip-text text-transparent">
                                Research, Writing
                            </span>
                            <br />
                            & Policy Translation
                        </h1>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">An ARIN Press Initiative</span>
                            <span className="text-gray-400">|</span>
                            <span>In Collaboration with Taylor & Francis</span>
                        </div>

                        <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                            Recognizing the urgent need to enhance the visibility of African research and
                            strengthen scholarly communication, ARIN proposes the establishment of the
                            ARIN Publishing Academy—a continental initiative to support both emerging and
                            established scholars in producing high-quality academic and policy-relevant outputs.
                        </p>

                        {/* Features List */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Lightbulb className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-gray-700 font-medium">Scholarly Writing</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-gray-700 font-medium">Publishing Support</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="text-gray-700 font-medium">Policy Communication</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5 text-[#021d49]" />
                                </div>
                                <span className="text-gray-700 font-medium">Mentorship & Coaching</span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="group bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#03275f] hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2">
                                Get Started
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </button>

                            <button className="group border-2 border-gray-300 hover:border-[#021d49] hover:bg-blue-50 text-gray-700 hover:text-[#021d49] px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Join Community
                            </button>
                        </div>
                    </div>

                    {/* Right Content - Image Section */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative">
                            {/* Main Image Container - Card Style */}
                            <div className="relative bg-white p-6 rounded-3xl shadow-2xl w-full lg:w-[580px]">
                                <div className="rounded-2xl overflow-hidden relative bg-gradient-to-br from-slate-50 to-white">
                                    <img
                                        src="/image/0.png"
                                        alt="ARIN Publishing Academy Launch Event"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                                
                                {/* Floating Badge */}
                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-8 py-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-2 border-white flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center">
                                            <Award className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                   
                                </div>
                            </div>

                            {floatingIcons.map((item, index) => (
                                <div
                                    key={index}
                                    className={`absolute ${item.position} hidden lg:block animate-float`}
                                    style={{ animationDelay: item.delay }}
                                >
                                    <div className={`${item.color} p-3 rounded-xl shadow-lg backdrop-blur-sm bg-opacity-90 hover:scale-110 transition-all duration-300 cursor-pointer`}>
                                        <item.Icon className="w-5 h-5 text-white" />
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