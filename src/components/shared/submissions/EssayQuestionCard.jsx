'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

const ALIGNMENT_CONFIG = {
    yes: { label: 'Addresses requirements', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'CheckCircle2' },
    partial: { label: 'Partially addresses requirements', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'AlertCircle' },
    no: { label: 'Does not address requirements', className: 'bg-red-50 text-red-700 border-red-200', icon: 'XCircle' },
};

/**
 * Renders one essay question + answer with a "Full Essay" / "AI Insights" tab
 * switch. `questionIndex` must be the result's stable `questionIndex` field
 * (its position within finalAssessmentResults / finalAssessment.questions),
 * not a position within any filtered subset.
 */
export default function EssayQuestionCard({ result, enrollmentId, onInsightsUpdate }) {
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const insights = result.aiInsights;
    const questionIndex = result.questionIndex;

    const fetchInsights = async (regenerate = false) => {
        setLoading(true);
        try {
            const res = await moduleEnrollmentService.getEssayAiAnalysis(enrollmentId, questionIndex, regenerate);
            onInsightsUpdate(questionIndex, res.data);
        } catch (err) {
            onInsightsUpdate(questionIndex, {
                generationStatus: 'failed',
                generationError: err?.response?.data?.message || 'Failed to generate AI insights',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (value) => {
        if (value === 'insights' && !insights && !loading) {
            fetchInsights(false);
        }
    };

    const alignment = ALIGNMENT_CONFIG[insights?.addressesRequirements] || ALIGNMENT_CONFIG.partial;
    const AlignIcon = Icons[alignment.icon];

    return (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-xs font-semibold text-violet-600 mb-1">Essay Q{questionIndex + 1}</p>
            <p className="text-sm font-medium text-gray-800 mb-3">{result.questionText}</p>

            <Tabs defaultValue="essay" onValueChange={handleTabChange}>
                <TabsList className="h-8 mb-3">
                    <TabsTrigger value="essay" className="text-xs px-3">Full Essay</TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs px-3 gap-1.5">
                        <Icons.Sparkles className="w-3 h-3" /> AI Insights
                    </TabsTrigger>
                </TabsList>

                {/* ── Full Essay ── */}
                <TabsContent value="essay" className="mt-0">
                    <div className="bg-white rounded-lg border border-violet-100 p-3">
                        <p className="text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Student's Answer</p>
                        {result.submissionType === 'pdf' ? (
                            result.studentAnswer ? (
                                <a href={resolveAssetUrl(result.studentAnswer)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900 underline">
                                    <Icons.FileDown className="w-4 h-4" /> View submitted PDF
                                </a>
                            ) : (
                                <p className="text-sm text-gray-400 italic">(no file submitted)</p>
                            )
                        ) : (
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result.studentAnswer || '(no answer provided)'}</p>
                        )}
                    </div>
                    {result.instructorFeedback && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            <p className="text-xs text-emerald-700 font-semibold mb-1 uppercase tracking-wide">Instructor Feedback</p>
                            <p className="text-sm text-emerald-800 leading-relaxed">{result.instructorFeedback}</p>
                        </div>
                    )}
                </TabsContent>

                {/* ── AI Insights ── */}
                <TabsContent value="insights" className="mt-0">
                    {result.submissionType === 'pdf' ? (
                        <div className="bg-white rounded-lg border border-violet-100 p-4 text-center">
                            <Icons.FileWarning className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">AI insights aren't available for PDF submissions yet.</p>
                        </div>
                    ) : loading ? (
                        <div className="bg-white rounded-lg border border-violet-100 p-4 space-y-2.5">
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                        </div>
                    ) : !insights ? (
                        <div className="bg-white rounded-lg border border-violet-100 p-4 text-center">
                            <Icons.Sparkles className="w-6 h-6 text-violet-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">AI insights will appear here.</p>
                        </div>
                    ) : insights.generationStatus === 'failed' ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-xs text-red-700 font-semibold mb-1">Couldn't generate AI insights</p>
                            <p className="text-xs text-red-600 mb-3">{insights.generationError || 'Something went wrong.'}</p>
                            <button
                                onClick={() => fetchInsights(true)}
                                className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1.5"
                            >
                                <Icons.RefreshCw className="w-3.5 h-3.5" /> Try again
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Stat row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white rounded-lg border border-violet-100 p-2.5 text-center">
                                    <p className="text-[10px] text-gray-400 mb-0.5">Word Count</p>
                                    <p className="text-sm font-bold text-gray-900">{insights.wordCount ?? '—'}</p>
                                </div>
                                <div className="bg-white rounded-lg border border-violet-100 p-2.5 text-center">
                                    <p className="text-[10px] text-gray-400 mb-0.5">Reading Time</p>
                                    <p className="text-sm font-bold text-gray-900">{insights.readingTimeMinutes ? `${insights.readingTimeMinutes} min` : '—'}</p>
                                </div>
                                <button
                                    onClick={() => fetchInsights(true)}
                                    className="bg-white rounded-lg border border-violet-100 p-2.5 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-violet-600 hover:border-violet-300 transition-colors"
                                    title="Regenerate"
                                >
                                    <Icons.RefreshCw className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-semibold">Regenerate</span>
                                </button>
                            </div>

                            {/* Requirement alignment */}
                            {insights.addressesRequirements && (
                                <div className={`rounded-lg border p-2.5 ${alignment.className}`}>
                                    <p className="text-xs font-bold flex items-center gap-1.5">
                                        {AlignIcon && <AlignIcon className="w-3.5 h-3.5" />}
                                        {alignment.label}
                                    </p>
                                    {insights.addressesRequirementsRationale && (
                                        <p className="text-xs mt-1 opacity-90">{insights.addressesRequirementsRationale}</p>
                                    )}
                                </div>
                            )}

                            {/* Summary */}
                            {insights.summary && (
                                <div className="bg-white rounded-lg border border-violet-100 p-3">
                                    <p className="text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Summary</p>
                                    <p className="text-sm text-gray-800 leading-relaxed">{insights.summary}</p>
                                </div>
                            )}

                            {/* Key Takeaways */}
                            {insights.keyTakeaways?.length > 0 && (
                                <div className="bg-white rounded-lg border border-violet-100 p-3">
                                    <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Key Takeaways</p>
                                    <ul className="space-y-1.5">
                                        {insights.keyTakeaways.map((t, i) => (
                                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                                                <Icons.CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Main Points */}
                            {insights.mainPoints?.length > 0 && (
                                <div className="bg-white rounded-lg border border-violet-100 p-3">
                                    <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Main Points &amp; Arguments</p>
                                    <ul className="space-y-1.5">
                                        {insights.mainPoints.map((t, i) => (
                                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                                                {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Themes + Keywords */}
                            {(insights.keyThemes?.length > 0 || insights.suggestedKeywords?.length > 0) && (
                                <div className="bg-white rounded-lg border border-violet-100 p-3 space-y-2.5">
                                    {insights.keyThemes?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Key Themes</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {insights.keyThemes.map((t, i) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">{t}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {insights.suggestedKeywords?.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Suggested Keywords</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {insights.suggestedKeywords.map((t, i) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">{t}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Improvement Suggestions (collapsible) */}
                            {insights.improvementSuggestions?.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setShowSuggestions(v => !v)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-amber-700 uppercase tracking-wide"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Icons.Lightbulb className="w-3.5 h-3.5" /> Improvement Suggestions
                                        </span>
                                        <Icons.ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showSuggestions && (
                                        <ul className="px-3 pb-3 space-y-1.5">
                                            {insights.improvementSuggestions.map((t, i) => (
                                                <li key={i} className="flex items-start gap-1.5 text-sm text-amber-800">
                                                    <Icons.ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <p className="text-[10px] text-gray-400 text-right">
                                Generated {timeAgo(insights.generatedAt)}
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
