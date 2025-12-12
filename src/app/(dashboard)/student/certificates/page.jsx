'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import Navbar from '@/components/navbar/navbar';

export default function CertificatesPage() {
    const router = useRouter();
    const [certificates, setCertificates] = useState([]);
    const [selectedTab, setSelectedTab] = useState('earned');
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Claimed certificates: those that are valid (already filtered as earnedCertificates)
    const claimedCertificates = certificates.filter(c => c.isValid);
    // Completed courses: unique courseIds from claimed certificates
    const completedCourses = [...new Set(claimedCertificates.map(c => c.courseId))];

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Get enrollments with certificates
            const enrollmentData = await courseService.getMyEnrollments();
            const completedWithCerts = enrollmentData.enrollments
                ?.filter(e => e.isCompleted && e.certificateEarned)
                .map(e => ({
                    _id: e.certificateId || e._id,
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
    const availableCertificates = []; // Could add logic for eligible but unclaimed

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
            alert('Certificate claimed successfully!');
        } catch (err) {
            alert('Failed to claim certificate');
            console.error(err);
        }
    };

    const handleDownloadCertificate = async (certificate) => {
        try {
            if (certificate.certificateUrl) {
                // Open certificate URL in new tab
                window.open(certificate.certificateUrl, '_blank');
            } else {
                alert('Certificate URL not available');
            }
        } catch (err) {
            alert('Failed to download certificate');
            console.error(err);
        }
    };

    const handleShareCertificate = (certificate, platform) => {
        const shareUrl = `${window.location.origin}/certificates/${certificate.certificateNumber}`;
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading certificates...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/student')}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                            >
                                <Icons.ChevronLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Back to Dashboard</span>
                            </button>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                                Your Certificates
                            </h1>
                            <p className="text-gray-600">
                                Claim and manage your course completion certificates
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <Icons.Award className="w-8 h-8" />
                                    <span className="text-3xl font-bold">{availableCertificates.length}</span>
                                </div>
                                <p className="text-blue-100 text-sm">Available to Claim</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <Icons.CheckCircle className="w-8 h-8" />
                                    <span className="text-3xl font-bold">{claimedCertificates.length}</span>
                                </div>
                                <p className="text-green-100 text-sm">Certificates Claimed</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <Icons.GraduationCap className="w-8 h-8" />
                                    <span className="text-3xl font-bold">{completedCourses.length}</span>
                                </div>
                                <p className="text-purple-100 text-sm">Courses Completed</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl border border-gray-200 mb-6">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setSelectedTab('available')}
                                    className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${selectedTab === 'available'
                                        ? 'text-green-600 border-b-2 border-green-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Available ({availableCertificates.length})
                                </button>
                                <button
                                    onClick={() => setSelectedTab('claimed')}
                                    className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${selectedTab === 'claimed'
                                        ? 'text-green-600 border-b-2 border-green-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Claimed ({claimedCertificates.length})
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
                                                className="bg-white rounded-xl border-2 border-gray-200 hover:border-green-300 hover:shadow-lg transition-all overflow-hidden"
                                            >
                                                <div className="relative h-48 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Icons.Award className="w-16 h-16 text-green-600 mx-auto mb-3" />
                                                        <p className="text-sm text-gray-600 mb-1">Certificate of Completion</p>
                                                        <h3 className="font-bold text-gray-900 px-4">{course.title}</h3>
                                                    </div>
                                                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                                        Ready to Claim
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Icons.Calendar className="w-4 h-4" />
                                                            <span>Completed: {new Date(course.completedDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleClaimCertificate(course)}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.Download className="w-5 h-5" />
                                                        Claim Certificate
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                        <Icons.Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Certificates Available</h3>
                                        <p className="text-gray-600 mb-6">Complete a course to earn your certificate</p>
                                        <button
                                            onClick={() => router.push('/courses')}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                        >
                                            Browse Courses
                                            <Icons.ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Claimed Certificates */}
                        {selectedTab === 'claimed' && (
                            <div className="space-y-6">
                                {claimedCertificates.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {claimedCertificates.map((course) => (
                                            <div
                                                key={course.id}
                                                className="bg-white rounded-xl border-2 border-green-200 shadow-md hover:shadow-xl transition-all overflow-hidden"
                                            >
                                                <div className="relative h-48 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                                                    <div className="text-center">
                                                        <Icons.CheckCircle className="w-16 h-16 mx-auto mb-3" />
                                                        <p className="text-sm text-green-100 mb-1">Certificate of Completion</p>
                                                        <h3 className="font-bold px-4">{course.title}</h3>
                                                    </div>
                                                    <div className="absolute top-4 right-4 bg-white text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                                        Verified
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Icons.Calendar className="w-4 h-4" />
                                                            <span>Issued: {new Date(course.certificateDate || course.completedDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={() => handleDownloadCertificate(course)}
                                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Icons.Download className="w-5 h-5" />
                                                            Download PDF
                                                        </button>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleShareCertificate(course, 'LinkedIn')}
                                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <Icons.Linkedin className="w-4 h-4" />
                                                                LinkedIn
                                                            </button>
                                                            <button
                                                                onClick={() => handleShareCertificate(course, 'Twitter')}
                                                                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                                                            >
                                                                <Icons.Twitter className="w-4 h-4" />
                                                                Twitter
                                                            </button>
                                                            <button
                                                                onClick={() => handleShareCertificate(course, 'Facebook')}
                                                                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
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
                                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                        <Icons.FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Claimed Certificates Yet</h3>
                                        <p className="text-gray-600">Your claimed certificates will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Certificate Claim Modal */}
            {selectedCertificate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-900">Claim Your Certificate</h3>
                                <button
                                    onClick={() => setSelectedCertificate(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <Icons.X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Certificate Preview */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-600 rounded-xl p-8 mb-6 text-center">
                                <Icons.Award className="w-20 h-20 text-green-600 mx-auto mb-4" />
                                <h4 className="text-sm text-gray-600 mb-2">CERTIFICATE OF COMPLETION</h4>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedCertificate.title}</h2>
                                <p className="text-gray-700 mb-2">This certifies that</p>
                                <p className="text-xl font-bold text-green-700 mb-4">Faith Muiruri</p>
                                <p className="text-gray-700 mb-6">has successfully completed the course</p>
                                <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                                    <div>
                                        <p className="font-medium">Issue Date</p>
                                        <p>{new Date().toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Certificate ID</p>
                                        <p>CERT-{selectedCertificate.id}-2024</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        handleDownloadCertificate(selectedCertificate);
                                        setSelectedCertificate(null);
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Icons.Download className="w-5 h-5" />
                                    Download Certificate
                                </button>
                                <button
                                    onClick={() => setSelectedCertificate(null)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
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