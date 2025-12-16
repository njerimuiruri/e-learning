"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AboutSection from "./aboutsection/page";
import HeroSection from "./herosection/page";
import WhyChooseUsSection from "./whyus/page";
import TeamSection from "./teamsection/page";
import CoursesSection from "./coursessection/page";
import Navbar from "../components/navbar/navbar";
import Footer from "../components/Footer/Footer";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is already logged in and redirect to appropriate dashboard
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);

        // Check instructor approval status
        if (user.role === "instructor") {
          // Fetch instructor approval status from backend
          checkInstructorApproval(user._id, token);
        } else if (user.role === "admin") {
          router.replace("/admin");
        } else if (user.role === "student") {
          router.replace("/student");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const checkInstructorApproval = async (instructorId, token) => {
    try {
      console.log("Checking instructor approval status...");
      const response = await fetch(
        `http://localhost:5000/api/users/profile/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check approval status: ${response.status}`);
      }

      const data = await response.json();
      const instructor = data.data;

      console.log("Instructor approval status:", instructor.instructorStatus);

      // Redirect based on approval status
      if (instructor.instructorStatus === "approved") {
        console.log("Instructor approved, redirecting to dashboard");
        router.replace("/instructor");
      } else if (instructor.instructorStatus === "pending") {
        console.log("Instructor pending, redirecting to pending-approval");
        router.replace("/instructor/pending-approval");
      } else if (instructor.instructorStatus === "rejected") {
        console.log("Instructor rejected, redirecting to application-rejected");
        router.replace("/instructor/application-rejected");
      }
    } catch (error) {
      console.error("Error checking instructor approval:", error);
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <HeroSection />
      <CoursesSection />
      <AboutSection />
      <WhyChooseUsSection />
      <TeamSection />
      <Footer />
    </>
  );
}
