'use client';

import React, { useState } from 'react';
import {
    formatAiEvaluation,
    getConfidenceBadge,
    getPlagiarismRiskDescription,
} from '@/lib/assessment-security';

interface AiEvaluationDisplayProps {
    result: any;
    questionNumber: number;
    showPlagiarismDetails?: boolean;
}

/**
 * Component to display AI evaluation results for essay questions
 */
export function AiEvaluationDisplay({
    result,
    questionNumber,
    showPlagiarismDetails = true,
}: AiEvaluationDisplayProps) {
    const [expandDetails, setExpandDetails] = useState(false);

    if (!result.aiScore) {
        return null;
    }

    const aiData = formatAiEvaluation(result);
    const confidenceBadge = getConfidenceBadge(aiData.confidence);
    const plagiarismInfo = getPlagiarismRiskDescription(
        aiData.plagiarismRisk,
    );

    return (
        <div className="mt-6 border-l-4 border-blue-500 bg-blue-50 p-4">
            {/* Header with Score and Confidence */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h4 className="font-semibold text-gray-900">AI Evaluation</h4>
                    <p className="text-sm text-gray-600">
                        Smart analysis for Question {questionNumber}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Score Badge */}
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                            {aiData.score}
                        </div>
                        <div className="text-xs text-gray-600">Score</div>
                    </div>

                    {/* Confidence Badge */}
                    <div
                        className={`rounded-lg px-3 py-2 text-center ${confidenceBadge.color}`}
                    >
                        <div className="font-semibold">{aiData.confidence}%</div>
                        <div className="text-xs">{confidenceBadge.icon} Confidence</div>
                    </div>
                </div>
            </div>

            {/* Status Message */}
            <div className="mb-4 rounded bg-white p-3">
                <p className="font-medium text-gray-900">{confidenceBadge.message}</p>
                {aiData.status === 'requires_review' && (
                    <p className="mt-1 text-sm text-yellow-700">
                        ⏳ Your answer is being reviewed by your instructor. You'll
                        receive final feedback soon.
                    </p>
                )}
                {aiData.status === 'auto_passed' && (
                    <p className="mt-1 text-sm text-green-700">
                        ✓ Your answer meets the expected criteria!
                    </p>
                )}
                {aiData.status === 'auto_failed' && (
                    <p className="mt-1 text-sm text-red-700">
                        ✗ Your answer didn't meet the expected criteria. Review the
                        feedback below.
                    </p>
                )}
            </div>

            {/* AI Feedback */}
            <div className="mb-4 rounded bg-white p-3">
                <h5 className="font-medium text-gray-900 mb-2">AI Feedback</h5>
                <p className="text-sm text-gray-700">{aiData.feedback}</p>
            </div>

            {/* Strengths */}
            {aiData.strengths.length > 0 && (
                <div className="mb-4 rounded bg-green-50 p-3 border border-green-200">
                    <h5 className="font-medium text-green-900 mb-2">
                        ✓ Identified Strengths
                    </h5>
                    <ul className="space-y-1">
                        {aiData.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-green-800">
                                • {strength}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Areas for Improvement */}
            {aiData.weaknesses.length > 0 && (
                <div className="mb-4 rounded bg-orange-50 p-3 border border-orange-200">
                    <h5 className="font-medium text-orange-900 mb-2">
                        → Areas for Improvement
                    </h5>
                    <ul className="space-y-1">
                        {aiData.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm text-orange-800">
                                • {weakness}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Key Concepts Found */}
            {aiData.keyConceptsFound.length > 0 && (
                <div className="mb-4 rounded bg-indigo-50 p-3 border border-indigo-200">
                    <h5 className="font-medium text-indigo-900 mb-2">
                        🎯 Key Concepts Identified
                    </h5>
                    <div className="flex flex-wrap gap-2">
                        {aiData.keyConceptsFound.map((concept, i) => (
                            <span
                                key={i}
                                className="inline-block bg-indigo-200 text-indigo-900 rounded-full px-3 py-1 text-xs font-medium"
                            >
                                {concept}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Plagiarism Risk */}
            {showPlagiarismDetails && (
                <div className="mb-4 rounded bg-white p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">Plagiarism Check</h5>
                        <div className="text-right">
                            <div className={`font-bold ${plagiarismInfo.color}`}>
                                {aiData.plagiarismRisk}%
                            </div>
                            <div className={`text-xs ${plagiarismInfo.color}`}>
                                {plagiarismInfo.level}
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                        {plagiarismInfo.description}
                    </p>
                    {aiData.cheatingIndicators.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                            Indicators: {aiData.cheatingIndicators.join(', ')}
                        </div>
                    )}
                </div>
            )}

            {/* Detailed Metrics */}
            <button
                onClick={() => setExpandDetails(!expandDetails)}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-100 rounded transition-colors"
            >
                {expandDetails ? '▼' : '▶'} Detailed Metrics
            </button>

            {expandDetails && (
                <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                    {/* Semantic Match */}
                    <div className="bg-white p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">Semantic Match</div>
                        <div className="text-lg font-bold text-blue-600">
                            {aiData.semanticMatch}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${aiData.semanticMatch}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            How well your answer matches the expected content
                        </p>
                    </div>

                    {/* Content Relevance */}
                    <div className="bg-white p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">Content Relevance</div>
                        <div className="text-lg font-bold text-green-600">
                            {aiData.contentRelevance}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{ width: `${aiData.contentRelevance}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            How relevant your answer is to the question
                        </p>
                    </div>

                    {/* Confidence Score */}
                    <div className="bg-white p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">AI Confidence</div>
                        <div className="text-lg font-bold text-purple-600">
                            {aiData.confidence}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-purple-600 h-1.5 rounded-full"
                                style={{ width: `${aiData.confidence}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            How confident the AI is in this evaluation
                        </p>
                    </div>

                    {/* Plagiarism Risk */}
                    <div className="bg-white p-3 rounded">
                        <div className="text-xs text-gray-600 mb-1">Plagiarism Risk</div>
                        <div className="text-lg font-bold text-red-600">
                            {aiData.plagiarismRisk}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-red-600 h-1.5 rounded-full"
                                style={{ width: `${aiData.plagiarismRisk}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Likelihood of plagiarized content
                        </p>
                    </div>
                </div>
            )}

            {/* Evaluation Timestamp */}
            <div className="mt-4 text-xs text-gray-500 text-center">
                {aiData.evaluatedAt && (
                    <>Evaluated: {aiData.evaluatedAt}</>
                )}
            </div>

            {/* Security Notice */}
            <div className="mt-4 rounded bg-gray-100 p-2 text-xs text-gray-600">
                🔒 <strong>Privacy Notice:</strong> This evaluation was performed by
                AI and is encrypted on our secure servers. Only you and your
                instructor can view these results.
            </div>
        </div>
    );
}

/**
 * Component to display AI evaluation summary on results page
 */
export function AiEvaluationSummary({ results }: { results: any[] }) {
    const aiResults = results.filter(r => r.aiScore !== undefined);

    if (aiResults.length === 0) {
        return null;
    }

    const avgScore =
        aiResults.reduce((sum, r) => sum + r.aiScore, 0) /
        aiResults.length;
    const avgConfidence =
        aiResults.reduce((sum, r) => sum + r.aiConfidence, 0) /
        aiResults.length;
    const requiresReview = aiResults.filter(
        r => r.aiGradingStatus === 'requires_review',
    ).length;

    return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4">
                📊 AI Evaluation Summary
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded text-center">
                    <div className="text-sm text-gray-600">Average AI Score</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {avgScore.toFixed(0)}%
                    </div>
                </div>

                <div className="bg-white p-4 rounded text-center">
                    <div className="text-sm text-gray-600">Average Confidence</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {avgConfidence.toFixed(0)}%
                    </div>
                </div>

                <div className="bg-white p-4 rounded text-center">
                    <div className="text-sm text-gray-600">AI-Graded</div>
                    <div className="text-2xl font-bold text-green-600">
                        {aiResults.length}
                    </div>
                </div>

                <div className="bg-white p-4 rounded text-center">
                    <div className="text-sm text-gray-600">Pending Review</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {requiresReview}
                    </div>
                </div>
            </div>

            {requiresReview > 0 && (
                <div className="bg-yellow-100 border border-yellow-400 rounded p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>⏳ Pending Instructor Review:</strong> {requiresReview}{' '}
                        of your essay answers require manual review by your instructor.
                        Check back soon for final feedback!
                    </p>
                </div>
            )}

            <div className="mt-4 text-xs text-gray-600 text-center">
                <p>
                    🤖 This assessment was evaluated using advanced AI technology
                    combined with instructor oversight to ensure accuracy and fairness.
                </p>
            </div>
        </div>
    );
}
