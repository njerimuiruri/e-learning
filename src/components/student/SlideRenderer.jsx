'use client';

import React from 'react';
import InteractiveCodeEditor from './InteractiveCodeEditor';

/**
 * SlideRenderer — renders a single slide.
 * Supported types: text | image | video | diagram | codeSnippet
 * Accepts darkMode prop for full theme support.
 */
export default function SlideRenderer({ slide, slideNumber, totalSlides, sectionTitle = '', darkMode = false }) {
  if (!slide) return null;
  const { type } = slide;

  const dm = darkMode; // shorthand

  return (
    <div className="w-full h-full flex flex-col">
      <RichContentStyles darkMode={dm} />

      {/* ── Section title ────────────────────────────────────────────────── */}
      {sectionTitle && (
        <div className={`flex items-center gap-3 px-5 pt-4 pb-2 flex-shrink-0`}>
          <div className="flex-shrink-0 w-1 h-6 rounded-full bg-green-500" />
          <h2 className={`text-base font-bold leading-tight ${dm ? 'text-white' : 'text-gray-900'}`}>{sectionTitle}</h2>
        </div>
      )}

      {/* ── TEXT SLIDE ─────────────────────────────────────────────────────── */}
      {type === 'text' && (
        <div className={`flex-1 flex flex-col overflow-hidden rounded-xl mx-3 my-3 border shadow-sm ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 border-b ${dm ? 'border-gray-700 bg-gray-800/80' : 'border-gray-100 bg-gray-50'}`}>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <svg className={`w-4 h-4 ${dm ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${dm ? 'text-green-400' : 'text-green-600'}`}>Reading</span>
              <p className={`text-xs mt-0.5 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{slideNumber} of {totalSlides}</p>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div
              className={`slide-rich-content prose prose-base max-w-none break-words
                prose-headings:font-bold prose-headings:text-left prose-headings:mt-5 prose-headings:mb-2
                prose-p:leading-[1.85] prose-p:text-justify prose-p:mb-3
                prose-li:leading-relaxed prose-li:text-justify
                prose-ul:my-3 prose-ol:my-3
                prose-a:no-underline hover:prose-a:underline
                ${dm
                  ? 'prose-invert prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-green-400'
                  : 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-green-600'
                }`}
              dangerouslySetInnerHTML={{ __html: slide.content || '' }}
            />
          </div>
        </div>
      )}

      {/* ── IMAGE SLIDE ────────────────────────────────────────────────────── */}
      {type === 'image' && (
        <div className={`flex-1 flex flex-col overflow-hidden rounded-xl mx-3 my-3 border shadow-sm ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 border-b ${dm ? 'border-gray-700 bg-gray-800/80' : 'border-gray-100 bg-gray-50'}`}>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
              <svg className={`w-4 h-4 ${dm ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${dm ? 'text-emerald-400' : 'text-emerald-600'}`}>Visual</span>
              <p className={`text-xs mt-0.5 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{slideNumber} of {totalSlides}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center gap-4">
            {slide.imageUrl ? (
              <>
                <img
                  src={slide.imageUrl}
                  alt={slide.imageCaption || 'Slide image'}
                  className={`max-w-full mx-auto rounded-xl shadow-md object-contain max-h-[420px] ${dm ? 'border border-gray-700' : 'border border-gray-100'}`}
                />
                {slide.imageCaption && (
                  <p className={`text-sm italic text-center ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{slide.imageCaption}</p>
                )}
              </>
            ) : (
              <div className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${dm ? 'border-gray-600 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">No image provided</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIDEO SLIDE ────────────────────────────────────────────────────── */}
      {type === 'video' && (
        <div className={`flex-1 flex flex-col overflow-hidden rounded-xl mx-3 my-3 border shadow-sm ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 border-b ${dm ? 'border-gray-700 bg-gray-800/80' : 'border-gray-100 bg-gray-50'}`}>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <svg className={`w-4 h-4 ${dm ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${dm ? 'text-purple-400' : 'text-purple-600'}`}>Video</span>
              <p className={`text-xs mt-0.5 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{slideNumber} of {totalSlides}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 justify-center">
            {slide.videoUrl ? (
              <>
                <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-black" style={{ paddingTop: '56.25%' }}>
                  {isYouTube(slide.videoUrl) ? (
                    <iframe
                      src={toYouTubeEmbed(slide.videoUrl)}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={slide.videoCaption || 'Video'}
                    />
                  ) : (
                    <video src={slide.videoUrl} controls className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
                {slide.videoCaption && (
                  <p className={`text-sm italic text-center ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{slide.videoCaption}</p>
                )}
              </>
            ) : (
              <div className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${dm ? 'border-gray-600 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">No video provided</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DIAGRAM SLIDE ──────────────────────────────────────────────────── */}
      {type === 'diagram' && (
        <div className={`flex-1 flex flex-col overflow-hidden rounded-xl mx-3 my-3 border shadow-sm ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 border-b ${dm ? 'border-gray-700 bg-gray-800/80' : 'border-gray-100 bg-gray-50'}`}>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
              <svg className={`w-4 h-4 ${dm ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </span>
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${dm ? 'text-amber-400' : 'text-amber-600'}`}>Diagram</span>
              <p className={`text-xs mt-0.5 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{slideNumber} of {totalSlides}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {slide.imageUrl && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={slide.imageUrl}
                  alt={slide.imageCaption || 'Diagram'}
                  className={`max-w-full mx-auto rounded-xl shadow-sm object-contain max-h-[420px] ${dm ? 'border border-gray-700' : 'border border-amber-100'}`}
                />
                {slide.imageCaption && (
                  <p className={`text-sm italic text-center ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{slide.imageCaption}</p>
                )}
              </div>
            )}
            {slide.content && (
              <div className={`rounded-xl border p-4 overflow-x-auto ${dm ? 'bg-gray-700/50 border-gray-600' : 'bg-amber-50 border-amber-100'}`}>
                <div
                  className={`slide-rich-content text-justify prose max-w-none ${dm ? 'prose-invert text-gray-300' : 'text-gray-800'}`}
                  dangerouslySetInnerHTML={{ __html: slide.content }}
                />
              </div>
            )}
            {!slide.content && !slide.imageUrl && (
              <div className={`w-full h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-sm ${dm ? 'border-gray-600 text-gray-500' : 'border-amber-200 text-amber-400'}`}>
                No diagram content
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CODE SNIPPET SLIDE ─────────────────────────────────────────────── */}
      {type === 'codeSnippet' && (
        <div className="flex-1 flex flex-col overflow-hidden rounded-xl mx-3 my-3 border border-gray-700 bg-gray-950 shadow-lg">
          <div className="flex-shrink-0 flex items-center gap-2.5 px-5 py-3 border-b border-gray-800">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
              <span className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
            </div>
            <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center ml-1 flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-green-400">Interactive Code</span>
              <p className="text-xs text-gray-500 mt-0.5">{slideNumber} of {totalSlides}</p>
            </div>
            <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg font-mono">
              {slide.codeLanguage || slide.language || 'python'}
            </span>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <InteractiveCodeEditor
              language={slide.codeLanguage || slide.language || 'python'}
              instructions={slide.codeInstructions || slide.instructions || ''}
              starterCode={slide.starterCode || ''}
              expectedOutput={slide.expectedOutput || ''}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared rich-content styles ────────────────────────────────────────────────
function RichContentStyles({ darkMode }) {
  return (
    <style jsx global>{`
      .slide-rich-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 0.75rem 0;
        font-size: 13px;
      }
      .slide-rich-content table th,
      .slide-rich-content table td {
        border: 1px solid ${darkMode ? '#374151' : '#d1d5db'};
        padding: 8px 12px;
        text-align: left;
        word-break: break-word;
      }
      .slide-rich-content table th {
        background: ${darkMode ? '#1f2937' : '#f3f4f6'};
        font-weight: 600;
        color: ${darkMode ? '#e5e7eb' : '#374151'};
      }
      .slide-rich-content table tr:nth-child(even) td {
        background: ${darkMode ? '#111827' : '#f9fafb'};
      }
      .slide-rich-content table tr:hover td {
        background: ${darkMode ? '#1f2937' : '#f0fdf4'};
      }
      .slide-rich-content p,
      .slide-rich-content li {
        text-align: justify;
        hyphens: auto;
      }
      .slide-rich-content h1,
      .slide-rich-content h2,
      .slide-rich-content h3,
      .slide-rich-content h4 {
        text-align: left;
      }
    `}</style>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}

function toYouTubeEmbed(url) {
  const match =
    url.match(/youtu\.be\/([^?&]+)/) ||
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtube\.com\/embed\/([^?&]+)/);
  const id = match?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : url;
}
