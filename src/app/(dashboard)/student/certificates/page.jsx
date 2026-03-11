'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Award, CheckCircle, Layers, TrendingUp, Download, Eye, Share2,
    Calendar, Hash, BadgeCheck, BookOpen, ChevronLeft, ArrowUpRight,
    Loader2, AlertCircle, GraduationCap, Medal,
} from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    HoverCard, HoverCardContent, HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const levelConfig = {
    beginner: { class: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Beginner' },
    intermediate: { class: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Intermediate' },
    advanced: { class: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Advanced' },
};

/* ─── Skeleton ─── */
function SkeletonCard() {
    return (
        <Card className="overflow-hidden animate-pulse border border-border">
            <div className="h-44 bg-muted" />
            <CardContent className="p-5 space-y-3">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="flex gap-2 mt-2">
                    <div className="h-6 bg-muted rounded-full w-24" />
                    <div className="h-6 bg-muted rounded-full w-16" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex gap-2 pt-1">
                    <div className="h-8 bg-muted rounded flex-1" />
                    <div className="h-8 bg-muted rounded w-9" />
                    <div className="h-8 bg-muted rounded w-9" />
                </div>
            </CardContent>
        </Card>
    );
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, value, label, iconClass, valueClass }) {
    return (
        <Card className="border border-border">
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

/* ─── Certificate Card ─── */
function CertificateCard({ cert, onDownload, onView, onShare }) {
    const moduleName = cert.moduleName || cert.moduleId?.title || 'Module';
    const moduleLevel = cert.moduleLevel || cert.moduleId?.level;
    const categoryName = cert.categoryName || cert.categoryId?.name || '';
    const score = cert.score || cert.finalScore || 0;
    const issueDate = cert.issuedAt || cert.createdAt;
    const levelCfg = levelConfig[moduleLevel] || levelConfig.beginner;

    const scoreColor =
        score >= 80 ? 'text-emerald-600' :
            score >= 60 ? 'text-amber-600' :
                'text-rose-600';

    return (
        <Card className="overflow-hidden border border-border hover:border-emerald-300 hover:shadow-md transition-all duration-200 group flex flex-col">
            {/* Hero banner */}
            <div className="relative h-44 bg-gradient-to-br from-[#021d49] via-blue-800 to-teal-700 flex flex-col items-center justify-center text-white overflow-hidden shrink-0">
                {/* decorative blobs */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

                <div className="relative z-10 text-center px-5">
                    <div className="inline-flex p-3 bg-white/15 rounded-2xl mb-2.5 group-hover:scale-110 transition-transform duration-200">
                        <GraduationCap className="w-9 h-9" />
                    </div>
                    <p className="text-[10px] text-blue-200 font-semibold uppercase tracking-widest mb-1">
                        Certificate of Completion
                    </p>
                    <h3 className="font-bold text-sm leading-snug line-clamp-2">{moduleName}</h3>
                </div>

                {/* top badges */}
                <Badge className="absolute top-3 right-3 bg-white/95 text-emerald-700 border-0 text-[10px] gap-1 shadow-sm">
                    <BadgeCheck className="w-3 h-3" /> Verified
                </Badge>
                {moduleLevel && (
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/90 ${levelCfg.class}`}>
                        {levelCfg.label}
                    </span>
                )}
            </div>

            {/* Body */}
            <CardContent className="p-5 flex flex-col flex-1">
                {categoryName && (
                    <p className="text-[10px] font-bold text-[#021d49] uppercase tracking-wider mb-2">
                        {categoryName}
                    </p>
                )}

                {/* Meta chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {issueDate ? new Date(issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted ${scoreColor}`}>
                        <TrendingUp className="w-3 h-3" />
                        {typeof score === 'number' ? score.toFixed(0) : score}%
                    </span>
                    {cert.certificateNumber && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full cursor-default">
                                        <Hash className="w-3 h-3" />
                                        {cert.certificateNumber.slice(0, 8)}…
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">{cert.certificateNumber}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                <Separator className="mb-4" />

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    <Button
                        onClick={() => onDownload(cert)}
                        className="flex-1 bg-[#021d49] hover:bg-[#032e6b] text-white gap-1.5 h-8 text-xs"
                        size="sm"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </Button>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onView(cert)}>
                                    <Eye className="w-3.5 h-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">View certificate</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                            <Share2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Share</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent align="end" className="w-40 text-sm">
                            <DropdownMenuItem onClick={() => onShare(cert, 'linkedin')} className="gap-2 cursor-pointer">
                                LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(cert, 'twitter')} className="gap-2 cursor-pointer">
                                Twitter / X
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(cert, 'facebook')} className="gap-2 cursor-pointer">
                                Facebook
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}

/* ─── Main Page ─── */
export default function CertificatesPage() {
    const router = useRouter();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchCertificates(); }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/certificates/module/student/my-certificates`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch certificates');
            const data = await res.json();
            setCertificates(Array.isArray(data) ? data : data?.certificates || []);
        } catch (err) {
            setError('Failed to load certificates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (cert) => {
        try {
            const publicId = cert.publicId || cert.certificatePublicId;
            if (!publicId) return;
            const res = await fetch(`${API_URL}/api/certificates/module/public/${publicId}/download`);
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${(cert.moduleName || 'module').replace(/\s+/g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch { alert('Failed to download certificate.'); }
    };

    const handleView = (cert) => {
        const publicId = cert.publicId || cert.certificatePublicId;
        if (publicId) window.open(`${API_URL}/api/certificates/module/public/${publicId}/view`, '_blank');
    };

    const handleShare = (cert, platform) => {
        const publicId = cert.publicId || cert.certificatePublicId;
        const shareUrl = `${window.location.origin}/certificates/module/${publicId}`;
        const name = cert.moduleName || cert.moduleId?.title || 'a module';
        const text = `I've earned a certificate for completing "${name}"!`;
        const urls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        };
        if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400');
    };

    const uniqueModules = [...new Set(certificates.map(c => c.moduleId?._id || c.moduleId))].length;
    const bestScore = certificates.length
        ? Math.max(...certificates.map(c => c.score || c.finalScore || 0))
        : 0;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                    {/* ── Header ── */}
                    <div className="mb-7">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/student')}
                            className="gap-1.5 text-muted-foreground mb-5 -ml-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#021d49] flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
                                <p className="text-sm text-muted-foreground">Showcase your achievements and share your success</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
                        <StatCard
                            icon={Medal}
                            value={certificates.length}
                            label="Certificates Earned"
                            iconClass="bg-[#021d49]/10 text-[#021d49]"
                            valueClass="text-[#021d49]"
                        />
                        <StatCard
                            icon={Layers}
                            value={uniqueModules}
                            label="Modules Completed"
                            iconClass="bg-emerald-100 text-emerald-600"
                            valueClass="text-emerald-600"
                        />
                        <StatCard
                            icon={TrendingUp}
                            value={`${typeof bestScore === 'number' ? bestScore.toFixed(0) : bestScore}%`}
                            label="Best Score"
                            iconClass="bg-purple-100 text-purple-600"
                            valueClass="text-purple-600"
                        />
                    </div>

                    {/* ── Content ── */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : error ? (
                        <Alert variant="destructive" className="max-w-lg">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between gap-4">
                                {error}
                                <Button size="sm" variant="outline" onClick={fetchCertificates}>
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    ) : certificates.length > 0 ? (
                        <>
                            <p className="text-xs text-muted-foreground mb-4">
                                {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {certificates.map(cert => (
                                    <CertificateCard
                                        key={cert._id}
                                        cert={cert}
                                        onDownload={handleDownload}
                                        onView={handleView}
                                        onShare={handleShare}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <Card className="border-dashed border-2 border-border">
                            <CardContent className="py-20 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                    <Award className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground mb-1">No Certificates Yet</h3>
                                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                                    Complete modules and pass the final assessment to earn your first certificate.
                                </p>
                                <Button
                                    onClick={() => router.push('/student/modules')}
                                    className="bg-[#021d49] hover:bg-[#032e6b] gap-2"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Browse Modules
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}