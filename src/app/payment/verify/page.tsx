'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import paymentService from '@/lib/api/paymentService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

function VerifyPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setError('Payment reference is missing');
      setVerifying(false);
      return;
    }

    verifyPayment();
  }, [reference]);

  const verifyPayment = async () => {
    try {
      setVerifying(true);
      setError(null);

      // Verify payment with backend
      const verificationResult = await paymentService.verifyPayment(reference!);

      setResult(verificationResult);
      setVerifying(false);

      // Clear pending payment data from localStorage
      localStorage.removeItem('pendingPaymentId');
      localStorage.removeItem('pendingCourseId');
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.message || 'Failed to verify payment');
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="w-16 h-16 animate-spin text-[#021d49] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment with Paystack...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/courses')}
              className="w-full bg-[#021d49] text-white py-3 rounded-lg font-semibold hover:bg-[#032a5e] transition"
            >
              Browse Courses
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment successful
  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Your payment has been verified and access has been granted.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-gray-900 mb-3">Payment Details</h2>
            <div className="space-y-2 text-sm">
              {result.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-gray-900">
                    ${result.amount.toLocaleString()}
                  </span>
                </div>
              )}
              {reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-xs text-gray-900">{reference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600">Completed</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-blue-900">
              <strong>✓ Access Granted!</strong> You now have lifetime access to all courses
              in this category. Start learning right away!
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                if (result.courseId) {
                  router.push(`/courses/${result.courseId}`);
                } else {
                  router.push('/courses');
                }
              }}
              className="w-full bg-[#021d49] text-white py-3 rounded-lg font-semibold hover:bg-[#032a5e] transition"
            >
              {result.courseId ? 'Go to Course' : 'Browse Courses'}
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              View My Purchases
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment failed or abandoned
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Completed</h1>
        <p className="text-gray-600 mb-6">
          {result?.message || 'Your payment was not completed. No charges were made.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => {
              const courseId = localStorage.getItem('pendingCourseId');
              if (courseId) {
                router.push(`/checkout?courseId=${courseId}`);
              } else {
                router.push('/courses');
              }
            }}
            className="w-full bg-[#ff8243] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/courses')}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Browse Courses
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#021d49] mx-auto" />
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <VerifyPaymentContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
