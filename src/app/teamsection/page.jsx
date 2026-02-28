"use client";
import React, { useState } from 'react';
import { X, ExternalLink, Mail, Linkedin, Award, Users } from 'lucide-react';

const TeamSection = () => {
    const [selectedMember, setSelectedMember] = useState(null);
    const [filterByRole, setFilterByRole] = useState('all');

    const teamMembers = [
        {
            id: 1,
            name: 'Dr. Joanes Atela (PhD)',
            role: 'Executive Director',
            category: 'Leadership',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/PROF.jpg',
            bio: 'Leading ARIN with extensive experience in research and academic publishing across Africa.',
        },
        {
            id: 2,
            name: 'Dr. Humphrey Agevi',
            role: 'Director Programmes Development and Delivery',
            category: 'Leadership',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/DrAgevi.jpg',
            bio: 'Driving programme development and delivery excellence for impactful research initiatives.',
        },
        {
            id: 3,
            name: 'Dr. Akinyi J. Eurallyah',
            role: 'Research Associate and Programme Manager',
            category: 'Research',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/Akinyi2-scaled.jpg',
            bio: 'Managing research programmes and coordinating scholarly activities across the network.',
        },
        {
            id: 4,
            name: 'Florence Onyango',
            role: 'Communications',
            category: 'Communications',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/florence.jpg',
            bio: 'Ensuring effective communication and outreach for ARIN initiatives and programmes.',
        },
        {
            id: 5,
            name: 'Washington Kanyangi',
            role: 'Research Associate',
            category: 'Research',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/Washington.jpg',
            bio: 'Contributing to research excellence and scholarly impact across African institutions.',
        },
        {
            id: 6,
            name: 'Maria Nailantei',
            role: 'Communications',
            category: 'Communications',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/maria.jpg',
            bio: 'Driving strategic communications and engagement with stakeholders and partners.',
        },
        {
            id: 7,
            name: 'Antonina Awino',
            role: 'IT',
            category: 'Technology',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/awino.jpg',
            bio: 'Providing technical infrastructure and digital solutions for research platforms.',
        },
    ];

    const categories = ['all', 'Leadership', 'Research', 'Communications', 'Technology'];

    const filteredMembers = filterByRole === 'all'
        ? teamMembers
        : teamMembers.filter(member => member.category === filterByRole);

    const getCategoryIcon = (category) => {
        switch(category) {
            case 'Leadership': return <Award className="w-4 h-4" />;
            case 'Research': return <Users className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <>
            <section className="relative py-16 lg:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
                {/* Enhanced Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Animated gradient orbs */}
                    <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-2xl"></div>
                    
                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px]"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Section Header */}
                    <div className="text-center mb-12 lg:mb-16">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-[#021d49] px-4 py-2 rounded-full font-semibold text-sm uppercase tracking-wider mb-4">
                            <Users className="w-4 h-4" />
                            Meet Our Team
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 leading-tight">
                            Expert Scholars & Publishing
                            <br />
                            <span className="bg-gradient-to-r from-[#021d49] via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                                Professionals Leading the Way
                            </span>
                        </h2>
                        <p className="text-lg text-gray-600 mt-6 leading-relaxed max-w-3xl mx-auto">
                            Our team comprises experienced academics, editors, and publishing specialists
                            dedicated to strengthening Africa's research capacity and global scholarly presence.
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setFilterByRole(category)}
                                className={`group relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                                    filterByRole === category
                                        ? 'bg-gradient-to-r from-[#021d49] via-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-900/30 scale-105'
                                        : 'bg-white text-gray-700 border-2 border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:scale-105'
                                }`}
                            >
                                {filterByRole === category && (
                                    <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                                )}
                                <span className="relative">{category === 'all' ? 'All Team Members' : category}</span>
                            </button>
                        ))}
                    </div>

                    {/* Team Count */}
                    <div className="text-center mb-8">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-bold bg-gradient-to-r from-[#021d49] to-blue-700 bg-clip-text text-transparent">{filteredMembers.length}</span> team {filteredMembers.length === 1 ? 'member' : 'members'}
                        </p>
                    </div>

                    {/* Team Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                onClick={() => setSelectedMember(member)}
                                className="group cursor-pointer"
                            >
                                {/* Card Container */}
                                <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-300">

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none"></div>

                                    {/* Category Badge */}
                                    <div className="absolute top-4 left-4 z-10">
                                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#021d49] to-blue-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                                            {getCategoryIcon(member.category)}
                                            {member.category}
                                        </div>
                                    </div>

                                    {/* Image Container */}
                                    <div className="relative h-80 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                                        />
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#021d49]/80 via-[#021d49]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        {/* Hover Text */}
                                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                                            <p className="text-white text-sm font-medium flex items-center gap-2">
                                                <ExternalLink className="w-4 h-4" />
                                                Click to view full profile
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-6 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-[#021d49] group-hover:to-blue-700 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                                            {member.name}
                                        </h3>
                                        <p className="text-[#021d49] font-semibold text-sm mb-2 flex items-center gap-1.5">
                                            <Award className="w-3.5 h-3.5" />
                                            {member.role}
                                        </p>
                                        <p className="text-gray-600 text-xs font-medium leading-relaxed">
                                            {member.organization}
                                        </p>
                                    </div>

                                    {/* Gradient Accent Line */}
                                    <div className="h-1.5 bg-gradient-to-r from-[#021d49] via-blue-600 to-indigo-600 group-hover:from-blue-700 group-hover:via-indigo-600 group-hover:to-purple-600 transition-all duration-300"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* Enhanced Modal */}
            {selectedMember && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setSelectedMember(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:scale-110 transition-all z-10 border-2 border-blue-200"
                        >
                            <X className="w-6 h-6 text-gray-700" />
                        </button>

                        {/* Modal Content */}
                        <div className="relative">

                            {/* Full Image with Gradient */}
                            <div className="relative h-96 w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                                <img
                                    src={selectedMember.image}
                                    alt={selectedMember.name}
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#021d49]/90 via-[#021d49]/50 to-transparent"></div>

                                {/* Category Badge on Image */}
                                <div className="absolute top-6 left-6">
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-[#021d49] via-blue-700 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-xl">
                                        {getCategoryIcon(selectedMember.category)}
                                        {selectedMember.category}
                                    </div>
                                </div>

                                {/* Name overlay on image */}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                                        {selectedMember.name}
                                    </h3>
                                    <p className="text-blue-200 font-semibold text-lg flex items-center gap-2 drop-shadow-md">
                                        <Award className="w-5 h-5" />
                                        {selectedMember.role}
                                    </p>
                                    <p className="text-white/90 font-medium text-sm mt-2 drop-shadow-md">
                                        {selectedMember.organization}
                                    </p>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div className="p-8 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-[#021d49] via-blue-700 to-indigo-600 rounded-full"></div>
                                        About
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {selectedMember.bio}
                                    </p>
                                </div>

                                {/* Contact Section */}
                                <div className="border-t-2 border-gradient-to-r from-blue-100 to-indigo-100 pt-6">
                                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-[#021d49] via-blue-700 to-indigo-600 rounded-full"></div>
                                        Get in Touch
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#021d49] via-blue-700 to-indigo-600 text-white rounded-full font-medium text-sm hover:shadow-lg hover:shadow-blue-900/30 transition-all hover:scale-105">
                                            <Mail className="w-4 h-4" />
                                            Send Email
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-200 text-[#021d49] rounded-full font-medium text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 transition-all hover:scale-105">
                                            <Linkedin className="w-4 h-4" />
                                            LinkedIn
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border-2 border-blue-100">
                                        <p className="text-[#021d49] text-sm font-semibold mb-1">Department</p>
                                        <p className="text-gray-800 font-bold">{selectedMember.category}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border-2 border-blue-100">
                                        <p className="text-[#021d49] text-sm font-semibold mb-1">Position</p>
                                        <p className="text-gray-800 font-bold text-sm">{selectedMember.role}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Gradient Accent Line at Bottom */}
                            <div className="h-2 bg-gradient-to-r from-[#021d49] via-blue-600 to-indigo-600"></div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .animate-pulse {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </>
    );
};

export default TeamSection;