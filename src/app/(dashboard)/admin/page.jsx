'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);

    const stats = [
        { label: 'Total Users', value: '15,234', icon: 'Users', color: 'from-blue-500 to-blue-600', change: '+12.5%' },
        { label: 'Active (30 days)', value: '4,567', icon: 'UserCheck', color: 'from-green-500 to-green-600', change: '+8.3%' },
        { label: 'Courses', value: '245', icon: 'GraduationCap', color: 'from-purple-500 to-purple-600', change: '+5 new' },
        { label: 'Certificates Issued', value: '8,934', icon: 'Award', color: 'from-yellow-500 to-yellow-600', change: '+234' },
        { label: 'Fellows (Total)', value: '100', icon: 'Trophy', color: 'from-indigo-500 to-indigo-600', change: 'All time' },
        { label: 'Fellows (Active)', value: '87', icon: 'TrendingUp', color: 'from-teal-500 to-teal-600', change: '87%' },
        { label: 'Public Users', value: '15,134', icon: 'Globe', color: 'from-pink-500 to-pink-600', change: '+10.2%' },
        { label: 'Revenue (30 days)', value: '$125,678', icon: 'DollarSign', color: 'from-emerald-500 to-emerald-600', change: '+18.4%' },
    ];

    const pendingCourses = [
        { id: 1, title: 'Python for Data Science', instructor: 'Dr. Smith', category: 'Programming' },
        { id: 2, title: 'Digital Marketing Mastery', instructor: 'Jane Doe', category: 'Marketing' },
        { id: 3, title: 'Graphic Design Basics', instructor: 'John K.', category: 'Design' },
    ];

    const reportedDiscussions = [
        { id: 1, issue: 'Spam post in "Web Dev" forum', time: '2 hours ago' },
        { id: 2, issue: 'Inappropriate comment', time: '4 hours ago' },
    ];

    const fellowsAtRisk = [
        { name: 'John Mwangi', daysLeft: 23, progress: 35 },
        { name: 'Sarah Wanjiku', daysLeft: 18, progress: 28 },
        { name: 'Peter Kamau', daysLeft: 15, progress: 45 },
    ];

    const recentActivity = [
        { icon: 'UserPlus', text: '23 new registrations today', color: 'text-blue-600' },
        { icon: 'Award', text: '12 certificates issued in last hour', color: 'text-yellow-600' },
        { icon: 'CheckCircle', text: '5 course completions', color: 'text-green-600' },
        { icon: 'MessageSquare', text: '45 active discussions', color: 'text-purple-600' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-full">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600">Platform overview and management</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {stats.map((stat, index) => {
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

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
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
                                onClick={() => router.push('/admin/settings')}
                                className="bg-white hover:bg-blue-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-blue-300"
                            >
                                <Icons.Settings className="w-4 h-4 text-blue-600" />
                                System Settings
                            </button>
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid lg:grid-cols-2 gap-6 mb-8">
                        {/* Pending Approvals */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-5 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Icons.AlertCircle className="w-5 h-5 text-orange-600" />
                                        Pending Approvals
                                    </h2>
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">
                                        {pendingCourses.length + reportedDiscussions.length}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Icons.BookOpen className="w-4 h-4" />
                                    Courses Awaiting Review ({pendingCourses.length})
                                </h3>
                                <div className="space-y-3 mb-6">
                                    {pendingCourses.map((course) => (
                                        <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 text-sm">{course.title}</h4>
                                                <p className="text-xs text-gray-600">by {course.instructor} • {course.category}</p>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/admin/courses/review/${course.id}`)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Icons.Flag className="w-4 h-4" />
                                    Reported Discussions ({reportedDiscussions.length})
                                </h3>
                                <div className="space-y-3">
                                    {reportedDiscussions.map((report) => (
                                        <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900">{report.issue}</p>
                                                <p className="text-xs text-gray-500">{report.time}</p>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/admin/discussions/moderate/${report.id}`)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Moderate
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-5 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Icons.Activity className="w-5 h-5 text-blue-600" />
                                        Recent Activity
                                    </h2>
                                    <button
                                        onClick={() => router.push('/admin/activity')}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        View All →
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {recentActivity.map((activity, index) => {
                                    const IconComponent = Icons[activity.icon];
                                    return (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-200`}>
                                                {IconComponent && <IconComponent className={`w-5 h-5 ${activity.color}`} />}
                                            </div>
                                            <p className="text-sm text-gray-700">{activity.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Fellowship Monitoring */}
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
                                {fellowsAtRisk.map((fellow, index) => (
                                    <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{fellow.name}</h3>
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
                                            onClick={() => setShowModal(true)}
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
                </div>
            </main>

            {/* Reminder Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Send Reminder</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="4"
                                    placeholder="Hi [Name], we noticed you're at [X]% progress with [Y] days remaining..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        alert('Reminder sent successfully!');
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
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