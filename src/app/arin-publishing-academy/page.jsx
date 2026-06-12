'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap, Briefcase, CheckCircle, AlertTriangle,
  Loader2, Upload, FileImage, Lock, Smartphone, CreditCard,
  ArrowRight, Clock, Shield, X,
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import paymentService from '@/lib/api/paymentService';
import authService from '@/lib/api/authService';
import studentVerificationService from '@/lib/api/studentVerificationService';
import categoryService from '@/lib/api/categoryService';

const OBJECTIVES = [
  'Strengthen research writing and publishing capacity to produce high-quality academic, technical, and policy-oriented outputs.',
  'Build inclusive mentorship networks by connecting participants with senior scholars, journal editors, and policy communication experts.',
  'Enhance data literacy and research rigor through training in analysis, visualization, reproducibility, and ethical practices.',
  'Advance knowledge translation by equipping participants to transform evidence into policy briefs, op-eds, and advocacy materials.',
  'Promote open dissemination pathways by leveraging digital tools, open-access models, AI, and structured publishing workflows.',
];

const OUTCOMES = [
  { title: 'Certificate', desc: 'Formal certificate upon completion of Academy modules.' },
  { title: 'Mentorship Access', desc: 'Ongoing access to mentors, editors, and peer reviewers.' },
  { title: 'Career Pathways', desc: 'Linkages to funding calls, fellowships, and journal opportunities.' },
  { title: 'Alumni Network', desc: 'Continental community for co-authorship and peer learning.' },
  { title: 'Awards', desc: 'Competitive recognition for outstanding research outputs.' },
  { title: 'Publication Opportunity', desc: 'Opportunity to publish in a high-impact journal as part of the programme.' },
];

function AcademyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const payParam = searchParams.get('pay');
  const actionParam = searchParams.get('action'); // 'pay-installment2'

  const [categoryId, setCategoryId] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('tier');
  const [tier, setTier] = useState(null);
  const [paymentOption, setPaymentOption] = useState(null);
  const [paymentType, setPaymentType] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const u = authService.getCurrentUser();
    setUser(u);
    init(u);
  }, []);

  const init = async (u) => {
    try {
      const rawCats = await categoryService.getAllCategories();
      const cats = Array.isArray(rawCats) ? rawCats : [];

      // Match by name, or fall back to any category with tiered pricing
      const a = cats.find(c =>
        c.name?.toLowerCase().includes('publishing academy') ||
        c.name?.toLowerCase().includes('arin publishing')
      ) || cats.find(c => c.hasTieredPricing && c.isPaid);

      if (a?._id) {
        setCategoryId(a._id);
        setPricing({ student: a.studentPrice || 5, nonStudent: a.nonStudentPrice || 10 });
        if (u) {
          try {
            const s = await paymentService.checkCategoryStatus(a._id);
            setStatus(s);

            if (actionParam === 'pay-installment2') {
              // Installment 2 reminder email link
              setStep('payment');
              setPaymentOption('installment2');
              setTier(s?.userTier || 'non-student');
            } else if (s.hasAccess) {
              setStep('done');
            } else if (s.awaitingPayment) {
              // ID approved — student should now choose Full or Installment and pay
              // Works whether they arrive via email link or navigate directly to the page
              setTier('student');
              setStep('payment');
            } else if (s.verificationStatus === 'pending') {
              // ID already submitted — show the "under review" state
              setStep('tier'); // Panel detects pending status and shows waiting screen
            } else {
              // Check for pending tier saved before login redirect
              const pendingTier = localStorage.getItem('pendingAcademyTier');
              if (pendingTier) {
                localStorage.removeItem('pendingAcademyTier');
                setTier(pendingTier);
                if (pendingTier === 'non-student') setStep('payment');
                else setStep('id-upload');
              }
            }
          } catch { }
        }
      } else {
        // Category not found — will surface as error when user tries to register
        console.warn('ARIN Publishing Academy category not found in:', cats.map(c => c.name));
      }
    } catch (e) {
      console.error('Failed to load academy data:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectTier = (t) => {
    if (!categoryId) {
      setError('Registration is not yet available. Please try again shortly.');
      return;
    }
    setTier(t); setError(null);
    if (!user) {
      // Save tier so we can restore it after they log in
      localStorage.setItem('pendingAcademyTier', t);
      setStep('auth');
      return;
    }
    if (t === 'non-student') setStep('payment');
    else if (status?.awaitingPayment) setStep('payment');
    else setStep('id-upload');
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(f.type)) {
      setError('Only JPG, PNG or PDF files are accepted.'); return;
    }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    setError(null); setIdFile(f);
    if (f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = e => setIdPreview(e.target.result);
      r.readAsDataURL(f);
    } else setIdPreview(null);
  };

  const submitId = async () => {
    if (!idFile) { setError('Please select your student ID first.'); return; }
    if (!categoryId) { setError('Could not identify the category. Please refresh.'); return; }
    if (!user) { router.push('/login?redirect=/arin-publishing-academy'); return; }
    try {
      setUploading(true); setError(null);
      await studentVerificationService.uploadStudentId(idFile, categoryId);
      setUploadDone(true);
    } catch (e) { setError(e?.response?.data?.message || 'Upload failed. Please try again.'); }
    finally { setUploading(false); }
  };

  const pay = async (pType) => {
    if (!paymentOption) { setError('Please select a payment option.'); return; }
    if (!user) { router.push('/login?redirect=/arin-publishing-academy'); return; }
    try {
      setProcessing(true); setPaymentType(pType); setError(null);
      const d = await paymentService.initializeCategoryPayment(categoryId, tier, paymentOption, pType);
      localStorage.setItem('pendingPaymentId', d.paymentId);
      localStorage.setItem('pendingCategoryId', categoryId);
      localStorage.setItem('pendingUserTier', tier);
      paymentService.redirectToPaystack(d.authorizationUrl);
    } catch (e) {
      setError(e?.response?.data?.message || 'Payment failed. Please try again.');
      setProcessing(false); setPaymentType(null);
    }
  };

  const sp = pricing?.student ?? 100;
  const nsp = pricing?.nonStudent ?? 200;
  const total = tier === 'student' ? sp : nsp;
  const half = Math.round(total * 0.5);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Africa Research and Impact Network
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1 leading-tight">
            ARIN Publishing Academy
          </h1>
          <p className="text-sm text-gray-400">
            In partnership with <span className="text-gray-600 font-semibold">Taylor &amp; Francis</span>
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* Left */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Objectives */}
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-6">
              <SectionHeading>Objectives</SectionHeading>
              <ol className="space-y-4">
                {OBJECTIVES.map((o, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed">{o}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Structure */}
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-6">
              <SectionHeading>Structure and Implementation</SectionHeading>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                A blended, flexible delivery model over <strong className="text-gray-700">2–3 months</strong>,
                accommodating working professionals and researchers across African time zones.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: 'Virtual instructor-led sessions', sub: 'Live interactive webinars' },
                  { title: 'Self-paced e-learning modules', sub: 'ARIN digital learning platform' },
                  { title: 'Mentorship and coaching clinics', sub: 'Small-group and one-on-one' },
                  { title: 'Peer-learning circles', sub: 'Collaborative feedback sessions' },
                  { title: 'Practical writing labs', sub: 'Real-time manuscript development' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes */}
            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-6">
              <SectionHeading>Outcomes</SectionHeading>
              <div className="grid sm:grid-cols-2 gap-3">
                {OUTCOMES.map((o, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{o.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{o.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right — registration panel */}
          <div className="lg:w-[380px] w-full flex-shrink-0">
            <div className="sticky top-24">
              <Panel
                step={step} tier={tier} paymentOption={paymentOption}
                setPaymentOption={setPaymentOption} error={error} setError={setError}
                processing={processing} paymentType={paymentType}
                sp={sp} nsp={nsp} total={total} half={half}
                uploadDone={uploadDone} idFile={idFile} idPreview={idPreview}
                fileInputRef={fileInputRef} uploading={uploading}
                onTier={selectTier} onFile={handleFile} onSubmitId={submitId} onPay={pay}
                onBack={() => { setStep('tier'); setTier(null); setPaymentOption(null); setError(null); }}
                user={user} router={router} status={status}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
      {children}
    </h2>
  );
}

function Panel({
  step, tier, paymentOption, setPaymentOption, error, setError,
  processing, paymentType, sp, nsp, total, half,
  uploadDone, idFile, idPreview, fileInputRef, uploading,
  onTier, onFile, onSubmitId, onPay, onBack, user, router, status,
}) {
  if (status?.hasAccess) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
      <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-7 h-7 text-emerald-500" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">You're Registered</h3>
      <p className="text-sm text-gray-500 mb-6">
        You have access to the ARIN Publishing Academy. Modules will be available here when published.
      </p>
      <button
        onClick={() => router.push('/student/modules')}
        className="w-full bg-[#021d49] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#032a66] transition-colors flex items-center justify-center gap-2"
      >
        Go to My Modules <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  if (uploadDone || status?.verificationStatus === 'pending') return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-amber-500" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">ID Under Review</h3>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">
        Your student ID has been submitted and is under review. We will respond within 1–2 business days.
      </p>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left text-xs text-amber-700 leading-relaxed">
        Once approved, you will receive an email with a link to complete your payment at the student rate of <strong>KES {sp}</strong>.
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registration</p>
        <p className="text-gray-900 font-bold text-lg leading-snug">ARIN Publishing Academy</p>
        <p className="text-xs text-gray-400 mt-0.5">First Cohort · 2026</p>
      </div>

      <div className="p-6 space-y-5">

        {/* Tier */}
        {step === 'tier' && (
          <>
            <p className="text-sm text-gray-500">Select your registration type to get started.</p>

            <div className="grid grid-cols-2 gap-3">
              <TierCard
                icon={<GraduationCap className="w-5 h-5 text-gray-700" />}
                label="Student"
                sub="ID verification required"
                price={sp}
                onClick={() => onTier('student')}
              />
              <TierCard
                icon={<Briefcase className="w-5 h-5 text-gray-700" />}
                label="Non-Student"
                sub="Immediate access"
                price={nsp}
                onClick={() => onTier('non-student')}
              />
            </div>

            <ul className="space-y-1.5 pt-1">
              {[
                'One-time payment — no recurring fees',
                'Access to all modules when published',
                'Certificate upon programme completion',
              ].map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Auth prompt — shown when tier selected but not logged in */}
        {step === 'auth' && (
          <>
            <BackBtn onClick={onBack} />

            <div className="text-center py-2">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {tier === 'student'
                  ? <GraduationCap className="w-5 h-5 text-gray-500" />
                  : <Briefcase className="w-5 h-5 text-gray-500" />
                }
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {tier === 'student' ? 'Student Registration' : 'Non-Student Registration'}
              </p>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                You need an account to complete your registration and receive confirmation.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/login?redirect=/arin-publishing-academy')}
                className="w-full bg-[#021d49] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#032a66] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/register?redirect=/arin-publishing-academy')}
                className="w-full border border-gray-200 text-gray-800 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Create Account
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              Your selection will be saved — continue straight after signing in.
            </p>
          </>
        )}

        {/* Upload ID */}
        {step === 'id-upload' && (
          <>
            <BackBtn onClick={onBack} />

            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Upload a valid student ID or enrollment letter. Once approved, you'll receive an email
                to complete payment at the <strong>student rate of KES {sp}</strong>.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#021d49]/40 hover:bg-gray-50 transition-all"
            >
              {idPreview
                ? <img src={idPreview} alt="" className="max-h-32 mx-auto rounded-lg object-contain" />
                : idFile
                  ? <div className="flex items-center justify-center gap-2 text-gray-600"><FileImage className="w-6 h-6 text-gray-400" /><span className="text-sm font-medium truncate max-w-[200px]">{idFile.name}</span></div>
                  : <>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Click to upload your student ID</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF · max 5MB</p>
                  </>
              }
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" className="hidden" onChange={onFile} />
            </div>

            {idFile && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs text-gray-500">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="flex-1 truncate">{idFile.name}</span>
                <span className="text-gray-300">{(idFile.size / 1024).toFixed(0)} KB</span>
              </div>
            )}

            {error && <ErrBox msg={error} />}

            <button
              onClick={onSubmitId}
              disabled={uploading || !idFile}
              className="w-full bg-[#021d49] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#032a66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Submit for Verification</>}
            </button>
          </>
        )}

        {/* Payment */}
        {step === 'payment' && (
          <>
            {/* Only show back button for non-students — students who are approved shouldn't go back to tier */}
            {tier !== 'student' && <BackBtn onClick={onBack} />}

            {/* Approved student banner */}
            {tier === 'student' && status?.awaitingPayment && (
              <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Student ID Approved</p>
                  <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                    Your student ID has been verified. Please select a payment option below to complete your registration.
                  </p>
                </div>
              </div>
            )}

            {/* Tier summary */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${tier === 'student' ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700'}`}>
              <div className="flex items-center gap-2">
                {tier === 'student' ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                {tier === 'student' ? 'Student' : 'Non-Student'}
              </div>
              <span>KES {total} total</span>
            </div>

            {/* Installment 2 — pre-selected from email link */}
            {paymentOption === 'installment2' ? (
              <div className="bg-[#021d49]/5 border border-[#021d49]/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#021d49] uppercase tracking-wider mb-2">2nd Installment Due</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Remaining balance</p>
                  <p className="text-2xl font-extrabold text-[#021d49]">KES {half}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">This completes your registration payment.</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment option</p>
                <div className="space-y-3">
                  <OptionCard
                    selected={paymentOption === 'full'}
                    onClick={() => { setPaymentOption('full'); setError(null); }}
                    title="Full Payment"
                    sub="Pay the full amount now"
                    price={`KES ${total}`}
                  />
                  <OptionCard
                    selected={paymentOption === 'installment1'}
                    onClick={() => { setPaymentOption('installment1'); setError(null); }}
                    title="Installment 1 — 50%"
                    sub="Due 15 June 2026 · 2nd installment TBA"
                    price={`KES ${half}`}
                  />
                </div>
                {paymentOption === 'installment1' && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    The 2nd installment of <strong>KES {half}</strong> will be communicated by the admin when due.
                  </p>
                )}
              </>
            )}

            {error && <ErrBox msg={error} />}

            {paymentOption && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment method</p>
                <div className="grid grid-cols-2 gap-3">
                  <PayBtn
                    label="Local Payment"
                    sub="M-Pesa · Bank · USSD"
                    icon={<Smartphone className="w-4 h-4" />}
                    loading={processing && paymentType === 'local'}
                    disabled={processing}
                    onClick={() => onPay('local')}
                    color="bg-emerald-600 hover:bg-emerald-700"
                  />
                  <PayBtn
                    label="Card Payment"
                    sub="Visa · Mastercard"
                    icon={<CreditCard className="w-4 h-4" />}
                    loading={processing && paymentType === 'international'}
                    disabled={processing}
                    onClick={() => onPay('international')}
                    color="bg-[#021d49] hover:bg-[#032a66]"
                  />
                </div>
              </>
            )}
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-300 pt-1">
          <Lock className="w-3 h-3" />
          <span>Secured by Paystack</span>
        </div>
      </div>
    </div>
  );
}

function TierCard({ icon, label, sub, price, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-sm transition-all text-left group w-full"
    >
      <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <p className="font-bold text-gray-900 text-sm mb-0.5">{label}</p>
      <p className="text-[11px] text-gray-400 mb-3 leading-snug">{sub}</p>
      <p className="text-2xl font-extrabold text-gray-900">KES {price}</p>
      <p className="text-[10px] text-gray-400 font-medium">Kenyan Shilling</p>
    </button>
  );
}

function OptionCard({ selected, onClick, title, sub, price }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
        selected ? 'border-[#021d49] bg-[#021d49]/5' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-[#021d49]' : 'border-gray-300'}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-[#021d49]" />}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
      </div>
      <p className="text-sm font-extrabold text-[#021d49] ml-3 flex-shrink-0">{price}</p>
    </button>
  );
}

function PayBtn({ label, sub, icon, loading, disabled, onClick, color }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${color} text-white py-4 px-3 rounded-xl font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-1.5`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      <span>{loading ? 'Processing…' : label}</span>
      <span className="text-white/60 text-[10px]">{sub}</span>
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
      <X className="w-3.5 h-3.5" /> Back
    </button>
  );
}

function ErrBox({ msg }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs leading-relaxed">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      {msg}
    </div>
  );
}

export default function ArinPublishingAcademyPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#021d49]" />
        </div>
      }>
        <AcademyContent />
      </Suspense>
      <Footer />
    </>
  );
}
