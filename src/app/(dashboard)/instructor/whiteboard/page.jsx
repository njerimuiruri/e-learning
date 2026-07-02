'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import * as Icons from 'lucide-react';
import ProtectedInstructorRoute from '@/components/ProtectedInstructorRoute';
import whiteboardService from '@/lib/api/whiteboardService';
import categoryService from '@/lib/api/categoryService';

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];
const STROKE_SIZES = [2, 4, 8, 14];
const FONT_SIZES = [14, 18, 24, 32, 48];

// ─── Text overlay layer ───────────────────────────────────────────────────────
function TextLayer({ texts, onUpdate, onDelete, activeTextId, setActiveTextId, tool, pendingEditId, onPendingEditCleared }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  // Auto-open edit mode for a freshly placed text element
  useEffect(() => {
    if (!pendingEditId) return;
    const el = texts.find((t) => t.id === pendingEditId);
    if (el) {
      setEditingId(pendingEditId);
      setEditValue('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
      }, 40);
      onPendingEditCleared();
    }
  }, [pendingEditId, texts]);

  const commitEdit = () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      onUpdate(editingId, { text: trimmed });
    } else {
      onDelete(editingId);
    }
    setEditingId(null);
    setEditValue('');
  };

  const startEdit = (el) => {
    setEditingId(el.id);
    setEditValue(el.text);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  return (
    <>
      {texts.map((el) => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            transform: 'translate(-0%, -50%)',
            zIndex: 10,
            cursor: tool === 'text' ? 'text' : 'default',
            userSelect: editingId === el.id ? 'text' : 'none',
          }}
          onDoubleClick={() => tool === 'text' && startEdit(el)}
          onClick={(e) => {
            e.stopPropagation();
            setActiveTextId(el.id);
          }}
        >
          {editingId === el.id ? (
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                // Auto-grow height as lines increase
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); commitEdit(); }
                // Enter commits, Shift+Enter adds a new line
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
              }}
              placeholder="Type here… (Enter to place, Shift+Enter for new line)"
              style={{
                color: el.color,
                fontSize: el.fontSize,
                fontWeight: el.bold ? 'bold' : 'normal',
                fontFamily: 'inherit',
                lineHeight: 1.4,
                minWidth: '320px',
                maxWidth: '70vw',
                width: '320px',
                background: 'rgba(255,255,255,0.92)',
                border: '2px dashed #10b981',
                borderRadius: '6px',
                padding: '6px 10px',
                outline: 'none',
                resize: 'horizontal',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              rows={1}
            />
          ) : (
            <span
              style={{
                color: el.color,
                fontSize: el.fontSize,
                fontWeight: el.bold ? 'bold' : 'normal',
                whiteSpace: 'pre-wrap',
                display: 'block',
                lineHeight: 1.3,
              }}
              className={activeTextId === el.id && tool === 'text' ? 'outline-dashed outline-2 outline-emerald-400 outline-offset-2 rounded' : ''}
            >
              {el.text}
            </span>
          )}

          {/* Delete button shown when this text is active */}
          {activeTextId === el.id && tool === 'text' && editingId !== el.id && (
            <button
              onMouseDown={(e) => { e.preventDefault(); onDelete(el.id); setActiveTextId(null); }}
              className="absolute -top-5 -right-5 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center shadow"
            >
              <Icons.X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </>
  );
}

// ─── Whiteboard toolbar + canvas ─────────────────────────────────────────────
function WhiteboardCanvas({
  canvasRef,
  tool, setTool,
  color, setColor,
  strokeWidth, setStrokeWidth,
  fontSize, setFontSize,
  bold, setBold,
  textElements, setTextElements,
  bgColor, setBgColor,
}) {
  const containerRef = useRef(null);
  const [activeTextId, setActiveTextId] = useState(null);
  const [pendingEditId, setPendingEditId] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();
  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setTextElements([]);
  };

  const handleCanvasAreaClick = (e) => {
    if (tool !== 'text') {
      setActiveTextId(null);
      return;
    }
    // Existing text elements call e.stopPropagation(), so this only fires on empty canvas area
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newEl = { id: `txt_${Date.now()}`, x, y, text: '', color, fontSize, bold };
    setTextElements((prev) => [...prev, newEl]);
    setActiveTextId(newEl.id);
    setPendingEditId(newEl.id);
  };

  const updateText = (id, patch) => {
    setTextElements((prev) => prev.map((el) => el.id === id ? { ...el, ...patch } : el));
  };

  const deleteText = (id) => {
    setTextElements((prev) => prev.filter((el) => el.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">

        {/* Tool selector */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setTool('pen')}
            title="Pen"
            className={`p-1.5 rounded-md transition-colors ${tool === 'pen' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Icons.Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            title="Eraser"
            className={`p-1.5 rounded-md transition-colors ${tool === 'eraser' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Icons.Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('text')}
            title="Text tool  click canvas to place text"
            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${tool === 'text' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Icons.Type className="w-4 h-4" />
            <span className="text-xs font-medium">Text</span>
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
              title={c}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-emerald-500 scale-110' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Stroke / font size  contextual */}
        {tool === 'text' ? (
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setFontSize(s)}
                title={`${s}px`}
                className={`px-2 h-7 rounded-md text-xs font-semibold transition-colors ${fontSize === s ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {s}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => setBold((b) => !b)}
              title="Bold"
              className={`w-7 h-7 rounded-md font-bold text-sm transition-colors ${bold ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              B
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            {STROKE_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setStrokeWidth(s)}
                title={`${s}px`}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${strokeWidth === s ? 'bg-emerald-100' : 'hover:bg-gray-100'}`}
              >
                <span className="rounded-full bg-gray-800" style={{ width: Math.min(s * 2, 18), height: Math.min(s * 2, 18) }} />
              </button>
            ))}
          </div>
        )}

        {/* Background */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
          {['#ffffff', '#fef9c3', '#f0fdf4', '#eff6ff'].map((bg) => (
            <button
              key={bg}
              onClick={() => setBgColor(bg)}
              title="Background color"
              className={`w-6 h-6 rounded border-2 ${bgColor === bg ? 'border-emerald-500' : 'border-gray-300'}`}
              style={{ backgroundColor: bg }}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <button onClick={handleUndo} title="Undo" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
          <Icons.Undo2 className="w-4 h-4" />
        </button>
        <button onClick={handleRedo} title="Redo" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
          <Icons.Redo2 className="w-4 h-4" />
        </button>
        <button onClick={handleClear} title="Clear everything on this page" className="p-1.5 rounded-md hover:bg-red-50 text-red-500">
          <Icons.Trash2 className="w-4 h-4" />
        </button>

        {tool === 'text' && (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-medium ml-1">
            Click anywhere on canvas to place text · Double-click text to edit
          </span>
        )}
      </div>

      {/* Canvas + text overlay */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-gray-100 overflow-hidden"
        style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}
        onClick={handleCanvasAreaClick}
      >
        {/* Drawing canvas  disable pointer events when text tool is active so clicks pass through */}
        <div style={{ pointerEvents: tool === 'text' ? 'none' : 'auto', width: '100%', height: '100%' }}>
          {mounted && (
            <ReactSketchCanvas
              ref={canvasRef}
              strokeColor={tool === 'eraser' ? bgColor : color}
              strokeWidth={tool === 'eraser' ? strokeWidth * 4 : strokeWidth}
              eraserWidth={strokeWidth * 4}
              canvasColor={bgColor}
              style={{ width: '100%', height: '100%', border: 'none' }}
              withTimestamp={false}
            />
          )}
        </div>

        {/* Text overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full" style={{ pointerEvents: tool === 'text' ? 'auto' : 'none' }}>
            <TextLayer
              texts={textElements}
              onUpdate={updateText}
              onDelete={deleteText}
              activeTextId={activeTextId}
              setActiveTextId={setActiveTextId}
              tool={tool}
              pendingEditId={pendingEditId}
              onPendingEditCleared={() => setPendingEditId(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Read-only preview modal (same experience as students) ───────────────────
function WhiteboardPreview({ whiteboard, onClose }) {
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([[]]);
  const [textLayers, setTextLayers] = useState([[]]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const load = async () => {
      try {
        const full = await whiteboardService.getById(whiteboard._id);
        const wbPages = full.pages?.length ? full.pages : [[]];
        const wbTexts = full.textLayers?.length ? full.textLayers : wbPages.map(() => []);
        setPages(wbPages);
        setTextLayers(wbTexts);
      } catch {
        setLoading(false);
      }
    };
    load();
  }, [whiteboard._id]);

  // Load paths into canvas only after canvas is mounted and data is ready
  useEffect(() => {
    if (!mounted || !canvasRef.current || pages[0] === undefined) return;
    const loadPaths = async () => {
      await canvasRef.current?.clearCanvas();
      if (pages[0]?.length > 0) await canvasRef.current?.loadPaths(pages[0]);
      setLoading(false);
    };
    setTimeout(loadPaths, 50);
  }, [mounted, pages]);

  const goToPage = async (idx) => {
    if (idx === currentPage || !canvasRef.current) return;
    setCurrentPage(idx);
    await canvasRef.current.clearCanvas();
    setTimeout(async () => {
      if (pages[idx]?.length > 0) await canvasRef.current?.loadPaths(pages[idx]);
    }, 50);
  };

  const currentTexts = textLayers[currentPage] || [];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900">{whiteboard.title}</h2>
          <p className="text-xs text-emerald-600 font-medium">Preview (read-only · as seen by students)</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Icons.X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 bg-gray-100 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {mounted && (
          <ReactSketchCanvas
            ref={canvasRef}
            strokeColor="transparent"
            strokeWidth={0}
            canvasColor="#ffffff"
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
            withTimestamp={false}
          />
        )}
        <div className="absolute inset-0 pointer-events-none">
          {currentTexts.map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: 'translate(0, -50%)',
                color: el.color,
                fontSize: el.fontSize,
                fontWeight: el.bold ? 'bold' : 'normal',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.3,
                zIndex: 10,
                userSelect: 'none',
              }}
            >
              {el.text}
            </div>
          ))}
        </div>
      </div>

      {pages.length > 1 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-center gap-2 shrink-0">
          <button onClick={() => currentPage > 0 && goToPage(currentPage - 1)} disabled={currentPage === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
            <Icons.ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          {pages.map((_, idx) => (
            <button key={idx} onClick={() => goToPage(idx)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${idx === currentPage ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {idx + 1}
            </button>
          ))}
          <button onClick={() => currentPage < pages.length - 1 && goToPage(currentPage + 1)} disabled={currentPage === pages.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
            <Icons.ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-400 ml-1">Page {currentPage + 1} of {pages.length}</span>
        </div>
      )}
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────
function DeleteConfirm({ whiteboard, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Icons.Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Whiteboard?</h3>
        <p className="text-sm text-gray-500 text-center mb-1">
          <span className="font-semibold text-gray-700">"{whiteboard.title}"</span>
        </p>
        <p className="text-xs text-gray-400 text-center mb-5">
          This will also remove it from students who can currently see it.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2">
            <Icons.Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────
function ShareModal({ whiteboard, categories, onClose, onShared }) {
  const [selected, setSelected] = useState(
    whiteboard?.sharedWith?.map((c) => c._id || c) || []
  );
  const [saving, setSaving] = useState(false);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleShare = async () => {
    setSaving(true);
    try {
      await whiteboardService.share(whiteboard._id, selected);
      onShared(selected);
      onClose();
    } catch {
      alert('Failed to update sharing settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Share Whiteboard</h3>
              <p className="text-sm text-gray-500 mt-0.5">Select categories that can view this whiteboard</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <Icons.X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No categories found</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((cat) => {
                const checked = selected.includes(cat._id);
                return (
                  <label
                    key={cat._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(cat._id)} className="w-4 h-4 accent-emerald-600" />
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Icons.Tag className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium text-white disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Share2 className="w-4 h-4" />}
            {selected.length === 0 ? 'Unshare' : `Share with ${selected.length} categor${selected.length === 1 ? 'y' : 'ies'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────
function WhiteboardEditorContent() {
  const canvasRef = useRef(null);

  const [whiteboards, setWhiteboards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeWb, setActiveWb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleInput, setTitleInput] = useState('Untitled Whiteboard');

  // Drawing paths per page
  const [pages, setPages] = useState([[]]);
  // Text elements per page
  const [textLayers, setTextLayers] = useState([[]]);
  const [currentPage, setCurrentPage] = useState(0);

  // Toolbar state (lifted so we can read color/fontSize when placing text)
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(18);
  const [bold, setBold] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');

  const [showShareModal, setShowShareModal] = useState(false);
  const [previewWb, setPreviewWb] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [wbs, cats] = await Promise.all([
          whiteboardService.getMyWhiteboards(),
          categoryService.getAllCategories(),
        ]);
        setWhiteboards(wbs);
        setCategories(cats);
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Current page's text elements
  const currentTexts = textLayers[currentPage] || [];
  const setCurrentTexts = useCallback((updater) => {
    setTextLayers((prev) => {
      const updated = [...prev];
      updated[currentPage] = typeof updater === 'function' ? updater(updated[currentPage] || []) : updater;
      return updated;
    });
  }, [currentPage]);

  const navigateToPage = useCallback(async (targetIdx) => {
    if (!canvasRef.current) return;
    const paths = await canvasRef.current.exportPaths();
    // Save current page state
    setPages((prev) => { const u = [...prev]; u[currentPage] = paths; return u; });
    // Switch page
    setCurrentPage(targetIdx);
    setTimeout(async () => {
      await canvasRef.current?.clearCanvas();
      const nextPaths = pages[targetIdx] || [];
      if (nextPaths.length > 0) await canvasRef.current?.loadPaths(nextPaths);
    }, 50);
  }, [currentPage, pages]);

  const addPage = async () => {
    if (!canvasRef.current) return;
    const paths = await canvasRef.current.exportPaths();
    setPages((prev) => { const u = [...prev]; u[currentPage] = paths; return [...u, []]; });
    setTextLayers((prev) => { const u = [...prev]; u[currentPage] = textLayers[currentPage] || []; return [...u, []]; });
    const newIdx = pages.length;
    setCurrentPage(newIdx);
    setTimeout(() => canvasRef.current?.clearCanvas(), 50);
  };

  const openWhiteboard = async (wb) => {
    const full = await whiteboardService.getById(wb._id);
    setActiveWb(full);
    setTitleInput(full.title);
    const wbPages = full.pages?.length ? full.pages : [[]];
    const wbTexts = full.textLayers?.length ? full.textLayers : wbPages.map(() => []);
    setPages(wbPages);
    setTextLayers(wbTexts);
    setCurrentPage(0);
    setTimeout(async () => {
      await canvasRef.current?.clearCanvas();
      if (wbPages[0]?.length > 0) await canvasRef.current?.loadPaths(wbPages[0]);
    }, 100);
  };

  const newWhiteboard = () => {
    setActiveWb(null);
    setTitleInput('Untitled Whiteboard');
    setPages([[]]);
    setTextLayers([[]]);
    setCurrentPage(0);
    setTimeout(() => canvasRef.current?.clearCanvas(), 50);
  };

  const saveWhiteboard = async () => {
    if (!canvasRef.current) {
      showToast('Canvas not ready  please wait a moment and try again', 'error');
      return;
    }
    setSaving(true);
    try {
      const paths = await canvasRef.current.exportPaths();
      const allPages = [...pages]; allPages[currentPage] = paths;
      const allTexts = [...textLayers]; allTexts[currentPage] = textLayers[currentPage] || [];
      const title = titleInput.trim() || 'Untitled Whiteboard';

      let saved;
      if (activeWb?._id) {
        saved = await whiteboardService.update(activeWb._id, title, allPages, allTexts);
      } else {
        saved = await whiteboardService.create(title, allPages, allTexts);
      }
      setActiveWb(saved);
      setPages(allPages);
      setTextLayers(allTexts);
      const wbs = await whiteboardService.getMyWhiteboards();
      setWhiteboards(wbs);
      showToast('Whiteboard saved');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save';
      showToast(msg, 'error');
      console.error('Save whiteboard error:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteWhiteboard = async (wb) => {
    setDeleteConfirm(wb);
  };

  const confirmDelete = async () => {
    const wb = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await whiteboardService.delete(wb._id);
      if (activeWb?._id === wb._id) newWhiteboard();
      setWhiteboards((prev) => prev.filter((w) => w._id !== wb._id));
      showToast('Whiteboard deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden bg-gray-50" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {toast.type === 'error' ? <Icons.AlertCircle className="w-4 h-4" /> : <Icons.CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Preview modal */}
      {previewWb && (
        <WhiteboardPreview whiteboard={previewWb} onClose={() => setPreviewWb(null)} />
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <DeleteConfirm whiteboard={deleteConfirm} onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />
      )}

      {/* Left panel */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Icons.PenTool className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">My Whiteboards</h2>
          </div>
          <button onClick={newWhiteboard} className="w-full flex items-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Icons.Plus className="w-4 h-4" /> New Whiteboard
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {whiteboards.length === 0 ? (
            <div className="text-center py-8 px-3">
              <Icons.PenTool className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No whiteboards yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {whiteboards.map((wb) => (
                <div
                  key={wb._id}
                  className={`group rounded-xl transition-colors ${activeWb?._id === wb._id ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  <div className="flex items-center gap-2 p-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${wb.isShared ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {wb.isShared ? <Icons.Share2 className="w-3.5 h-3.5 text-blue-600" /> : <Icons.FileImage className="w-3.5 h-3.5 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{wb.title}</p>
                      <p className="text-[10px] text-gray-400">{wb.isShared ? 'Shared' : 'Private'} · {new Date(wb.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 pb-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewWb(wb)}
                      title="Preview (read-only)"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-gray-100"
                    >
                      <Icons.Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      onClick={() => openWhiteboard(wb)}
                      title="Edit"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100"
                    >
                      <Icons.Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => deleteWhiteboard(wb)}
                      title="Delete"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-gray-100"
                    >
                      <Icons.Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Whiteboard title…"
            className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none flex-1 min-w-0"
          />
          <div className="flex items-center gap-2">
            {activeWb?.isShared && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">
                <Icons.Share2 className="w-3 h-3" /> Shared
              </span>
            )}
            <button
              onClick={() => setShowShareModal(true)}
              disabled={!activeWb?._id}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-40"
            >
              <Icons.Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={saveWhiteboard}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {saving ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Canvas with text tool */}
        <div className="flex-1 overflow-hidden">
          <WhiteboardCanvas
            canvasRef={canvasRef}
            tool={tool} setTool={setTool}
            color={color} setColor={setColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
            fontSize={fontSize} setFontSize={setFontSize}
            bold={bold} setBold={setBold}
            bgColor={bgColor} setBgColor={setBgColor}
            textElements={currentTexts}
            setTextElements={setCurrentTexts}
          />
        </div>

        {/* Page controls */}
        <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-center gap-3">
          <button onClick={() => currentPage > 0 && navigateToPage(currentPage - 1)} disabled={currentPage === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
            <Icons.ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => idx !== currentPage && navigateToPage(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${idx === currentPage ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {idx + 1}
              </button>
            ))}
            <button onClick={addPage} title="Add page" className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 flex items-center justify-center">
              <Icons.Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={() => currentPage < pages.length - 1 && navigateToPage(currentPage + 1)} disabled={currentPage === pages.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
            <Icons.ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-400 ml-2">Page {currentPage + 1} of {pages.length}</span>
        </div>
      </div>

      {showShareModal && activeWb && (
        <ShareModal
          whiteboard={activeWb}
          categories={categories}
          onClose={() => setShowShareModal(false)}
          onShared={(categoryIds) => {
            setActiveWb((p) => ({ ...p, isShared: categoryIds.length > 0, sharedWith: categoryIds }));
            setWhiteboards((p) => p.map((w) => w._id === activeWb._id ? { ...w, isShared: categoryIds.length > 0 } : w));
            showToast(categoryIds.length ? 'Shared with students' : 'Unshared');
          }}
        />
      )}
    </div>
  );
}

export default function InstructorWhiteboardPage() {
  return (
    <ProtectedInstructorRoute>
      <WhiteboardEditorContent />
    </ProtectedInstructorRoute>
  );
}
