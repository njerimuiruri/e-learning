'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';

export default function InstructorApprovalsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [viewMode, setViewMode] = useState('cards');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const [instructorApplications, setInstructorApplications] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    useEffect(() => {
        fetchInstructors();
    }, [filterStatus]);

    const fetchInstructors = async () => {
        try {
            setLoading(true);
            const response = await adminService.getAllInstructors({
                status: filterStatus === 'all' ? null : filterStatus,
                limit: 100,
            });

            setInstructorApplications(response.instructors || []);

            // Calculate stats
            const allInstructors = response.instructors || [];
            setStats({
                total: allInstructors.length,
                pending: allInstructors.filter(i => i.instructorStatus === 'pending').length,
                approved: allInstructors.filter(i => i.instructorStatus === 'approved').length,
                rejected: allInstructors.filter(i => i.instructorStatus === 'rejected').length,
            });
        } catch (error) {
            console.error('Error fetching instructors:', error);
            alert('Failed to load instructors');
        } finally {
            setLoading(false);
        }
    };

    const filteredApplications = instructorApplications.filter(app => {
        const matchesSearch =
            `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.institution?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleApprove = async () => {
        try {
            await adminService.approveInstructor(selectedInstructor._id);
            alert('Instructor approved successfully!');
            setShowApproveModal(false);
            setSelectedInstructor(null);
            fetchInstructors();
        } catch (error) {
            console.error('Error approving instructor:', error);
            alert(error.message || 'Failed to approve instructor');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await adminService.rejectInstructor(selectedInstructor._id, rejectionReason);
            alert('Application rejected');
            setShowRejectModal(false);
            setSelectedInstructor(null);
            setRejectionReason('');
            fetchInstructors();
        } catch (error) {
            console.error('Error rejecting instructor:', error);
            alert(error.message || 'Failed to reject instructor');
        }
    };

    const handleDeleteInstructor = async (instructorId) => {
        if (!confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
            return;
        }

        try {
            await adminService.deleteUser(instructorId);
            alert('Instructor deleted successfully');
            fetchInstructors();
        } catch (error) {
            console.error('Error deleting instructor:', error);
            alert(error.message || 'Failed to delete instructor');
        }
    };

    const statsList = [
        { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { label: 'Approved', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading instructors...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Instructor Applications</h1>
                    <p className="text-gray-600 text-sm">Review and manage instructor applications</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    {statsList.map((stat, idx) => (
                        <div key={idx} className={`${stat.bg} rounded-lg p-4 border border-gray-200`}>
                            <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or institution..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <div className="flex gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'cards'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icons.LayoutGrid className="w-4 h-4" />
                                Cards
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'table'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icons.List className="w-4 h-4" />
                                Table
                            </button>
                        </div>
                    </div>
                </div>

                {/* Applications Grid */}
                {viewMode === 'cards' ? (
                    <div className="grid gap-4">
                        {filteredApplications.map((app) => (
                            <div key={app._id} className="bg-white rounded-lg p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Avatar */}
                                    {app.profilePicture ? (
                                        <img
                                            src={`https://api.elearning.arin-africa.orgapi/files/download/${app.profilePicture.replace('uploads/', '').replace(/\\/g, '/')}?inline=true`}
                                            alt={`${app.firstName} ${app.lastName}`}
                                            className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                if (e.target.nextElementSibling) {
                                                    e.target.nextElementSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${app.profilePicture ? 'hidden' : ''}`}>
                                        {app.firstName?.[0]}{app.lastName?.[0]}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                    {app.firstName} {app.lastName}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-1">{app.email}</p>
                                                <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500">
                                                    {app.phoneNumber && (
                                                        <>
                                                            <span className="flex items-center gap-1">
                                                                <Icons.Phone className="w-3 h-3" />
                                                                {app.phoneNumber}
                                                            </span>
                                                            <span>•</span>
                                                        </>
                                                    )}
                                                    {app.country && (
                                                        <span className="flex items-center gap-1">
                                                            <Icons.MapPin className="w-3 h-3" />
                                                            {app.country}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.instructorStatus)} whitespace-nowrap`}>
                                                {app.instructorStatus?.charAt(0).toUpperCase() + app.instructorStatus?.slice(1)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                            {app.institution && (
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <p className="text-xs text-gray-600 mb-1">Institution</p>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{app.institution}</p>
                                                </div>
                                            )}
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <p className="text-xs text-gray-600 mb-1">Applied</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <p className="text-xs text-gray-600 mb-1">Status</p>
                                                <p className="text-sm font-semibold text-gray-900 capitalize">{app.instructorStatus}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 items-center justify-between">
                                            <div className="flex gap-2 text-xs">
                                                {app.cvUrl && (
                                                    <span className="flex items-center gap-1 text-green-700">
                                                        <Icons.CheckCircle className="w-3 h-3" />
                                                        CV
                                                    </span>
                                                )}
                                                {app.profilePhotoUrl && (
                                                    <span className="flex items-center gap-1 text-green-700">
                                                        <Icons.CheckCircle className="w-3 h-3" />
                                                        Photo
                                                    </span>
                                                )}
                                                {app.bio && (
                                                    <span className="flex items-center gap-1 text-green-700">
                                                        <Icons.CheckCircle className="w-3 h-3" />
                                                        Bio
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/instructors/${app._id}`)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <Icons.Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                                {app.instructorStatus === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInstructor(app);
                                                                setShowApproveModal(true);
                                                            }}
                                                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Icons.Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInstructor(app);
                                                                setShowRejectModal(true);
                                                            }}
                                                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <Icons.X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteInstructor(app._id)}
                                                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                                    title="Delete Instructor"
                                                >
                                                    <Icons.Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Instructor</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Institution</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredApplications.map((app) => (
                                        <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                        {app.firstName?.[0]}{app.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">
                                                            {app.firstName} {app.lastName}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{app.country || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">{app.email}</div>
                                                <div className="text-xs text-gray-500">{app.phoneNumber || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {app.institution || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.instructorStatus)}`}>
                                                    {app.instructorStatus?.charAt(0).toUpperCase() + app.instructorStatus?.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/admin/instructors/${app._id}`)}
                                                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Icons.Eye className="w-4 h-4" />
                                                    </button>
                                                    {app.instructorStatus === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedInstructor(app);
                                                                    setShowApproveModal(true);
                                                                }}
                                                                className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                                                                title="Approve"
                                                            >
                                                                <Icons.Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedInstructor(app);
                                                                    setShowRejectModal(true);
                                                                }}
                                                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                                                title="Reject"
                                                            >
                                                                <Icons.X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {filteredApplications.length === 0 && (
                    <div className="bg-white rounded-lg p-12 text-center">
                        <Icons.Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
                        <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && selectedInstructor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Approve Instructor?</h3>
                            <p className="text-center text-gray-600 mb-6">
                                <strong>{selectedInstructor.firstName} {selectedInstructor.lastName}</strong> will be approved as an instructor and notified via email.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowApproveModal(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedInstructor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Reject Application?</h3>
                            <p className="text-center text-gray-600 mb-4">
                                Please provide a reason for rejecting <strong>{selectedInstructor.firstName} {selectedInstructor.lastName}'s</strong> application.
                            </p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-4"
                                rows="4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason('');
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}