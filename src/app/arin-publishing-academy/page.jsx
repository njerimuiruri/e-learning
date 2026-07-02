'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GraduationCap, Briefcase, CheckCircle, AlertTriangle,
  Loader2, Upload, FileImage, Lock, Smartphone, CreditCard,
  ArrowRight, Clock, Shield, X, ChevronDown, BookOpen, Users, FileText, ExternalLink, Download,
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

const MODULES = [
  {
    code: 'M1', title: 'Academic Writing Mastery', duration: '3 Sessions · 9–12 Hours',
    goal: 'To equip participants with the skills required to develop high-quality scholarly manuscripts that meet international publishing standards.',
    outcomes: ['Structure a publishable academic manuscript', 'Develop clear research arguments', 'Write compelling abstracts and introductions', 'Present findings effectively', 'Select appropriate journals for publication', 'Improve manuscript quality before submission'],
    sessions: [
      { title: 'Foundations of Academic Writing', topics: ['Characteristics of scholarly writing', 'Research-to-publication pathway', 'Understanding journal article structures', 'IMRAD format'], exercise: 'Analyse a published article and identify each section.' },
      { title: 'Building a Strong Manuscript', topics: ['Writing effective abstracts', 'Literature review development', 'Constructing arguments', 'Presenting methods and results'], exercise: 'Draft an abstract from your own research.' },
      { title: 'Journal Selection & Submission Readiness', topics: ['Identifying suitable journals', 'Impact factors and journal rankings', 'Avoiding journal mismatch', 'Submission checklists'], exercise: 'Match manuscripts to appropriate journals.' },
    ],
    assignment: 'Develop a complete manuscript outline for a selected study.',
    output: 'Draft manuscript ready for mentorship review.',
  },
  {
    code: 'M2', title: 'Navigating the Publishing Process', duration: '2 Sessions · 6–8 Hours',
    goal: 'To prepare participants for successful engagement with editors, reviewers, and publishers.',
    outcomes: ['Understand peer review systems', 'Respond effectively to reviewers', 'Manage revisions professionally', 'Recognise predatory journals', 'Understand publication workflows'],
    sessions: [
      { title: 'Understanding the Publishing Ecosystem', topics: ['Types of peer review', 'Editorial decision-making', 'Publishing timelines', 'Rejection and resubmission strategies'], exercise: 'Simulated editorial review process.' },
      { title: 'Managing Revisions & Editorial Feedback', topics: ['Reading reviewer comments', 'Writing response letters', 'Revision strategies', 'Publishing contracts and copyright'], exercise: 'Respond to actual reviewer comments.' },
    ],
    assignment: 'Prepare a reviewer response matrix.',
    output: 'Reviewer response letter and revised manuscript section.',
  },
  {
    code: 'M3', title: 'Research Impact and Open Science', duration: '2 Sessions · 6–8 Hours',
    goal: 'To help researchers maximise visibility, accessibility, and impact of their research.',
    outcomes: ['Understand open science principles', 'Increase citation potential', 'Build researcher profiles', 'Track research impact', 'Use repositories effectively'],
    sessions: [
      { title: 'Open Science and Open Access', topics: ['Open science principles', 'Open-access publishing models', 'Institutional repositories', 'Data sharing practices'], exercise: 'Deposit a paper into a repository.' },
      { title: 'Measuring and Increasing Research Impact', topics: ['Citation metrics', 'H-index and impact indicators', 'Research visibility strategies', 'ORCID, Google Scholar, ResearchGate'], exercise: 'Create and optimise academic profiles.' },
    ],
    assignment: 'Develop a personal research visibility plan.',
    output: 'Research impact enhancement strategy.',
  },
  {
    code: 'M4', title: 'Science Communication for Policy Impact', duration: '3 Sessions · 9–12 Hours',
    goal: "To strengthen participants' ability to translate research into policy and public influence.",
    outcomes: ['Write policy briefs', 'Develop evidence-based narratives', 'Engage media effectively', 'Communicate with non-specialist audiences', 'Use storytelling for impact'],
    sessions: [
      { title: 'Principles of Knowledge Translation', topics: ['Research-to-policy pathways', 'Audience analysis', 'Evidence translation'], exercise: 'Convert a research finding into a policy message.' },
      { title: 'Writing Policy Briefs and Op-Eds', topics: ['Structure of policy briefs', 'Writing executive summaries', 'Op-ed development'], exercise: 'Draft a two-page policy brief.' },
      { title: 'Media Engagement and Storytelling', topics: ['Media interviews', 'Press releases', 'Storytelling techniques', 'Social media for research'], exercise: 'Mock media interview.' },
    ],
    assignment: 'One policy brief, one opinion article, one media release.',
    output: 'Policy communication package.',
  },
  {
    code: 'M5', title: 'Ethical Publishing & Research Integrity', duration: '2 Sessions · 6–8 Hours',
    goal: 'To promote responsible conduct in research and publishing.',
    outcomes: ['Understand research ethics', 'Avoid plagiarism', 'Apply authorship standards', 'Ensure transparency and reproducibility'],
    sessions: [
      { title: 'Research Integrity', topics: ['Research misconduct', 'Fabrication and falsification', 'Authorship ethics', 'Conflicts of interest'], exercise: 'Ethics case study analysis.' },
      { title: 'Responsible Publishing', topics: ['Plagiarism detection', 'Citation ethics', 'Data transparency', 'Reproducibility'], exercise: 'Using plagiarism screening tools.' },
    ],
    assignment: 'Develop an ethical compliance checklist.',
    output: 'Research integrity action plan.',
  },
  {
    code: 'M6', title: 'Responsible Use of AI in Academic Writing', duration: '2 Sessions · 6–8 Hours',
    goal: 'To enable participants to use AI responsibly while maintaining academic integrity.',
    outcomes: ['Use AI tools ethically', 'Understand AI limitations', 'Apply disclosure requirements', 'Protect data privacy', 'Maintain originality'],
    sessions: [
      { title: 'AI for Research and Writing', topics: ['AI tools landscape', 'Literature review support', 'Editing and language enhancement', 'AI-assisted brainstorming'], exercise: 'Compare AI-generated and human-written outputs.' },
      { title: 'Ethics, Transparency and Governance', topics: ['AI disclosure requirements', 'Journal policies on AI', 'Data protection', 'Bias and misinformation'], exercise: 'Develop AI usage statements for manuscripts.' },
    ],
    assignment: 'Prepare an AI-assisted writing workflow.',
    output: 'Responsible AI use protocol.',
  },
  {
    code: 'M7', title: 'Linking Research to the SDGs', duration: '2 Sessions · 6–8 Hours',
    goal: 'To strengthen the alignment of research with global sustainable development priorities.',
    outcomes: ['Map research to SDGs', 'Develop impact pathways', 'Demonstrate policy relevance', 'Frame evidence for donors and policymakers'],
    sessions: [
      { title: 'Understanding the SDG Framework', topics: ['SDGs overview', 'Targets and indicators', 'SDG localisation in Africa', 'Theory of Change'], exercise: 'Map participant research to SDGs.' },
      { title: 'Demonstrating Development Impact', topics: ['Impact pathways', 'Results frameworks', 'Donor reporting', 'Policy influence tracking'], exercise: 'Develop an SDG impact matrix.' },
    ],
    assignment: 'Prepare an SDG alignment and impact statement for a manuscript or policy product.',
    output: 'Research-to-SDG impact framework.',
  },
];

const BOARD_MEMBERS = [
  { name: 'Dr. Joanes Atela', role: 'Founder & Executive Director, ARIN', initials: 'JA', bio: 'Dr. Joanes Atela is a leading African scientist and institution builder with over 15 years of experience in research, climate policy, and technical advisory work. He leads a network of over 200 researchers and policymakers across 36 African countries. Formerly Director of Partnerships and Impact at ACTS, he is Lead Expert for the African Union Green Innovation Framework and serves on the Strategic Advisory Group of UKRI. He holds a PhD from the University of Leeds and has over 1,000 Google Scholar citations.' },
  { name: 'Prof. Idil Boran', role: 'Professor of Philosophy, York University, Canada', initials: 'IB', bio: "Prof. Idil Boran is a Full Professor at York University, Toronto, specialising in political philosophy, applied ethics, and global climate governance. She has participated as an accredited observer in UN Climate Change conferences since 2012 and is the author of Political Theory and Global Climate Action: Recasting the Public Sphere (Routledge, 2019)." },
  { name: 'Dr. J.P. Ochieng Odero', role: 'Scientist & Research Systems Specialist', initials: 'JO', bio: "Dr. J.P.R. Ochieng'-Odero holds a PhD in Zoology from the University of Auckland and has led major research programmes including FCDO's Research and Innovation Systems for Africa (RISA) and the East Africa Research Fund (EARF). He is a Member of the Kenya National Academy of Sciences and has consulted for the World Bank." },
  { name: 'Prof. Dawn Bazley', role: 'University Professor of Biology, York University, Canada', initials: 'DB', bio: "Prof. Dawn Bazley is a University Professor at York University's Faculty of Science. She directed York's Institute for Research and Innovation in Sustainability for seven years. Her research spans ecology, climate change, and science policy. She holds a doctorate from Oxford University and has published over 70 academic works with more than 2,000 citations." },
  { name: 'Prof. George Krhoda', role: 'Professor of Geography & Environmental Studies, University of Nairobi', initials: 'GK', bio: "Prof. George Okoye Krhoda is a Professor at the University of Nairobi specialising in hydrology and water resources. Formerly Permanent Secretary of Kenya's Ministry of Environment and Natural Resources, he has consulted for the World Bank, UNDP, UNICEF, and UNEP. He was awarded the Chief of the Order of the Burning Spear (CBS)." },
];

const TRAINERS = [
  { name: 'Dr. Francis Oloo', role: 'Lead Coordinator · GIS & Remote Sensing', initials: 'FO', bio: 'Dr. Francis Oloo is an expert in Geographic Information Science with over a decade of experience. He holds a PhD from the University of Salzburg and is a Lecturer at the Technical University of Kenya and Adjunct Lecturer at Strathmore University. At ARIN, he serves as AI for Climate Resilience programme lead.' },
  { name: 'Dr. Eurallyah Akinyi', role: 'Advocate, Economist & Policy Specialist', initials: 'EA', bio: 'Dr. Eurallyah Akinyi is an Advocate of the High Court of Kenya and an economist at the intersection of sustainable development, climate finance, energy transition, and public policy. She has published widely on international trade law, climate change, sovereign debt, and artificial intelligence.' },
  { name: 'Dr. Maureen Ngesa', role: 'Academic Writing & Research Capacity', initials: 'MN', bio: 'Dr. Maureen Ngesa is a behavioural systems and programme design leader with a background in clinical psychology and MHPSS across Kenya and East Africa. Her expertise in systems thinking and multi-stakeholder engagement brings a rigorous, evidence-grounded lens to research communication and capacity building.' },
  { name: 'Dr. Fiona Ngarachu', role: 'Research Methods & Policy Communication', initials: 'FN', bio: "Dr. Fiona Ngarachu is an Assistant Professor at USIU-Africa with a PhD from the University of Southampton. She has five years of university teaching experience in research methods and political science. As co-founder of the African Youth Dialogues, she has built knowledge-sharing communities across 17 African countries." },
];

const DOCUMENTS = [
  { title: 'Publishing Academy Brief', description: 'Background, objectives, and programme structure', file: '/documents/ARIN_Publishing_Academy_Brief_Final (1).pdf' },
  { title: 'Training Modules', description: 'All 7 modules, sessions, exercises, and capstone', file: '/documents/Academy Modules.pdf' },
  { title: 'Board Members & Trainers', description: 'Full profiles of board, trainers, and coordinator', file: '/documents/BOARD AND TRAINERS (1).pdf' },
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
  const [payLaterFlow, setPayLaterFlow] = useState(false);
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
        setPricing({ student: a.studentPrice || 100, nonStudent: a.nonStudentPrice || 200 });
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
              // ID approved  student should now choose Full or Installment and pay
              // Works whether they arrive via email link or navigate directly to the page
              setTier('student');
              setStep('payment');
            } else if (s.verificationStatus === 'pending') {
              // ID already submitted  show the "under review" state
              setStep('tier'); // Panel detects pending status and shows waiting screen
            } else {
              // Check for pending tier saved before login redirect
              const pendingTier = localStorage.getItem('pendingAcademyTier');
              if (pendingTier) {
                localStorage.removeItem('pendingAcademyTier');
                setTier(pendingTier);
                setStep('pay-choice');
              }
            }
          } catch { }
        }
      } else {
        // Category not found  will surface as error when user tries to register
        console.warn('ARIN Publishing Academy category not found in:', cats.map(c => c.name));
      }
    } catch (e) {
      console.error('Failed to load academy data:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectTier = (t) => {
    setTier(t); setError(null);
    if (!user) {
      localStorage.setItem('pendingAcademyTier', t);
      setStep('auth');
      return;
    }
    setStep('pay-choice');
  };

  const handlePayNow = () => {
    if (tier === 'non-student') setStep('payment');
    else if (status?.awaitingPayment) setStep('payment');
    else setStep('id-upload');
  };

  const handlePayLater = async () => {
    if (!tier) return;
    if (!categoryId) { setError('Category could not be loaded. Please refresh the page.'); return; }
    try {
      setProcessing(true); setError(null);
      await paymentService.enrollPayLater(categoryId, tier);
      if (tier === 'student') {
        // Student still needs to upload ID so admin can verify for the student rate
        setPayLaterFlow(true);
        setStep('id-upload');
        setProcessing(false);
      } else {
        router.push(`/student/modules/category/${categoryId}`);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Enrollment failed. Please try again.');
      setProcessing(false);
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-5">

        {/* Objectives + Registration panel  two column */}
        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* Left  Objectives */}
          <div className="flex-1 min-w-0">
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
          </div>

          {/* Right  registration panel */}
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
                onBack={() => { setStep('tier'); setTier(null); setPaymentOption(null); setError(null); setPayLaterFlow(false); }}
                onPayNow={handlePayNow} onPayLater={handlePayLater}
                user={user} router={router} status={status}
                payLaterFlow={payLaterFlow} categoryId={categoryId}
              />
            </div>
          </div>

        </div>

        {/* Full-width sections */}
        <TrainingCurriculum />
        <AcademyTeam />
        <ProgrammeDocuments />

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

function TrainingCurriculum() {
  const [expandedModule, setExpandedModule] = useState(null);
  const moduleColors = { M1: 'bg-blue-50 text-blue-800', M2: 'bg-indigo-50 text-indigo-800', M3: 'bg-violet-50 text-violet-800', M4: 'bg-purple-50 text-purple-800', M5: 'bg-rose-50 text-rose-800', M6: 'bg-amber-50 text-amber-800', M7: 'bg-emerald-50 text-emerald-800' };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#021d49] flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#021d49]">Training Curriculum</span>
      </div>
      <p className="text-gray-400 text-xs ml-9 mb-5">7 modules · Click any module to see full details</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MODULES.map((mod) => {
          const isOpen = expandedModule === mod.code;
          return (
            <div
              key={mod.code}
              className={`rounded-xl border transition-all duration-200 ${isOpen ? 'border-[#021d49] lg:col-span-3 sm:col-span-2' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
            >
              <button
                onClick={() => setExpandedModule(isOpen ? null : mod.code)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <span className={`shrink-0 w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center ${moduleColors[mod.code]}`}>{mod.code}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#021d49] text-sm leading-snug">{mod.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{mod.duration}</p>
                </div>
                <ChevronDown className={`shrink-0 w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 border-t border-gray-100 pt-4">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Module Goal</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{mod.goal}</p>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-5 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Learning Outcomes</p>
                      <div className="space-y-1.5">
                        {mod.outcomes.map((o, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#021d49] mt-1.5 opacity-40" />{o}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Sessions</p>
                      <div className="space-y-2">
                        {mod.sessions.map((s, si) => (
                          <div key={si} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                            <p className="font-semibold text-[#021d49] text-xs mb-1.5">Session {si + 1}: {s.title}</p>
                            <ul className="space-y-0.5 mb-2">
                              {s.topics.map((t, ti) => (
                                <li key={ti} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                                  <span className="shrink-0 w-1 h-1 rounded-full bg-gray-400 mt-1.5" />{t}
                                </li>
                              ))}
                            </ul>
                            <p className="text-[10px] text-gray-400 pt-1.5 border-t border-gray-200">
                              <span className="font-bold uppercase tracking-wide">Exercise  </span>{s.exercise}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Assignment</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{mod.assignment}</p>
                    </div>
                    <div className="rounded-xl bg-[#021d49] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Expected Output</p>
                      <p className="text-sm text-white/80 leading-relaxed italic">{mod.output}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Capstone Project  Academy Wide</p>
        <p className="text-sm text-gray-600 mb-3">Each participant develops one publication product, choosing from four tracks:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[{ l: 'Track A', s: 'Academic Journal Manuscript', c: 'bg-blue-50 text-blue-700 border-blue-100' }, { l: 'Track B', s: 'Policy Brief', c: 'bg-violet-50 text-violet-700 border-violet-100' }, { l: 'Track C', s: 'Technical Paper', c: 'bg-amber-50 text-amber-700 border-amber-100' }, { l: 'Track D', s: 'Book Chapter', c: 'bg-emerald-50 text-emerald-700 border-emerald-100' }].map((t) => (
            <div key={t.l} className={`rounded-xl border p-3 text-center ${t.c}`}>
              <p className="text-[10px] font-bold mb-0.5">{t.l}</p>
              <p className="text-[11px] leading-snug font-medium">{t.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AcademyTeam() {
  const [expandedPerson, setExpandedPerson] = useState(null);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-[#021d49] flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#021d49]">Academy Team</span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Publishing Partner</p>
          <p className="font-bold text-[#021d49] text-sm">Taylor &amp; Francis Group</p>
          <p className="text-xs text-gray-400 mt-0.5">Global academic publisher</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Coordinator</p>
          <p className="font-bold text-[#021d49] text-sm">Florence Onyango</p>
          <p className="text-xs text-gray-400 italic mt-0.5">Senior Manager, Science Communications</p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">Oversees editorial strategy, heads ARIN Press, and leads policy engagement. MSc in Climate Change Adaptation · ISO 9001 Lead Auditor.</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Support Team</p>
          <div className="space-y-1.5 mt-1">
            {['Jerry Ariel', 'Nancy Mutwii', 'Maria Nailentei'].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#021d49] opacity-40" />
                <p className="text-sm font-medium text-[#021d49]">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Board Members</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {BOARD_MEMBERS.map((p) => {
          const key = `board-${p.name}`;
          const isOpen = expandedPerson === key;
          return (
            <div key={key} className={`rounded-xl border transition-all ${isOpen ? 'border-[#021d49] sm:col-span-2 lg:col-span-3' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
              <button onClick={() => setExpandedPerson(isOpen ? null : key)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="shrink-0 w-9 h-9 rounded-full bg-[#021d49] text-white text-xs font-bold flex items-center justify-center">{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#021d49] text-sm">{p.name}</p>
                  <p className="text-[11px] text-gray-400 italic mt-0.5 leading-snug truncate">{p.role}</p>
                </div>
                <ChevronDown className={`shrink-0 w-4 h-4 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{p.bio}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Trainers</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TRAINERS.map((p) => {
          const key = `trainer-${p.name}`;
          const isOpen = expandedPerson === key;
          return (
            <div key={key} className={`rounded-xl border transition-all ${isOpen ? 'border-[#021d49] sm:col-span-2 lg:col-span-3' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
              <button onClick={() => setExpandedPerson(isOpen ? null : key)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="shrink-0 w-9 h-9 rounded-full bg-gray-200 text-[#021d49] text-xs font-bold flex items-center justify-center">{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#021d49] text-sm">{p.name}</p>
                  <p className="text-[11px] text-gray-400 italic mt-0.5 leading-snug truncate">{p.role}</p>
                </div>
                <ChevronDown className={`shrink-0 w-4 h-4 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{p.bio}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgrammeDocuments() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#021d49] flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#021d49]">Programme Documents</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {DOCUMENTS.map((doc) => (
          <div key={doc.title} className="rounded-xl border border-gray-200 p-4 flex flex-col justify-between gap-3">
            <div>
              <p className="font-semibold text-[#021d49] text-sm mb-1">{doc.title}</p>
              <p className="text-[11px] text-gray-400 leading-snug">{doc.description}</p>
            </div>
            <div className="flex gap-2">
              <a href={doc.file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-[#021d49] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                <ExternalLink className="w-3 h-3" /> View
              </a>
              <a href={doc.file} download className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#021d49] rounded-lg px-3 py-1.5 hover:bg-[#032566] transition-colors">
                <Download className="w-3 h-3" /> Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({
  step, tier, paymentOption, setPaymentOption, error, setError,
  processing, paymentType, sp, nsp, total, half,
  uploadDone, idFile, idPreview, fileInputRef, uploading,
  onTier, onFile, onSubmitId, onPay, onBack, onPayNow, onPayLater, user, router, status,
  payLaterFlow, categoryId,
}) {
  if (status?.hasAccess) {
    const dashPath = user?.role === 'admin' ? '/admin' : '/student';
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">You're Registered</h3>
        <p className="text-sm text-gray-500 mb-6">
          You have access to the ARIN Publishing Academy. Modules will be available here when published.
        </p>
        <button
          onClick={() => router.push(dashPath)}
          className="w-full bg-[#021d49] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#032a66] transition-colors flex items-center justify-center gap-2"
        >
          Go to My Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (uploadDone || status?.verificationStatus === 'pending') return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-amber-500" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">ID Under Review</h3>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">
        Your student ID has been submitted and is under review. We will respond within 1–2 business days.
      </p>
      {payLaterFlow ? (
        <>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-left text-xs text-emerald-700 leading-relaxed mb-4">
            <strong>Module 1 is now available.</strong> You can start exploring while your ID is reviewed. Once approved, you'll be able to pay the student rate of <strong>USD {sp}</strong> to unlock all modules.
          </div>
          <button
            onClick={() => router.push(`/student/modules/category/${categoryId}`)}
            className="w-full bg-[#021d49] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#032a66] transition-colors flex items-center justify-center gap-2"
          >
            Go to Module 1 <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left text-xs text-amber-700 leading-relaxed">
          Once approved, you will receive an email with a link to complete your payment at the student rate of <strong>USD {sp}</strong>.
        </div>
      )}
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

            {error && <ErrBox msg={error} />}

            <ul className="space-y-1.5 pt-1">
              {[
                'One-time payment  no recurring fees',
                'Access to all modules when published',
                'Certificate upon programme completion',
              ].map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-2 border border-dashed border-amber-200 bg-amber-50 rounded-xl p-3">
              <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Not ready to pay?</strong> Select a tier then choose <em>Pay Later</em>  get Module 1 free and pay anytime to unlock the rest. Students still need to upload their ID for admin approval to access the student rate.
              </p>
            </div>
          </>
        )}

        {/* Auth prompt  shown when tier selected but not logged in */}
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
              Your selection will be saved  continue straight after signing in.
            </p>
          </>
        )}

        {/* Pay Choice  Pay Now or Pay Later */}
        {step === 'pay-choice' && (
          <>
            <BackBtn onClick={onBack} />

            {/* Tier summary */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${tier === 'student' ? 'bg-sky-50 text-sky-700' : 'bg-orange-50 text-orange-700'}`}>
              <div className="flex items-center gap-2">
                {tier === 'student' ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                {tier === 'student' ? 'Student' : 'Non-Student'}
              </div>
              <span>USD {total} total</span>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select a payment option</p>
            <div className="space-y-3">
              <OptionCard
                selected={paymentOption === 'full'}
                onClick={() => { setPaymentOption('full'); setError(null); }}
                title="Full Payment"
                sub="One-time · Instant full access"
                price={`USD ${total}`}
              />
              <OptionCard
                selected={paymentOption === 'installment1'}
                onClick={() => { setPaymentOption('installment1'); setError(null); }}
                title="Installments"
                sub={`USD ${half} now · + USD ${half} later`}
                price={`USD ${half}`}
              />
            </div>

            {paymentOption === 'installment1' && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                You'll pay <strong>USD {half} now</strong> for full access. The 2nd installment of <strong>USD {half}</strong> will be communicated by the admin when due.
              </p>
            )}

            {error && <ErrBox msg={error} />}

            <button
              onClick={onPayNow}
              disabled={processing || !paymentOption}
              className="w-full bg-[#021d49] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#032a66] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {paymentOption ? 'Continue to Payment' : 'Select an option above'}
            </button>

            {/* Pay Later with tooltip */}
            <div className="relative group">
              <button
                onClick={onPayLater}
                disabled={processing}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Explore for Free · Pay Later
              </button>
              <div className="absolute bottom-full left-0 right-0 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-xl px-4 py-3 leading-relaxed shadow-lg">
                  You'll get instant access to <strong>Module 1</strong> as a free preview. Pay anytime to unlock the full programme  your spot is saved and your progress won't be lost.
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Upload ID */}
        {step === 'id-upload' && (
          <>
            <BackBtn onClick={onBack} />

            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                {payLaterFlow
                  ? <>You now have access to <strong>Module 1</strong>. Upload your student ID so the admin can verify your eligibility for the <strong>student rate of USD {sp}</strong> when you complete payment.</>
                  : <>Upload a valid student ID or enrollment letter. Once approved, you'll receive an email to complete payment at the <strong>student rate of USD {sp}</strong>.</>
                }
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
            {/* Only show back button for non-students  students who are approved shouldn't go back to tier */}
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
              <span>USD {total} total</span>
            </div>

            {/* Installment 2  pre-selected from email link */}
            {paymentOption === 'installment2' ? (
              <div className="bg-[#021d49]/5 border border-[#021d49]/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#021d49] uppercase tracking-wider mb-2">2nd Installment Due</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">Remaining balance</p>
                  <p className="text-2xl font-extrabold text-[#021d49]">USD {half}</p>
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
                    price={`USD ${total}`}
                  />
                  <OptionCard
                    selected={paymentOption === 'installment1'}
                    onClick={() => { setPaymentOption('installment1'); setError(null); }}
                    title="Installment 1  50%"
                    sub="Pay now · 2nd installment TBA"
                    price={`USD ${half}`}
                  />
                </div>
                {paymentOption === 'installment1' && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    The 2nd installment of <strong>USD {half}</strong> will be communicated by the admin when due.
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

function TierCard({ icon, label, sub, price, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-sm transition-all text-left group w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:shadow-none"
    >
      <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <p className="font-bold text-gray-900 text-sm mb-0.5">{label}</p>
      <p className="text-[11px] text-gray-400 mb-3 leading-snug">{sub}</p>
      <p className="text-2xl font-extrabold text-gray-900">USD {price}</p>
      <p className="text-[10px] text-gray-400 font-medium">US Dollar</p>
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
