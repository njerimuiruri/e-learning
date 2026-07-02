'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import studentVerificationService from '@/lib/api/studentVerificationService';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';
import {
  Upload, CheckCircle, Clock, XCircle, Loader2,
  FileImage, AlertTriangle, GraduationCap, ArrowRight,
} from 'lucide-react';

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId');
  const categoryId = searchParams.get('categoryId');

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState(null);
  const [existingStatus, setExistingStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) { router.push('/login'); return; }
    checkExistingStatus();
  }, []);

  const checkExistingStatus = async () => {
    try {
      const status = await studentVerificationService.getMyStatus();
      setExistingStatus(status);
      if (status.status === 'approved') {
        // Already verified  redirect to module
        if (moduleId) router.push(`/student/modules/${moduleId}`);
        else router.push('/student/modules');
      }
    } catch {
      // proceed
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(selected.type)) {
      setError('Only JPG, PNG, or PDF files are accepted.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    setError(null);
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    try {
      setUploading(true);
      setError(null);
      await studentVerificationService.uploadStudentId(file);
      setUploadDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#021d49]" />
      </div>
    );
  }

  // Upload done  show confirmation
  if (uploadDone || existingStatus?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verification Under Review</h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Your student ID has been submitted. Our team will review it within 1–2 business days.
            You will receive an email notification once approved.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>What happens next?</strong><br />
              Once your ID is approved, you will automatically get full access to all modules
              in Arin Publishing Academy.
            </p>
          </div>
          <button
            onClick={() => router.push('/student')}
            className="w-full bg-[#021d49] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#032a66] transition flex items-center justify-center gap-2"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Rejected  re-upload
  if (existingStatus?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="font-semibold text-red-800 text-sm">Verification Rejected</p>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              <strong>Reason:</strong> {existingStatus.rejectionReason || 'Invalid or unreadable ID'}
            </p>
          </div>
          <UploadForm
            file={file} preview={preview} uploading={uploading} error={error}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            onBrowse={() => fileInputRef.current?.click()}
            isReupload
          />
        </div>
      </div>
    );
  }

  // Fresh upload
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#021d49]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-[#021d49]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Upload Student ID</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verify your student status to unlock Arin Publishing Academy
          </p>
        </div>

        <UploadForm
          file={file} preview={preview} uploading={uploading} error={error}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          onBrowse={() => fileInputRef.current?.click()}
        />
      </div>
    </div>
  );
}

function UploadForm({ file, preview, uploading, error, fileInputRef, onFileChange, onUpload, onBrowse, isReupload }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {isReupload && (
        <h2 className="text-sm font-bold text-gray-700 mb-4">Upload a New Student ID</h2>
      )}

      {/* Drop zone */}
      <div
        onClick={onBrowse}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#021d49]/40 hover:bg-gray-50 transition mb-4"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain mb-2" />
        ) : file ? (
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <FileImage className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Click to browse your student ID</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or PDF · Max 5MB</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {file && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-4 text-xs text-gray-600">
          <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span className="truncate">{file.name}</span>
          <span className="ml-auto text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl mb-4 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={onUpload}
        disabled={uploading || !file}
        className="w-full bg-[#021d49] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#032a66] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="w-4 h-4" /> Submit Student ID</>
        )}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        Your ID is reviewed by our team and never shared publicly.
      </p>
    </div>
  );
}

export default function StudentVerificationUploadPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#021d49]" />
          </div>
        }>
          <UploadContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
