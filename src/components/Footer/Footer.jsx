"use client";
import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white pt-12 pb-12 lg:pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">

                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-lg border-2 border-[#021d49] p-1">
                                <img
                                    src="/Arin.png"
                                    alt="ARIN Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xl">Arin Elearning Platform</span>
                                <span className="text-xs text-gray-400">Education & Research</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Our platform is built on trust, quality, and innovation, ensuring researchers everywhere access knowledge that truly empowers and inspires.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-white" />
                            <a href="mailto:info@arin-africa.org" className="text-gray-300 hover:text-[#021d49] transition-colors">
                                info@arin-africa.org
                            </a>
                        </div>
                    </div>

                    {/* Explore Links */}
                    <div>
                        <h3 className="text-xl font-bold mb-6">Explore</h3>
                        <ul className="space-y-3">
                            <li><a href="#home" className="text-gray-400 hover:text-[#021d49] transition-colors">Home</a></li>
                            <li><a href="#about" className="text-gray-400 hover:text-[#021d49] transition-colors">About</a></li>
                            <li><a href="/courses" className="text-gray-400 hover:text-[#021d49] transition-colors">Courses</a></li>
                            <li><a href="#community" className="text-gray-400 hover:text-[#021d49] transition-colors">Community</a></li>
                            <li><a href="#contact" className="text-gray-400 hover:text-[#021d49] transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h3 className="text-xl font-bold mb-6">Get in touch</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-white mt-1 flex-shrink-0" />
                                <span className="text-gray-400">ACK Gardens House, 1St Ngong Ave, Upperhill, Nairobi. P.O Box 53358 – 00200. Nairobi, Kenya</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-white" />
                                <span className="text-gray-400">+254 746 130 873</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-white" />
                                <span className="text-gray-400">info@arin-africa.org</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Bottom */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-lg border-2 border-[#021d49] p-1">
                            <img
                                src="/Arin.png"
                                alt="ARIN Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="text-gray-400 text-sm">© {currentYear} Arin Publishing Academy</span>
                    </div>
                    <div className="flex gap-3">
                        <a href="#" className="w-10 h-10 bg-[#021d49] hover:bg-[#03275f] rounded-full flex items-center justify-center transition-colors">
                            <Facebook className="w-5 h-5 text-white" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-[#021d49] hover:bg-[#03275f] rounded-full flex items-center justify-center transition-colors">
                            <Twitter className="w-5 h-5 text-white" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-[#021d49] hover:bg-[#03275f] rounded-full flex items-center justify-center transition-colors">
                            <Youtube className="w-5 h-5 text-white" />
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;