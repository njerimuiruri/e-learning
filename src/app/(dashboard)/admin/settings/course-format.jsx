'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CourseFormatManagement() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [courseFormat, setCourseFormat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchCourseFormat();
  }, []);

  const fetchCourseFormat = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/course-format`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCourseFormat(response.data.courseFormat);
      }
    } catch (error) {
      console.error('Error fetching course format:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Please select a PDF or DOC file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('version', version);

      const response = await axios.post(`${API_URL}/api/admin/course-format/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        alert('Course format uploaded successfully!');
        setFile(null);
        setDescription('');
        setVersion('');
        document.getElementById('fileInput').value = '';
        fetchCourseFormat();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload course format: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
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

  const handleDelete = async () => {
    if (!courseFormat) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/admin/course-format/${courseFormat._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        alert('Course format deleted successfully!');
        setCourseFormat(null);
        setDeleteConfirm(false);
        fetchCourseFormat();
      }
    } catch (error) {
      console.error('Error deleting course format:', error);
      alert(`Failed to delete course format: ${error.response?.data?.message || error.message}`);
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Icons.FileText className="w-6 h-6 text-emerald-600" />
        <h2 className="text-2xl font-bold text-gray-800">Course Format Management</h2>
      </div>

      <p className="text-gray-600 mb-6">
        Upload a PDF or DOC file that will serve as the course format template for all instructors to download and follow.
      </p>

      {/* Current Course Format */}
      {courseFormat && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                {courseFormat.fileType === 'pdf' ? (
                  <Icons.FileText className="w-6 h-6 text-red-600" />
                ) : (
                  <Icons.FileText className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{courseFormat.fileName}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Size: {formatFileSize(courseFormat.fileSize)}</p>
                  <p>Type: {courseFormat.fileType.toUpperCase()}</p>
                  {courseFormat.version && <p>Version: {courseFormat.version}</p>}
                  <p>Uploaded: {formatDate(courseFormat.uploadedAt)}</p>
                  {courseFormat.description && (
                    <p className="mt-2 text-gray-700">{courseFormat.description}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Icons.Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Icons.Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 mb-4">Are you sure you want to delete this course format? This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {courseFormat ? 'Upload New Version' : 'Upload Course Format'}
        </h3>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File (PDF or DOC)*
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={uploading}
            />
            {file && (
              <p className="mt-2 text-sm text-emerald-600 flex items-center gap-2">
                <Icons.CheckCircle className="w-4 h-4" />
                {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          {/* Version Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version (Optional)
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0, 2.1, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={uploading}
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes or instructions for instructors..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={uploading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !file}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              uploading || !file
                ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {uploading ? (
              <>
                <Icons.Loader className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Icons.Upload className="w-4 h-4" />
                Upload Course Format
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">About Course Format Documents</p>
            <p>
              This document will be visible and downloadable by all instructors when they are creating or editing courses. 
              It should contain the required structure, format guidelines, and any other instructions that instructors need to follow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
