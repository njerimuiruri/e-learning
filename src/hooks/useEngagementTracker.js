'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useEngagementTracker — tracks slide viewing time + scroll depth.
 *
 * Root cause of previous bug: resetTracker() called setIsActive(true) while
 * isActive was already true, so React skipped re-running the timer useEffect
 * and the interval was never restarted after a reset.
 *
 * Fix: a timerKey counter is incremented on every reset, which forces the
 * timer useEffect to re-run regardless of isActive's current value.
 */
export function useEngagementTracker({
  minViewingTime = 15,
  scrollTrackingEnabled = false,
  onSlideComplete = null,
} = {}) {
  const containerRef = useRef(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isActive, setIsActive] = useState(true);
  // ↑ timerKey increments on every reset to force the timer effect to re-run
  const [timerKey, setTimerKey] = useState(0);

  // ── Timer (restarted whenever isActive or timerKey changes) ───────────────
  useEffect(() => {
    if (!isActive) return;

    const id = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isActive, timerKey]); // timerKey forces a fresh interval on reset

  // ── Pause timer when the browser tab loses focus ──────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => setIsActive(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ── Scroll detection ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!scrollTrackingEnabled || scrolledToBottom) return;

    const container = containerRef.current;
    if (!container) return;

    const checkWindowScroll = () => {
      const { scrollY, innerHeight } = window;
      const totalH = document.documentElement.scrollHeight;
      if ((scrollY + innerHeight) / totalH >= 0.85) setScrolledToBottom(true);
    };

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // If the container itself isn't scrollable, fall back to window scroll
      if (scrollHeight <= clientHeight + 10) {
        checkWindowScroll();
        return;
      }
      if ((scrollTop + clientHeight) / scrollHeight >= 0.9) setScrolledToBottom(true);
    };

    // Check immediately (short content auto-satisfies scroll)
    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollTrackingEnabled, scrolledToBottom]);

  // ── Auto-satisfy scroll for content that doesn't need scrolling ───────────
  useEffect(() => {
    if (!scrollTrackingEnabled || scrolledToBottom) return;
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollHeight <= container.clientHeight + 10) {
      setScrolledToBottom(true);
    }
  });

  const meetsTimeReq = timeSpent >= minViewingTime;
  const scrollReqMet = !scrollTrackingEnabled || scrolledToBottom;
  const canProceed = meetsTimeReq && scrollReqMet;

  // ── Fire onSlideComplete once when all requirements are first met ──────────
  const completedFiredRef = useRef(false);
  useEffect(() => {
    if (canProceed && !completedFiredRef.current) {
      completedFiredRef.current = true;
      onSlideComplete?.({ timeSpent, scrolledToBottom });
    }
  }, [canProceed, timeSpent, scrolledToBottom, onSlideComplete]);

  // ── Reset — call when navigating to a new slide ───────────────────────────
  const resetTracker = useCallback(() => {
    setTimeSpent(0);
    setScrolledToBottom(false);
    setIsActive(true);
    // Increment timerKey so the timer useEffect always re-runs, even if
    // isActive was already true (fixes the original "timer won't restart" bug).
    setTimerKey((k) => k + 1);
    completedFiredRef.current = false;
  }, []);

  return {
    containerRef,
    timeSpent,
    scrolledToBottom,
    meetsTimeReq,
    canProceed,
    resetTracker,
    remainingTime: Math.max(0, minViewingTime - timeSpent),
    progressPercent: Math.min(100, Math.round((timeSpent / minViewingTime) * 100)),
  };
}
