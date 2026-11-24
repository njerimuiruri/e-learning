'use client';

import Link from 'next/link';
import { Award, Trophy, Building2, MapPin, Briefcase, X, ArrowRight } from 'lucide-react';
import { aiAwardees } from '@/data/ai-awardees';

const initials = (name = '') =>
  name.replace(/^(Dr\.|Prof\.)\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export function AwardeePhoto({ awardee, className = '' }) {
  if (awardee.image) {
    return <img src={awardee.image} alt={awardee.name || 'Awardee'} className={`object-cover object-top ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-amber-600 font-bold ${className}`}>
      {awardee.name ? initials(awardee.name) : <Award className="w-1/3 h-1/3" />}
    </div>
  );
}

// Photo-first card: large headshot, name, role and awarded project
export function AwardeeTile({ awardee, onOpen, compact = false }) {
  // Render as a plain div when wrapped in a link (no click handler)
  const Tag = onOpen ? 'button' : 'div';
  return (
    <Tag
      {...(onOpen ? { type: 'button', onClick: () => onOpen(awardee) } : {})}
      className="group w-full h-full text-left bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
        <AwardeePhoto awardee={awardee} className="w-full h-full text-4xl group-hover:scale-105 transition-transform duration-500" />
        {awardee.country && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/95 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow">
            <MapPin className="w-3 h-3 text-[#039e8e]" /> {awardee.country}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-10 pb-3">
          <p className="text-white font-bold leading-tight">{awardee.name}</p>
          <p className="text-white/80 text-xs truncate">{awardee.position}</p>
        </div>
      </div>
      {!compact && (
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-gray-400 line-clamp-1 mb-2">{awardee.institution}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Awarded Project</p>
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-3 mb-3">{awardee.projectTitle}</p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[#021d49] group-hover:gap-2.5 transition-all">
            View profile <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}
    </Tag>
  );
}

export function AwardeeModal({ awardee, onClose }) {
  if (!awardee) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:w-2/5 h-72 sm:h-auto shrink-0 bg-gray-100">
          <AwardeePhoto awardee={awardee} className="w-full h-full text-6xl" />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative p-6 border-b border-gray-100">
            <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
              <Trophy className="w-3 h-3" /> AI for Climate Resilience · Mini-Grant Awardee
            </p>
            <h3 className="text-xl font-bold text-gray-900 leading-tight pr-10">{awardee.name}</h3>
            {awardee.theme && (
              <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                {awardee.theme}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Awarded Project</p>
              <p className="text-sm font-bold text-gray-900 leading-snug">{awardee.projectTitle}</p>
            </div>
            <div className="space-y-2.5">
              {[
                { Icon: Briefcase, value: awardee.position },
                { Icon: Building2, value: awardee.institution },
                { Icon: MapPin, value: awardee.country },
              ].filter((r) => r.value).map(({ Icon, value }) => (
                <div key={value} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
            {awardee.overview && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Project Overview</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{awardee.overview}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview strip of awardee photos with a link to the full awardees page
export function AwardeesPreview({ limit = 4, className = '' }) {
  if (aiAwardees.length === 0) return null;
  const shown = aiAwardees.slice(0, limit);
  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-1 inline-flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Mini-Grant Awardees
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">AI for Climate Resilience Awardees</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            {aiAwardees.length} fellows awarded mini-grants to apply AI and machine learning to climate resilience challenges across Africa.
          </p>
        </div>
        <Link
          href="/mini-grant-awardees"
          className="shrink-0 inline-flex items-center gap-2 bg-[#021d49] hover:bg-[#032a66] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors"
        >
          See all mini-grant awardees <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {shown.map((a) => (
          <Link key={a.id} href={`/mini-grant-awardees#${a.id}`} className="block">
            <AwardeeTile awardee={a} compact />
          </Link>
        ))}
      </div>
    </div>
  );
}
