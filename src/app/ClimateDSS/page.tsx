'use client';

import {
  BookOpen, ArrowRight, Terminal, Code2, GraduationCap, BookMarked,
  Github, CloudRain, Droplets, Wheat, Bug, Mountain,
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

// ---------------------------------------------------------------------------
// Simple page that links out to the ARIN-DSS documentation and training labs
// Drop this in your app router as e.g. app/docs-redirect/page.jsx
// or wherever you want a "Docs" entry point to live.
// ---------------------------------------------------------------------------

const DOCS_URL = 'http://64.225.98.64/docs';
const LABS_REPO_URL = 'https://github.com/Odero54/climate-change/tree/main/training-labs';
const LABS_BLOB_BASE = 'https://github.com/Odero54/climate-change/blob/main/training-labs';

const SECTIONS = [
  {
    icon: Terminal,
    title: 'Setup',
    desc: 'Install the package and authenticate with Earth Engine.',
  },
  {
    icon: Code2,
    title: 'API reference',
    desc: 'Auth, analysis modules, reports, and boundary lookups.',
  },
  {
    icon: GraduationCap,
    title: 'Five guided labs',
    desc: 'Walkthroughs for each climate risk module, with real data.',
  },
  {
    icon: BookMarked,
    title: 'Glossary',
    desc: 'Every index and acronym, explained in plain terms.',
  },
];

const STATS = [
  { value: '54', label: 'Countries covered' },
  { value: 'JWT', label: 'Secured API' },
];

const LABS = [
  {
    file: '01_drought_monitoring.ipynb',
    icon: CloudRain,
    title: 'Drought Monitoring',
    desc: 'CDI and a 6-month LSTM forecast for Marsabit, Kenya.',
  },
  {
    file: '02_flood_risk.ipynb',
    icon: Droplets,
    title: 'Flood Risk',
    desc: 'Susceptibility mapping for the Niger River floodplain.',
  },
  {
    file: '03_food_security.ipynb',
    icon: Wheat,
    title: 'Food Security',
    desc: 'VCI/TCI stress scoring for Marsabit County.',
  },
  {
    file: '04_disease_surveillance.ipynb',
    icon: Bug,
    title: 'Disease Surveillance',
    desc: 'Climate suitability for outbreaks in Kisumu County.',
  },
  {
    file: '05_land_degradation.ipynb',
    icon: Mountain,
    title: 'Land Degradation',
    desc: 'NDVI trend and breakpoints in Burkina Faso.',
  },
];

export default function DocsLinkPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-14 sm:pt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">

          {/* Header row: intro + CTA + stats, all in one compact band */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10 pb-6 mb-6 border-b border-gray-100">
            <div className="flex items-start gap-4 lg:flex-1">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-5.5 h-5.5 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                  ARIN-DSS Documentation
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
                  Install the package, connect to the API, and work through hands-on labs for drought, flood, food security, disease, and land degradation analysis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 shrink-0 pl-0 lg:pl-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-lg font-bold text-gray-900 leading-none">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's inside — compact single row on desktop */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {SECTIONS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
                  <p className="text-xs text-gray-500 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Training notebooks */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Training notebooks
              </p>
              <a
                href={LABS_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors shrink-0"
              >
                <Github className="w-3.5 h-3.5" />
                View repo
              </a>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {LABS.map(({ file, icon: Icon, title, desc }, i) => (
                <a
                  key={file}
                  href={`${LABS_BLOB_BASE}/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col p-3.5 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors">
                      <Icon className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="text-xs font-mono text-gray-300">0{i + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
                  <p className="text-xs text-gray-500 leading-snug mb-2">{desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 mt-auto">
                    Open
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Closing CTA */}
          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <p className="text-sm text-gray-500">
              Ready to get started? The docs walk you through setup, the API, and every lab in detail.
            </p>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              Go to Documentation
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}