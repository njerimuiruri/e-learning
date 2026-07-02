'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Award, BookOpen, ChevronLeft, Download, FileText,
    GraduationCap, Lock, Loader2, Star, TrendingUp, CheckCircle, Calendar, Hash,
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Navbar from '@/components/navbar/navbar';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/config';

const LEVEL = {
    beginner:     { icon: BookOpen,   color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-100',  dot: 'bg-blue-600',  label: 'Beginner'     },
    intermediate: { icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500', label: 'Intermediate' },
    advanced:     { icon: Star,       color: 'text-rose-600',  bg: 'bg-rose-50',  border: 'border-rose-100',  dot: 'bg-rose-600',  label: 'Advanced'     },
};

async function buildCertificatePdf(studentName) {
    const res = await fetch('/documents/ARINCertificateofCompletion.pdf');
    const templateBytes = await res.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 28;
    const textWidth = font.widthOfTextAtSize(studentName, fontSize);
    page.drawText(studentName, {
        x: (width - textWidth) / 2,
        y: height * 0.487,
        size: fontSize,
        font,
        color: rgb(0.008, 0.114, 0.286),
    });
    const pdfBytes = await pdfDoc.save();
    return URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
}

function CertificateCard({ cert }) {
    const [dlCert, setDlCert] = useState(false);
    const [dlTrans, setDlTrans] = useState(false);
    const t = LEVEL[cert.moduleLevel] || LEVEL.beginner;
    const Icon = t.icon;

    const handleDownloadCert = async () => {
        setDlCert(true);
        try {
            const url = await buildCertificatePdf(cert.studentName);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ARIN_Certificate_${cert.moduleLevel}_${cert.studentName.replace(/\s+/g, '_')}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch { alert('Could not generate PDF. Please try again.'); }
        finally { setDlCert(false); }
    };

    const handleDownloadTranscript = async () => {
        setDlTrans(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org'}/api/certificates/module/student/transcript/${cert.moduleLevel}`,
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            if (!res.ok) throw new Error('Failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ARIN_Transcript_${cert.moduleLevel}_${cert.studentName.replace(/\s+/g, '_')}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch { alert('Could not generate transcript. Please try again.'); }
        finally { setDlTrans(false); }
    };

    const issued = cert.issuedDate
        ? new Date(cert.issuedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Thin level accent line */}
            <div className={`h-0.5 w-full ${t.dot}`} />

            <div className="p-6">
                {/* Header row */}
                <div className="flex items-start gap-4 mb-5">
                    <div className={`w-11 h-11 rounded-xl ${t.bg} ${t.border} border flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${t.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-[15px] leading-snug">
                            {cert.moduleName || 'Certificate of Completion'}
                        </p>
                        <span className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.bg} ${t.color}`}>
                            {t.label} Level
                        </span>
                    </div>
                    <div className="shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-50 mb-4" />

                {/* Meta details */}
                <div className="space-y-2.5 mb-5">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="text-gray-400 text-xs w-20 shrink-0">Issued on</span>
                        <span className="font-medium text-gray-700 text-xs">{issued}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Hash className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="text-gray-400 text-xs w-20 shrink-0">Certificate ID</span>
                        <span className="font-mono text-gray-600 text-xs truncate">{cert.certificateNumber || ''}</span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleDownloadCert}
                        disabled={dlCert}
                        className="flex items-center justify-center gap-1.5 bg-[#021d49] hover:bg-[#032e6b] disabled:opacity-60 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors"
                    >
                        {dlCert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Certificate
                    </button>
                    <button
                        onClick={handleDownloadTranscript}
                        disabled={dlTrans}
                        className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-60 text-gray-700 text-xs font-semibold py-2.5 px-3 rounded-xl border border-gray-200 transition-colors"
                    >
                        {dlTrans ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        Transcript
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CertificatesPage() {
    const router = useRouter();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/certificates/module/student/my-certificates')
            .then(res => setCertificates(Array.isArray(res.data) ? res.data : []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50/50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

                    {/* Back */}
                    <button
                        onClick={() => router.push('/student')}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>

                    {/* Page title */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <Award className="w-6 h-6 text-[#021d49]" />
                            <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
                        </div>
                        <p className="text-sm text-gray-400 ml-9">
                            {loading
                                ? 'Loading your certificates…'
                                : certificates.length > 0
                                    ? `${certificates.length} certificate${certificates.length !== 1 ? 's' : ''} earned  download your certificate & transcript below`
                                    : 'Your certificates will appear here once issued'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                <GraduationCap className="w-8 h-8 text-gray-300" />
                            </div>
                            <h2 className="text-base font-semibold text-gray-700 mb-1">No certificates yet</h2>
                            <p className="text-sm text-gray-400 max-w-xs">
                                Complete all modules at your level and your admin will issue your certificate here.
                            </p>
                            <button
                                onClick={() => router.push('/student')}
                                className="mt-6 bg-[#021d49] hover:bg-[#032e6b] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                            >
                                Continue Learning
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {certificates.map(cert => (
                                <CertificateCard key={cert._id} cert={cert} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
