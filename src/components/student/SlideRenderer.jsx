'use client';

import React from 'react';
import InteractiveCodeEditor from './InteractiveCodeEditor';

/**
 * SlideRenderer — renders a single slide with type-specific visual design.
 * Supported types: text | image | video | diagram | codeSnippet
 */
export default function SlideRenderer({ slide, slideNumber, totalSlides, sectionTitle = '' }) {
  if (!slide) return null;
  const { type } = slide;

  return (
    <div className="w-full space-y-3">
      <RichContentStyles />

      {/* ── Section title banner ─────────────────────────────────────────── */}
      {sectionTitle && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-shrink-0 w-1 h-7 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">{sectionTitle}</h2>
        </div>
      )}

      {/* ── TEXT SLIDE ─────────────────────────────────────────────────────── */}
      {type === 'text' && (
        <div className="relative rounded-xl overflow-hidden border border-blue-100 bg-white shadow-sm">
          {/* Accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400" />
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-blue-50">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Reading</span>
                <p className="text-xs text-gray-400 mt-0.5">{slideNumber} of {totalSlides}</p>
              </div>
            </div>
            <SlideProgress current={slideNumber} total={totalSlides} color="blue" />
          </div>
          {/* Content */}
          <div className="px-6 py-5 overflow-x-hidden">
            <div className="overflow-x-auto">
              <div
                className="slide-rich-content prose prose-gray prose-base max-w-none break-words text-justify
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:text-left prose-headings:mt-5 prose-headings:mb-2
                  prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:text-justify prose-p:mb-3
                  prose-li:text-gray-700 prose-li:leading-relaxed
                  prose-ul:my-3 prose-ol:my-3
                  prose-strong:text-gray-900
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: slide.content || '' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE SLIDE ────────────────────────────────────────────────────── */}
      {type === 'image' && (
        <div className="relative rounded-xl overflow-hidden border border-emerald-100 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400" />
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-emerald-50">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Visual</span>
                <p className="text-xs text-gray-400 mt-0.5">{slideNumber} of {totalSlides}</p>
              </div>
            </div>
            <SlideProgress current={slideNumber} total={totalSlides} color="emerald" />
          </div>
          <div className="p-6">
            {slide.imageUrl ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative group w-full">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
                  <img
                    src={slide.imageUrl}
                    alt={slide.imageCaption || 'Slide image'}
                    className="max-w-full mx-auto rounded-xl shadow-md object-contain max-h-[460px] border border-gray-100"
                  />
                </div>
                {slide.imageCaption && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                    <span className="w-4 h-0.5 bg-emerald-300 rounded" />
                    {slide.imageCaption}
                    <span className="w-4 h-0.5 bg-emerald-300 rounded" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="relative rounded-xl overflow-hidden border border-purple-100 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-400" />
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-purple-50">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Video</span>
                <p className="text-xs text-gray-400 mt-0.5">{slideNumber} of {totalSlides}</p>
              </div>
            </div>
            <SlideProgress current={slideNumber} total={totalSlides} color="purple" />
          </div>
          <div className="p-6">
            {slide.videoUrl ? (
              <div className="flex flex-col gap-4">
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
                    <video
                      src={slide.videoUrl}
                      controls
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
                {slide.videoCaption && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 italic justify-center">
                    <span className="w-4 h-0.5 bg-purple-300 rounded" />
                    {slide.videoCaption}
                    <span className="w-4 h-0.5 bg-purple-300 rounded" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="relative rounded-xl overflow-hidden border border-amber-100 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400" />
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-amber-50">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Diagram</span>
                <p className="text-xs text-gray-400 mt-0.5">{slideNumber} of {totalSlides}</p>
              </div>
            </div>
            <SlideProgress current={slideNumber} total={totalSlides} color="amber" />
          </div>
          <div className="p-6 space-y-4">
            {/* Uploaded / pasted image */}
            {slide.imageUrl && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={slide.imageUrl}
                  alt={slide.imageCaption || 'Diagram'}
                  className="max-w-full mx-auto rounded-xl shadow-sm border border-amber-100 object-contain max-h-[460px]"
                />
                {slide.imageCaption && (
                  <p className="text-sm text-gray-500 italic text-center">{slide.imageCaption}</p>
                )}
              </div>
            )}
            {/* Embedded SVG / HTML */}
            {slide.content && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 overflow-x-auto">
                <div
                  className="slide-rich-content text-gray-800 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: slide.content }}
                />
              </div>
            )}
            {!slide.content && !slide.imageUrl && (
              <div className="w-full h-32 bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl flex items-center justify-center text-amber-400 text-sm">
                No diagram content
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CODE SNIPPET SLIDE ─────────────────────────────────────────────── */}
      {type === 'codeSnippet' && (
        <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-950 shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-green-500 via-teal-400 to-green-400" />
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                <span className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
              </div>
              <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center ml-1">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-green-400">Interactive Code</span>
                <p className="text-xs text-gray-500 mt-0.5">{slideNumber} of {totalSlides}</p>
              </div>
            </div>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg font-mono">
              {slide.codeLanguage || slide.language || 'python'}
            </span>
          </div>
          <div className="p-4">
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

// ── Shared rich-content styles (tables, etc.) ─────────────────────────────────
function RichContentStyles() {
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
        border: 1px solid #d1d5db;
        padding: 8px 12px;
        text-align: left;
        word-break: break-word;
      }
      .slide-rich-content table th {
        background: #f3f4f6;
        font-weight: 600;
        color: #374151;
      }
      .slide-rich-content table tr:nth-child(even) td {
        background: #f9fafb;
      }
      .slide-rich-content table tr:hover td {
        background: #eff6ff;
      }
    `}</style>
  );
}

// ── Slide progress pip row ────────────────────────────────────────────────────
function SlideProgress({ current, total, color }) {
  if (total <= 1) return null;
  const colorMap = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };
  const dotColor = colorMap[color] || 'bg-gray-400';
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all ${
            i === current - 1
              ? `${dotColor} w-4 h-2`
              : i < current - 1
              ? `${dotColor} opacity-50 w-2 h-2`
              : 'bg-gray-200 w-2 h-2'
          }`}
        />
      ))}
    </div>
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
