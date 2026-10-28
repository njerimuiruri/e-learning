"use client";

// ============================================================
// FACILITATOR PANEL
// ------------------------------------------------------------
// A side panel with notes for the presenter: questions to ask
// the audience, the answers, and where the data comes from.
// It slides in from the right. Press Escape or "Close" to hide.
// ============================================================

import { useEffect, useRef } from "react";
import type { LearnMoreLink } from "../types";

interface FacilitatorPanelProps {
  open: boolean;
  onClose: () => void;
  sceneTitle: string;
  notes: string[];
  dataNote?: string;
  links?: LearnMoreLink[];
}

export default function FacilitatorPanel({ open, onClose, sceneTitle, notes, dataNote, links }: FacilitatorPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="tm-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="tm-panel" role="dialog" aria-label="Notes for the facilitator">
        <div className="tm-panel-head">
          <h2>For the facilitator</h2>
          <button ref={closeRef} type="button" className="tm-button tm-button-small tm-button-secondary" onClick={onClose}>
            Close ✕
          </button>
        </div>
        <p className="tm-panel-scene">{sceneTitle}</p>
        <ul className="tm-panel-notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        {dataNote && <p className="tm-panel-data">📊 {dataNote}</p>}
        {links && links.length > 0 && (
          <div className="tm-panel-links">
            <h3>📎 Read the originals</h3>
            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="tm-panel-tip">
          Tip: press <kbd>→</kbd> for Next and <kbd>←</kbd> for Back.
        </p>
      </aside>
    </>
  );
}
