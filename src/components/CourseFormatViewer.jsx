'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CourseFormatViewer() {
  const [courseFormat, setCourseFormat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchCourseFormat();
  }, []);

  const fetchCourseFormat = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/course-format`);

      if (response.data.success && response.data.courseFormat) {
        setCourseFormat(response.data.courseFormat);
      } else {
        setError('No course format document is currently available');
      }
    } catch (err) {
      console.error('Error fetching course format:', err);
      setError('Failed to load course format document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!courseFormat) return;
    
    const link = document.createElement('a');
    link.href = `${API_URL}/api/files/download/${courseFormat.filePath}`;
    link.download = courseFormat.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <Icons.Loader className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Loading course format...</p>
        </div>
      </div>
    );
  }

  if (error || !courseFormat) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icons.AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Course Format Not Available</p>
            <p className="text-sm text-amber-700 mt-1">
              The administrator has not yet uploaded a course format document. Check back later for instructions on how to structure your course.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-emerald-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 border-b border-emerald-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-200 rounded-lg">
              {courseFormat.fileType === 'pdf' ? (
                <Icons.FileText className="w-5 h-5 text-red-600" />
              ) : (
                <Icons.FileText className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">Course Format Guide</h3>
              <p className="text-sm text-gray-600 mt-1">
                Download and review this document before uploading your course content
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Icons.ChevronDown
              className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {showDetails && (
        <>
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">File Name</p>
                <p className="text-sm font-medium text-gray-900 mt-1 truncate">{courseFormat.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">File Type</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{courseFormat.fileType.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Size</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatFileSize(courseFormat.fileSize)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Uploaded</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(courseFormat.uploadedAt)}</p>
              </div>
            </div>

            {courseFormat.version && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-medium">Version</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{courseFormat.version}</p>
              </div>
            )}

            {courseFormat.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-medium mb-2">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{courseFormat.description}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer with Download Button */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-t border-emerald-200 flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Icons.Download className="w-4 h-4" />
          Download Guide
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
    </div>
  );
}
