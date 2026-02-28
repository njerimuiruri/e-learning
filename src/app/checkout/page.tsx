'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import paymentService from '@/lib/api/paymentService';
import courseService from '@/lib/api/courseService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import { ArrowLeft, Lock, Loader2, AlertTriangle, CheckCircle, CreditCard, Globe, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';

type PaymentType = 'local' | 'international';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [course, setCourse] = useState<any>(null);
  const [accessCheck, setAccessCheck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<PaymentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push(`/login?redirect=/checkout?courseId=${courseId}`);
      return;
    }

    if (!courseId) {
      toast.error('Course ID is required');
      router.push('/courses');
      return;
    }

    loadCheckoutData();
  }, [courseId]);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [courseData, accessData] = await Promise.all([
        courseService.getCourseById(courseId!),
        paymentService.checkCourseAccess(courseId!),
      ]);

      setCourse(courseData);
      setAccessCheck(accessData);

      if (accessData.allowed) {
        toast.success('You already have access to this course!');
        router.push(`/courses/${courseId}`);
        return;
      }

      if (!accessData.requiresPayment) {
        setError('This course is not available for purchase');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading checkout data:', err);
      setError(err.response?.data?.message || 'Failed to load checkout page');
      setLoading(false);
    }
  };

  const handlePayment = async (paymentType: PaymentType) => {
    try {
      setProcessing(paymentType);
      setError(null);

      const paymentData = await paymentService.initializePayment(courseId!, paymentType);

      localStorage.setItem('pendingPaymentId', paymentData.paymentId);
      localStorage.setItem('pendingCourseId', courseId!);

      paymentService.redirectToPaystack(paymentData.authorizationUrl);
    } catch (err: any) {
      console.error('Error initializing payment:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment');
      setProcessing(null);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#021d49] mx-auto" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !accessCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/courses')}
            className="w-full bg-[#021d49] text-white py-3 rounded-lg font-semibold hover:bg-[#032a5e] transition"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!accessCheck?.requiresPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Lock className="w-16 h-16 text-yellow-500 mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            This course is not available for purchase. It may be restricted to specific user groups.
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="w-full bg-[#021d49] text-white py-3 rounded-lg font-semibold hover:bg-[#032a5e] transition"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const price = accessCheck?.price;
  const isProcessing = processing !== null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          <p className="mt-2 text-gray-600">Secure payment powered by Paystack</p>
        </div>

        {/* Course Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {course?.thumbnailUrl && (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-[#021d49] bg-opacity-10 text-[#021d49] rounded-full text-sm font-semibold">
                {course?.category}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{course?.title}</h2>
            <p className="text-gray-600 mb-6">{course?.description}</p>

            {/* Pricing */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 text-lg">Category Access:</span>
                <span className="text-4xl font-bold text-[#021d49]">
                  ${price?.toLocaleString()}
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-semibold mb-1">
                      One-time payment for category access
                    </p>
                    <p className="text-sm text-blue-800">
                      Get lifetime access to all courses in the "{course?.category}" category.
                      This includes current and future courses in this category.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Access to all courses in this category</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Lifetime access - no recurring fees</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Certificate upon course completion</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Access to future courses in this category</span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Select Payment Method</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Local Payment */}
                  <div className="border-2 border-green-200 rounded-xl p-5 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Local Payment</p>
                        <p className="text-xs text-gray-500">Nigeria (NGN)</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Pay via bank transfer, USSD, or mobile money. Best for Nigerian bank accounts.
                    </p>
                    <button
                      onClick={() => handlePayment('local')}
                      disabled={isProcessing}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing === 'local' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          Pay Locally — ${price?.toLocaleString()}
                        </>
                      )}
                    </button>
                  </div>

                  {/* International Payment */}
                  <div className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">International Payment</p>
                        <p className="text-xs text-gray-500">Worldwide (Card)</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Pay via Visa, Mastercard, or any international debit/credit card.
                    </p>
                    <button
                      onClick={() => handlePayment('international')}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing === 'international' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Pay Internationally — ${price?.toLocaleString()}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Secure payment processed by Paystack
          </p>
          <p className="mt-1">Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#021d49] mx-auto" />
              <p className="mt-4 text-gray-600">Loading checkout...</p>
            </div>
          </div>
        }>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
