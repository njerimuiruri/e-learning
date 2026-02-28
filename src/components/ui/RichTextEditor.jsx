'use client';

import React, { useRef, useMemo, useCallback } from 'react';
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

// Import styles
import 'react-quill-new/dist/quill.snow.css';

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

    const getEditor = useCallback(() => {
        const ref = quillRef.current;
        if (!ref) return null;
        // react-quill-new exposes getEditor() on the component instance
        if (typeof ref.getEditor === 'function') return ref.getEditor();
        // Fallback: try unprivilegedEditor or the editor property
        if (ref.editor) return ref.editor;
        return null;
    }, []);

    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                return;
            }

            try {
                const url = await uploadService.uploadImage(file);
                const quill = getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', url);
                    quill.setSelection(range.index + 1);
                }
            } catch (error) {
                console.error('Image upload failed:', error);
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

            if (file.size > 20 * 1024 * 1024) {
                alert('File must be less than 20MB');
                return;
            }

            try {
                const { url, originalName } = await uploadService.uploadDocument(file);
                const quill = getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    const linkText = `${originalName}`;
                    quill.insertText(range.index, linkText, 'link', url);
                    quill.setSelection(range.index + linkText.length);
                }
            } catch (error) {
                console.error('File upload failed:', error);
                alert('Failed to upload file. Please try again.');
            }
        };
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
                    ['clean'],
                ],
                handlers: {
                    image: imageHandler,
                    attachment: attachmentHandler,
                },
            },
            clipboard: {
                matchVisual: false,
            },
        }),
        [imageHandler, attachmentHandler]
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
        <div className={className}>
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
                .rich-text-editor .ql-attachment {
                    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'/%3E%3C/svg%3E") no-repeat center center !important;
                    background-size: 18px !important;
                }
            `}</style>
        </div>
    );
}
