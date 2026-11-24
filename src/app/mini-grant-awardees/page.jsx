'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X, Trophy, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import { aiAwardees } from '@/data/ai-awardees';
import { AwardeeTile, AwardeeModal } from '@/components/awardees/Awardees';

const countries = new Set(aiAwardees.map((a) => a.country).filter(Boolean)).size;

export default function MiniGrantAwardeesPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  // Open an awardee directly when arriving from a preview tile (#ai-award-3 etc.)
  useEffect(() => {
    const id = window.location.hash.slice(1);
    const match = id && aiAwardees.find((a) => a.id === id);
    if (match) setSelected(match);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aiAwardees;
    return aiAwardees.filter((a) =>
      [a.name, a.country, a.theme, a.position, a.institution, a.projectTitle].some((v) => v && v.toLowerCase().includes(q)),
    );
  }, [query]);

  const close = () => {
    setSelected(null);
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f8fafc] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/ai-climate-resilience" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#021d49] mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> AI for Climate Resilience
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-gray-200 pb-5 mb-6">
            <div>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-1 inline-flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Mini-Grant Awardees
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">AI for Climate Resilience Awardees</h1>
              <p className="text-sm text-gray-500 mt-1">
                {aiAwardees.length} awardees across {countries} countries applying AI and machine learning to climate resilience challenges in Africa
              </p>
            </div>
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, project, or country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-[#021d49] focus:ring-2 focus:ring-[#021d49]/10 text-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map((a) => (
                <AwardeeTile key={a.id} awardee={a} onOpen={setSelected} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-base font-semibold text-gray-700 mb-2">No awardees match your search</p>
              <button onClick={() => setQuery('')} className="text-sm text-[#021d49] font-semibold hover:underline">Clear search</button>
            </div>
          )}
        </div>
      </div>
      <AwardeeModal awardee={selected} onClose={close} />
      <Footer />
    </>
  );
}
