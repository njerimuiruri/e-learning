"use client";
import Image from "next/image";
import AboutSection from "./aboutsection/page";
import HeroSection from "./herosection/page";
import WhyChooseUsSection from "./whyus/page";
import CoursesSection from "./coursessection/page";
// import CoursesSection from "./coursessection/page";
import Navbar from "../components/navbar/navbar";
import Footer from "../components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <CoursesSection />
      <AboutSection />
      <WhyChooseUsSection />
      <Footer />
    </>
  );
}
