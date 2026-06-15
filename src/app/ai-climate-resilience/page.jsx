'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Users, Lock, Loader2, CheckCircle, Play,
  Sprout, Flame, Rocket, Video, Monitor, PenLine,
  Layers, ArrowRight, Award, GraduationCap,
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import categoryService from '@/lib/api/categoryService';
import moduleService from '@/lib/api/moduleService';
import authService from '@/lib/api/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const LEVELS = [
  {
    key: 'beginner',
    label: 'Beginner',
    title: 'Foundation & Technical Core',
    desc: 'Climate science, policy frameworks, mathematical foundations, and an introduction to AI and Machine Learning.',
    assessments: ['Topic quizzes after each major topic', 'End-of-module assessments', 'Minimum pass mark: 70%'],
    cert: 'Certificate in Foundations of AI for Climate Resilience',
    Icon: Sprout,
    dot: 'bg-sky-400',
    tag: 'text-sky-600 bg-sky-50 border-sky-100',
    iconColor: 'text-sky-500',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    title: 'Advanced Analytical Modelling',
    desc: 'Advanced ML for climate modeling, uncertainty and risk analysis, and spatial vulnerability mapping.',
    assessments: ['Advanced modeling quizzes', 'Practical assignments', 'Mini modeling project', 'Minimum pass mark: 70%'],
    cert: 'Advanced Certificate in AI for Climate Analytics',
    Icon: Flame,
    dot: 'bg-emerald-400',
    tag: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-500',
  },
  {
    key: 'advanced',
    label: 'Advanced',
    title: 'Applied Innovation & Capstone',
    desc: 'Real-world case studies, AI-driven solution design, ethical integration, policy translation, and a final Capstone Project where you design an AI-based climate resilience solution.',
    assessments: ['Advanced assessments & solution reviews',  'Final presentation & peer review'],
    cert: 'Fellowship Certificate',
    Icon: Rocket,
    dot: 'bg-violet-400',
    tag: 'text-violet-700 bg-violet-50 border-violet-100',
    iconColor: 'text-violet-500',
  },
];

const DELIVERY = [
  { Icon: Monitor,  label: 'Self-paced Modules',     sub: 'Learn at your own pace on the ARIN platform' },
  { Icon: Video,    label: 'Live Zoom Masterclasses', sub: 'Interactive sessions with thematic experts'  },
  { Icon: Layers,   label: 'Webinars',                sub: 'Curated expert-led knowledge sessions'       },
  { Icon: PenLine,  label: 'Case-based Assignments',  sub: 'Real-world problem-solving tasks'            },
  { Icon: Award,    label: 'Capstone Project',         sub: 'AI innovation aligned with African priorities' },
];

const OUTCOMES = [
  'Interpret climate datasets and model climate variability trends',
  'Build and evaluate basic ML models for environmental data',
  'Apply AI in vulnerability mapping and risk forecasting',
  'Quantify uncertainty in climate projections',
  'Critically assess ethical implications of AI in climate governance',
  'Develop policy briefs informed by AI-generated evidence',
  'Present a climate-resilient AI innovation aligned with African priorities',
];

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const toAbsoluteUrl = (url) => {
  if (!url) return '';
  return url.startsWith('/') ? `${API_URL}${url}` : url;
};

const levelMeta = {
  beginner:     { label: 'Beginner',     Icon: Sprout, dot: 'bg-sky-400',     pill: 'bg-sky-50 text-sky-600 border border-sky-100'         },
  intermediate: { label: 'Intermediate', Icon: Flame,  dot: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  advanced:     { label: 'Advanced',     Icon: Rocket, dot: 'bg-violet-400',  pill: 'bg-violet-50 text-violet-700 border border-violet-100'  },
};

function ModuleCard({ mod, onAction, isLoggedIn }) {
  const meta = levelMeta[mod.level] || levelMeta.beginner;
  const LvlIcon = meta.Icon;
  const desc = stripHtml(mod.description || '');

  return (
    <div
      onClick={() => onAction(mod)}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* thin top bar */}
      <div className={`h-0.5 w-full ${meta.dot}`} />

      {/* banner */}
      <div className="relative h-36 overflow-hidden shrink-0 bg-gray-50">
        {mod.bannerUrl ? (
          <img
            src={toAbsoluteUrl(mod.bannerUrl)}
            alt={mod.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <BookOpen className="w-8 h-8 text-gray-200" />
          </div>
        )}
      </div>

      {/* content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2.5">
          {mod.order > 0 && (
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              Module {mod.order}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.pill}`}>
            <LvlIcon className="w-2.5 h-2.5" />
            {meta.label}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-[#021d49] transition-colors">
          {mod.title}
        </h3>

        {desc && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">{desc}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {mod.lessons?.length || mod.totalLessons || 0} lessons
          </span>
          {(mod.enrollmentCount || 0) > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {mod.enrollmentCount}
            </span>
          )}
          <span className="flex items-center gap-1 text-[#021d49] font-semibold">
            {isLoggedIn ? <><Play className="w-3 h-3" /> Start</> : <><Lock className="w-3 h-3" /> Sign in</>}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AIClimateResiliencePage() {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const loggedIn = !!user;
    setIsLoggedIn(loggedIn);
    loadModules(loggedIn);
  }, []);

  const loadModules = async (loggedIn) => {
    // Modules require auth — skip the fetch entirely for unauthenticated visitors
    if (!loggedIn) {
      setLoading(false);
      return;
    }

    try {
      const cats = await categoryService.getAllCategories();
      const all = Array.isArray(cats) ? cats : [];

      const cat = all.find(c => {
        const n = c.name?.toLowerCase() ?? '';
        return (
          n.includes('ai resilience') ||
          n.includes('climate resilience') ||
          n.includes('ai for climate') ||
          n.includes('climate') ||
          n.includes('resilience')
        );
      });

      if (!cat?._id) {
        console.warn('[AI Climate] Category not found. Available:', all.map(c => c.name));
        return;
      }

      // Try category-specific endpoint first, then fall back to general modules list
      const [catResult, modResult] = await Promise.allSettled([
        categoryService.getModulesByCategory(cat._id, { limit: 50 }),
        moduleService.getAllModules({ category: cat._id, limit: 50 }),
      ]);

      let mods = [];
      if (catResult.status === 'fulfilled') {
        const v = catResult.value;
        mods = Array.isArray(v) ? v : v?.data || v?.modules || [];
      }
      if (mods.length === 0 && modResult.status === 'fulfilled') {
        const v = modResult.value;
        mods = Array.isArray(v) ? v : v?.modules || [];
      }

      setModules(mods.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch {
      // page still renders with static content
    } finally {
      setLoading(false);
    }
  };

  const handleModuleAction = (mod) => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/ai-climate-resilience');
    } else {
      router.push(`/student/modules/${mod._id}`);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#f8fafc] pt-20">

        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Africa Research and Impact Network
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                  AI for Climate Resilience <span className="text-[#021d49]">Fellowship</span>
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Equipping African researchers, practitioners, and policymakers with AI and ML
                  skills to address climate change challenges across Africa and beyond.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                {[{ v: '3', l: 'Levels' }, { v: '70%', l: 'Pass Mark' }, { v: '3', l: 'Certificates' }].map(s => (
                  <div key={s.l} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-center min-w-[72px]">
                    <p className="text-lg font-black text-[#021d49]">{s.v}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

          {/* ── Programme Levels ── */}
          <section>
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Programme Structure</p>
              <h2 className="text-base font-bold text-gray-900">Fellowship Levels</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {LEVELS.map((lv) => {
                const Icon = lv.Icon;
                return (
                  <div key={lv.key} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                    {/* level tag + icon row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-full ${lv.tag}`}>
                        {lv.label}
                      </span>
                      <Icon className={`w-5 h-5 ${lv.iconColor}`} />
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2">{lv.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{lv.desc}</p>

                    {/* assessments */}
                    <div className="space-y-1 mb-4">
                      {lv.assessments.map((a, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${lv.dot}`} />
                          <p className="text-[11px] text-gray-400 leading-snug">{a}</p>
                        </div>
                      ))}
                    </div>

                    {/* certificate */}
                    <div className="pt-3 border-t border-gray-50 flex items-start gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-500 leading-snug">{lv.cert}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Mode of Study + Outcomes ── */}
          <div className="grid lg:grid-cols-2 gap-5">

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Format</p>
              <h2 className="text-sm font-bold text-gray-900 mb-4">Mode of Study</h2>
              <div className="divide-y divide-gray-50">
                {DELIVERY.map(({ Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-[11px] text-gray-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Skills</p>
              <h2 className="text-sm font-bold text-gray-900 mb-4">Learning Outcomes</h2>
              <ul className="space-y-2.5">
                {OUTCOMES.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">{o}</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* ── Course Modules ── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Curriculum</p>
                <h2 className="text-base font-bold text-gray-900">Course Modules</h2>
              </div>
              {!loading && modules.length > 0 && (
                <span className="text-xs text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full">
                  {modules.length} module{modules.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : !isLoggedIn ? (
              <div className="bg-white border border-gray-100 rounded-xl py-14 text-center">
                <div className="w-12 h-12 rounded-full bg-[#021d49]/5 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-5 h-5 text-[#021d49]/40" />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Sign in to view modules</p>
                <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
                  Your fellowship modules are ready. Sign in to access and start learning.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => router.push('/login?redirect=/ai-climate-resilience')}
                    className="px-5 py-2 bg-[#021d49] hover:bg-[#032a66] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => router.push('/register?redirect=/ai-climate-resilience')}
                    className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            ) : modules.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl py-14 text-center">
                <BookOpen className="w-9 h-9 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600 mb-1">Modules coming soon</p>
                <p className="text-xs text-gray-400">Content for the first cohort is being prepared.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((mod) => (
                  <ModuleCard
                    key={mod._id}
                    mod={mod}
                    onAction={handleModuleAction}
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── CTA ── */}
          {!isLoggedIn && (
            <section className="bg-white border border-gray-100 rounded-xl px-6 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Ready to begin your fellowship?</h3>
                <p className="text-xs text-gray-400">Sign in or create an account to access your modules.</p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => router.push('/register?redirect=/ai-climate-resilience')}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Create Account
                </button>
                <button
                  onClick={() => router.push('/login?redirect=/ai-climate-resilience')}
                  className="px-4 py-2 bg-[#021d49] hover:bg-[#032a66] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  Sign In <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          )}

        </div>
      </div>

      <Footer />
    </>
  );
}
