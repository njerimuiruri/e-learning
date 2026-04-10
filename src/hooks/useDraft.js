'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import draftService from '@/lib/api/draftService';

/**
 * Recursively strip base64 data URIs from any string values.
 * Prevents draft payloads from bloating when images are pasted into Quill.
 */
function stripBase64(value) {
  if (typeof value === 'string') {
    return value.replace(/src="data:[^"]{0,10000000}"/g, 'src=""');
  }
  if (Array.isArray(value)) return value.map(stripBase64);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = stripBase64(value[k]);
    return out;
  }
  return value;
}

/**
 * useDraft — DB-only autosave. No localStorage.
 * Drafts always save to the server so they load on any device.
 *
 * Status values:
 *   'idle'    — no unsaved changes yet
 *   'unsaved' — changes detected, save pending
 *   'saving'  — save in progress
 *   'saved'   — successfully saved to DB
 *   'error'   — DB save failed
 *
 * The `entityId` option is reactive — if you pass a new value (e.g. after a
 * module is created), the next autosave will include it and it will be stored
 * in the DB draft so it can be retrieved on any device via `loadedEntityId`.
 */
export function useDraft(draftKey, data, {
  enabled     = true,
  delay       = 2000,
  contentType = 'module',
  entityId,          // reactive — pass setState value; updated each render via ref
  title,
} = {}) {
  const [status, setStatus]               = useState('idle');
  const [savedAt, setSavedAt]             = useState(null);
  const [hasDraft, setHasDraft]           = useState(false);
  const [loadedDraft, setLoadedDraft]     = useState(null);
  const [loadedEntityId, setLoadedEntityId] = useState(null); // entityId from DB draft
  const [dbError, setDbError]             = useState(null);

  const timerRef    = useRef(null);
  const dataRef     = useRef(data);
  const entityIdRef = useRef(entityId);  // always holds the latest entityId
  const isFirst     = useRef(true);

  // Keep refs in sync with latest values every render
  useEffect(() => { dataRef.current = data; });
  useEffect(() => { entityIdRef.current = entityId; }, [entityId]);

  // ── On mount: load draft from DB, migrate old localStorage data if needed ──
  useEffect(() => {
    if (!enabled || !draftKey) return;
    let cancelled = false;
    const lsKey = `arinlms_draft_${draftKey}`;

    (async () => {
      // 1. Try DB first
      try {
        const res = await draftService.get(draftKey);
        if (!cancelled && res?.data) {
          const ts = new Date(res.data.lastSavedAt).getTime();
          setLoadedDraft({ data: res.data.data, savedAt: ts });
          setHasDraft(true);
          setSavedAt(ts);
          setStatus('saved');
          if (res.data.entityId) setLoadedEntityId(res.data.entityId);
          // DB has data — clean up any stale localStorage entry
          try { localStorage.removeItem(lsKey); } catch {}
          return;
        }
      } catch (err) {
        const httpStatus = err?.response?.status;
        if (httpStatus !== 404) {
          const msg = err?.response?.data?.message || err?.message || 'Unknown';
          console.warn(`[useDraft] Could not load draft from DB (${httpStatus ?? 'network'}):`, msg);
        }
      }

      // 2. DB had nothing (404) — check for old localStorage data to migrate
      if (cancelled) return;
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(lsKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.data) {
            console.info(`[useDraft] Migrating localStorage draft "${draftKey}" → DB`);
            // Save to DB so it's accessible from any device going forward.
            // Strip base64 images first — they cause 413 errors.
            const resolvedTitle =
              (typeof parsed.data?.title === 'string' ? parsed.data.title : null) ||
              (typeof parsed.data?.moduleData?.title === 'string' ? parsed.data.moduleData.title : null) ||
              'Untitled';
            try {
              await draftService.save(draftKey, {
                contentType: contentType || 'module',
                data: stripBase64(parsed.data),
                title: resolvedTitle,
              });
              localStorage.removeItem(lsKey); // remove after successful migration
              console.info(`[useDraft] Migration complete — localStorage draft removed`);
            } catch (saveErr) {
              console.warn(`[useDraft] Migration to DB failed, keeping localStorage copy`, saveErr);
            }
            if (!cancelled) {
              setLoadedDraft(parsed);
              setHasDraft(true);
              setSavedAt(parsed.savedAt || Date.now());
              setStatus('saved');
            }
          }
        }
      } catch { /* ignore localStorage parse errors */ }
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

  // ── Core save logic (DB only) ────────────────────────────────────────────
  const performSave = useCallback(async () => {
    const snapshot  = dataRef.current;
    const currentEntityId = entityIdRef.current; // always use latest value
    setStatus('saving');

    const resolvedTitle =
      title ||
      (typeof snapshot?.title === 'string' ? snapshot.title : null) ||
      (typeof snapshot?.moduleData?.title === 'string' ? snapshot.moduleData.title : null) ||
      'Untitled';

    // Strip base64 images before sending — uploaded images should be URLs
    const safeData = stripBase64(snapshot);

    try {
      await draftService.save(draftKey, {
        contentType,
        data: safeData,
        entityId: currentEntityId ? String(currentEntityId) : undefined,
        title: String(resolvedTitle),
      });
      setSavedAt(Date.now());
      setHasDraft(true);
      setStatus('saved');
      setDbError(null);
      // Keep loadedEntityId in sync so callers always get the latest
      if (currentEntityId) setLoadedEntityId(String(currentEntityId));
    } catch (err) {
      const httpStatus = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      console.error(`[useDraft] DB save failed (${httpStatus ?? 'network'}):`, msg, err);

      const reason =
        httpStatus === 401 ? 'Session expired — please log in again.'
        : httpStatus === 413 ? 'Draft too large — images may need to be re-uploaded.'
        : httpStatus       ? `Server error (${httpStatus}) — please try again.`
        :                    'Cannot reach server — check your connection.';

      setDbError(reason);
      setStatus('error');
    }
  }, [draftKey, contentType, title]); // entityId is read from ref — no dep needed

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Manual save — cancels pending timer and saves immediately.
   * Pass `overrideEntityId` to immediately associate this draft with an entity
   * (e.g. a newly created module ID) without waiting for a React re-render.
   */
  const saveDraft = useCallback(async (overrideEntityId) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (overrideEntityId !== undefined) entityIdRef.current = overrideEntityId;
    await performSave();
  }, [performSave]);

  /** Discard draft from DB */
  const discardDraft = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try { await draftService.discard(draftKey); } catch {}
    setSavedAt(null);
    setHasDraft(false);
    setLoadedDraft(null);
    setLoadedEntityId(null);
    setStatus('idle');
    setDbError(null);
  }, [draftKey]);

  /** Get the loaded draft snapshot */
  const getDraft = useCallback(() => loadedDraft, [loadedDraft]);

  /** Human-readable label for last save time */
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
    status,          // 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
    hasDraft,
    loadedDraft,
    loadedEntityId,  // entityId restored from DB draft (e.g. the module ID on another device)
    getDraft,
    saveDraft,
    discardDraft,
    savedAt,
    savedAgoLabel,
    dbError,         // human-readable error reason (null when last save succeeded)
  };
}
