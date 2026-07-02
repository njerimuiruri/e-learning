'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import * as Icons from 'lucide-react';
import authService from '@/lib/api/authService';
import whiteboardService from '@/lib/api/whiteboardService';

function WhiteboardViewer({ whiteboard, onClose }) {
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
      if (pages[idx]?.length > 0) {
        await canvasRef.current?.loadPaths(pages[idx]);
      }
    }, 50);
  };

  const currentTexts = textLayers[currentPage] || [];

  const instructorName = whiteboard.instructorId
    ? `${whiteboard.instructorId.firstName || ''} ${whiteboard.instructorId.lastName || ''}`.trim()
    : 'Instructor';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">{whiteboard.title}</h2>
          <p className="text-xs text-gray-500">By {instructorName} · {new Date(whiteboard.updatedAt).toLocaleDateString()}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Icons.X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Canvas + text overlay  read-only */}
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
        {/* Read-only text layer */}
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

      {/* Page controls */}
      {pages.length > 1 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-center gap-2">
          <button
            onClick={() => currentPage > 0 && goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <Icons.ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${idx === currentPage ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() => currentPage < pages.length - 1 && goToPage(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <Icons.ChevronRight className="w-4 h-4 text-gray-600" />
          </button>

          <span className="text-xs text-gray-400 ml-2">Page {currentPage + 1} of {pages.length}</span>
        </div>
      )}
    </div>
  );
}

export default function StudentWhiteboardsPage() {
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const user = authService.getCurrentUser();
        const categoryId = user?.categoryId || user?.category?._id || user?.category;
        if (!categoryId) {
          setLoading(false);
          return;
        }
        // Try to get category name
        if (user?.category?.name) setCategoryName(user.category.name);

        const wbs = await whiteboardService.getSharedForCategory(categoryId);
        setWhiteboards(wbs);
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#021d49] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading whiteboards…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Icons.PenTool className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instructor Whiteboards</h1>
            <p className="text-sm text-gray-500">
              {categoryName ? `Shared with ${categoryName} category` : 'Shared with your category'}
            </p>
          </div>
        </div>
      </div>

      {whiteboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Icons.PenTool className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No whiteboards yet</h3>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Your instructor hasn't shared any whiteboards with your category yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {whiteboards.map((wb) => {
            const instructor = wb.instructorId;
            const instructorName = instructor
              ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim()
              : 'Instructor';
            const initials = instructorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={wb._id}
                onClick={() => setViewing(wb)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group overflow-hidden"
              >
                {/* Preview area */}
                <div className="h-36 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center relative">
                  <Icons.PenTool className="w-12 h-12 text-emerald-200 group-hover:text-emerald-300 transition-colors" />
                  <div className="absolute top-3 right-3 bg-white/80 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    {wb.pageCount || 'Multiple'} page{wb.pageCount === 1 ? '' : 's'}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate">{wb.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {initials || 'IN'}
                      </div>
                      <span className="text-xs text-gray-500 truncate max-w-[100px]">{instructorName}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(wb.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <button className="w-full mt-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                    <Icons.Eye className="w-3.5 h-3.5" />
                    Open Whiteboard
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer modal */}
      {viewing && (
        <WhiteboardViewer whiteboard={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
