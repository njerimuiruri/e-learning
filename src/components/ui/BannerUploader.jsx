'use client';

import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import uploadService from '@/lib/api/uploadService';

export default function BannerUploader({ value = '', onChange, label = 'Banner Image' }) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid image format. Allowed: JPEG, PNG, GIF, WebP');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const url = await uploadService.uploadImage(file);
            onChange(url);
        } catch (error) {
            console.error('Banner upload failed:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>

            {value ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                        src={value}
                        alt="Module banner"
                        className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors group flex items-center justify-center gap-3">
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Icons.Camera className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                            onClick={() => onChange('')}
                            className="p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Icons.Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-gray-50 transition-colors"
                    onClick={() => inputRef.current?.click()}
                >
                    {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                            <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                    ) : (
                        <>
                            <Icons.ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                                Click to upload a banner image
                            </p>
                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP - Max 5MB</p>
                        </>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </div>
    );
}
