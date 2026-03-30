'use client';

import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import uploadService from '@/lib/api/uploadService';

export default function VideoUploader({ value = '', onChange, label = 'Intro Video' }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [urlInput, setUrlInput] = useState('');
    const [mode, setMode] = useState('upload'); // 'upload' | 'url'
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;
        const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
        if (!allowed.includes(file.type)) {
            alert('Invalid video format. Allowed: MP4, WebM, OGG, MOV, AVI');
            return;
        }
        if (file.size > 500 * 1024 * 1024) {
            alert('Video must be less than 500MB');
            return;
        }
        setUploading(true);
        setProgress(0);
        try {
            const interval = setInterval(() => setProgress(p => p < 85 ? p + 5 : p), 800);
            const url = await uploadService.uploadVideo(file);
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => { setProgress(0); setUploading(false); }, 500);
            onChange(url);
        } catch (err) {
            console.error('Video upload failed:', err);
            alert('Failed to upload video. Please try again.');
            setUploading(false);
            setProgress(0);
        }
    };

    const handleUrlSubmit = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        onChange(trimmed);
        setUrlInput('');
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {/* Mode toggle */}
            {!value && (
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'upload' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Icons.Upload className="w-3 h-3" /> Upload File
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('url')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === 'url' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Icons.Link className="w-3 h-3" /> Paste URL
                    </button>
                </div>
            )}

            {/* Current video preview */}
            {value && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                    <video src={value} controls className="w-full max-h-64 object-contain" />
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                        <p className="text-xs text-gray-500 truncate flex-1 mr-2">{value}</p>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0"
                        >
                            <Icons.Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                    </div>
                </div>
            )}

            {/* Upload area */}
            {!value && mode === 'upload' && (
                <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${uploading ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50 cursor-pointer'}`}
                    onClick={() => !uploading && inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                >
                    {uploading ? (
                        <div className="space-y-3">
                            <Icons.Loader2 className="w-8 h-8 text-green-500 mx-auto animate-spin" />
                            <p className="text-sm font-semibold text-green-700">Uploading video…</p>
                            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-gray-400">{progress}%</p>
                        </div>
                    ) : (
                        <>
                            <Icons.Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-600">Click to upload or drag & drop a video</p>
                            <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV, AVI · Max 500MB</p>
                        </>
                    )}
                </div>
            )}

            {/* URL input */}
            {!value && mode === 'url' && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <button
                        type="button"
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors flex-shrink-0"
                    >
                        Use URL
                    </button>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </div>
    );
}
