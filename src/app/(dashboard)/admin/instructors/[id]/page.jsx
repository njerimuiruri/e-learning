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
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-start">
                        {/* Profile Picture */}
                        <div className="flex flex-col items-center">
                            {instructor?.profilePicture ? (
                                <img
                                    src={`http://localhost:5000/api/files/download/${instructor.profilePicture.replace('uploads/', '').replace(/\\/g, '/')}?inline=true`}
                                    alt={`${instructor?.firstName} ${instructor?.lastName}`}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-md"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextElementSibling) {
                                            e.target.nextElementSibling.style.display = 'flex';
                                        }
                                    }}
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-4xl font-bold border-4 border-blue-200 shadow-md">
                                    {initials}
                                </div>
                            )}
                            <span className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                {StatusIcon && <StatusIcon className="w-4 h-4 mr-2" />}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{instructor?.firstName} {instructor?.lastName}</h1>
                                <p className="text-gray-600 mt-1">Instructor Registration Details</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {/* Email */}
                                <div className="flex items-start gap-3">
                                    <Icons.Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-600 text-xs font-medium">Email</p>
                                        <p className="text-gray-900 font-medium">{instructor?.email}</p>
                                    </div>
                                </div>

                                {/* Phone */}
                                {instructor?.phoneNumber && (
                                    <div className="flex items-start gap-3">
                                        <Icons.Phone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-600 text-xs font-medium">Phone</p>
                                            <p className="text-gray-900 font-medium">{instructor.phoneNumber}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Country */}
                                {instructor?.country && (
                                    <div className="flex items-start gap-3">
                                        <Icons.Globe className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-600 text-xs font-medium">Country</p>
                                            <p className="text-gray-900 font-medium">{instructor.country}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Organization */}
                                {instructor?.organization && (
                                    <div className="flex items-start gap-3">
                                        <Icons.Building2 className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-600 text-xs font-medium">Organization</p>
                                            <p className="text-gray-900 font-medium">{instructor.organization}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Institution */}
                                {instructor?.institution && (
                                    <div className="flex items-start gap-3">
                                        <Icons.BookOpen className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-600 text-xs font-medium">Institution</p>
                                            <p className="text-gray-900 font-medium">{instructor.institution}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Join Date */}
                                <div className="flex items-start gap-3">
                                    <Icons.Calendar className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-600 text-xs font-medium">Registered</p>
                                        <p className="text-gray-900 font-medium">{new Date(instructor?.createdAt || Date.now()).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading || status === "approved"}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Icons.CheckCircle className="w-4 h-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading || status === "rejected"}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Icons.XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
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
                        {/* Bio Section */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.User className="w-5 h-5 text-blue-600" />
                                Professional Bio
                            </h2>
                            <p className="text-gray-700 leading-relaxed min-h-[80px]">
                                {instructor?.bio || "No bio provided."}
                            </p>
                        </div>

                        {/* Qualifications & Expertise */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Award className="w-5 h-5 text-purple-600" />
                                    Qualifications
                                </h2>
                                <p className="text-gray-700">
                                    {instructor?.qualifications || "Not provided."}
                                </p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Zap className="w-5 h-5 text-yellow-600" />
                                    Expertise/Specialization
                                </h2>
                                <p className="text-gray-700">
                                    {instructor?.expertise || "Not provided."}
                                </p>
                            </div>
                        </div>

                        {/* Teaching Experience */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.BookMarked className="w-5 h-5 text-indigo-600" />
                                    Teaching Experience
                                </h2>
                                <p className="text-gray-700">
                                    {instructor?.teachingExperience || "Not provided."}
                                </p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Clock className="w-5 h-5 text-orange-600" />
                                    Years of Experience
                                </h2>
                                <p className="text-gray-700 text-lg font-semibold">
                                    {instructor?.yearsOfExperience || "Not provided."}
                                </p>
                            </div>
                        </div>

                        {/* Professional Links */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.Link2 className="w-5 h-5 text-teal-600" />
                                Professional Links
                            </h2>
                            <div className="space-y-3">
                                {instructor?.linkedIn ? (
                                    <a
                                        href={instructor.linkedIn}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        <Icons.Linkedin className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">LinkedIn Profile</p>
                                            <p className="text-blue-600 hover:underline text-sm font-medium truncate">{instructor.linkedIn}</p>
                                        </div>
                                    </a>
                                ) : (
                                    <p className="text-gray-600 text-sm">LinkedIn profile not provided.</p>
                                )}

                                {instructor?.portfolio ? (
                                    <a
                                        href={instructor.portfolio}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                                    >
                                        <Icons.Globe className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Portfolio/Website</p>
                                            <p className="text-green-600 hover:underline text-sm font-medium truncate">{instructor.portfolio}</p>
                                        </div>
                                    </a>
                                ) : (
                                    <p className="text-gray-600 text-sm">Portfolio/Website not provided.</p>
                                )}
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.FileText className="w-5 h-5 text-red-600" />
                                Documents & Attachments
                            </h2>
                            <div className="space-y-3">
                                {instructor?.cvUrl ? (
                                    <a
                                        href={`http://localhost:5000/api/files/download/${instructor.cvUrl.replace('uploads/', '').replace(/\\/g, '/')}`}
                                        download={`${instructor.firstName}_${instructor.lastName}_CV.pdf`}
                                        className="flex items-center gap-3 p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <Icons.FileDown className="w-5 h-5 text-red-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">CV / Resume</p>
                                            <p className="text-red-600 hover:underline text-sm font-medium">Download PDF</p>
                                        </div>
                                    </a>
                                ) : (
                                    <p className="text-gray-600 text-sm">No CV uploaded.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Account Summary */}
                    <div className="space-y-4">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.Info className="w-5 h-5 text-purple-600" />
                                Account Summary
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">Status</span>
                                    <span className="font-semibold capitalize px-2 py-1 rounded text-xs bg-gray-200">{status}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">Role</span>
                                    <span className="font-semibold">Instructor</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">Total Students</span>
                                    <span className="font-semibold">{instructor?.totalStudents || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">Average Rating</span>
                                    <span className="font-semibold">{instructor?.avgRating?.toFixed(2) || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.CalendarClock className="w-5 h-5 text-amber-600" />
                                Activity Timeline
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">Registered</span>
                                    <span className="font-semibold">{new Date(instructor?.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-gray-600">Last Updated</span>
                                    <span className="font-semibold">{new Date(instructor?.updatedAt || instructor?.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-base font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <Icons.Bell className="w-5 h-5 text-blue-600" />
                                Note
                            </h3>
                            <p className="text-sm text-blue-800">
                                Review all the information provided by the instructor. Approve if all details are valid and complete, or reject with a specific reason if needed.
                            </p>
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
