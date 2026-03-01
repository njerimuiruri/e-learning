'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import { useToast } from '@/components/ui/ToastProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

export default function CertificatesPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/certificates/module/student/my-certificates`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to fetch certificates');

            const data = await response.json();
            const certList = Array.isArray(data) ? data : data?.certificates || [];
            setCertificates(certList);
        } catch (err) {
            setError('Failed to load certificates');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCertificate = async (cert) => {
        try {
            const publicId = cert.publicId || cert.certificatePublicId;
            if (!publicId) {
                showToast('Certificate not available for download', { type: 'error', title: 'Download failed' });
                return;
            }

            const response = await fetch(`${API_URL}/api/certificates/module/public/${publicId}/download`);

            if (!response.ok) throw new Error('Failed to download certificate');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const moduleName = (cert.moduleName || cert.moduleId?.title || 'module').replace(/\s+/g, '-');
            link.download = `certificate-${moduleName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast('Failed to download certificate', { type: 'error', title: 'Download failed' });
            console.error(err);
        }
    };

    const handleViewCertificate = (cert) => {
        const publicId = cert.publicId || cert.certificatePublicId;
        if (publicId) {
            window.open(`${API_URL}/api/certificates/module/public/${publicId}/view`, '_blank');
        }
    };

    const handleShareCertificate = (cert, platform) => {
        const publicId = cert.publicId || cert.certificatePublicId;
        const shareUrl = `${window.location.origin}/certificates/module/${publicId}`;
        const moduleName = cert.moduleName || cert.moduleId?.title || 'a module';
        const shareText = `I've earned a certificate for completing "${moduleName}"!`;

        const shareUrls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    };

    const getLevelBadge = (level) => {
        const badges = {
            beginner: { color: 'bg-green-100 text-green-700', label: 'Beginner' },
            intermediate: { color: 'bg-yellow-100 text-yellow-700', label: 'Intermediate' },
            advanced: { color: 'bg-red-100 text-red-700', label: 'Advanced' },
        };
        return badges[level] || badges.beginner;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-[#021d49] mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icons.Award className="w-8 h-8 text-[#021d49]" />
                        </div>
                    </div>
                    <p className="text-gray-700 font-semibold text-lg">Loading your certificates...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 pt-16">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/student')}
                                className="flex items-center gap-2 text-gray-600 hover:text-[#021d49] mb-6 font-semibold transition-colors group"
                            >
                                <div className="bg-white p-2 rounded-lg group-hover:bg-[#021d49] group-hover:text-white transition-all shadow-sm">
                                    <Icons.ChevronLeft className="w-5 h-5" />
                                </div>
                                <span className="text-sm">Back to Dashboard</span>
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-gradient-to-r from-[#021d49] to-blue-700 p-4 rounded-2xl shadow-lg">
                                    <Icons.Award className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-2">
                                        Your Certificates
                                    </h1>
                                    <p className="text-gray-600 text-lg">
                                        Showcase your achievements and share your success
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                            <div className="group bg-gradient-to-br from-[#021d49] to-blue-800 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.CheckCircle className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">{certificates.length}</span>
                                </div>
                                <p className="text-blue-100 text-sm font-semibold mb-1">Certificates Earned</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>

                            <div className="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.Layers className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">
                                        {[...new Set(certificates.map(c => c.moduleId?._id || c.moduleId))].length}
                                    </span>
                                </div>
                                <p className="text-green-100 text-sm font-semibold mb-1">Modules Completed</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>

                            <div className="group bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.TrendingUp className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">
                                        {certificates.length > 0
                                            ? `${Math.max(...certificates.map(c => c.score || c.finalScore || 0)).toFixed(0)}%`
                                            : '0%'
                                        }
                                    </span>
                                </div>
                                <p className="text-purple-100 text-sm font-semibold mb-1">Best Score</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>
                        </div>

                        {/* Certificate Grid */}
                        {certificates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {certificates.map((cert) => {
                                    const moduleName = cert.moduleName || cert.moduleId?.title || 'Module';
                                    const moduleLevel = cert.moduleLevel || cert.moduleId?.level;
                                    const categoryName = cert.categoryName || cert.categoryId?.name || '';
                                    const score = cert.score || cert.finalScore || 0;
                                    const issueDate = cert.issuedAt || cert.createdAt;
                                    const levelBadge = getLevelBadge(moduleLevel);

                                    return (
                                        <div
                                            key={cert._id}
                                            className="group bg-white rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:-translate-y-2"
                                        >
                                            {/* Certificate Header */}
                                            <div className="relative h-56 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center text-white overflow-hidden">
                                                <div className="absolute inset-0 bg-black/10"></div>
                                                <div className="text-center relative z-10 p-6">
                                                    <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-4 inline-block">
                                                        <Icons.CheckCircle className="w-20 h-20 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <p className="text-sm text-green-100 mb-2 font-semibold">Certificate of Completion</p>
                                                    <h3 className="font-black text-xl px-4">{moduleName}</h3>
                                                </div>
                                                <div className="absolute top-4 right-4 bg-white text-green-700 px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                    <Icons.BadgeCheck className="w-3 h-3" />
                                                    Verified
                                                </div>
                                                {moduleLevel && (
                                                    <div className="absolute top-4 left-4">
                                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${levelBadge.color}`}>
                                                            {levelBadge.label}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                            </div>

                                            {/* Certificate Info */}
                                            <div className="p-6">
                                                {categoryName && (
                                                    <span className="text-xs font-semibold text-[#021d49] uppercase tracking-wide mb-2 block">
                                                        {categoryName}
                                                    </span>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-6">
                                                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-full font-semibold">
                                                        <Icons.Calendar className="w-4 h-4" />
                                                        <span>Issued: {issueDate ? new Date(issueDate).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-full font-semibold">
                                                        <Icons.TrendingUp className="w-4 h-4" />
                                                        <span>{score.toFixed ? score.toFixed(0) : score}%</span>
                                                    </div>
                                                    {cert.certificateNumber && (
                                                        <div className="flex items-center gap-2 bg-gray-50 text-gray-600 px-3 py-2 rounded-full font-semibold">
                                                            <Icons.Hash className="w-4 h-4" />
                                                            <span>{cert.certificateNumber}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleDownloadCertificate(cert)}
                                                            className="flex-1 bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
                                                        >
                                                            <Icons.Download className="w-5 h-5" />
                                                            Download PDF
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewCertificate(cert)}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-4 rounded-xl font-bold transition-all flex items-center justify-center"
                                                            title="View Certificate"
                                                        >
                                                            <Icons.Eye className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleShareCertificate(cert, 'linkedin')}
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <Icons.Linkedin className="w-4 h-4" />
                                                            LinkedIn
                                                        </button>
                                                        <button
                                                            onClick={() => handleShareCertificate(cert, 'twitter')}
                                                            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <Icons.Twitter className="w-4 h-4" />
                                                            Twitter
                                                        </button>
                                                        <button
                                                            onClick={() => handleShareCertificate(cert, 'facebook')}
                                                            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                                                        >
                                                            <Icons.Facebook className="w-4 h-4" />
                                                            Facebook
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border-2 border-gray-100 p-16 text-center shadow-lg">
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Icons.Award className="w-16 h-16 text-gray-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-3">No Certificates Yet</h3>
                                <p className="text-gray-600 text-lg mb-8">Complete modules and pass the final assessment to earn certificates</p>
                                <button
                                    onClick={() => router.push('/student/modules')}
                                    className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3 text-lg"
                                >
                                    <Icons.BookOpen className="w-6 h-6" />
                                    Browse Modules
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
