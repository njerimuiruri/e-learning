'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function AdminRemindersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [studentsNotFinished, setStudentsNotFinished] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [reminderMessage, setReminderMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showMessageModal, setShowMessageModal] = useState(false);

    const limit = 50;

    useEffect(() => {
        fetchStudentsNotFinished();
    }, [currentPage]);

    const fetchStudentsNotFinished = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/reminders/students-not-finished?page=${currentPage}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch students');

            const data = await response.json();
            setStudentsNotFinished(data.students || []);
            setTotalPages(Math.ceil(data.total / limit));
            setErrorMessage('');
        } catch (err) {
            console.error('Error fetching students:', err);
            setErrorMessage('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (enrollmentId) => {
        setSelectedStudents((prev) =>
            prev.includes(enrollmentId)
                ? prev.filter((id) => id !== enrollmentId)
                : [...prev, enrollmentId]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudents.length === studentsNotFinished.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(studentsNotFinished.map((s) => s.enrollmentId));
        }
    };

    const handleSendReminders = async () => {
        if (selectedStudents.length === 0) {
            setErrorMessage('Please select at least one student');
            return;
        }

        try {
            setSending(true);
            setErrorMessage('');
            setSuccessMessage('');

            const token = localStorage.getItem('token');

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/reminders/send-bulk`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        enrollmentIds: selectedStudents,
                        message: reminderMessage.trim() || undefined,
                    }),
                }
            );

            if (!response.ok) throw new Error('Failed to send reminders');

            const data = await response.json();
            setSuccessMessage(
                `Reminders sent successfully! ${data.sent} email(s) sent${data.failed > 0 ? `, ${data.failed} failed` : ''
                }`
            );

            setSelectedStudents([]);
            setReminderMessage('');
            setShowMessageModal(false);

            // Refresh the list
            setTimeout(() => fetchStudentsNotFinished(), 1500);
        } catch (err) {
            console.error('Error sending reminders:', err);
            setErrorMessage(err.message || 'Failed to send reminders');
        } finally {
            setSending(false);
        }
    };

    const handleSendToAll = async () => {
        if (
            !window.confirm(
                `Send reminders to all ${studentsNotFinished.length} students who haven't finished their courses?`
            )
        ) {
            return;
        }

        try {
            setSending(true);
            setErrorMessage('');
            setSuccessMessage('');

            const token = localStorage.getItem('token');

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/reminders/send-all`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: reminderMessage.trim() || undefined,
                    }),
                }
            );

            if (!response.ok) throw new Error('Failed to send reminders');

            const data = await response.json();
            setSuccessMessage(
                `Reminders sent to all students! ${data.sent} email(s) sent${data.failed > 0 ? `, ${data.failed} failed` : ''
                }`
            );

            setReminderMessage('');
            setShowMessageModal(false);

            // Refresh the list
            setTimeout(() => fetchStudentsNotFinished(), 1500);
        } catch (err) {
            console.error('Error sending reminders:', err);
            setErrorMessage(err.message || 'Failed to send reminders');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <Icons.ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Course Reminders</h1>
                                <p className="text-sm text-gray-600">Send reminders to students who haven't finished their courses</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
                        >
                            Back to Admin
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Alert Messages */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <Icons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-green-700">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <Icons.AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-700">{errorMessage}</p>
                    </div>
                )}

                {/* Stats Card */}
                <div className="mb-8 bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600">Students Not Finished</p>
                            <p className="text-3xl font-bold text-gray-900">{studentsNotFinished.length}</p>
                        </div>
                        <Icons.Users className="w-12 h-12 text-orange-500 opacity-20" />
                    </div>
                    <p className="text-sm text-gray-600">
                        These students enrolled but haven't completed their courses yet
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mb-8 flex gap-4">
                    <button
                        onClick={() => setShowMessageModal(true)}
                        disabled={selectedStudents.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                        <Icons.Mail className="w-4 h-4" />
                        Send to Selected ({selectedStudents.length})
                    </button>
                    <button
                        onClick={() => {
                            setShowMessageModal(true);
                            setReminderMessage('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Icons.SendHorizontal className="w-4 h-4" />
                        Send to All
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading students...</p>
                    </div>
                ) : studentsNotFinished.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <Icons.BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">No students to remind</p>
                        <p className="text-sm text-gray-500">All enrolled students have completed their courses!</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.length === studentsNotFinished.length}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 rounded border-gray-300"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Student
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Course
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Progress
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                                Last Accessed
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsNotFinished.map((student, idx) => (
                                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student.enrollmentId)}
                                                        onChange={() => handleSelectStudent(student.enrollmentId)}
                                                        className="w-4 h-4 rounded border-gray-300"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {student.studentName}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {student.email}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {student.courseTitle}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-[#021d49] h-2 rounded-full"
                                                                style={{ width: `${student.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-gray-600 font-medium">{student.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {student.lastAccessedAt
                                                        ? new Date(student.lastAccessedAt).toLocaleDateString()
                                                        : 'Never'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Message Modal */}
                {showMessageModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Send Reminders</h3>
                                <button
                                    onClick={() => setShowMessageModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Custom Message (Optional)
                                </label>
                                <textarea
                                    value={reminderMessage}
                                    onChange={(e) => setReminderMessage(e.target.value)}
                                    placeholder="Leave empty to use default message..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                    rows="4"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    If empty, a default reminder message will be used
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowMessageModal(false)}
                                    disabled={sending}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                {selectedStudents.length > 0 ? (
                                    <button
                                        onClick={handleSendReminders}
                                        disabled={sending}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {sending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Icons.Send className="w-4 h-4" />
                                                Send ({selectedStudents.length})
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSendToAll}
                                        disabled={sending}
                                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {sending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Icons.SendHorizontal className="w-4 h-4" />
                                                Send to All
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
