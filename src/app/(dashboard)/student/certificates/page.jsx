'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import Navbar from '@/components/navbar/navbar';
import { useToast } from '@/components/ui/ToastProvider';

export default function CertificatesPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [certificates, setCertificates] = useState([]);
    const [selectedTab, setSelectedTab] = useState('earned');
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const claimedCertificates = certificates.filter(c => c.isValid);
    const completedCourses = [...new Set(claimedCertificates.map(c => c.courseId))];

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError('');

            const enrollmentData = await courseService.getMyEnrollments();
            const completedWithCerts = enrollmentData.enrollments
                ?.filter(e => e.isCompleted && e.certificateEarned)
                .map(e => ({
                    _id: e.certificateId || e._id,
                    publicId: e.certificatePublicId,
                    courseId: e.courseId._id || e.courseId,
                    courseName: e.courseId.title || 'Unknown Course',
                    studentName: `${e.studentId?.firstName || ''} ${e.studentId?.lastName || ''}`.trim() || 'Student',
                    issueDate: e.certificateIssuedAt || e.completedAt,
                    completionDate: e.completedAt,
                    score: e.finalAssessmentScore || e.totalScore || 0,
                    certificateUrl: e.certificateUrl,
                    isValid: true,
                    enrollmentId: e._id,
                })) || [];

            setCertificates(completedWithCerts);
        } catch (err) {
            setError('Failed to load certificates');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const earnedCertificates = certificates.filter(c => c.isValid);
    const availableCertificates = [];

    const handleClaimCertificate = async (certificateId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/certificates/${certificateId}/claim`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to claim certificate');

            await fetchCertificates();
            showToast('Certificate claimed successfully!', { type: 'success', title: 'Certificate claimed' });
        } catch (err) {
            showToast('Failed to claim certificate', { type: 'error', title: 'Claim failed' });
            console.error(err);
        }
    };

    const handleDownloadCertificate = async (certificate) => {
        try {
            const token = localStorage.getItem('token');
            const certificateId = certificate._id || certificate.enrollmentId;

            if (!certificateId) {
                showToast('Certificate ID not available', { type: 'error', title: 'Certificate unavailable' });
                return;
            }

            const response = await fetch(
                `http://localhost:5000/api/certificates/${certificateId}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to download certificate');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate-${certificate.courseName.replace(/\s+/g, '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast('Failed to download certificate', { type: 'error', title: 'Download failed' });
            console.error(err);
        }
    };

    const handleShareCertificate = (certificate, platform) => {
        const publicId = certificate.publicId || certificate._id;
        const shareUrl = `${window.location.origin}/certificates/${publicId}`;
        const shareText = `I've earned a certificate for ${certificate.courseName}!`;

        const shareUrls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
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
                            <div className="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.Award className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">{availableCertificates.length}</span>
                                </div>
                                <p className="text-blue-100 text-sm font-semibold mb-1">Available to Claim</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>

                            <div className="group bg-gradient-to-br from-[#021d49] to-blue-800 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.CheckCircle className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">{claimedCertificates.length}</span>
                                </div>
                                <p className="text-blue-100 text-sm font-semibold mb-1">Certificates Earned</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>

                            <div className="group bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl group-hover:scale-110 transition-transform">
                                        <Icons.GraduationCap className="w-10 h-10" />
                                    </div>
                                    <span className="text-5xl font-black">{completedCourses.length}</span>
                                </div>
                                <p className="text-purple-100 text-sm font-semibold mb-1">Courses Completed</p>
                                <div className="h-1 bg-white/30 rounded-full mt-3"></div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl border-2 border-gray-100 mb-8 shadow-lg overflow-hidden">
                            <div className="flex border-b-2 border-gray-100">
                                <button
                                    onClick={() => setSelectedTab('available')}
                                    className={`flex-1 px-8 py-5 font-bold text-base transition-all relative ${
                                        selectedTab === 'available'
                                            ? 'text-[#021d49] bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Icons.Gift className="w-5 h-5" />
                                        Available ({availableCertificates.length})
                                    </div>
                                    {selectedTab === 'available' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#021d49] to-blue-700"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSelectedTab('claimed')}
                                    className={`flex-1 px-8 py-5 font-bold text-base transition-all relative ${
                                        selectedTab === 'claimed'
                                            ? 'text-[#021d49] bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Icons.Award className="w-5 h-5" />
                                        Earned ({claimedCertificates.length})
                                    </div>
                                    {selectedTab === 'claimed' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#021d49] to-blue-700"></div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Available Certificates */}
                        {selectedTab === 'available' && (
                            <div className="space-y-6">
                                {availableCertificates.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {availableCertificates.map((course) => (
                                            <div
                                                key={course.id}
                                                className="group bg-white rounded-2xl border-2 border-blue-200 hover:border-[#021d49] hover:shadow-2xl transition-all overflow-hidden transform hover:-translate-y-2"
                                            >
                                                <div className="relative h-56 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                                                    <div className="text-center p-6">
                                                        <div className="bg-white p-6 rounded-2xl shadow-lg mb-4 inline-block">
                                                            <Icons.Award className="w-20 h-20 text-[#021d49] group-hover:scale-110 transition-transform" />
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2 font-semibold">Certificate of Completion</p>
                                                        <h3 className="font-black text-xl text-gray-900 px-4">{course.title}</h3>
                                                    </div>
                                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                        <Icons.Sparkles className="w-3 h-3" />
                                                        Ready to Claim
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                                                        <div className="flex items-center gap-2">
                                                            <Icons.Calendar className="w-4 h-4 text-[#021d49]" />
                                                            <span>Completed: {new Date(course.completedDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleClaimCertificate(course)}
                                                        className="w-full bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
                                                    >
                                                        <Icons.Download className="w-6 h-6" />
                                                        Claim Certificate
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-16 text-center shadow-lg">
                                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Icons.Award className="w-16 h-16 text-gray-400" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900 mb-3">No Certificates Available</h3>
                                        <p className="text-gray-600 mb-8 text-lg">Complete a course and pass the final assessment to earn your certificate</p>
                                        <button
                                            onClick={() => router.push('/courses')}
                                            className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3 text-lg"
                                        >
                                            <Icons.Search className="w-6 h-6" />
                                            Browse Courses
                                            <Icons.ArrowRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Earned Certificates */}
                        {selectedTab === 'claimed' && (
                            <div className="space-y-6">
                                {claimedCertificates.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {claimedCertificates.map((course) => (
                                            <div
                                                key={course.id}
                                                className="group bg-white rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:-translate-y-2"
                                            >
                                                <div className="relative h-56 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center text-white overflow-hidden">
                                                    <div className="absolute inset-0 bg-black/10"></div>
                                                    <div className="text-center relative z-10 p-6">
                                                        <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-4 inline-block">
                                                            <Icons.CheckCircle className="w-20 h-20 group-hover:scale-110 transition-transform" />
                                                        </div>
                                                        <p className="text-sm text-green-100 mb-2 font-semibold">Certificate of Completion</p>
                                                        <h3 className="font-black text-xl px-4">{course.courseName}</h3>
                                                    </div>
                                                    <div className="absolute top-4 right-4 bg-white text-green-700 px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                        <Icons.BadgeCheck className="w-3 h-3" />
                                                        Verified
                                                    </div>

                                                    {/* Decorative elements */}
                                                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                                                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-full font-semibold">
                                                            <Icons.Calendar className="w-4 h-4" />
                                                            <span>Issued: {new Date(course.issueDate || course.completionDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-full font-semibold">
                                                            <Icons.TrendingUp className="w-4 h-4" />
                                                            <span>{course.score.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <button
                                                            onClick={() => handleDownloadCertificate(course)}
                                                            className="w-full bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
                                                        >
                                                            <Icons.Download className="w-5 h-5" />
                                                            Download PDF
                                                        </button>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleShareCertificate(course, 'linkedin')}
                                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <Icons.Linkedin className="w-4 h-4" />
                                                                LinkedIn
                                                            </button>
                                                            <button
                                                                onClick={() => handleShareCertificate(course, 'twitter')}
                                                                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <Icons.Twitter className="w-4 h-4" />
                                                                Twitter
                                                            </button>
                                                            <button
                                                                onClick={() => handleShareCertificate(course, 'facebook')}
                                                                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <Icons.Facebook className="w-4 h-4" />
                                                                Facebook
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-16 text-center shadow-lg">
                                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Icons.FileText className="w-16 h-16 text-gray-400" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900 mb-3">No Certificates Yet</h3>
                                        <p className="text-gray-600 text-lg mb-8">Complete courses and pass assessments to earn certificates</p>
                                        <button
                                            onClick={() => router.push('/courses')}
                                            className="bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3 text-lg"
                                        >
                                            <Icons.BookOpen className="w-6 h-6" />
                                            Start Learning
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Certificate Preview Modal */}
            {selectedCertificate && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scaleIn">
                        <div className="p-8 border-b-2 border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-[#021d49] to-blue-700 p-3 rounded-xl">
                                        <Icons.Award className="w-8 h-8 text-white" />
                                    </div>
                                    Claim Your Certificate
                                </h3>
                                <button
                                    onClick={() => setSelectedCertificate(null)}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-3 rounded-xl transition-all"
                                >
                                    <Icons.X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Certificate Preview */}
                            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-4 border-[#021d49] rounded-2xl p-12 mb-8 text-center relative overflow-hidden shadow-xl">
                                {/* Decorative corners */}
                                <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#021d49] opacity-50"></div>
                                <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#021d49] opacity-50"></div>
                                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#021d49] opacity-50"></div>
                                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#021d49] opacity-50"></div>

                                <div className="relative z-10">
                                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl inline-block mb-6 shadow-lg">
                                        <Icons.Award className="w-24 h-24 text-[#021d49]" />
                                    </div>
                                    <h4 className="text-sm text-gray-600 mb-3 font-bold uppercase tracking-wider">Certificate of Completion</h4>
                                    <h2 className="text-4xl font-black text-gray-900 mb-6">{selectedCertificate.title}</h2>
                                    <p className="text-gray-700 mb-3 text-lg">This certifies that</p>
                                    <p className="text-3xl font-black text-[#021d49] mb-6">Your Name</p>
                                    <p className="text-gray-700 mb-8 text-lg">has successfully completed the course</p>
                                    <div className="flex items-center justify-center gap-12 text-sm text-gray-600">
                                        <div>
                                            <p className="font-bold mb-1">Issue Date</p>
                                            <p className="text-[#021d49] font-semibold">{new Date().toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold mb-1">Certificate ID</p>
                                            <p className="text-[#021d49] font-semibold">CERT-{selectedCertificate.id}-2024</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        handleDownloadCertificate(selectedCertificate);
                                        setSelectedCertificate(null);
                                    }}
                                    className="w-full bg-gradient-to-r from-[#021d49] to-blue-700 hover:from-[#032e6b] hover:to-blue-800 text-white py-5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
                                >
                                    <Icons.Download className="w-6 h-6" />
                                    Download Certificate
                                </button>
                                <button
                                    onClick={() => setSelectedCertificate(null)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-5 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
