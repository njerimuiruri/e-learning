'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [selectedFellow, setSelectedFellow] = useState(null);
    const [reminderMessage, setReminderMessage] = useState('');

    // State for data
    const [stats, setStats] = useState(null);
    const [pendingInstructors, setPendingInstructors] = useState([]);
    const [fellowsAtRisk, setFellowsAtRisk] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityFilter, setActivityFilter] = useState('all');
    const [activityPage, setActivityPage] = useState(1);
    const [totalActivities, setTotalActivities] = useState(0);
    const activitiesPerPage = 10;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [statsData, pendingData, fellowsData, activityData] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getPendingInstructors(),
                adminService.getFellowsAtRisk(),
                adminService.getRecentActivity(50), // Fetch more for better pagination
            ]);

            // Process stats
            setStats({
                totalUsers: {
                    label: 'Total Users',
                    value: statsData.totalUsers?.toLocaleString() || '0',
                    icon: 'Users',
                    color: 'from-blue-500 to-blue-600',
                    change: statsData.userGrowth || '+0%',
                },
                activeUsers: {
                    label: 'Active (30 days)',
                    value: statsData.activeUsersLast30Days?.toLocaleString() || '0',
                    icon: 'UserCheck',
                    color: 'from-green-500 to-green-600',
                    change: statsData.activeGrowth || '+0%',
                },
                totalInstructors: {
                    label: 'Instructors',
                    value: statsData.totalInstructors?.toString() || '0',
                    icon: 'GraduationCap',
                    color: 'from-purple-500 to-purple-600',
                    change: `${statsData.pendingInstructors || 0} pending`,
                },
                totalStudents: {
                    label: 'Students',
                    value: statsData.totalStudents?.toLocaleString() || '0',
                    icon: 'BookOpen',
                    color: 'from-yellow-500 to-yellow-600',
                    change: '+0 new',
                },
                totalFellows: {
                    label: 'Fellows (Total)',
                    value: statsData.totalFellows?.toString() || '0',
                    icon: 'Trophy',
                    color: 'from-indigo-500 to-indigo-600',
                    change: 'All time',
                },
                activeFellows: {
                    label: 'Fellows (Active)',
                    value: statsData.activeFellows?.toString() || '0',
                    icon: 'TrendingUp',
                    color: 'from-teal-500 to-teal-600',
                    change: `${statsData.fellowsPercentage || 0}%`,
                },
                publicUsers: {
                    label: 'Public Users',
                    value: statsData.publicUsers?.toLocaleString() || '0',
                    icon: 'Globe',
                    color: 'from-pink-500 to-pink-600',
                    change: '+0%',
                },
                revenue: {
                    label: 'Revenue (30 days)',
                    value: '$0',
                    icon: 'DollarSign',
                    color: 'from-emerald-500 to-emerald-600',
                    change: '+0%',
                },
            });

            // Set pending instructors
            setPendingInstructors(pendingData.instructors || []);

            // Set fellows at risk
            setFellowsAtRisk(fellowsData.fellows || []);

            // Set recent activity
            setRecentActivity(activityData.activities || []);
            setTotalActivities(activityData.total || 0);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            alert('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveInstructor = async (instructor) => {
        try {
            await adminService.approveInstructor(instructor._id);
            alert(`${instructor.firstName} ${instructor.lastName} approved successfully!`);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error('Error approving instructor:', error);
            alert(error.message || 'Failed to approve instructor');
        }
    };

    const handleRejectInstructor = async (instructor) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await adminService.rejectInstructor(instructor._id, reason);
            alert(`${instructor.firstName} ${instructor.lastName} rejected`);
            fetchDashboardData(); // Refresh data
        } catch (error) {
            console.error('Error rejecting instructor:', error);
            alert(error.message || 'Failed to reject instructor');
        }
    };

    const handleSendReminder = async () => {
        if (!reminderMessage.trim() || !selectedFellow) return;

        try {
            await adminService.sendFellowReminder(selectedFellow._id, reminderMessage);
            alert('Reminder sent successfully!');
            setShowModal(false);
            setReminderMessage('');
            setSelectedFellow(null);
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert(error.message || 'Failed to send reminder');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-20 p-6 lg:p-8">
                <div className="max-w-full">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600">Platform overview and management</p>
                    </div>

                    {/* Key Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => router.push('/admin/analytics')}
                            className="group w-full bg-white border border-gray-200 rounded-xl p-6 text-left hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
                                    <Icons.BarChart3 className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">Analytics & Reports</h3>
                                    <p className="text-sm text-gray-600 mt-1">Track student progress, instructor activity, and course completion rates.</p>
                                </div>
                                <Icons.ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            </div>
                        </button>
                        <button
                            onClick={() => router.push('/admin/reminders')}
                            className="group w-full bg-white border border-gray-200 rounded-xl p-6 text-left hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-green-50 text-green-700">
                                    <Icons.Mail className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">Student Reminders</h3>
                                    <p className="text-sm text-gray-600 mt-1">Send manual reminders and manage automatic email notifications.</p>
                                </div>
                                <Icons.ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                            </div>
                        </button>
                    </div>

                    {/* Stats Grid */}
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {Object.values(stats).map((stat, index) => {
                                const IconComponent = Icons[stat.icon];
                                return (
                                    <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                                {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                                            </div>
                                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                                {stat.change}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                        <p className="text-sm text-gray-600">{stat.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Zap className="w-5 h-5 text-blue-600" />
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <button
                                onClick={() => router.push('/admin/fellows/add')}
                                className="bg-white hover:bg-blue-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-blue-300"
                            >
                                <Icons.UserPlus className="w-4 h-4 text-blue-600" />
                                Add Fellows
                            </button>
                            <button
                                onClick={() => router.push('/admin/courses/add')}
                                className="bg-white hover:bg-blue-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-blue-300"
                            >
                                <Icons.Plus className="w-4 h-4 text-blue-600" />
                                Add Course
                            </button>
                            <button
                                onClick={() => router.push('/admin/analytics')}
                                className="bg-white hover:bg-blue-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-blue-300"
                            >
                                <Icons.BarChart3 className="w-4 h-4 text-blue-600" />
                                View Reports
                            </button>
                            <button
                                onClick={() => router.push('/admin/reminders')}
                                className="bg-white hover:bg-green-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-green-300"
                            >
                                <Icons.Mail className="w-4 h-4 text-green-600" />
                                Send Reminders
                            </button>
                        </div>
                    </div>

                    {/* Pending Instructor Approvals */}
                    {pendingInstructors.length > 0 && (
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-lg mb-6">
                            <div className="p-6 border-b border-orange-200 bg-white bg-opacity-60">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.UserCog className="w-6 h-6 text-orange-600" />
                                            Pending Instructor Approvals
                                            <span className="ml-2 bg-[#021d49] text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                                                {pendingInstructors.length} Pending
                                            </span>
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Review and approve new instructor applications
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/admin/instructors')}
                                        className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        View All <Icons.ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    {pendingInstructors.slice(0, 3).map((instructor) => (
                                        <div key={instructor._id} className="bg-white rounded-xl p-5 border border-orange-200 hover:shadow-md transition-all">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                        {instructor.firstName?.[0]}{instructor.lastName?.[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 text-lg">
                                                                    {instructor.firstName} {instructor.lastName}
                                                                </h3>
                                                                <p className="text-sm text-gray-600">{instructor.email}</p>
                                                            </div>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                {new Date(instructor.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {instructor.institution && (
                                                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                                                    {instructor.institution}
                                                                </span>
                                                            )}
                                                            {instructor.phoneNumber && (
                                                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                                                                    {instructor.phoneNumber}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 lg:flex-shrink-0">
                                                    <button
                                                        onClick={() => router.push(`/admin/instructors/${instructor._id}`)}
                                                        className="flex-1 lg:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveInstructor(instructor)}
                                                        className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.CheckCircle className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectInstructor(instructor)}
                                                        className="flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.XCircle className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Icons.ActivitySquare className="w-6 h-6 text-blue-600" />
                                        Recent Activities
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Track instructor logins, course approvals, rejections, and user registrations
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Filter Section */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setActivityFilter('all');
                                        setActivityPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activityFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    All Activities
                                </button>
                                <button
                                    onClick={() => {
                                        setActivityFilter('user_registration');
                                        setActivityPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activityFilter === 'user_registration'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Icons.UserPlus className="w-4 h-4" />
                                    Registrations
                                </button>
                                <button
                                    onClick={() => {
                                        setActivityFilter('instructor_approved');
                                        setActivityPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activityFilter === 'instructor_approved'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Icons.CheckCircle className="w-4 h-4" />
                                    Approved
                                </button>
                                <button
                                    onClick={() => {
                                        setActivityFilter('instructor_rejected');
                                        setActivityPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activityFilter === 'instructor_rejected'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Icons.XCircle className="w-4 h-4" />
                                    Rejected
                                </button>
                            </div>
                        </div>

                        {/* Activities List */}
                        <div className="p-6">
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-12">
                                    <Icons.Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">No activities recorded yet</p>
                                    <p className="text-sm text-gray-500 mt-2">Activities will appear here as instructors register, courses are submitted, and approvals are made.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentActivity.map((activity) => {
                                        const IconComponent = Icons[activity.icon] || Icons.Activity;
                                        const activityTypeColors = {
                                            user_registration: 'bg-green-50 border-green-200',
                                            instructor_approved: 'bg-emerald-50 border-emerald-200',
                                            instructor_rejected: 'bg-red-50 border-red-200',
                                            course_approved: 'bg-blue-50 border-blue-200',
                                            course_rejected: 'bg-orange-50 border-orange-200',
                                        };
                                        const typeColor = activityTypeColors[activity.type] || 'bg-gray-50 border-gray-200';

                                        return (
                                            <div
                                                key={activity._id}
                                                className={`border rounded-lg p-5 transition-all hover:shadow-md ${typeColor}`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className="p-3 rounded-lg bg-white shadow-sm border border-gray-200 flex-shrink-0">
                                                        <IconComponent className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {activity.message}
                                                                </p>
                                                                {activity.performedBy && (
                                                                    <p className="text-xs text-gray-600 mt-1">
                                                                        Performed by: <strong>{activity.performedBy.name}</strong>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-gray-600 whitespace-nowrap">
                                                                {new Date(activity.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        {activity.metadata?.reason && (
                                                            <p className="text-xs text-gray-700 mt-2 p-2 bg-white bg-opacity-50 rounded border border-gray-300">
                                                                <strong>Reason:</strong> {activity.metadata.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalActivities > activitiesPerPage && (
                                <div className="mt-6 flex items-center justify-between border-t pt-4">
                                    <p className="text-sm text-gray-600">
                                        Showing {Math.min((activityPage - 1) * activitiesPerPage + 1, totalActivities)} to{' '}
                                        {Math.min(activityPage * activitiesPerPage, totalActivities)} of {totalActivities} activities
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                                            disabled={activityPage === 1}
                                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Icons.ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setActivityPage(Math.min(Math.ceil(totalActivities / activitiesPerPage), activityPage + 1))
                                            }
                                            disabled={activityPage >= Math.ceil(totalActivities / activitiesPerPage)}
                                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fellowship Monitoring */}
                    {fellowsAtRisk.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-5 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Icons.AlertTriangle className="w-5 h-5 text-red-600" />
                                            Fellowship Monitoring
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Fellows at risk (&lt; 30 days to deadline, &lt; 50% progress)
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/admin/fellows')}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        View All Fellows →
                                    </button>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="grid md:grid-cols-3 gap-4">
                                    {fellowsAtRisk.slice(0, 3).map((fellow, index) => (
                                        <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {fellow.firstName} {fellow.lastName}
                                                    </h3>
                                                    <p className="text-sm text-red-600 font-medium">{fellow.daysLeft} days left</p>
                                                </div>
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                    {fellow.progress}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-red-200 rounded-full h-2 mb-3">
                                                <div
                                                    className="bg-red-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${fellow.progress}%` }}
                                                ></div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedFellow(fellow);
                                                    setShowModal(true);
                                                }}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Icons.Send className="w-4 h-4" />
                                                Send Reminder
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Reminder Modal */}
            {showModal && selectedFellow && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Send Reminder</h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setReminderMessage('');
                                    setSelectedFellow(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Sending reminder to: <strong>{selectedFellow.firstName} {selectedFellow.lastName}</strong>
                                </p>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <textarea
                                    value={reminderMessage}
                                    onChange={(e) => setReminderMessage(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="4"
                                    placeholder={`Hi ${selectedFellow.firstName}, we noticed you're at ${selectedFellow.progress}% progress with ${selectedFellow.daysLeft} days remaining...`}
                                ></textarea>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setReminderMessage('');
                                        setSelectedFellow(null);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendReminder}
                                    disabled={!reminderMessage.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Send Reminder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}