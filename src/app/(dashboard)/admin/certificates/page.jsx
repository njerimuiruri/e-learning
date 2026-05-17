'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Award, BookOpen, CheckCircle, Clock, Loader2, RefreshCw, Star, TrendingUp, X, CheckCheck } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { certificateService } from '@/lib/api/adminService';
import { CertificatesDataTable } from './_components/certificates-data-table';
import { buildCertificateColumns } from './_components/columns';

function StatCard({ label, value, helper, icon: Icon, tone }) {
    return (
        <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
                <div className={`mb-3 inline-flex rounded-lg p-2 ${tone}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-gray-950">{value}</p>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="mt-1 text-xs text-gray-500">{helper}</p>
            </CardContent>
        </Card>
    );
}

export default function CertificateManagementPage() {
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [issuingAll, setIssuingAll] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await certificateService.getAll();
            setAllStudents(data.data || []);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to load data';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const byLevel = useCallback((level) => allStudents.filter(s => s.level === level), [allStudents]);

    const summary = useMemo(() => ({
        beginnerTotal:      byLevel('beginner').length,
        beginnerPending:    byLevel('beginner').filter(s => s.status === 'pending').length,
        intermediateTotal:  byLevel('intermediate').length,
        intermediatePending:byLevel('intermediate').filter(s => s.status === 'pending').length,
        advancedTotal:      byLevel('advanced').length,
        advancedPending:    byLevel('advanced').filter(s => s.status === 'pending').length,
        totalIssued:        allStudents.filter(s => s.status === 'issued').length,
        totalPending:       allStudents.filter(s => s.status === 'pending').length,
    }), [allStudents, byLevel]);

    const buildPersonalisedPdf = useCallback(async (studentName) => {
        setPdfLoading(true);
        try {
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
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            setPdfPreviewUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error('PDF error:', err);
            setPdfPreviewUrl('/documents/ARINCertificateofCompletion.pdf');
        } finally {
            setPdfLoading(false);
        }
    }, []);

    const openPreview = useCallback((student) => {
        if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
        setSelectedStudent(student);
        setShowPreview(true);
        buildPersonalisedPdf(student.name);
    }, [pdfPreviewUrl, buildPersonalisedPdf]);

    const closePreview = () => {
        setShowPreview(false);
        if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
        setSelectedStudent(null);
    };

    const handleIssueAll = async (level) => {
        const pendingCount = byLevel(level).filter(s => s.status === 'pending').length;
        if (!pendingCount) return;
        if (!confirm(`Issue certificates for all ${pendingCount} pending ${level} student${pendingCount !== 1 ? 's' : ''}?`)) return;
        setIssuingAll(true);
        try {
            const result = await certificateService.issueAll(level);
            setAllStudents(prev => prev.map(s =>
                s.level === level && s.status === 'pending'
                    ? { ...s, status: 'issued', issuedDate: new Date().toISOString() }
                    : s
            ));
            alert(`Issued ${result.issued} certificate${result.issued !== 1 ? 's' : ''}${result.failed ? `, ${result.failed} failed` : ''}.`);
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to issue all certificates');
        } finally {
            setIssuingAll(false);
        }
    };

    const handleIssueCertificate = async (student) => {
        setIssuing(true);
        try {
            await certificateService.issue(student.enrollmentId);
            setAllStudents(prev =>
                prev.map(s => s.id === student.id
                    ? { ...s, status: 'issued', issuedDate: new Date().toISOString() }
                    : s)
            );
            setSelectedStudent(s => s ? { ...s, status: 'issued' } : s);
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to issue certificate');
        } finally {
            setIssuing(false);
        }
    };

    const handleResetCertificate = async (student) => {
        if (!confirm(`Reset certificate for ${student.name}? This will move them back to "pending" and delete the issued record.`)) return;
        setResetting(true);
        try {
            await certificateService.reset(student.studentId, student.level);
            setAllStudents(prev =>
                prev.map(s => s.id === student.id
                    ? { ...s, status: 'pending', issuedDate: null }
                    : s)
            );
            setSelectedStudent(s => s ? { ...s, status: 'pending', issuedDate: null } : s);
        } catch (err) {
            alert(err?.response?.data?.message || err?.message || 'Failed to reset certificate');
        } finally {
            setResetting(false);
        }
    };

    const downloadPdf = (student) => {
        const url = pdfPreviewUrl || '/documents/ARINCertificateofCompletion.pdf';
        const link = document.createElement('a');
        link.href = url;
        link.download = `ARIN_Certificate_${(student.name || 'Student').replace(/\s+/g, '_')}.pdf`;
        link.click();
    };

    const beginnerColumns    = useMemo(() => buildCertificateColumns({ onIssue: openPreview, level: 'beginner' }),    [openPreview]);
    const intermediateColumns = useMemo(() => buildCertificateColumns({ onIssue: openPreview, level: 'intermediate' }), [openPreview]);
    const advancedColumns    = useMemo(() => buildCertificateColumns({ onIssue: openPreview, level: 'advanced' }),    [openPreview]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                        <Award className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-950">Certificate Management</h1>
                        <p className="text-sm text-gray-500">
                            {allStudents.length} student{allStudents.length !== 1 ? 's' : ''} completed all modules
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Beginner Completions"
                    value={loading ? '—' : summary.beginnerTotal}
                    helper={loading ? '' : `${summary.beginnerPending} pending certificate${summary.beginnerPending !== 1 ? 's' : ''}`}
                    icon={BookOpen}
                    tone="bg-blue-50 text-blue-700"
                />
                <StatCard
                    label="Intermediate Completions"
                    value={loading ? '—' : summary.intermediateTotal}
                    helper={loading ? '' : `${summary.intermediatePending} pending certificate${summary.intermediatePending !== 1 ? 's' : ''}`}
                    icon={TrendingUp}
                    tone="bg-amber-50 text-amber-700"
                />
                <StatCard
                    label="Advanced Completions"
                    value={loading ? '—' : summary.advancedTotal}
                    helper={loading ? '' : `${summary.advancedPending} pending certificate${summary.advancedPending !== 1 ? 's' : ''}`}
                    icon={Star}
                    tone="bg-rose-50 text-rose-700"
                />
                <StatCard
                    label="Certificates Issued"
                    value={loading ? '—' : summary.totalIssued}
                    helper={loading ? '' : `${summary.totalPending} still pending`}
                    icon={CheckCircle}
                    tone="bg-green-50 text-green-700"
                />
            </div>

            {/* Tabs + Tables */}
            {loading ? (
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </CardContent>
                </Card>
            ) : error ? (
                <Card className="border-red-200 bg-red-50 shadow-sm">
                    <CardContent className="py-10 text-center">
                        <p className="font-semibold text-red-600">Failed to load data</p>
                        <p className="mt-1 text-xs font-mono text-red-400">{error}</p>
                        <p className="mt-2 text-sm text-gray-500">Ensure the backend is running and has been restarted with the latest code.</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={fetchAll}>Retry</Button>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="beginner">
                    <TabsList className="mb-4 h-auto gap-1 bg-gray-100/80 p-1">
                        <TabsTrigger
                            value="beginner"
                            className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                        >
                            <BookOpen className="h-4 w-4" />
                            Beginner
                            {summary.beginnerPending > 0 && (
                                <span className="ml-1 rounded-full bg-yellow-300 px-1.5 py-0.5 text-xs font-bold text-yellow-900">
                                    {summary.beginnerPending}
                                </span>
                            )}
                            <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                                {summary.beginnerTotal}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="intermediate"
                            className="flex items-center gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Intermediate
                            {summary.intermediatePending > 0 && (
                                <span className="ml-1 rounded-full bg-yellow-300 px-1.5 py-0.5 text-xs font-bold text-yellow-900">
                                    {summary.intermediatePending}
                                </span>
                            )}
                            <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                                {summary.intermediateTotal}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="advanced"
                            className="flex items-center gap-2 data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                        >
                            <Star className="h-4 w-4" />
                            Advanced
                            {summary.advancedPending > 0 && (
                                <span className="ml-1 rounded-full bg-yellow-300 px-1.5 py-0.5 text-xs font-bold text-yellow-900">
                                    {summary.advancedPending}
                                </span>
                            )}
                            <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-600">
                                {summary.advancedTotal}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {['beginner', 'intermediate', 'advanced'].map((level) => {
                        const levelData = byLevel(level);
                        const pendingCount = levelData.filter(s => s.status === 'pending').length;
                        const colMap = { beginner: beginnerColumns, intermediate: intermediateColumns, advanced: advancedColumns };
                        const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
                        return (
                            <TabsContent key={level} value={level}>
                                {pendingCount > 0 && (
                                    <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                        <p className="text-sm text-amber-800 font-medium">
                                            {pendingCount} pending certificate{pendingCount !== 1 ? 's' : ''} awaiting issuance
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => handleIssueAll(level)}
                                            disabled={issuingAll}
                                            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                                        >
                                            {issuingAll
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <Award className="h-3.5 w-3.5" />
                                            }
                                            Issue All Pending
                                        </Button>
                                    </div>
                                )}
                                <CertificatesDataTable
                                    columns={colMap[level]}
                                    data={levelData}
                                    title={`${levelLabel} — ${levelData.length} fellow${levelData.length !== 1 ? 's' : ''} completed all modules`}
                                    level={level}
                                />
                            </TabsContent>
                        );
                    })}
                </Tabs>
            )}

            {/* Preview Modal */}
            {showPreview && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closePreview}>
                    <div className="flex w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl" style={{ maxHeight: '95vh' }} onClick={e => e.stopPropagation()}>

                        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Certificate Preview</h2>
                                <p className="mt-0.5 text-sm text-gray-500">{selectedStudent.name} · {selectedStudent.level} level</p>
                            </div>
                            <button onClick={closePreview} className="rounded-lg p-2 hover:bg-gray-100 transition-all">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="relative flex-1 bg-gray-100" style={{ minHeight: 500 }}>
                            {pdfLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <p className="text-sm text-gray-500">Personalising certificate…</p>
                                </div>
                            ) : pdfPreviewUrl ? (
                                <iframe src={pdfPreviewUrl} className="h-full w-full border-0" style={{ minHeight: 500 }} title="Certificate Preview" />
                            ) : null}
                        </div>

                        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 p-5">
                            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${selectedStudent.status === 'issued' ? 'text-green-600' : 'text-yellow-600'}`}>
                                {selectedStudent.status === 'issued'
                                    ? <><CheckCircle className="h-4 w-4" /> Certificate already issued</>
                                    : <><Clock className="h-4 w-4" /> Pending — review and confirm</>
                                }
                            </span>
                            <div className="flex gap-3">
                                {selectedStudent.status === 'pending' && (
                                    <Button
                                        onClick={() => handleIssueCertificate(selectedStudent)}
                                        disabled={issuing || pdfLoading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {issuing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
                                        {issuing ? 'Issuing…' : 'Confirm & Issue'}
                                    </Button>
                                )}
                                {selectedStudent.status === 'issued' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleResetCertificate(selectedStudent)}
                                        disabled={resetting}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                        Reset to Pending
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => downloadPdf(selectedStudent)}
                                    disabled={pdfLoading}
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    <Award className="mr-2 h-4 w-4" />
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
