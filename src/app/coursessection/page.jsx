"use client";
import React, { useState } from 'react';
import { Clock, Users, Star, ArrowRight } from 'lucide-react';

// Course Data
const coursesData = [
    {
        id: 1,
        category: 'Research',
        title: 'Research Methodology Mastery',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
        duration: '10 WEEKS',
        students: '3,250+ STUDENTS ENROLLED',
        rating: 4.8,
        instructor: {
            name: 'Dr. Sarah Mitchell, Ph.D.',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80'
        },
        badge: 'Research',
        bgColor: 'bg-blue-100',
        accentColor: 'bg-blue-500'
    },
    {
        id: 2,
        category: 'Data',
        title: 'Advanced Data Analysis & Statistics',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
        duration: '8 WEEKS',
        students: '2,890+ STUDENTS ENROLLED',
        rating: 4.9,
        instructor: {
            name: 'Prof. James Chen, M.Sc.',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'
        },
        badge: 'Data',
        bgColor: 'bg-pink-100',
        accentColor: 'bg-pink-500'
    },
    {
        id: 3,
        category: 'Tech',
        title: 'Academic Writing & Publication',
        image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
        duration: '6 WEEKS',
        students: '4,120+ STUDENTS ENROLLED',
        rating: 4.95,
        instructor: {
            name: 'Dr. Emily Roberts, Ph.D.',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80'
        },
        badge: 'Tech',
        bgColor: 'bg-purple-100',
        accentColor: 'bg-purple-500'
    }
];

const CoursesSection = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Research', 'Data', 'Tech', 'Climate'];

    const filteredCourses = activeCategory === 'All'
        ? coursesData
        : coursesData.filter(course => course.category === activeCategory);

    return (
        <section className="relative py-16 lg:py-24 bg-white overflow-hidden">
            {/* Stylish Background Pattern with Fading Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Vertical Lines */}
                <div className="absolute top-0 left-[10%] w-px h-full bg-gradient-to-b from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute top-0 left-[25%] w-px h-full bg-gradient-to-b from-orange-200 via-transparent to-orange-200 opacity-20"></div>
                <div className="absolute top-0 right-[25%] w-px h-full bg-gradient-to-b from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute top-0 right-[10%] w-px h-full bg-gradient-to-b from-orange-200 via-transparent to-orange-200 opacity-20"></div>

                {/* Horizontal Lines */}
                <div className="absolute top-[20%] left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-30"></div>
                <div className="absolute top-[50%] left-0 w-full h-px bg-gradient-to-r from-orange-200 via-transparent to-orange-200 opacity-20"></div>
                <div className="absolute top-[80%] left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-30"></div>

                {/* Decorative Circles */}
                <div className="absolute top-10 left-20 w-32 h-32 bg-orange-200 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-200 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center mb-12">
                    <span className="text-[#f65e14] font-semibold text-sm uppercase tracking-wider">
                        Our Courses
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 mb-6">
                        Explore Our Research Programs
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Master the art of research with our expert-led courses designed to elevate your academic journey
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 ${activeCategory === category
                                ? 'bg-[#f65e14] text-white shadow-lg transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Courses Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {filteredCourses.map((course) => (
                        <div
                            key={course.id}
                            className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 hover:border-orange-200"
                        >
                            {/* Course Image */}
                            <div className="relative overflow-hidden h-64">
                                <div className={`absolute top-4 left-4 ${course.accentColor} text-white px-4 py-1.5 rounded-full text-sm font-semibold z-10`}>
                                    {course.badge}
                                </div>
                                <img
                                    src={course.image}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>

                            {/* Course Content */}
                            <div className="p-6 space-y-4">
                                {/* Meta Info */}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-[#f65e14]" />
                                        <span>{course.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4 text-[#f65e14]" />
                                        <span className="text-xs">{course.students}</span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#f65e14] transition-colors">
                                    {course.title}
                                </h3>

                                {/* Rating */}
                                <div className="flex items-center gap-2">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.floor(course.rating)
                                                    ? 'fill-orange-500 text-orange-500'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        ({course.rating} RATING)
                                    </span>
                                </div>

                                {/* Instructor */}
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                    <img
                                        src={course.instructor.avatar}
                                        alt={course.instructor.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                    />
                                    <div>
                                        <p className="text-xs text-gray-500">By</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {course.instructor.name}
                                        </p>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button className="w-full bg-[#f65e14] hover:bg-[#e54d03] text-white py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg mt-4">
                                    Enroll And Begin
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Explore Endless Knowledge With Us</p>
                    <button className="text-[#f65e14] font-semibold hover:underline inline-flex items-center gap-2">
                        More Courses Features
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </section>
    );
};

export default CoursesSection;