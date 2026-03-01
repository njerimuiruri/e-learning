'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/components/ui/ToastProvider';

export default function CertificatePage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [certificate, setCertificate] = useState(null);

    useEffect(() => {
        const loadCertificate = async () => {
            try {
                const token = localStorage.getItem('token');
                const isUUID = params.id.includes('-'); // UUID format check

                let apiEndpoint;
                let headers = {};

                if (isUUID) {
                    // Use public endpoint for UUIDs (no auth required, more secure)
                    apiEndpoint = `https://api.elearning.arin-africa.orgapi/certificates/public/${params.id}`;
                } else {
                    // Use authenticated endpoint for internal IDs (backward compatibility)
                    if (!token) {
                        router.push('/login');
                        return;
                    }
                    apiEndpoint = `https://api.elearning.arin-africa.orgapi/certificates/${params.id}`;
                    headers = { Authorization: `Bearer ${token}` };
                }

                // Fetch certificate details
                const certResponse = await axios.get(apiEndpoint, { headers });
                setCertificate(certResponse.data);

                // Fetch PDF
                const pdfEndpoint = isUUID
                    ? `https://api.elearning.arin-africa.orgapi/certificates/public/${params.id}/view`
                    : `https://api.elearning.arin-africa.orgapi/certificates/${params.id}/view`;

                const pdfResponse = await axios.get(pdfEndpoint, {
                    headers,
                    responseType: 'blob',
                });

                // Create a blob URL for the PDF
                const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                setPdfUrl(url);
                setLoading(false);

            } catch (err) {
                console.error('Error loading certificate:', err);
                if (err.response?.status === 401) {
                    setError('Please log in to view this certificate');
                    setTimeout(() => router.push('/login'), 2000);
                } else if (err.response?.status === 404) {
                    setError('Certificate not found');
                } else {
                    setError(err.response?.data?.message || 'Failed to load certificate');
                }
                setLoading(false);
            }
        };

        if (params.id) {
            loadCertificate();
        }

        // Cleanup blob URL when component unmounts
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [params.id, router]);

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const isUUID = params.id.includes('-');

            let apiEndpoint;
            let headers = {};

            if (isUUID) {
                apiEndpoint = `https://api.elearning.arin-africa.orgapi/certificates/public/${params.id}/download`;
            } else {
                apiEndpoint = `https://api.elearning.arin-africa.orgapi/certificates/${params.id}/download`;
                headers = { Authorization: `Bearer ${token}` };
            }

            const response = await axios.get(apiEndpoint, {
                headers,
                responseType: 'blob',
            }); const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate-${certificate?.certificateNumber || params.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading certificate:', err);
            showToast('Failed to download certificate', { type: 'error', title: 'Download failed' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading certificate...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <div className="text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Error Loading Certificate
                        </h1>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => router.push('/student/certificates')}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Go to Certificates
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/student/certificates')}
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                ← Back
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Certificate of Completion
                                </h1>
                                {certificate && (
                                    <p className="text-sm text-gray-600">
                                        {certificate.courseName} • {certificate.certificateNumber}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* PDF Viewer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {pdfUrl ? (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <iframe
                            src={pdfUrl}
                            className="w-full"
                            style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
                            title="Certificate PDF"
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <p className="text-gray-600">Unable to display certificate</p>
                    </div>
                )}
            </div>
        </div>
    );
}