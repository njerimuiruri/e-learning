"use client";
import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

const WhyChooseUsSection = () => {
    const [openAccordion, setOpenAccordion] = useState(0);

    const accordionData = [
        {
            title: 'Peer Review & Collaborative Learning',
            content: 'Engage in structured peer review sessions where you critique and improve manuscripts in a supportive environment. Build confidence with editorial standards while enhancing the quality of your scholarly work through collaborative feedback.',
            image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80'
        },
        {
            title: 'Publication Incentives & Recognition',
            content: 'Benefit from awards, fellowships, and visibility campaigns for successful publications in peer-reviewed journals or policy-relevant outputs. The Academy recognizes and celebrates your scholarly achievements.',
            image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80'
        },
        {
            title: 'Iterative Feedback Mechanisms',
            content: 'Receive continuous, constructive feedback throughout your writing process. This iterative approach supports manuscript improvement and enhances readiness for submission to reputable journals.',
            image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80'
        },
        {
            title: 'Interdisciplinary Research Collaboration',
            content: 'Collaborate across disciplines and cohorts, promoting diverse perspectives and fostering innovative, solution-oriented research that addresses complex development challenges facing Africa.',
            image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80'
        },
        {
            title: 'Strategic Partnership with Taylor & Francis',
            content: 'Access joint publishing initiatives, co-designed training modules, and editorial mentorship pipelines. Benefit from institutional support that promotes inclusive journal access and open publishing practices.',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80'
        }
    ];

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? -1 : index);
    };

    return (
        <section className="py-16 lg:py-24 bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-20 right-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-40 h-40 bg-red-200 rounded-full opacity-20 blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center lg:text-left mb-12 lg:mb-16">
                    <span className="text-[#021d49] font-semibold text-sm uppercase tracking-wider">
                        Why Choose the Academy
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 leading-tight max-w-3xl">
                        Driving Research Quality Through Targeted Programming
                    </h2>
                    <p className="text-lg text-gray-600 mt-6 leading-relaxed max-w-2xl">
                        The ARIN Publishing Academy embeds targeted mechanisms that improve the quality,
                        visibility, and volume of African scholarly outputs through comprehensive support systems
                        and strategic partnerships.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* Left Side - Image with Unique Shape & Orange Card */}
                    <div className="relative order-2 lg:order-1">
                        {/* Main Image Container with Custom Shape */}
                        <div className="relative">
                            {/* Custom Shape Background */}
                            <div className="relative bg-white rounded-[3rem] rounded-tr-[8rem] shadow-2xl overflow-hidden h-[500px] lg:h-[600px]">
                                <img
                                    src="/image/poster-launch.jpg"
                                    alt="African researchers collaborating"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Orange Floating Card */}
                            <div className="absolute bottom-8 left-8 bg-[#021d49] rounded-3xl p-6 shadow-2xl max-w-xs transform hover:scale-105 transition-transform duration-300">
                                <h3 className="text-white text-2xl font-bold mb-2">
                                    Amplify African
                                    <br />
                                    Research Voices
                                </h3>
                                <p className="text-orange-100 text-sm mb-4">
                                    A springboard for African researchers to confidently publish impactful work.
                                </p>
                                <button className="bg-white text-[#021d49] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center gap-2 group">
                                    Join Academy
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Accordions */}
                    <div className="order-1 lg:order-2 space-y-4">
                        {accordionData.map((item, index) => (
                            <div
                                key={index}
                                className="border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-300"
                            >
                                {/* Accordion Header */}
                                <button
                                    onClick={() => toggleAccordion(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-orange-50 transition-colors duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-[#021d49]">+</span>
                                        <h3 className="text-left text-lg font-bold text-gray-900">
                                            {item.title}
                                        </h3>
                                    </div>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-600 transition-transform duration-300 flex-shrink-0 ${openAccordion === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {/* Accordion Content */}
                                <div
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${openAccordion === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="px-6 pb-6 pt-2 bg-gray-50">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                                            {/* Small Image */}
                                            <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Content */}
                                            <div className="flex-1">
                                                <p className="text-gray-600 leading-relaxed">
                                                    {item.content}
                                                </p>
                                                <button className="mt-3 text-[#021d49] font-semibold hover:underline text-sm">
                                                    Learn more
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default WhyChooseUsSection;