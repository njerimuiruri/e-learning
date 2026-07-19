'use client';

import { useState, useMemo } from 'react';
import { FileText, ExternalLink, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

// ---------------------------------------------------------------------------
// Page listing student presentations / project proposals, with photos,
// slide thumbnails, and pagination.
// Drop this in your app router as e.g. app/presentations/page.jsx
//
// To add a new entry, add an object to SUBMISSIONS below with:
//   name        -> student's full name
//   photoUrl    -> student's profile photo
//   topic       -> title of their presentation / proposal
//   module      -> which climate module it relates to
//   slideUrl    -> thumbnail image of their first slide / cover slide
//   docUrl      -> link to the full document (Drive, PDF, GitHub, etc.)
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 6;

const SUBMISSIONS = [
  {
    name: 'Amina Yusuf',
    photoUrl: 'https://i.pravatar.cc/150?img=47',
    topic: 'Forecasting drought severity in Marsabit using LSTM models',
    module: 'Drought Monitoring',
    slideUrl: 'https://picsum.photos/seed/drought1/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
  {
    name: 'Daniel Otieno',
    photoUrl: 'https://i.pravatar.cc/150?img=12',
    topic: 'Mapping flood susceptibility along the Niger River floodplain',
    module: 'Flood Risk',
    slideUrl: 'https://picsum.photos/seed/flood1/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
  {
    name: 'Grace Mwangi',
    photoUrl: 'https://i.pravatar.cc/150?img=32',
    topic: 'Vegetation health indices as early indicators of food insecurity',
    module: 'Food Security',
    slideUrl: 'https://picsum.photos/seed/food1/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
  {
    name: 'Samuel Achieng',
    photoUrl: 'https://i.pravatar.cc/150?img=51',
    topic: 'Climate suitability modelling for malaria risk in Kisumu County',
    module: 'Disease Surveillance',
    slideUrl: 'https://picsum.photos/seed/disease1/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
  {
    name: 'Fatima Diallo',
    photoUrl: 'https://i.pravatar.cc/150?img=25',
    topic: 'Detecting land degradation trends across northern Burkina Faso',
    module: 'Land Degradation',
    slideUrl: 'https://picsum.photos/seed/land1/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
  {
    name: 'Peter Mutua',
    photoUrl: 'https://i.pravatar.cc/150?img=15',
    topic: 'A six-month CDI forecast for pastoralist early warning in Kenya',
    module: 'Drought Monitoring',
    slideUrl: 'https://picsum.photos/seed/drought2/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
  {
    name: 'Linda Chikwanda',
    photoUrl: 'https://i.pravatar.cc/150?img=29',
    topic: 'Using SAR change detection to speed up flood response',
    module: 'Flood Risk',
    slideUrl: 'https://picsum.photos/seed/flood2/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
  {
    name: 'Ibrahim Konate',
    photoUrl: 'https://i.pravatar.cc/150?img=33',
    topic: 'NDVI trend breakpoints and restoration targeting in the Sahel',
    module: 'Land Degradation',
    slideUrl: 'https://picsum.photos/seed/land2/480/270',
    docUrl: 'https://drive.google.com/your-link-here',
  },
];

function initials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function PresentationsPage() {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(SUBMISSIONS.length / ITEMS_PER_PAGE));
  const current = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return SUBMISSIONS.slice(start, start + ITEMS_PER_PAGE);
  }, [page]);

  const goTo = (p) => {
    setPage(Math.min(Math.max(p, 1), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 sm:pt-20">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">

          {/* Header */}
          <div className="flex items-start gap-4 mb-10">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Users className="w-5.5 h-5.5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
                Student Presentations & Project Proposals
              </h1>
              <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
                Work submitted by students using the ARIN-DSS platform. Click
                a card to view the full presentation or proposal.
              </p>
            </div>
          </div>

          {/* Grid of submissions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {current.map((s) => (
              <a
                key={s.name}
                href={s.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl border border-gray-100 overflow-hidden hover:border-green-200 hover:shadow-md transition-all"
              >
                {/* Slide thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={s.slideUrl}
                    alt={`${s.name}'s first slide`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 text-xs font-medium text-green-700 bg-white/95 border border-green-100 px-2.5 py-1 rounded-full">
                    {s.module}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3 -mt-9 relative z-10">
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.name}
                        className="w-12 h-12 rounded-full border-[3px] border-white shadow-sm object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-[3px] border-white shadow-sm bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                        {initials(s.name)}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-900 pt-6">{s.name}</p>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    {s.topic}
                  </p>

                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 group-hover:text-green-800 transition-colors">
                    <FileText className="w-4 h-4" />
                    View document
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    p === page
                      ? 'bg-green-600 text-white'
                      : 'text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => goTo(page + 1)}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}