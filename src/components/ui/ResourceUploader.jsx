'use client';

import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import uploadService from '@/lib/api/uploadService';

export default function ResourceUploader({ value = [], onChange, label = 'Lesson Resources' }) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        const newResources = [...value];

        for (const file of Array.from(files)) {
            if (file.size > 20 * 1024 * 1024) {
                alert(`${file.name} is too large. Max 20MB per file.`);
                continue;
            }

            try {
                const result = await uploadService.uploadDocument(file);
                newResources.push({
                    url: result.url,
                    name: result.originalName || file.name,
                });
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                alert(`Failed to upload ${file.name}`);
            }
        }

        onChange(newResources);
        setUploading(false);
    };

    const removeResource = (index) => {
        const updated = value.filter((_, i) => i !== index);
        onChange(updated);
    };

    const getFileIcon = (name) => {
        const ext = name?.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <Icons.FileText className="w-4 h-4 text-red-500" />;
            case 'doc': case 'docx': return <Icons.FileText className="w-4 h-4 text-blue-500" />;
            case 'ppt': case 'pptx': return <Icons.Presentation className="w-4 h-4 text-orange-500" />;
            case 'xls': case 'xlsx': return <Icons.Table className="w-4 h-4 text-green-500" />;
            case 'zip': return <Icons.Archive className="w-4 h-4 text-purple-500" />;
            default: return <Icons.File className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>

            {/* Uploaded files list */}
            {value.length > 0 && (
                <div className="space-y-2 mb-3">
                    {value.map((resource, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                            {getFileIcon(resource.name || resource)}
                            <span className="text-sm text-gray-700 flex-1 truncate">
                                {typeof resource === 'string' ? resource : resource.name}
                            </span>
                            <a
                                href={typeof resource === 'string' ? resource : resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Icons.ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                                onClick={() => removeResource(index)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Icons.X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                ) : (
                    <div>
                        <Icons.Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">
                            Click to upload resources
                        </p>
                        <p className="text-xs text-gray-400">PDF, DOC, PPT, XLS, ZIP - Max 20MB each</p>
                    </div>
                )}
            </button>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
        </div>
    );
}
