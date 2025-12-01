"use client";
import React, { useState, useEffect } from 'react';
import { Menu, X, Search } from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isSearchOpen && !e.target.closest('.search-container')) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSearchOpen]);

    const navLinks = [
        { name: 'Home', href: '#home' },
        { name: 'About', href: '#about' },
        { name: 'Courses', href: '/courses' },
        { name: 'Community', href: '#community' },
        { name: 'Contact', href: '#contact' }
    ];

    const courseCategories = [
        { title: 'Courses', items: ['Free Courses', 'Certificated Courses'] },
        { title: 'Content', items: ['Business', 'Health', 'Leadership', 'Government', 'Data and Computer Science'] }
    ];

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white shadow-md'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <div className="flex items-center gap-2">
                                <div className="bg-[#f65e14] rounded-lg p-2 w-10 h-10 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">E</span>
                                </div>
                                <div className="hidden sm:flex flex-col">
                                    <span className="font-bold text-xl text-gray-900">Educate</span>
                                    <span className="text-xs text-gray-600">Education & Online Course</span>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-700 hover:text-[#f65e14] font-medium transition-colors duration-200 relative group"
                                >
                                    {link.name}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#f65e14] group-hover:w-full transition-all duration-300"></span>
                                </a>
                            ))}
                        </div>

                        {/* Right Side Actions - Desktop */}
                        <div className="hidden lg:flex items-center space-x-4">
                            {/* Search Button */}
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 text-gray-700 hover:text-[#f65e14] hover:bg-orange-50 rounded-lg transition-all duration-200"
                            >
                                <Search size={22} />
                            </button>

                            {/* Sign In */}
                            <button className="text-gray-700 hover:text-[#f65e14] font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-all duration-200">
                                Sign In
                            </button>

                            {/* Join Now Button */}
                            <button className="bg-[#f65e14] hover:bg-[#e54d03] text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                                Join Now
                            </button>
                        </div>

                        {/* Mobile Right Side */}
                        <div className="flex lg:hidden items-center space-x-2">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 text-gray-700 hover:text-[#f65e14] transition-colors duration-200"
                            >
                                <Search size={22} />
                            </button>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-700 hover:text-[#f65e14] focus:outline-none transition-colors duration-200"
                            >
                                {isOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Dropdown */}
                <div
                    className={`search-container absolute top-full left-0 right-0 bg-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isSearchOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {/* Search Input */}
                        <div className="relative mb-6">
                            <input
                                type="text"
                                placeholder="What are you looking for?"
                                className="w-full px-6 py-4 pr-12 text-lg border-2 border-gray-200 rounded-xl focus:border-[#f65e14] focus:outline-none transition-colors duration-200"
                                autoFocus
                            />
                            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#f65e14] transition-colors">
                                <Search size={24} />
                            </button>
                        </div>

                        {/* Categories Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {courseCategories.map((category, idx) => (
                                <div key={idx}>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                        {category.title}
                                    </h3>
                                    <div className="space-y-2">
                                        {category.items.map((item, itemIdx) => (
                                            <a
                                                key={itemIdx}
                                                href="#"
                                                className="block px-4 py-2.5 text-gray-700 hover:text-[#f65e14] hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
                                            >
                                                {item}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                <div
                    className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="px-4 pt-2 pb-4 space-y-1 bg-white border-t">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-[#f65e14] rounded-lg font-medium transition-all duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </a>
                        ))}

                        {/* Mobile Auth Buttons */}
                        <div className="pt-4 space-y-2 border-t mt-4">
                            <button className="w-full text-gray-700 hover:text-[#f65e14] font-medium px-4 py-3 rounded-lg hover:bg-orange-50 transition-all duration-200 border border-gray-200">
                                Sign In
                            </button>
                            <button className="w-full bg-[#f65e14] hover:bg-[#e54d03] text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 shadow-md">
                                Join Now
                            </button>
                        </div>
                    </div>
                </div>
            </nav>


        </>
    );
};
export default Navbar
