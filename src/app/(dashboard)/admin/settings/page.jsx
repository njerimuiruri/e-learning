'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';
import CourseFormatManagement from './course-format';

export default function SystemSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityFilter, setActivityFilter] = useState('all');
    const [activityPage, setActivityPage] = useState(1);
    const [totalActivities, setTotalActivities] = useState(0);
    const [activeTab, setActiveTab] = useState('activities');
    const activitiesPerPage = 10;

    useEffect(() => {
        fetchSystemData();
    }, []);

    const fetchSystemData = async () => {
        try {
            setLoading(true);
            const activityData = await adminService.getRecentActivity(100); // Fetch more to populate the list
            setRecentActivity(activityData.activities || []);
            setTotalActivities(activityData.total || 0);
            console.log('Activities fetched:', activityData); // Debug log
        } catch (error) {
            console.error('Error fetching system data:', error);
            // Don't show alert on initial load, just log it
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading system settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-20 p-6 lg:p-8">
                <div className="max-w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Icons.Settings className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                    System Settings
                                </h1>
                                <p className="text-gray-600 mt-1">Monitor and manage system activities</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg">
                        <div className="flex gap-0">
                            <button
                                onClick={() => setActiveTab('activities')}
                                className={`px-6 py-4 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                                    activeTab === 'activities'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Icons.Activity className="w-4 h-4" />
                                Activities
                            </button>
                            <button
                                onClick={() => setActiveTab('course-format')}
                                className={`px-6 py-4 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                                    activeTab === 'course-format'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Icons.FileText className="w-4 h-4" />
                                Course Format
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'activities' && (
                        <>
                            {/* System Information Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-gray-600">System Status</h3>
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">Active</p>
                                    <p className="text-xs text-gray-500 mt-2">All systems operational</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-gray-600">Last Activity</h3>
                                        <Icons.Clock className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {recentActivity.length > 0
                                            ? new Date(recentActivity[0].timestamp).toLocaleTimeString()
                                            : 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {recentActivity.length > 0
                                            ? new Date(recentActivity[0].timestamp).toLocaleDateString()
                                            : 'No activities yet'}
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-gray-600">Total Activities</h3>
                                        <Icons.Activity className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{totalActivities}</p>
                                    <p className="text-xs text-gray-500 mt-2">Recorded in system</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Zap className="w-5 h-5 text-blue-600" />
                                    Quick Actions
                                </h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => router.push('/admin')}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-blue-200"
                                    >
                                        <Icons.LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => router.push('/admin/instructors')}
                                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-purple-200"
                                    >
                                        <Icons.Users className="w-4 h-4" />
                                        Instructors
                                    </button>
                                    <button
                                        onClick={() => router.push('/admin/users')}
                                        className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-green-200"
                                    >
                                        <Icons.Users className="w-4 h-4" />
                                        All Users
                                    </button>
                                    <button
                                        onClick={() => router.push('/admin/courses/pending')}
                                        className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-orange-200"
                                    >
                                        <Icons.Clock className="w-4 h-4" />
                                        Pending Courses
                                    </button>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            {recentActivity.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                    <Icons.ActivitySquare className="w-6 h-6 text-blue-600" />
                                                    All System Activities
                                                </h2>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Complete log of instructor logins, course approvals/rejections, and user registrations
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => fetchSystemData()}
                                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                            >
                                                <Icons.RefreshCw className="w-5 h-5 text-gray-600" />
                                            </button>
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
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    activityFilter === 'all'
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
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    activityFilter === 'user_registration'
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
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    activityFilter === 'instructor_approved'
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
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    activityFilter === 'instructor_rejected'
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <Icons.XCircle className="w-4 h-4" />
                                                Rejected
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActivityFilter('course_approved');
                                                    setActivityPage(1);
                                                }}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                    activityFilter === 'course_approved'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <Icons.BookOpen className="w-4 h-4" />
                                                Courses
                                            </button>
                                        </div>
                                    </div>

                                    {/* Activities List */}
                                    <div className="p-6">
                                        {recentActivity.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Icons.Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-600 font-medium">No activities recorded yet</p>
                                                <p className="text-sm text-gray-500 mt-2">Activities will appear here as users register, instructors submit courses, and admins take actions.</p>
                                                <button
                                                    onClick={() => fetchSystemData()}
                                                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Refresh Activities
                                                </button>
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
                                                                                    Performed by: <strong>{activity.performedBy.name}</strong> ({activity.performedBy.role})
                                                                                </p>
                                                                            )}
                                                                            {activity.targetUser && (
                                                                                <p className="text-xs text-gray-600 mt-1">
                                                                                    User: <strong>{activity.targetUser.name}</strong>
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
                            )}
                        </>
                    )}

                    {activeTab === 'course-format' && (
                        <div className="bg-white rounded-lg">
                            <CourseFormatManagement />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
