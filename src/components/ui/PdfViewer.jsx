'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import * as Icons from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

/**
 * Renders a PDF ourselves (via pdf.js) instead of relying on the browser's
 * built-in viewer, so every page is guaranteed to render large and fit the
 * container width  regardless of the browser's own remembered zoom setting.
 */
export default function PdfViewer({ url, className = '' }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) setContainerWidth(Math.max(320, Math.floor(width - 32)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPageNumber(1);
    setError(null);
  }, [url]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-100 flex justify-center px-4 py-4">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-16">
            <Icons.FileWarning className="w-8 h-8" />
            <p className="text-sm">Couldn't load the PDF preview.</p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setError('load-failed')}
            loading={
              <div className="flex items-center justify-center gap-2 text-gray-400 py-16">
                <Icons.Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading presentation…</span>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={containerWidth}
              renderAnnotationLayer={false}
              className="shadow-md"
            />
          </Document>
        )}
      </div>

      {numPages > 1 && !error && (
        <div className="flex items-center justify-center gap-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-[80px] text-center">
            Page {pageNumber} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
