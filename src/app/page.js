"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroSection from "./herosection/page";
import CategoriesTeaser from "@/components/home/CategoriesTeaser";
import AboutTeaser from "@/components/home/AboutTeaser";
import Navbar from "../components/navbar/navbar";
import Footer from "../components/Footer/Footer";

export default function Home() {

  return (
    <>
      <Navbar />
      <HeroSection />
      <CategoriesTeaser />
      <AboutTeaser />

      {/* Closing CTA */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Ready to start learning?
          </h2>
          <p className="text-gray-500 mb-6">
            Create a free account and enroll in a module today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#021d49] hover:bg-[#032a5e] text-white px-8 py-3 rounded-full font-bold text-sm transition-colors"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
