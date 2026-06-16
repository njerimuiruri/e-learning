'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as Icons from 'lucide-react';
import whiteboardService from '@/lib/api/whiteboardService';

const ReactSketchCanvas = dynamic(
  () => import('react-sketch-canvas').then((m) => m.ReactSketchCanvas),
  { ssr: false }
);

// ─── Read-only viewer modal ───────────────────────────────────────────────────
function WhiteboardViewer({ whiteboard, onClose }) {
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([[]]);
  const [textLayers, setTextLayers] = useState([[]]);

  useEffect(() => {
    const load = async () => {
      try {
        const full = await whiteboardService.getById(whiteboard._id);
        const wbPages = full.pages?.length ? full.pages : [[]];
        const wbTexts = full.textLayers?.length ? full.textLayers : wbPages.map(() => []);
        setPages(wbPages);
        setPageCount(wbPages.length);
        setTextLayers(wbTexts);
        setTimeout(async () => {
          await canvasRef.current?.clearCanvas();
          if (wbPages[0]?.length > 0) await canvasRef.current?.loadPaths(wbPages[0]);
          setLoading(false);
        }, 150);
      } catch {
        setLoading(false);
      }
    };
    load();
  }, [whiteboard._id]);

  const goToPage = async (idx) => {
    if (idx === currentPage || !canvasRef.current) return;
    setCurrentPage(idx);
    await canvasRef.current.clearCanvas();
    setTimeout(async () => {
      if (pages[idx]?.length > 0) await canvasRef.current?.loadPaths(pages[idx]);
    }, 50);
  };

  const currentTexts = textLayers[currentPage] || [];
  const instructor = whiteboard.instructorId;
  const instructorName = instructor
    ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.email
    : 'Unknown Instructor';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">{whiteboard.title}</h2>
          <p className="text-xs text-gray-500">By {instructorName} · {new Date(whiteboard.updatedAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {whiteboard.isShared && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full shrink-0">
              <Icons.Share2 className="w-3 h-3" />
              Shared with {(whiteboard.sharedWith || []).length} categor{(whiteboard.sharedWith || []).length === 1 ? 'y' : 'ies'}
            </span>
          )}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
            <Icons.X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-100 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <ReactSketchCanvas
          ref={canvasRef}
          strokeColor="transparent"
          strokeWidth={0}
          canvasColor="#ffffff"
          style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          withTimestamp={false}
        />
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

      {pageCount > 1 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-center gap-2 shrink-0">
          <button onClick={() => currentPage > 0 && goToPage(currentPage - 1)} disabled={currentPage === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
            <Icons.ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          {pages.map((_, idx) => (
            <button key={idx} onClick={() => goToPage(idx)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${idx === currentPage ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {idx + 1}
            </button>
          ))}
          <button onClick={() => currentPage < pageCount - 1 && goToPage(currentPage + 1)} disabled={currentPage === pageCount - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30">
            <Icons.ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-400 ml-1">Page {currentPage + 1} of {pageCount}</span>
        </div>
      )}
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────
function DeleteDialog({ whiteboard, onConfirm, onCancel, deleting }) {
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
          This will permanently remove it for the instructor and all students it was shared with.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60">
            {deleting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Trash2 className="w-4 h-4" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminWhiteboardsPage() {
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterShared, setFilterShared] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await whiteboardService.adminGetAll();
      setWhiteboards(data);
    } catch {
      showToast('Failed to load whiteboards', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await whiteboardService.adminDelete(deleteTarget._id);
      setWhiteboards((prev) => prev.filter((w) => w._id !== deleteTarget._id));
      showToast('Whiteboard deleted');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete whiteboard', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const q = search.toLowerCase();
  const filtered = whiteboards.filter((wb) => {
    const instructor = wb.instructorId;
    const instructorName = instructor
      ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim()
      : '';
    const matchSearch = !q ||
      wb.title?.toLowerCase().includes(q) ||
      instructorName.toLowerCase().includes(q) ||
      instructor?.email?.toLowerCase().includes(q);
    const matchShared = filterShared === 'all'
      ? true
      : filterShared === 'shared' ? wb.isShared : !wb.isShared;
    return matchSearch && matchShared;
  });

  const totalShared = whiteboards.filter((w) => w.isShared).length;
  const totalPrivate = whiteboards.filter((w) => !w.isShared).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 border ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {toast.type === 'error' ? <Icons.AlertCircle className="w-4 h-4" /> : <Icons.CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Icons.PenTool className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Whiteboards</h1>
            <p className="text-sm text-gray-500">{whiteboards.length} whiteboard{whiteboards.length !== 1 ? 's' : ''} across all instructors</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm disabled:opacity-50">
          <Icons.RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat chips */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {[
          { key: 'all',     label: 'All',     count: whiteboards.length, cls: 'bg-gray-100 text-gray-700'           },
          { key: 'shared',  label: 'Shared',  count: totalShared,        cls: 'bg-blue-50 text-blue-700'            },
          { key: 'private', label: 'Private', count: totalPrivate,       cls: 'bg-amber-50 text-amber-700'          },
        ].map(({ key, label, count, cls }) => (
          <button
            key={key}
            onClick={() => setFilterShared(key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              filterShared === key ? 'border-[#021d49] bg-[#021d49] text-white' : `${cls} border-transparent hover:border-gray-200`
            }`}
          >
            {label}
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${filterShared === key ? 'bg-white/20' : 'bg-white/80'}`}>{count}</span>
          </button>
        ))}

        <div className="ml-auto relative">
          <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or instructor…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-400 bg-white w-52"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Loading whiteboards…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Icons.PenTool className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700">{search || filterShared !== 'all' ? 'No whiteboards match your filter.' : 'No whiteboards yet.'}</p>
          <p className="text-sm text-gray-400 mt-1">Instructors haven't created any whiteboards yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((wb) => {
            const instructor = wb.instructorId;
            const instructorName = instructor
              ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.email
              : 'Unknown';
            const initials = instructorName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'IN';
            const sharedCategories = wb.sharedWith || [];

            return (
              <div key={wb._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                {/* Preview thumbnail */}
                <div className="h-32 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center relative">
                  <Icons.PenTool className="w-10 h-10 text-emerald-200" />
                  {wb.isShared ? (
                    <div className="absolute top-2.5 right-2.5 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Icons.Share2 className="w-2.5 h-2.5" /> Shared
                    </div>
                  ) : (
                    <div className="absolute top-2.5 right-2.5 bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Icons.Lock className="w-2.5 h-2.5" /> Private
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1 gap-3">
                  {/* Title */}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{wb.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(wb.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials}
                    </div>
                    <span className="text-xs text-gray-600 truncate">{instructorName}</span>
                  </div>

                  {/* Sharing info */}
                  {wb.isShared && sharedCategories.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg px-2.5 py-1.5">
                      <Icons.Users className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {sharedCategories.map((c) => c.name || 'Category').join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setViewing(wb)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Icons.Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => setDeleteTarget(wb)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                      title="Delete whiteboard"
                    >
                      <Icons.Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer modal */}
      {viewing && <WhiteboardViewer whiteboard={viewing} onClose={() => setViewing(null)} />}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <DeleteDialog
          whiteboard={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
