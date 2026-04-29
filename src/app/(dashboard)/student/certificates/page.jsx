'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Award, ChevronLeft, GraduationCap } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import { Button } from '@/components/ui/button';

export default function CertificatesPage() {
    const router = useRouter();

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                    {/* Header */}
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

                    {/* Locked state */}
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-3xl bg-[#021d49]/8 flex items-center justify-center">
                                <GraduationCap className="w-12 h-12 text-[#021d49]/40" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center shadow-sm">
                                <Lock className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-foreground mb-2">Certificates Coming Soon</h2>
                        <p className="text-sm text-muted-foreground max-w-sm mb-1">
                            Certificates are not yet available. They will be issued once you have completed all required modules in a course.
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs mt-2">
                            Keep learning — your progress is being tracked.
                        </p>

                        <Button
                            onClick={() => router.push('/student')}
                            className="mt-8 bg-[#021d49] hover:bg-[#032e6b] gap-2"
                        >
                            Continue Learning
                        </Button>
                    </div>

                </div>
            </div>
        </>
    );
}
