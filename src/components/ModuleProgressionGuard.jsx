import React from 'react';
import { Lock, AlertCircle, CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
import { canAccessModule, getModuleUnlockRequirements } from '@/lib/utils/courseProgressionLogic';

/**
 * Component to display module lock status and progression requirements
 * Shows a modal when a student tries to access a locked module
 */
export function ModuleProgressionGuard({
  moduleIndex,
  modules,
  enrollment,
  onClose,
  onProceed,
}) {
  if (!enrollment) return null;

  const moduleProgress = enrollment.moduleProgress || [];
  const access = canAccessModule(moduleIndex, moduleProgress);
  const requirements = getModuleUnlockRequirements(moduleIndex, modules, moduleProgress);

  // Module is accessible, don't show guard
  if (access.canAccess) {
    return null;
  }

  const previousModule = modules[moduleIndex - 1];
  const previousProgress = moduleProgress.find(mp => mp.moduleIndex === moduleIndex - 1);
  const remainingAttempts = previousProgress ? Math.max(0, 3 - previousProgress.assessmentAttempts) : 3;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <Lock className="w-6 h-6 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Module Locked
        </h2>
        <p className="text-gray-600 text-center mb-6">
          This module is not yet available.
        </p>

        {/* Requirements */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">To unlock this module:</h3>
              <p className="text-orange-800 text-sm mb-3">
                You must pass the assessment in <strong>{previousModule?.title || `Module ${moduleIndex}`}</strong>
              </p>

              {/* Attempt Status */}
              {previousProgress && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-700">Assessment Attempts:</span>
                    <span className="font-semibold text-orange-900">
                      {previousProgress.assessmentAttempts}/3
                    </span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${(previousProgress.assessmentAttempts / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-orange-700 text-xs">
                    {remainingAttempts > 0
                      ? `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`
                      : 'No attempts remaining. Course must be restarted.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Course Structure:</strong> You must complete each module's assessment before moving to the next one.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <strong>Once passed:</strong> The next module will automatically unlock.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Back
          </button>
          {previousProgress && remainingAttempts > 0 && (
            <button
              onClick={onProceed}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2"
            >
              Go to Previous Module
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Complete the previous module assessment to unlock this module.
        </p>
      </div>
    </div>
  );
}

export default ModuleProgressionGuard;
