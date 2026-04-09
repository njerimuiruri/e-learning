'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import draftService from '@/lib/api/draftService';

const LS_PREFIX = 'arinlms_draft_';

/**
 * useDraft — DB-first autosave with localStorage fallback.
 *
 * Status values:
 *   'idle'        — no unsaved changes yet
 *   'unsaved'     — changes detected, save pending
 *   'saving'      — save in progress
 *   'saved'       — successfully saved to server (DB)
 *   'local_only'  — saved to localStorage only (DB failed — not visible on other devices)
 *   'error'       — save failed everywhere
 */
export function useDraft(draftKey, data, {
  enabled    = true,
  delay      = 2000,
  contentType = 'module',
  entityId,
  title,
} = {}) {
  const [status, setStatus]           = useState('idle');
  const [savedAt, setSavedAt]         = useState(null);
  const [hasDraft, setHasDraft]       = useState(false);
  const [loadedDraft, setLoadedDraft] = useState(null);

  const timerRef  = useRef(null);
  const dataRef   = useRef(data);
  const isFirst   = useRef(true);
  const lsKey     = `${LS_PREFIX}${draftKey}`;

  // Keep ref in sync
  useEffect(() => { dataRef.current = data; });

  // ── On mount: load from DB → fallback to localStorage ────────────────────
  useEffect(() => {
    if (!enabled || !draftKey) return;
    let cancelled = false;

    (async () => {
      // DB first
      try {
        const res = await draftService.get(draftKey);
        if (!cancelled && res?.data) {
          const ts = new Date(res.data.lastSavedAt).getTime();
          setLoadedDraft({ data: res.data.data, savedAt: ts });
          setHasDraft(true);
          setSavedAt(ts);
          setStatus('saved');
          return;
        }
      } catch { /* not authenticated or no draft */ }

      // localStorage fallback
      if (!cancelled) {
        try {
          const raw = localStorage.getItem(lsKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            setLoadedDraft(parsed);
            setHasDraft(true);
            setSavedAt(parsed.savedAt);
            setStatus('saved');
          }
        } catch {}
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, enabled]);

  // ── Serialize for change detection ───────────────────────────────────────
  const serialized = useMemo(() => {
    try { return JSON.stringify(data); } catch { return ''; }
  }, [data]);

  // ── Debounced autosave ───────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !draftKey) return;
    if (isFirst.current) { isFirst.current = false; return; }

    setStatus('unsaved');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { performSave(); }, delay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, draftKey, enabled, delay]);

  // ── Core save logic ──────────────────────────────────────────────────────
  const performSave = useCallback(async () => {
    const snapshot = dataRef.current;
    setStatus('saving');

    // Always write to localStorage first (instant, offline-safe)
    const lsPayload = { data: snapshot, savedAt: Date.now() };
    let lsOk = false;
    try {
      localStorage.setItem(lsKey, JSON.stringify(lsPayload));
      lsOk = true;
    } catch {}

    // Sync to DB
    try {
      await draftService.save(draftKey, {
        contentType,
        data: snapshot,
        entityId,
        title: title || (snapshot?.title) || (snapshot?.moduleData?.title) || 'Untitled',
      });
      setSavedAt(Date.now());
      setHasDraft(true);
      setStatus('saved');
    } catch {
      if (lsOk) {
        // localStorage only — warn the instructor this is device-specific
        setSavedAt(Date.now());
        setHasDraft(true);
        setStatus('local_only');
      } else {
        setStatus('error');
      }
    }
  }, [draftKey, contentType, entityId, title, lsKey]);

  // ── Public API ───────────────────────────────────────────────────────────

  /** Manual save — cancels any pending timer and saves immediately */
  const saveDraft = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await performSave();
  }, [performSave]);

  /** Discard draft from both DB and localStorage */
  const discardDraft = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try { localStorage.removeItem(lsKey); } catch {}
    try { await draftService.discard(draftKey); } catch {}
    setSavedAt(null);
    setHasDraft(false);
    setLoadedDraft(null);
    setStatus('idle');
  }, [draftKey, lsKey]);

  /** Get the loaded draft snapshot (from DB or localStorage) */
  const getDraft = useCallback(() => loadedDraft, [loadedDraft]);

  /** Human-readable label for the last save time */
  const savedAgoLabel = useMemo(() => {
    if (!savedAt) return null;
    const diff = Math.floor((Date.now() - savedAt) / 1000);
    if (diff < 10)  return 'Saved just now';
    if (diff < 60)  return `Saved ${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60)  return `Saved ${mins}m ago`;
    return `Saved ${Math.floor(mins / 60)}h ago`;
  }, [savedAt]);

  return {
    status,        // 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
    hasDraft,
    loadedDraft,
    getDraft,
    saveDraft,
    discardDraft,
    savedAt,
    savedAgoLabel,
  };
}
