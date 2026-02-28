"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Lock, Loader2, AlertTriangle } from 'lucide-react';

import courseService from '@/lib/api/courseService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import { useToast } from '@/components/ui/ToastProvider';

// A wrapper component is needed to use useSearchParams with Suspense
const CheckoutPageContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('courseId');
    const { showToast } = useToast();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAlreadyPurchased, setIsAlreadyPurchased] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (!user) {
            // If not logged in, redirect to login, preserving the checkout URL
            router.push(`/login?redirect=/checkout?courseId=${courseId}`);
            return;
        }

        if (!courseId) {
            setError('No course was selected. Please go back and choose a course.');
            setLoading(false);
            return;
        }

        const fetchCourseAndStatus = async () => {
            try {
                setLoading(true);
                // 1. Fetch course details
                const courseData = await courseService.getCourseById(courseId);
                setCourse(courseData);

                // 2. Check if user is already enrolled
                await courseService.getEnrollment(courseId);
                setIsAlreadyPurchased(true);
            } catch (err) {
                // A 404 error is expected if the user is not enrolled, which is the "purchase" path.
                if (err.response && err.response.status === 404) {
                    setIsAlreadyPurchased(false);
                } else {
                    console.error('Failed to load checkout data:', err);
                    setError('Could not load course details. It might be invalid or you may not have permission.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourseAndStatus();
    }, [courseId, router]);

    const handlePayment = async () => {
        setIsProcessingPayment(true);
        showToast('Processing your payment...', { type: 'info' });

        try {
            // In a real app, you would integrate Stripe Elements here.
            // For this example, we simulate a successful payment and call our backend to confirm.
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment gateway delay

            // This new backend endpoint confirms the payment and creates the enrollment.
            await courseService.confirmPurchase(courseId, { paymentToken: 'stripe_mock_transaction_id' });

            showToast('Payment successful! You can now access the course.', { type: 'success' });

            // Redirect to the course learning page upon success
            router.push(`/courses/${courseId}`);

        } catch (err) {
            console.error('Payment failed:', err);
            showToast(err.response?.data?.message || 'An error occurred during payment. Please try again.', { type: 'error' });
            setIsProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-[#021d49]" />
                <p className="mt-4 text-lg font-semibold text-gray-700">Loading Checkout...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">An Error Occurred</h2>
                <p className="mt-2 text-gray-600">{error}</p>
                <button
                    onClick={() => router.push('/courses')}
                    className="mt-6 bg-[#021d49] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#032a5e] transition-colors"
                >
                    Browse Other Courses
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-6 group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back
            </button>

            <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-lg text-gray-600 mb-8">Complete your purchase to start learning.</p>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <img src={course.bannerImage} alt={course.title} className="w-full sm:w-48 h-32 object-cover rounded-lg shadow-md" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-600">{course.category}</p>
                        <h2 className="text-2xl font-bold text-gray-800 mt-1">{course.title}</h2>
                        <p className="text-2xl font-bold text-[#021d49] mt-2">KES {course.price?.toLocaleString() || '0.00'}</p>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8">
                    {isAlreadyPurchased ? (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800">You Already Own This Course!</h3>
                            <p className="text-gray-600 mt-2 mb-6">You can start or continue learning right away.</p>
                            <button
                                onClick={() => router.push(`/courses/${courseId}`)}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                            >
                                Go to Course
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-6">Payment Information</h3>
                            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 mb-6">
                                <p className="text-gray-600 font-medium">Stripe Payment Form Placeholder</p>
                                <p className="text-sm text-gray-500 mt-1">A secure payment form will be integrated here.</p>
                            </div>
                            <button
                                onClick={handlePayment}
                                disabled={isProcessingPayment}
                                className="w-full bg-[#ff8243] text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isProcessingPayment ? (
                                    <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
                                ) : (
                                    <><Lock className="w-5 h-5" /> Pay KES {course.price?.toLocaleString() || '0.00'} Securely</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CheckoutPage = () => {
    return (
        <>
            <Navbar />
            <main className="pt-20 pb-12 bg-gray-50 min-h-screen">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <Loader2 className="w-12 h-12 animate-spin text-[#021d49]" />
                        <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
                    </div>
                }>
                    <CheckoutPageContent />
                </Suspense>
            </main>
            <Footer />
        </>
    );
};

export default CheckoutPage;