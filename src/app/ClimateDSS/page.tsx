'use client';

import { BookOpen, ArrowRight, Terminal, Code2, GraduationCap, BookMarked } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

// ---------------------------------------------------------------------------
// Simple page that links out to the ARIN-DSS documentation
// Drop this in your app router as e.g. app/docs-redirect/page.jsx
// or wherever you want a "Docs" entry point to live.
// ---------------------------------------------------------------------------

const DOCS_URL = 'http://64.225.98.64/docs';

const SECTIONS = [
  {
    icon: Terminal,
    title: 'Setup',
    desc: 'Install the climate-change Python package and authenticate with Google Earth Engine.',
  },
  {
    icon: Code2,
    title: 'API reference',
    desc: 'Auth, the five analysis modules, reports, and boundary lookups  with request and response examples.',
  },
  {
    icon: GraduationCap,
    title: 'Five guided labs',
    desc: 'Step-by-step walkthroughs for drought, flood, food security, disease, and land degradation, using real study areas.',
  },
  {
    icon: BookMarked,
    title: 'Glossary',
    desc: 'Every index and acronym used across the platform, explained in plain terms.',
  },
];

const STATS = [
//   { value: '5', label: 'Analysis modules' },
  { value: '54', label: 'Countries covered' },
//   { value: '90-day', label: 'Result caching' },
  { value: 'JWT', label: 'Secured API' },
];

export default function DocsLinkPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 items-start">

            {/* Left: intro + CTA + stats */}
            <div className="lg:col-span-2">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                ARIN-DSS Documentation
              </h1>
              <p className="text-gray-500 mb-7 leading-relaxed">
                A complete implementation guide: install the package, connect
                to the API, and work through hands-on labs for drought,
                flood, food security, disease, and land degradation analysis.
              </p>

              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm mb-10"
              >
                Go to Documentation
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-7 border-t border-gray-100">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: what's inside */}
            <div className="lg:col-span-3 bg-gray-50 rounded-2xl p-8 sm:p-10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
                What's inside
              </p>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
                {SECTIONS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}