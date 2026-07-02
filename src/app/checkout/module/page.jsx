'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import paymentService from '@/lib/api/paymentService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import {
  ArrowLeft, Lock, Loader2, AlertTriangle, CheckCircle,
  GraduationCap, Briefcase, CreditCard, Globe, Smartphone,
  ShieldCheck,
} from 'lucide-react';

function ModuleCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId');
  const categoryId = searchParams.get('categoryId');
  const categoryName = searchParams.get('categoryName') || 'Arin Publishing Academy';

  const [selectedTier, setSelectedTier] = useState(null); // 'student' | 'non-student'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [processing, setProcessing] = useState(null); // 'local' | 'international'
  const [error, setError] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push(`/login?redirect=/checkout/module?moduleId=${moduleId}&categoryId=${categoryId}`);
      return;
    }
    if (!moduleId || !categoryId) {
      router.push('/modules');
      return;
    }
    loadPricing();
  }, [moduleId, categoryId]);

  const loadPricing = async () => {
    try {
      const data = await paymentService.getCategoryPricing(categoryId);
      setPricing(data);
    } catch (err) {
      setError('Failed to load pricing information.');
    } finally {
      setLoadingPricing(false);
    }
  };

  const handlePay = async (paymentType) => {
    if (!selectedTier) { setError('Please select your tier first.'); return; }
    if (selectedTier === 'student' && !agreedToTerms) {
      setError('Please agree to the student declaration before proceeding.');
      return;
    }
    try {
      setProcessing(paymentType);
      setError(null);
      const payData = await paymentService.initializeModulePaymentWithTier(
        moduleId, selectedTier, paymentType,
      );
      localStorage.setItem('pendingPaymentId', payData.paymentId);
      localStorage.setItem('pendingModuleId', moduleId);
      localStorage.setItem('pendingUserTier', selectedTier);
      paymentService.redirectToPaystack(payData.authorizationUrl);
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment initialization failed. Please try again.');
      setProcessing(null);
    }
  };

  const isProcessing = processing !== null;
  const selectedPrice = selectedTier === 'student'
    ? pricing?.studentPrice
    : selectedTier === 'non-student'
      ? pricing?.nonStudentPrice
      : null;

  if (loadingPricing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#021d49] mx-auto" />
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {categoryName}  one payment unlocks all modules
          </p>
        </div>

        {/* Tier Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
            Select Your Tier
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student */}
            <button
              onClick={() => { setSelectedTier('student'); setError(null); }}
              className={`rounded-xl border-2 p-5 text-left transition-all ${
                selectedTier === 'student'
                  ? 'border-[#021d49] bg-[#021d49]/5 shadow-md'
                  : 'border-gray-200 bg-white hover:border-[#021d49]/40'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  selectedTier === 'student' ? 'bg-[#021d49]' : 'bg-gray-100'
                }`}>
                  <GraduationCap className={`w-5 h-5 ${selectedTier === 'student' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Student</p>
                  <p className="text-[11px] text-gray-400">Currently enrolled</p>
                </div>
                {selectedTier === 'student' && (
                  <CheckCircle className="w-4 h-4 text-[#021d49] ml-auto" />
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-[#021d49]">
                  KES {pricing?.studentPrice}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">One-time · Unlocks all modules</p>
            </button>

            {/* Non-Student */}
            <button
              onClick={() => { setSelectedTier('non-student'); setAgreedToTerms(false); setError(null); }}
              className={`rounded-xl border-2 p-5 text-left transition-all ${
                selectedTier === 'non-student'
                  ? 'border-[#021d49] bg-[#021d49]/5 shadow-md'
                  : 'border-gray-200 bg-white hover:border-[#021d49]/40'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  selectedTier === 'non-student' ? 'bg-[#021d49]' : 'bg-gray-100'
                }`}>
                  <Briefcase className={`w-5 h-5 ${selectedTier === 'non-student' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Professional</p>
                  <p className="text-[11px] text-gray-400">Working professional</p>
                </div>
                {selectedTier === 'non-student' && (
                  <CheckCircle className="w-4 h-4 text-[#021d49] ml-auto" />
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-extrabold text-gray-900">
                  KES {pricing?.nonStudentPrice}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">One-time · Unlocks all modules</p>
            </button>
          </div>

          {/* Student terms */}
          {selectedTier === 'student' && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-2">Student Declaration</p>
                  <p className="text-xs text-amber-700 leading-relaxed mb-3">
                    After payment you will be required to upload a valid student ID for verification.
                    Access to modules is granted <strong>after admin approval</strong> of your ID.
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 accent-amber-600"
                    />
                    <span className="text-xs text-amber-800 leading-relaxed">
                      I confirm that I am currently an enrolled student. I understand that
                      misrepresentation may result in account suspension and I will be required
                      to submit a valid student ID before accessing content.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* What you get */}
        {selectedTier && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              What You Get
            </h2>
            <div className="space-y-2">
              {[
                'Access to all modules under ' + categoryName,
                'Lifetime access  no recurring fees',
                'Certificate upon module completion',
                selectedTier === 'student'
                  ? 'Student price: requires student ID verification'
                  : 'Immediate access after payment',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment methods */}
        {selectedTier && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Payment Method
              </h2>
              {selectedPrice != null && (
                <span className="text-lg font-extrabold text-[#021d49]">
                  KES {selectedPrice}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Local */}
              <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">Local Payment</p>
                    <p className="text-[10px] text-gray-500">Bank transfer / USSD / Mobile money</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePay('local')}
                  disabled={isProcessing || (selectedTier === 'student' && !agreedToTerms)}
                  className="w-full mt-2 bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing === 'local' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><Smartphone className="w-4 h-4" /> Pay KES {selectedPrice}</>
                  )}
                </button>
              </div>

              {/* International */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">International Card</p>
                    <p className="text-[10px] text-gray-500">Visa / Mastercard / Debit card</p>
                  </div>
                </div>
                <button
                  onClick={() => handlePay('international')}
                  disabled={isProcessing || (selectedTier === 'student' && !agreedToTerms)}
                  className="w-full mt-2 bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing === 'international' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Pay KES {selectedPrice}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Security */}
        <div className="text-center text-xs text-gray-400">
          <p className="flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Secure payment by Paystack
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ModuleCheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#021d49]" />
          </div>
        }>
          <ModuleCheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
