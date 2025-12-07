'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeRange, setTimeRange] = useState('30days');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getDashboardStats();
            setStats(data);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                    <p className="text-gray-600">Platform performance and user statistics</p>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Icons.Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-green-600">{stats?.userGrowth || '+0%'}</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalUsers || 0}</h3>
                        <p className="text-sm text-gray-600">Total Users</p>
                        <p className="text-xs text-gray-500 mt-2">{stats?.newUsersLast30Days || 0} new this month</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                                <Icons.UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-green-600">{stats?.activeGrowth || '+0%'}</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.activeUsers || 0}</h3>
                        <p className="text-sm text-gray-600">Active Users</p>
                        <p className="text-xs text-gray-500 mt-2">{stats?.activeUsersLast30Days || 0} active this month</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                                <Icons.GraduationCap className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalStudents || 0}</h3>
                        <p className="text-sm text-gray-600">Total Students</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Icons.BookOpen className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalInstructors || 0}</h3>
                        <p className="text-sm text-gray-600">Total Instructors</p>
                        <p className="text-xs text-yellow-600 mt-2">{stats?.pendingInstructors || 0} pending approval</p>
                    </div>
                </div>

                {/* Instructor Stats */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.UserCog className="w-5 h-5 text-blue-600" />
                            Instructor Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Approved Instructors</span>
                                <span className="text-2xl font-bold text-green-600">{stats?.approvedInstructors || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Pending Approval</span>
                                <span className="text-2xl font-bold text-yellow-600">{stats?.pendingInstructors || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Total Instructors</span>
                                <span className="text-2xl font-bold text-blue-600">{stats?.totalInstructors || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Award className="w-5 h-5 text-purple-600" />
                            Fellows Program
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Total Fellows</span>
                                <span className="text-2xl font-bold text-purple-600">{stats?.totalFellows || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Active Fellows</span>
                                <span className="text-2xl font-bold text-green-600">{stats?.activeFellows || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                                <span className="text-2xl font-bold text-blue-600">{stats?.fellowsPercentage || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Type Distribution */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">User Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icons.Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                            <p className="text-sm text-gray-600">All Users</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icons.GraduationCap className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                            <p className="text-sm text-gray-600">Students</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icons.BookOpen className="w-8 h-8 text-orange-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.totalInstructors || 0}</p>
                            <p className="text-sm text-gray-600">Instructors</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icons.UserCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
                            <p className="text-sm text-gray-600">Active</p>
                        </div>
                    </div>
                </div>

                {/* Growth Indicators */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <Icons.TrendingUp className="w-8 h-8" />
                            <span className="text-2xl font-bold">{stats?.userGrowth || '+0%'}</span>
                        </div>
                        <h4 className="text-lg font-semibold mb-1">User Growth</h4>
                        <p className="text-blue-100 text-sm">Last 30 days</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <Icons.Activity className="w-8 h-8" />
                            <span className="text-2xl font-bold">{stats?.activeGrowth || '+0%'}</span>
                        </div>
                        <h4 className="text-lg font-semibold mb-1">Active Growth</h4>
                        <p className="text-green-100 text-sm">Last 30 days</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <Icons.Users className="w-8 h-8" />
                            <span className="text-2xl font-bold">{stats?.publicUsers || 0}</span>
                        </div>
                        <h4 className="text-lg font-semibold mb-1">Public Users</h4>
                        <p className="text-purple-100 text-sm">Non-enrolled</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
