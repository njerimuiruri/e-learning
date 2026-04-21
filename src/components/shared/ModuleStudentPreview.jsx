'use client';

import React, { useState } from 'react';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';
import * as Icons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import InteractiveCodeEditor from '@/components/student/InteractiveCodeEditor';

// ─── helpers ──────────────────────────────────────────────────────────────────

function resourceHref(r) {
  const raw = typeof r === 'string' ? r : r?.url || '';
  const url = resolveAssetUrl(raw);
  const name = typeof r === 'string' ? r : r?.name || '';
  const ext = (name || url).split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf';
  const isCloudinary = url.includes('cloudinary.com');
  const href = isCloudinary && !isPdf ? url.replace('/upload/', '/upload/fl_attachment/') : url;
  return { href, isPdf, name: name || url.split('/').pop() || 'Resource' };
}

function ytEmbedUrl(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// ─── PreviewSlide ──────────────────────────────────────────────────────────────

function PreviewSlide({ slide }) {
  if (!slide) return null;

  if (slide.type === 'text') {
    return (
      <div
        className="prose prose-sm max-w-none break-words overflow-hidden
          prose-headings:break-words prose-p:break-words
          prose-table:w-full prose-td:break-words prose-th:break-words
          [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full
          [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg
          [&_pre]:overflow-x-auto [&_pre]:max-w-full
          [&_a]:break-all"
        dangerouslySetInnerHTML={{ __html: slide.content || '<p class="text-gray-400 italic">No content yet.</p>' }}
      />
    );
  }

  if (slide.type === 'image' || slide.type === 'diagram') {
    return (
      <div className="space-y-3">
        {slide.imageUrl ? (
          <div className="flex justify-center">
            <img
              src={slide.imageUrl}
              alt={slide.imageCaption || ''}
              className="max-w-full h-auto rounded-xl border border-gray-200 object-contain"
              style={{ maxHeight: '420px' }}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
            <p className="text-sm text-gray-400">No image set</p>
          </div>
        )}
        {slide.imageCaption && (
          <p className="text-sm text-center text-gray-500 italic break-words">{slide.imageCaption}</p>
        )}
        {slide.type === 'diagram' && slide.content && (
          <div
            className="border border-gray-200 rounded-xl p-4 overflow-x-auto prose prose-sm max-w-none break-words
              [&_table]:block [&_table]:overflow-x-auto [&_img]:max-w-full [&_pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: slide.content }}
          />
        )}
      </div>
    );
  }

  if (slide.type === 'video') {
    const isYT = slide.videoUrl && (slide.videoUrl.includes('youtube.com') || slide.videoUrl.includes('youtu.be'));
    const embedUrl = isYT ? ytEmbedUrl(slide.videoUrl) : null;
    return (
      <div className="space-y-2">
        {slide.videoUrl ? (
          isYT && embedUrl ? (
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 w-full">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Video" />
            </div>
          ) : (
            <video
              src={slide.videoUrl}
              controls
              className="w-full max-w-full rounded-xl border border-gray-200"
              style={{ maxHeight: '420px' }}
            />
          )
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
            <p className="text-sm text-gray-400">No video set</p>
          </div>
        )}
        {slide.videoCaption && (
          <p className="text-sm text-center text-gray-500 italic break-words">{slide.videoCaption}</p>
        )}
      </div>
    );
  }

  if (slide.type === 'codeSnippet') {
    return (
      <div className="overflow-hidden rounded-xl">
        <InteractiveCodeEditor
          language={slide.codeLanguage || 'python'}
          instructions={slide.codeInstructions || ''}
          starterCode={slide.starterCode || ''}
          expectedOutput={slide.expectedOutput || ''}
        />
      </div>
    );
  }

  return null;
}

// ─── ModuleStudentPreview ──────────────────────────────────────────────────────
// Accepts `module` — works with both the create-form shape and the API module shape.

export default function ModuleStudentPreview({ module, onClose }) {
  const [selectedLesson, setSelectedLesson] = useState(0);
  const [selectedSlide, setSelectedSlide] = useState(0);

  const lessons = module?.lessons || [];
  const lesson = lessons[selectedLesson];
  const slides = lesson?.slides || [];

  const bannerUrl = module?.bannerUrl;
  const title = module?.title || 'Untitled Module';
  const level = module?.level;
  const moduleResources = module?.moduleResources || module?.resources || [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden flex flex-col">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-sm font-medium truncate">Student Preview</span>
            <Badge className="bg-amber-900/40 text-amber-300 border-amber-700 text-xs flex-shrink-0">
              Read-only
            </Badge>
          </div>
          <Button
            variant="ghost" size="sm" onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-white/10 flex-shrink-0 ml-2"
          >
            <Icons.X className="w-4 h-4 mr-1" /> Close Preview
          </Button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Sidebar */}
          <div className="w-60 border-r bg-gray-50 flex-shrink-0 flex flex-col overflow-hidden">
            {bannerUrl && (
              <img src={bannerUrl} alt="banner" className="w-full h-20 object-cover flex-shrink-0" />
            )}
            <div className="px-4 py-3 border-b flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-900 leading-tight break-words">{title}</h2>
              {level && (
                <Badge variant="secondary" className="mt-1 text-xs capitalize">{level}</Badge>
              )}
            </div>

            {/* Module resources */}
            {moduleResources.length > 0 && (
              <div className="px-2 py-2 border-b border-gray-200 flex-shrink-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 mb-1.5">Module Resources</p>
                <div className="space-y-0.5">
                  {moduleResources.map((r, i) => {
                    const { href, isPdf, name } = resourceHref(r);
                    return (
                      <a
                        key={i} href={href} target="_blank" rel="noopener noreferrer"
                        download={!isPdf ? name : undefined}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-teal-50 text-xs text-gray-700 hover:text-teal-800 transition-colors"
                      >
                        <Icons.FileText className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                        <span className="truncate flex-1">{name}</span>
                        {isPdf
                          ? <Icons.ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          : <Icons.Download className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        }
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lesson list */}
            <div className="flex-1 overflow-y-auto p-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 mb-1">Lessons</p>
              {lessons.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-2 py-4 text-center">No lessons yet</p>
              ) : lessons.map((l, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedLesson(i); setSelectedSlide(0); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    selectedLesson === i ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                      selectedLesson === i ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>{i + 1}</span>
                    <span className="text-xs font-medium truncate">{l.title || `Lesson ${i + 1}`}</span>
                  </div>
                  {selectedLesson === i && (l.slides || []).length > 0 && (
                    <p className="text-[10px] mt-0.5 pl-7 text-blue-200">
                      {(l.slides || []).length} slides
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {!lesson ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Icons.BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm">No lessons to preview.</p>
                  <p className="text-xs mt-1">Add lessons first.</p>
                </div>
              </div>
            ) : (
              <div className="min-w-0">

                {/* Lesson header */}
                <div className="px-6 py-5 border-b bg-white">
                  <h1 className="text-xl font-bold text-gray-900 break-words">
                    {lesson.title || `Lesson ${selectedLesson + 1}`}
                  </h1>
                  {lesson.description && lesson.description !== '<p><br></p>' && (
                    <div
                      className="prose prose-sm max-w-none mt-3 text-gray-600 break-words overflow-hidden
                        [&_img]:max-w-full [&_table]:block [&_table]:overflow-x-auto [&_pre]:overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: lesson.description }}
                    />
                  )}
                  {(lesson.learningOutcomes || []).length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Learning Outcomes
                      </p>
                      <ul className="space-y-1">
                        {lesson.learningOutcomes.map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <Icons.CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Slides */}
                {slides.length > 0 ? (
                  <div>
                    {/* Slide nav */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setSelectedSlide(s => Math.max(0, s - 1))}
                        disabled={selectedSlide === 0}
                        className="gap-1.5"
                      >
                        <Icons.ArrowLeft className="w-4 h-4" /> Prev
                      </Button>

                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        {slides.map((_, si) => (
                          <button
                            key={si}
                            onClick={() => setSelectedSlide(si)}
                            className={`rounded-full transition-all ${
                              selectedSlide === si
                                ? 'w-6 h-2.5 bg-blue-600'
                                : 'w-2.5 h-2.5 bg-gray-300 hover:bg-blue-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                          {selectedSlide + 1} / {slides.length}
                        </span>
                      </div>

                      <Button
                        variant="outline" size="sm"
                        onClick={() => setSelectedSlide(s => Math.min(slides.length - 1, s + 1))}
                        disabled={selectedSlide >= slides.length - 1}
                        className="gap-1.5"
                      >
                        Next <Icons.ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Slide content — overflow-safe wrapper */}
                    <div className="px-6 py-6 min-h-[280px] overflow-hidden min-w-0">
                      <PreviewSlide slide={slides[selectedSlide] || slides[0]} />
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center text-gray-400">
                    <Icons.Layers className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm">No slides in this lesson yet.</p>
                  </div>
                )}

                {/* Lesson resources */}
                {(lesson.lessonResources || lesson.resources || []).length > 0 && (
                  <div className="mx-6 mb-4 border border-teal-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-teal-50 border-b border-teal-100">
                      <Icons.Link className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-teal-800">Lesson Resources</span>
                    </div>
                    <div className="divide-y divide-teal-50">
                      {(lesson.lessonResources || lesson.resources || []).map((r, i) => {
                        const { href, isPdf, name } = resourceHref(r);
                        return (
                          <div key={i} className="flex items-center gap-3 px-4 py-3 min-w-0">
                            <Icons.FileText className="w-4 h-4 text-teal-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                              {r.description && (
                                <p className="text-xs text-gray-500 break-words">{r.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {r.fileType && (
                                <Badge variant="secondary" className="text-xs">{r.fileType}</Badge>
                              )}
                              {href && (
                                <a
                                  href={href} target="_blank" rel="noopener noreferrer"
                                  download={!isPdf ? name : undefined}
                                  className="text-teal-500 hover:text-teal-700"
                                >
                                  {isPdf
                                    ? <Icons.ExternalLink className="w-3.5 h-3.5" />
                                    : <Icons.Download className="w-3.5 h-3.5" />
                                  }
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quiz preview */}
                {(lesson.assessmentQuiz || []).length > 0 && (
                  <div className="mx-6 mb-8 border border-purple-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border-b border-purple-100">
                      <Icons.HelpCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-purple-800">
                        Lesson Quiz — {lesson.assessmentQuiz.length} question{lesson.assessmentQuiz.length !== 1 ? 's' : ''}
                      </span>
                      <Badge className="ml-auto bg-purple-100 text-purple-700 border-0 text-xs flex-shrink-0">
                        Pass: {lesson.quizPassingScore ?? 70}%
                      </Badge>
                    </div>
                    <div className="p-4 space-y-4 overflow-hidden">
                      {lesson.assessmentQuiz.map((q, qi) => (
                        <div key={qi} className="space-y-2">
                          <p className="text-sm font-medium text-gray-800 break-words">
                            <span className="text-purple-600 mr-1">Q{qi + 1}.</span> {q.question}
                          </p>
                          {q.type === 'multiple-choice' && (
                            <div className="space-y-1 ml-5">
                              {(q.options || []).map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                  <span className="text-sm text-gray-600 break-words">{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === 'true-false' && (
                            <div className="flex gap-4 ml-5 flex-wrap">
                              {['True', 'False'].map(opt => (
                                <div key={opt} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                  <span className="text-sm text-gray-600">{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
