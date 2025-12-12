import React from 'react';
import { Lock, Star, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { canAccessFinalAssessment } from '@/lib/utils/courseProgressionLogic';

/**
 * Component to display final assessment lock status
 * Shows when student hasn't completed all modules yet
 */
export function FinalAssessmentGuard({
  course,
  enrollment,
  onClose,
}) {
  if (!enrollment || !course) return null;

  const moduleProgress = enrollment.moduleProgress || [];
  const totalModules = course.modules?.length || 0;
  const access = canAccessFinalAssessment(totalModules, moduleProgress);

  // Final assessment is accessible, don't show guard
  if (access.canAccess) {
    return null;
  }

  const completedModules = access.completedModules;
  const remainingModules = totalModules - completedModules;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-4">
          <Lock className="w-6 h-6 text-yellow-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Final Assessment Locked
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Complete all modules before taking the final assessment.
        </p>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Course Progress
          </h3>

          {/* Progress Meter */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-700">Modules Completed:</span>
              <span className="text-lg font-bold text-blue-600">
                {completedModules}/{totalModules}
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedModules / totalModules) * 100}%` }}
              />
            </div>
          </div>

          {/* Completion percentage */}
          <div className="text-center pt-3 border-t border-blue-200">
            <p className="text-sm font-semibold text-gray-700">
              {Math.round((completedModules / totalModules) * 100)}% Complete
            </p>
            <p className="text-xs text-gray-600">
              {remainingModules} module{remainingModules !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>

        {/* Modules List */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Modules to Complete:</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {course.modules?.map((module, idx) => {
              const progress = moduleProgress.find(mp => mp.moduleIndex === idx);
              const isCompleted = progress?.assessmentPassed;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg transition ${
                    isCompleted
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCompleted ? 'text-green-900' : 'text-gray-700'
                    }`}>
                      {module.title || `Module ${idx + 1}`}
                    </p>
                  </div>
                  {isCompleted && (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                      Passed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-2 mb-6">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Final Assessment:</strong> Only available after completing all course modules.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Star className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-800">
              <strong>Certificate:</strong> Earn your certificate by scoring 70% or higher on the final assessment.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          Go Back
        </button>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Keep completing modules to unlock the final assessment!
        </p>
      </div>
    </div>
  );
}

export default FinalAssessmentGuard;
