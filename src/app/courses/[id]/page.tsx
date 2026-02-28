'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Lock,
  Loader2,
  AlertTriangle,
  Users,
  Clock,
  BookOpen,
  Award,
  DollarSign
} from 'lucide-react';

import courseService from '@/lib/api/courseService';
import paymentService from '@/lib/api/paymentService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import { useToast } from '@/components/ui/ToastProvider';

interface CourseAccessInfo {
  allowed: boolean;
  requiresPayment: boolean;
  categoryId?: string;
  price?: number;
  reason?: string;
}

const CourseDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { showToast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [accessInfo, setAccessInfo] = useState<CourseAccessInfo | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }

    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch course details first
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);

      // Then check access (this might fail if user not logged in)
      try {
        const accessData = await paymentService.checkCourseAccess(courseId);
        setAccessInfo(accessData);
      } catch (accessErr: any) {
        console.error('Error checking access:', accessErr);
        // If access check fails, set default to require payment
        setAccessInfo({
          allowed: false,
          requiresPayment: true,
          price: 0,
          reason: 'payment_required'
        });
      }

      // Check if already enrolled
      try {
        await courseService.getEnrollment(courseId);
        setIsEnrolled(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setIsEnrolled(false);
        }
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading course data:', err);
      setError(err.response?.data?.message || 'Failed to load course details');
      setLoading(false);
    }
  };

  const handleAccessCourse = async () => {
    if (isEnrolled) {
      // Already enrolled, go to learning page
      router.push(`/courses/${courseId}/learn`);
      return;
    }

    // If has access but not enrolled, enroll first
    if (accessInfo?.allowed) {
      try {
        showToast('Enrolling in course...', { type: 'info' });
        await courseService.enrollCourse(courseId);
        showToast('Successfully enrolled!', { type: 'success' });
        router.push(`/courses/${courseId}/learn`);
      } catch (err: any) {
        console.error('Error enrolling:', err);
        showToast(err.response?.data?.message || 'Failed to enroll', { type: 'error' });
      }
    }
  };

  const handlePayNow = () => {
    // Redirect to checkout page
    router.push(`/checkout?courseId=${courseId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-20 pb-12 bg-gray-50 min-h-screen">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 animate-spin text-[#021d49]" />
            <p className="mt-4 text-lg font-semibold text-gray-700">Loading course details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !course) {
    return (
      <>
        <Navbar />
        <main className="pt-20 pb-12 bg-gray-50 min-h-screen">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Error Loading Course</h2>
            <p className="mt-2 text-gray-600">{error || 'Course not found'}</p>
            <button
              onClick={() => router.push('/courses')}
              className="mt-6 bg-[#021d49] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#032a5e] transition-colors"
            >
              Browse Other Courses
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Determine what action button to show
  const getActionButton = () => {
    // Already enrolled - show "Continue Learning"
    if (isEnrolled) {
      return (
        <button
          onClick={handleAccessCourse}
          className="w-full bg-emerald-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          Continue Learning
        </button>
      );
    }

    // Has access (free course, fellow, or purchased) - show "Enroll Now"
    if (accessInfo?.allowed) {
      return (
        <button
          onClick={handleAccessCourse}
          className="w-full bg-[#021d49] text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#032a5e] transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          Enroll Now (Free Access)
        </button>
      );
    }

    // Requires payment - show "Pay Now"
    if (accessInfo?.requiresPayment) {
      return (
        <button
          onClick={handlePayNow}
          className="w-full bg-[#ff8243] text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
        >
          <Lock className="w-5 h-5" />
          Pay ${accessInfo.price?.toLocaleString()} to Access
        </button>
      );
    }

    // Access restricted (not available for this user)
    return (
      <div className="w-full bg-gray-200 text-gray-600 py-4 px-6 rounded-lg font-semibold text-lg text-center">
        <Lock className="w-5 h-5 inline mr-2" />
        Access Restricted
      </div>
    );
  };

  // Get access status badge
  const getAccessBadge = () => {
    if (isEnrolled) {
      return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">Enrolled</span>;
    }
    if (course.isPaid === false) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Free Course</span>;
    }
    if (accessInfo?.reason === 'fellow_access') {
      return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">Fellow Access</span>;
    }
    if (accessInfo?.reason === 'purchased') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Purchased</span>;
    }
    if (accessInfo?.requiresPayment) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">Paid Course</span>;
    }
    return null;
  };

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {course.thumbnailUrl && (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-[#021d49] bg-opacity-10 text-[#021d49] rounded-full text-sm font-semibold">
                      {course.category}
                    </span>
                    {getAccessBadge()}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
                  <p className="text-lg text-gray-600">{course.description}</p>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Details</h2>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Modules</p>
                      <p className="text-lg font-semibold text-gray-900">{course.modules?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Enrolled</p>
                      <p className="text-lg font-semibold text-gray-900">{course.enrollmentCount || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Level</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{course.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{course.status}</p>
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                {course.courseAim && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Course Aim</h3>
                    <p className="text-gray-600">{course.courseAim}</p>
                  </div>
                )}

                {course.expectedLearningOutcomes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Learning Outcomes</h3>
                    <p className="text-gray-600">{course.expectedLearningOutcomes}</p>
                  </div>
                )}

                {course.requirements && course.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Requirements</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {course.requirements.map((req: string, index: number) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                {/* Price Display */}
                {accessInfo?.requiresPayment && accessInfo?.price && accessInfo.price > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">Category Price</span>
                    </div>
                    <p className="text-4xl font-bold text-[#021d49]">
                      ${accessInfo.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">One-time payment for "{course.category}" category access</p>
                    <p className="text-xs text-gray-400 mt-1">Includes all courses in this category</p>
                  </div>
                )}

                {/* Free Course Display */}
                {!accessInfo?.requiresPayment && !isEnrolled && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600 font-semibold">Free Access</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {accessInfo?.reason === 'fellow_access' && 'You have fellow access to this course'}
                      {accessInfo?.reason === 'purchased' && 'You have purchased access to this category'}
                      {accessInfo?.reason === 'free_category' && 'This course is free for everyone'}
                      {accessInfo?.reason === 'free_course' && 'This course is free'}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="space-y-4">
                  {getActionButton()}

                  {/* Access Info */}
                  {accessInfo && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        {accessInfo.allowed && !isEnrolled && (
                          <span>✓ You have free access to this course</span>
                        )}
                        {isEnrolled && (
                          <span>✓ You are enrolled in this course</span>
                        )}
                        {accessInfo.requiresPayment && (
                          <span>Payment required to access this course and all courses in the "{course.category}" category</span>
                        )}
                        {accessInfo.reason === 'restricted' && (
                          <span>This course is restricted to specific user groups</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">What's Included</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {course.modules?.length || 0} comprehensive modules
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Interactive assessments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Certificate upon completion
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Lifetime access
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CourseDetailPage;
