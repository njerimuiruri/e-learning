"use client";
import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

const TeamSection = () => {
    const [selectedMember, setSelectedMember] = useState(null);

    const teamMembers = [
        {
            id: 1,
            name: 'Dr. Joanes Atela (PhD)',
            role: 'Executive Director',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/PROF.jpg'
        },
        {
            id: 2,
            name: 'Dr. Humphrey Agevi',
            role: 'Director Programmes Development and Delivery',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/DrAgevi.jpg'
        },
        {
            id: 3,
            name: 'Dr. Akinyi J. Eurallyah',
            role: 'Research Associate and Programme Manager',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/Akinyi2-scaled.jpg'
        },
        {
            id: 4,
            name: 'Florence Onyango',
            role: 'Communications',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/florence.jpg'
        },
        {
            id: 5,
            name: 'Washington Kanyangi',
            role: 'Research Associate',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/Washington.jpg'
        },
        {
            id: 6,
            name: 'Maria Nailantei',
            role: 'Communications',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/maria.jpg'
        },
         {
            id: 7,
            name: 'Antonina Awino',
            role: 'IT',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/awino.jpg'
        },
         {
            id: 8,
            name: 'Njeri Muiruri',
            role: 'IT',
            organization: 'African Research and Impact Network (ARIN)',
            image: '/image/faith.jpg'
        }
    ];

    return (
        <>
            <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-orange-50 relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-200 rounded-full opacity-20 blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Section Header */}
                    <div className="text-center mb-12 lg:mb-16">
                        <span className="text-[#f65e14] font-semibold text-sm uppercase tracking-wider">
                            Meet Our Team
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 leading-tight">
                            Expert Scholars & Publishing
                            <br />
                            Professionals Leading the Way
                        </h2>
                        <p className="text-lg text-gray-600 mt-6 leading-relaxed max-w-3xl mx-auto">
                            Our team comprises experienced academics, editors, and publishing specialists 
                            dedicated to strengthening Africa's research capacity and global scholarly presence.
                        </p>
                    </div>

                    {/* Team Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teamMembers.map((member) => (
                            <div 
                                key={member.id}
                                onClick={() => setSelectedMember(member)}
                                className="group cursor-pointer"
                            >
                                {/* Card Container */}
                                <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                                    
                                    {/* Image Container */}
                                    <div className="relative h-80 overflow-hidden bg-gray-100">
                                        <img 
                                            src={member.image} 
                                            alt={member.name}
                                            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500"
                                        />
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        {/* Hover Text */}
                                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                            <p className="text-white text-sm font-medium">Click to view profile</p>
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#f65e14] transition-colors">
                                            {member.name}
                                        </h3>
                                        <p className="text-[#f65e14] font-medium text-sm mb-1">
                                            {member.role}
                                        </p>
                                        <p className="text-gray-500 text-sm font-medium">
                                            {member.organization}
                                        </p>
                                    </div>

                                    {/* Decorative Element */}
                                    <div className="absolute top-4 right-4 w-12 h-12 bg-[#f65e14] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <ExternalLink className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* Modal */}
            {selectedMember && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setSelectedMember(null)}
                >
                    <div 
                        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                        >
                            <X className="w-6 h-6 text-gray-700" />
                        </button>

                        {/* Modal Content */}
                        <div className="relative">
                            
                            {/* Full Image */}
                            <div className="relative h-96 w-full bg-gray-100">
                                <img 
                                    src={selectedMember.image} 
                                    alt={selectedMember.name}
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                
                                {/* Name overlay on image */}
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h3 className="text-3xl font-bold text-white mb-2">
                                        {selectedMember.name}
                                    </h3>
                                    <p className="text-orange-300 font-semibold text-lg">
                                        {selectedMember.role}
                                    </p>
                                    <p className="text-white/90 font-medium text-sm mt-1">
                                        {selectedMember.organization}
                                    </p>
                                </div>
                            </div>

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
            `}</style>
        </>
    );
};

export default TeamSection;