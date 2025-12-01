"use client";
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const testimonialssections = () => {
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const testimonials = [
        {
            id: 1,
            rating: 5,
            text: "Expert researchers made complex methodologies simple, enjoyable, and impactful. I now feel more prepared to conduct meaningful research and publish papers.",
            name: "Dr. Michael Chen",
            role: "PhD Candidate",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
        },
        {
            id: 2,
            rating: 5,
            text: "Learning here is flexible, engaging, and practical. It truly helped me master data analysis and advance my research career with confidence.",
            name: "Sarah Johnson",
            role: "Research Analyst",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
        },
        {
            id: 3,
            rating: 5,
            text: "The publication guidance and mentorship I received was invaluable. My research papers are now getting accepted in top-tier journals thanks to this academy.",
            name: "Prof. David Martinez",
            role: "Associate Professor",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
        }
    ];

    const partners = [
        { name: "Research Institute", logo: "RI" },
        { name: "Academic Press", logo: "AP" },
        { name: "Data Science Hub", logo: "DS" }
    ];

    // Auto-slide testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [testimonials.length]);

    const currentYear = new Date().getFullYear();

    return (
        <>
            {/* Testimonials Section */}
            <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-orange-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <span className="text-[#f65e14] font-semibold text-sm uppercase tracking-wider">
                            Our Feedback
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 mb-4">
                            Trusted Voices Of Researchers
                        </h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Discover authentic testimonials from researchers who transformed their knowledge, boosted confidence, and achieved meaningful goals through our research programs.
                        </p>
                    </div>

                    {/* Testimonials Carousel */}
                    <div className="relative max-w-6xl mx-auto mb-16">
                        <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-700 ease-in-out"
                                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                            >
                                {testimonials.map((testimonial, index) => (
                                    <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                                        <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 max-w-4xl mx-auto">
                                            {/* Stars */}
                                            <div className="flex justify-center gap-1 mb-6">
                                                {[...Array(testimonial.rating)].map((_, i) => (
                                                    <Star key={i} className="w-6 h-6 fill-orange-500 text-orange-500" />
                                                ))}
                                            </div>

                                            {/* Testimonial Text */}
                                            <p className="text-xl lg:text-2xl text-gray-700 text-center mb-8 leading-relaxed font-medium">
                                                "{testimonial.text}"
                                            </p>

                                            {/* Author Info */}
                                            <div className="flex items-center justify-center gap-4">
                                                <img
                                                    src={testimonial.avatar}
                                                    alt={testimonial.name}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-200"
                                                />
                                                <div className="text-left">
                                                    <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                                                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-2 mt-8">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    className={`transition-all duration-300 rounded-full ${currentTestimonial === index
                                        ? 'w-8 h-2 bg-[#f65e14]'
                                        : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                                        }`}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Partners Section */}
                    <div className="bg-white rounded-3xl shadow-lg p-8 lg:p-12 max-w-5xl mx-auto">
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                                Our Partners:
                            </h3>
                            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12">
                                {partners.map((partner, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-center bg-gray-50 rounded-2xl px-8 py-4 border-2 border-gray-200 hover:border-orange-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">{partner.logo}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900 text-lg">{partner.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Call to Action Section */}
            <section className="py-16 lg:py-0 bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative rounded-[3rem] overflow-hidden shadow-2xl lg:-mb-32">
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0">
                            <img
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80"
                                alt="CTA Background"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/70"></div>
                        </div>

                        {/* Content */}
                        <div className="relative text-center py-16 lg:py-24 px-6">
                            <span className="text-[#f65e14] font-semibold text-sm uppercase tracking-wider">
                                Get Started
                            </span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-6">
                                Let's Research and Grow Up!
                            </h2>
                            <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">
                                Transform your passion into expertise through rigorous, modern, and meaningful research experiences.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="bg-[#f65e14] hover:bg-[#e54d03] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    Start Learning Now
                                </button>
                                <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border-2 border-white/30">
                                    Browse All Courses
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


        </>
    );
};

export default testimonialssections;