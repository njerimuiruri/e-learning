"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import adminService from "@/lib/api/adminService";

const statusStyles = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "Clock" },
    approved: { bg: "bg-green-100", text: "text-green-800", icon: "CheckCircle" },
    rejected: { bg: "bg-red-100", text: "text-red-800", icon: "XCircle" },
};

export default function InstructorDetailPage() {
    const router = useRouter();
    const params = useParams();
    const instructorId = params?.id;

    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        if (!instructorId) return;

        const fetchInstructor = async () => {
            setLoading(true);
            setError("");
            try {
                const { instructor: data } = await adminService.getInstructorDetails(String(instructorId));
                setInstructor(data);
            } catch (err) {
                setError("Failed to load instructor details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchInstructor();
    }, [instructorId]);

    const status = instructor?.instructorStatus || "pending";
    const statusStyle = statusStyles[status] || statusStyles.pending;
    const StatusIcon = Icons[statusStyle.icon];

    const initials = useMemo(() => {
        const fullName = `${instructor?.firstName || ""} ${instructor?.lastName || ""}`.trim();
        return fullName ? fullName.split(" ").map((n) => n[0]).join("") : "IN";
    }, [instructor]);

    const handleApprove = async () => {
        if (!instructorId) return;
        setActionLoading(true);
        setError("");
        try {
            await adminService.approveInstructor(String(instructorId));
            alert("Instructor approved successfully");
            router.push("/admin/instructors");
        } catch (err) {
            setError("Could not approve instructor. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            setError("Rejection reason is required");
            return;
        }
        setActionLoading(true);
        setError("");
        try {
            await adminService.rejectInstructor(String(instructorId), rejectionReason.trim());
            alert("Instructor rejected");
            router.push("/admin/instructors");
        } catch (err) {
            setError("Could not reject instructor. Please try again.");
        } finally {
            setActionLoading(false);
            setShowRejectModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading instructor details...</div>
            </div>
        );
    }

    if (error && !instructor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 text-center space-y-3">
                    <Icons.AlertTriangle className="w-6 h-6 text-red-500 mx-auto" />
                    <p className="text-gray-800 font-semibold">{error}</p>
                    <button
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => router.push("/admin/instructors")}
                    >
                        Go back to instructors
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.push("/admin/instructors")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <Icons.ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Applications</span>
                    </button>

                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        {StatusIcon && <StatusIcon className="w-4 h-4 mr-2" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                            {initials}
                        </div>
                        <div className="flex-1 space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">{instructor?.firstName} {instructor?.lastName}</h1>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <Icons.Mail className="w-4 h-4 text-gray-500" />
                                    <span>{instructor?.email}</span>
                                </div>
                                {instructor?.phoneNumber && (
                                    <div className="flex items-center gap-2">
                                        <Icons.Phone className="w-4 h-4 text-gray-500" />
                                        <span>{instructor.phoneNumber}</span>
                                    </div>
                                )}
                                {instructor?.institution && (
                                    <div className="flex items-center gap-2">
                                        <Icons.Building2 className="w-4 h-4 text-gray-500" />
                                        <span>{instructor.institution}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Icons.Calendar className="w-4 h-4 text-gray-500" />
                                    <span>Joined {new Date(instructor?.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading || status === "approved"}
                                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Icons.CheckCircle className="w-4 h-4" />
                                Approve
                            </button>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={actionLoading || status === "rejected"}
                                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Icons.XCircle className="w-4 h-4" />
                                Reject
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <Icons.AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Icons.User className="w-5 h-5 text-blue-600" />
                                Profile
                            </h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line min-h-[80px]">
                                {instructor?.bio || "No bio provided yet."}
                            </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Icons.FileText className="w-5 h-5 text-green-600" />
                                Documents
                            </h2>
                            {instructor?.cvUrl ? (
                                <a
                                    href={instructor.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <Icons.Link className="w-4 h-4" />
                                    View CV / Resume
                                </a>
                            ) : (
                                <p className="text-gray-600 text-sm">No CV uploaded yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Icons.Info className="w-5 h-5 text-purple-600" />
                                Account Summary
                            </h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-center justify-between">
                                    <span>Status</span>
                                    <span className="font-semibold capitalize">{status}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Role</span>
                                    <span className="font-semibold">Instructor</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Total Students</span>
                                    <span className="font-semibold">{instructor?.totalStudents || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Average Rating</span>
                                    <span className="font-semibold">{instructor?.avgRating || 0}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Icons.CalendarClock className="w-5 h-5 text-amber-600" />
                                Activity
                            </h3>
                            <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex items-center justify-between">
                                    <span>Created</span>
                                    <span>{new Date(instructor?.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Last Updated</span>
                                    <span>{new Date(instructor?.updatedAt || instructor?.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showRejectModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Icons.XCircle className="w-5 h-5 text-red-600" />
                                    Reject Instructor
                                </h3>
                                <button onClick={() => setShowRejectModal(false)} className="text-gray-500 hover:text-gray-800">
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">Provide a brief reason for rejection. This will be shared with the instructor.</p>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows={4}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Reason for rejection"
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
