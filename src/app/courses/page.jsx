"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, Star, ArrowRight, BookOpen } from 'lucide-react';
import coursesData from '../../data/courses/courses';
import Navbar from '../../components/navbar/navbar';
import Footer from '../../components/Footer/Footer';

const CoursesPage = () => {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Marketing', 'Web Development', 'Language'];

    const filteredCourses = activeCategory === 'All'
        ? coursesData
        : coursesData.filter(course => course.category === activeCategory);

    // Navigate to course detail page by ID
    const handleEnrollClick = (course) => {
        router.push(`/courses/${course.id}`);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white pt-24 pb-12">

                {/* Main Courses Section */}
                <section className="py-4 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Category Filter */}
                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${activeCategory === category
                                        ? 'bg-[#f65e14] text-white shadow-lg scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Courses Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group border border-gray-100 hover:border-orange-200 hover:-translate-y-2"
                                >
                                    {/* Course Image with Decorative Elements */}
                                    <div className="relative overflow-hidden h-64">
                                        {/* Background with illustration style */}
                                        <div className={`absolute inset-0 ${course.bgColor}`}></div>

                                        {/* Badge */}
                                        <div className={`absolute top-4 left-4 ${course.accentColor} text-white px-4 py-1.5 rounded-full text-sm font-semibold z-10 shadow-lg`}>
                                            {course.badge}
                                        </div>

                                        {/* Image */}
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
                                        />

                                        {/* Overlay with icons */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                        {/* Level Badge */}
                                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800">
                                            {course.level}
                                        </div>
                                    </div>

                                    {/* Course Content */}
                                    <div className="p-6 space-y-4">
                                        {/* Meta Info */}
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-[#f65e14]" />
                                                <span className="font-medium">{course.duration}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="w-4 h-4 text-[#f65e14]" />
                                                <span className="font-medium">{course.modules.length} Modules</span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#f65e14] transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>

                                        {/* Rating & Students */}
                                        <div className="flex items-center justify-between">
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
                                                    {course.rating}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span>{course.students.split(' ')[0]}</span>
                                            </div>
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
                                        <button
                                            onClick={() => handleEnrollClick(course)}
                                            className="w-full bg-[#f65e14] hover:bg-[#e54d03] text-white py-3.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg mt-4"
                                        >
                                            Enroll And Begin
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </>

    );
};

export default CoursesPage;