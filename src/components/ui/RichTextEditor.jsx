'use client';

import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import uploadService from '@/lib/api/uploadService';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 animate-pulse" style={{ minHeight: 200 }}>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
    ),
});

import 'react-quill-new/dist/quill.snow.css';

/** Insert a starter table at the current cursor position */
function buildStarterTable(rows = 3, cols = 3) {
    const thead = `<thead><tr>${Array(cols).fill(0).map((_, i) => `<th>Header ${i + 1}</th>`).join('')}</tr></thead>`;
    const tbody = Array(rows - 1).fill(0).map(() =>
        `<tr>${Array(cols).fill(0).map(() => '<td>&nbsp;</td>').join('')}</tr>`
    ).join('');
    return `<table><${thead}<tbody>${tbody}</tbody></table><p><br></p>`;
}

export default function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Start writing...',
    height = 200,
    label,
    required = false,
    className = '',
}) {
    const quillRef = useRef(null);
    const containerRef = useRef(null);
    const unmountedRef = useRef(false);

    const getEditor = useCallback(() => {
        if (unmountedRef.current) return null;
        const ref = quillRef.current;
        if (!ref) return null;
        if (typeof ref.getEditor === 'function') return ref.getEditor();
        if (ref.editor) return ref.editor;
        return null;
    }, []);

    // Disable Quill before React tears down the DOM to prevent removeChild conflicts
    useEffect(() => {
        unmountedRef.current = false;
        return () => {
            unmountedRef.current = true;
            try {
                const ref = quillRef.current;
                if (!ref) return;
                const editor = typeof ref.getEditor === 'function' ? ref.getEditor() : ref.editor;
                if (editor) editor.enable(false);
            } catch {}
        };
    }, []);

    // ── Intercept paste events to preserve table HTML from Word / Google Docs ──
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handlePaste = (e) => {
            const html = e.clipboardData?.getData('text/html') || '';
            if (!html.includes('<table')) return; // let Quill handle non-table pastes normally

            e.preventDefault();
            e.stopPropagation();

            const quill = getEditor();
            if (!quill) return;

            // Clean up Word/Docs cruft but keep table structure
            const cleaned = html
                .replace(/<!--[\s\S]*?-->/g, '')       // remove comments
                .replace(/\s?class="[^"]*"/g, '')       // strip class attrs
                .replace(/\s?style="[^"]*"/g, '')       // strip inline styles (we restyle in CSS)
                .replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/g, '') // remove Office XML tags
                .replace(/<\/?w:[^>]*>/g, '')           // remove Word tags
                .replace(/<\/?m:[^>]*>/g, '');          // remove Math tags

            const range = quill.getSelection(true) || { index: quill.getLength() - 1 };
            quill.clipboard.dangerouslyPasteHTML(range.index, cleaned);
        };

        // Use capture so we intercept before Quill's own handler
        container.addEventListener('paste', handlePaste, true);
        return () => container.removeEventListener('paste', handlePaste, true);
    }, [getEditor]);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return; }
            try {
                const url = await uploadService.uploadImage(file);
                const quill = getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', url);
                    quill.setSelection(range.index + 1);
                }
            } catch {
                alert('Failed to upload image. Please try again.');
            }
        };
    }, [getEditor]);

    const attachmentHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip');
        input.click();
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > 20 * 1024 * 1024) { alert('File must be less than 20MB'); return; }
            try {
                const { url, originalName } = await uploadService.uploadDocument(file);
                const quill = getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertText(range.index, originalName, 'link', url);
                    quill.setSelection(range.index + originalName.length);
                }
            } catch {
                alert('Failed to upload file. Please try again.');
            }
        };
    }, [getEditor]);

    /** Insert a 3×3 starter table at cursor */
    const tableHandler = useCallback(() => {
        const quill = getEditor();
        if (!quill) return;
        const range = quill.getSelection(true) || { index: quill.getLength() - 1 };
        quill.clipboard.dangerouslyPasteHTML(range.index, buildStarterTable(3, 3));
    }, [getEditor]);

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image', 'video', 'attachment'],
                    [{ align: [] }],
                    [{ color: [] }, { background: [] }],
                    ['table'],
                    ['clean'],
                ],
                handlers: {
                    image: imageHandler,
                    attachment: attachmentHandler,
                    table: tableHandler,
                },
            },
            clipboard: {
                matchVisual: false,
            },
        }),
        [imageHandler, attachmentHandler, tableHandler]
    );

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'blockquote', 'code-block',
        'link', 'image', 'video',
        'align',
        'color', 'background',
    ];

    return (
        <div className={className} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="rich-text-editor">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    style={{ minHeight: height }}
                />
            </div>
            <style jsx global>{`
                .rich-text-editor .ql-container {
                    min-height: ${height}px;
                    font-size: 14px;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                }
                .rich-text-editor .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    background: #f9fafb;
                }
                .rich-text-editor .ql-editor {
                    min-height: ${height}px;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
                .rich-text-editor .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin: 0.5rem 0;
                }

                /* ── Table toolbar button ── */
                .rich-text-editor .ql-table::before {
                    content: '⊞';
                    font-size: 16px;
                    font-weight: 600;
                    line-height: 1;
                }

                /* ── Table styles inside editor ── */
                .rich-text-editor .ql-editor table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 0.75rem 0;
                    font-size: 13px;
                }
                .rich-text-editor .ql-editor table th,
                .rich-text-editor .ql-editor table td {
                    border: 1px solid #d1d5db;
                    padding: 8px 12px;
                    text-align: left;
                    min-width: 80px;
                }
                .rich-text-editor .ql-editor table th {
                    background: #f3f4f6;
                    font-weight: 600;
                    color: #374151;
                }
                .rich-text-editor .ql-editor table tr:nth-child(even) td {
                    background: #f9fafb;
                }
                .rich-text-editor .ql-editor table tr:hover td {
                    background: #eff6ff;
                }

                /* ── Attachment button icon ── */
                .rich-text-editor .ql-attachment {
                    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'/%3E%3C/svg%3E") no-repeat center center !important;
                    background-size: 18px !important;
                }
            `}</style>
        </div>
    );
}
