'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as Icons from 'lucide-react';
import authService from '@/lib/api/authService';

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#021d49',
  '#1e40af', '#FFEAA7', '#DDA0DD', '#FF9A3C', '#98D8C8',
];

function Confetti({ active }) {
  const particles = useMemo(() => (
    Array.from({ length: 70 }, (_, i) => ({
      left: `${((i * 13) % 100)}%`,
      backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      width: `${7 + (i % 5) * 2}px`,
      height: `${7 + (i % 4) * 2}px`,
      borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
      animationDelay: `${((i * 0.08) % 2.5).toFixed(2)}s`,
      animationDuration: `${(2.8 + (i % 6) * 0.35).toFixed(2)}s`,
      opacity: 0,
    }))
  ), []);

  if (!active) return null;

  return (
    <>
      <style>{`
        @keyframes cf-fall {
          0%   { transform: translateY(-10px) rotate(0deg)   scale(1);   opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg) scale(0.4); opacity: 0; }
        }
        .cf-particle { animation: cf-fall linear forwards; position: absolute; pointer-events: none; }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
        {particles.map((style, i) => (
          <span key={i} className="cf-particle" style={style} />
        ))}
      </div>
    </>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, passed }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 1200;
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(score * ease));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke={passed ? '#dcfce7' : '#fee2e2'} strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke={passed ? '#16a34a' : '#dc2626'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - displayed / 100)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-black tabular-nums ${passed ? 'text-green-700' : 'text-red-600'}`}>
          {displayed}%
        </span>
        <span className={`text-xs font-semibold mt-0.5 ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? 'PASSED' : 'FAILED'}
        </span>
      </div>
    </div>
  );
}

// ── Attempt pips ──────────────────────────────────────────────────────────────
function AttemptPips({ used, max }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            i < used
              ? 'bg-red-400 border-red-400'
              : 'bg-transparent border-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function QuizResultsModal({
  isOpen,
  result,
  passingScore,
  maxAttempts,
  onContinue,
  onRetry,
  onReturnToLesson,
  darkMode = false,
  confirming = false,
}) {
  const [visible, setVisible] = useState(false);
  const userName = useMemo(() => {
    try {
      const u = authService.getCurrentUser();
      if (!u) return null;
      const combined = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      return combined || u.fullName || null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // small delay so the CSS transition fires
      const id = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(id);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const passed            = result?.passed ?? false;
  const score             = result?.score ?? 0;
  const remainingAttempts = result?.remainingAttempts ?? 0;
  const lessonResetRequired = result?.lessonResetRequired ?? false;
  const attemptsUsed      = maxAttempts
    ? maxAttempts - (passed ? 0 : remainingAttempts)
    : 1;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Confetti active={passed && visible} />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[900] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[901] flex items-center justify-center p-4">
        <div
          className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden
            transform transition-all duration-300
            ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
            ${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}
        >
          {/* ── Top colour band ── */}
          <div
            className={`px-8 pt-10 pb-8 text-center ${
              passed
                ? 'bg-gradient-to-b from-green-50 to-white'
                : 'bg-gradient-to-b from-red-50 to-white'
            } ${darkMode ? (passed ? '!from-green-950 !to-gray-900' : '!from-red-950 !to-gray-900') : ''}`}
          >
            {/* Icon badge */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg ${
                passed
                  ? 'bg-gradient-to-br from-green-400 to-green-600'
                  : 'bg-gradient-to-br from-red-400 to-red-600'
              }`}
            >
              {passed
                ? <Icons.Trophy className="w-10 h-10 text-white" />
                : <Icons.RefreshCcw className="w-10 h-10 text-white" />}
            </div>

            {/* Headline */}
            {passed ? (
              <div>
                <h2 className="text-2xl font-black text-green-700 mb-1">
                  You passed! 🎉
                </h2>
                {userName && (
                  <p className="text-base font-semibold text-green-600 mb-1">
                    Congratulations, {userName}!
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Excellent work on this lesson quiz.
                </p>
              </div>
            ) : (
              <div>
                <h2 className={`text-2xl font-black mb-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {lessonResetRequired ? 'All attempts used' : 'Not quite yet'}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {lessonResetRequired
                    ? 'Please review the lesson before trying again.'
                    : `You need ${passingScore}% to pass.`}
                </p>
              </div>
            )}

            {/* Score ring */}
            <div className="mt-6">
              <ScoreRing score={score} passed={passed} />
            </div>

            {/* Pass mark */}
            <p className={`mt-3 text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pass mark: <span className="font-bold">{passingScore ?? 70}%</span>
            </p>
          </div>

          {/* ── Body ── */}
          <div className={`px-8 pb-8 space-y-5 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>

            {/* Score breakdown */}
            {result?.breakdown && (
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Score breakdown
                </p>
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-2xl font-black text-green-600">{result.breakdown.correct}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Correct</p>
                  </div>
                  <div className={`w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div>
                    <p className="text-2xl font-black text-red-500">{result.breakdown.incorrect}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incorrect</p>
                  </div>
                  <div className={`w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  <div>
                    <p className={`text-2xl font-black ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {(result.breakdown.correct ?? 0) + (result.breakdown.incorrect ?? 0)}
                    </p>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                  </div>
                </div>
              </div>
            )}

            {/* Attempts info */}
            {!passed && !lessonResetRequired && maxAttempts && (
              <div className={`flex items-center justify-between rounded-xl p-4 ${
                darkMode ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'
              }`}>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                    💪 Keep going! {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} left
                  </p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-400/70' : 'text-amber-700'}`}>
                    You need {passingScore}% to pass this quiz
                  </p>
                </div>
                <AttemptPips used={attemptsUsed} max={maxAttempts} />
              </div>
            )}

            {lessonResetRequired && (
              <div className={`flex items-start gap-3 rounded-xl p-4 ${
                darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <Icons.AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                <div>
                  <p className={`font-semibold text-sm ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                    Lesson reset required
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    You've used all {maxAttempts} attempts. Please go through the lesson again before retrying the quiz.
                  </p>
                </div>
              </div>
            )}

            {/* Saving indicator */}
            {confirming && (
              <div className={`flex items-center gap-2 text-xs px-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                <Icons.Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span>Saving result…</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {passed && (
                <button
                  onClick={onContinue}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#021d49] hover:bg-[#032a66] active:bg-[#043080] text-white font-bold transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <Icons.ChevronRight className="w-5 h-5" />
                  Continue to Next Lesson
                </button>
              )}

              {!passed && !lessonResetRequired && (
                <button
                  onClick={onRetry}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#021d49] hover:bg-[#032a66] text-white font-bold transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <Icons.RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              )}

              {lessonResetRequired && (
                <button
                  onClick={onReturnToLesson}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#021d49] hover:bg-[#032a66] text-white font-bold transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <Icons.BookOpen className="w-4 h-4" />
                  Restart Lesson
                </button>
              )}

              {!passed && (
                <button
                  onClick={onReturnToLesson}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all border ${
                    darkMode
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Review Lesson
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
