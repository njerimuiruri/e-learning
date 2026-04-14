'use client';

import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle2, Trophy, BookOpen, ArrowRight } from 'lucide-react';
import { getLessonRequirements, canAccessLesson } from '@/lib/utils/lessonProgressionLogic';

/**
 * LessonAccessGuard
 * Component to display and enforce lesson access rules
 * Prevents students from accessing lessons before completing prerequisites
 */
export function LessonAccessGuard({
    lessonIndex,
    lesson,
    enrollment,
    module,
    onClose,
    onProceed,
}) {
    const [showGuard, setShowGuard] = useState(false);

    useEffect(() => {
        const canAccess = canAccessLesson(lessonIndex, enrollment, module);
        setShowGuard(!canAccess && lessonIndex > 0);
    }, [lessonIndex, enrollment, module]);

    if (!showGuard) return null;

    const requirements = getLessonRequirements(lessonIndex, module, enrollment);
    const previousLesson = module?.lessons?.[lessonIndex - 1];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                    <Lock className="w-6 h-6 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    Lesson Locked
                </h2>
                <p className="text-gray-600 text-center mb-6">
                    This lesson is not yet available.
                </p>

                {/* Requirements */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-orange-900 mb-2">
                                To unlock this lesson:
                            </h3>

                            {/* Previous lesson info */}
                            <div className="mb-3 p-2 bg-white rounded border border-orange-100">
                                <p className="text-sm text-orange-800 mb-2">
                                    You must complete:{' '}
                                    <strong>{previousLesson?.title || `Lesson ${lessonIndex}`}</strong>
                                </p>
                            </div>

                            {/* Requirements list */}
                            <ul className="space-y-2">
                                {requirements.requirements.map((req, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-orange-800 text-sm">
                                        <span className="text-orange-600 mt-1">•</span>
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <strong>Sequential Learning:</strong> Lessons must be completed in order to
                            ensure proper understanding.
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                            <strong>Automatic Unlock:</strong> Once you complete the previous lesson,
                            this lesson will unlock automatically.
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => onProceed?.(lessonIndex - 1)}
                        className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
                    >
                        Go to Previous Lesson
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
