'use client';

import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import uploadService from '@/lib/api/uploadService';

export default function VideoUploader({ value = '', onChange, onRemove, label = 'Lesson Video' }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid video format. Allowed: MP4, MOV, AVI');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            alert('Video must be less than 100MB');
            return;
        }

        setUploading(true);
        setProgress(10);

        // Simulate progress since Cloudinary upload_stream doesn't give progress
        const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 5, 90));
        }, 500);

        try {
            const url = await uploadService.uploadVideo(file);
            clearInterval(progressInterval);
            setProgress(100);
            onChange(url);
        } catch (error) {
            console.error('Video upload failed:', error);
            alert('Failed to upload video. Please try again.');
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => {
                setUploading(false);
                setProgress(0);
            }, 500);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>

            {value ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <video
                        src={value}
                        controls
                        className="w-full max-h-64 bg-black"
                    />
                    <div className="flex items-center justify-between p-3 bg-gray-50">
                        <span className="text-sm text-gray-600 truncate flex-1">{value}</span>
                        <button
                            onClick={() => { onChange(''); onRemove?.(); }}
                            className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Icons.Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : uploading ? (
                <div className="border-2 border-gray-200 rounded-lg p-6 text-center">
                    <Icons.Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-gray-600 mb-3">Uploading video...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{progress}%</p>
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        dragActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <Icons.Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                        Drag & drop a video or <span className="text-emerald-600 font-medium">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI - Max 100MB</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                </div>
            )}
        </div>
    );
}
