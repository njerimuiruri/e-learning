'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export default function FellowDetailPage() {
    const [activeTab, setActiveTab] = useState('overview');

    // Mock fellow data - in production, this would come from route params/API
    const fellow = {
        id: 'FEL-001',
        name: 'John Mwangi',
        email: 'john.m@email.com',
        phone: '+254 712 345 678',
        cohort: 'Cohort 2024-A',
        enrolledDate: '2024-01-15',
        deadline: '2024-12-15',
        daysRemaining: 23,
        status: 'active',
        progress: 35,
        coursesEnrolled: 5,
        coursesCompleted: 1,
        coursesInProgress: 3,
        lastActive: '2 hours ago',
        certificatesEarned: 1,
        location: 'Nairobi, Kenya',
        bio: 'Passionate software developer with keen interest in web technologies and cloud computing.',
        linkedIn: 'linkedin.com/in/johnmwangi',
        github: 'github.com/johnmwangi',
        joinedProgram: '2024-01-15'
    };

    const courses = [
        {
            id: 1,
            title: 'Introduction to Web Development',
            progress: 100,
            status: 'completed',
            startDate: '2024-01-20',
            completionDate: '2024-03-15',
            grade: 92,
            modules: 12,
            completedModules: 12,
            timeSpent: '45 hours',
            instructor: 'Dr. Jane Smith'
        },
        {
            id: 2,
            title: 'Advanced JavaScript',
            progress: 65,
            status: 'in-progress',
            startDate: '2024-03-20',
            completionDate: null,
            grade: null,
            modules: 15,
            completedModules: 10,
            timeSpent: '28 hours',
            instructor: 'Prof. Michael Chen'
        },
        {
            id: 3,
            title: 'React & Modern Frontend',
            progress: 40,
            status: 'in-progress',
            startDate: '2024-05-01',
            completionDate: null,
            grade: null,
            modules: 20,
            completedModules: 8,
            timeSpent: '18 hours',
            instructor: 'Sarah Johnson'
        },
        {
            id: 4,
            title: 'Node.js Backend Development',
            progress: 15,
            status: 'in-progress',
            startDate: '2024-07-10',
            completionDate: null,
            grade: null,
            modules: 18,
            completedModules: 3,
            timeSpent: '8 hours',
            instructor: 'David Kumar'
        },
        {
            id: 5,
            title: 'Database Design & SQL',
            progress: 0,
            status: 'not-started',
            startDate: null,
            completionDate: null,
            grade: null,
            modules: 14,
            completedModules: 0,
            timeSpent: '0 hours',
            instructor: 'Dr. Amanda Lee'
        }
    ];

    const activities = [
        { date: '2024-12-06', time: '09:30 AM', action: 'Completed Module 10 in Advanced JavaScript', type: 'completion' },
        { date: '2024-12-05', time: '02:15 PM', action: 'Started Module 8 in React & Modern Frontend', type: 'start' },
        { date: '2024-12-04', time: '11:00 AM', action: 'Submitted assignment for Node.js Backend Development', type: 'submission' },
        { date: '2024-12-03', time: '04:30 PM', action: 'Attended live session: React Hooks Deep Dive', type: 'attendance' },
        { date: '2024-12-02', time: '10:15 AM', action: 'Completed quiz in Advanced JavaScript (Score: 88%)', type: 'quiz' },
        { date: '2024-12-01', time: '03:45 PM', action: 'Posted question in discussion forum', type: 'discussion' }
    ];

    const certificates = [
        {
            id: 1,
            title: 'Introduction to Web Development',
            issueDate: '2024-03-15',
            credentialId: 'CERT-2024-001-JM',
            grade: 92
        }
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        Active
                    </span>
                );
            case 'at-risk':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <Icons.AlertTriangle className="w-3.5 h-3.5" />
                        At Risk
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Icons.CheckCircle className="w-3.5 h-3.5" />
                        Completed
                    </span>
                );
            default:
                return null;
        }
    };

    const getCourseStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg">Completed</span>;
            case 'in-progress':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">In Progress</span>;
            case 'not-started':
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">Not Started</span>;
            default:
                return null;
        }
    };

    const getProgressColor = (progress) => {
        if (progress < 30) return 'bg-rose-500';
        if (progress < 50) return 'bg-orange-500';
        if (progress < 80) return 'bg-amber-500';
        if (progress < 100) return 'bg-blue-500';
        return 'bg-emerald-500';
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'completion':
                return <Icons.CheckCircle className="w-4 h-4 text-emerald-600" />;
            case 'start':
                return <Icons.PlayCircle className="w-4 h-4 text-blue-600" />;
            case 'submission':
                return <Icons.FileText className="w-4 h-4 text-purple-600" />;
            case 'attendance':
                return <Icons.Video className="w-4 h-4 text-indigo-600" />;
            case 'quiz':
                return <Icons.ClipboardCheck className="w-4 h-4 text-orange-600" />;
            case 'discussion':
                return <Icons.MessageCircle className="w-4 h-4 text-pink-600" />;
            default:
                return <Icons.Activity className="w-4 h-4 text-gray-600" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <Icons.ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Fellows</span>
                    </button>

                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                        <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600"></div>
                        <div className="px-8 pb-8">
                            <div className="flex flex-col md:flex-row gap-6 -mt-16">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl border-4 border-white">
                                        {fellow.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                                        {fellow.status === 'active' && <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>}
                                        {fellow.status === 'at-risk' && <Icons.AlertTriangle className="w-4 h-4 text-rose-500" />}
                                    </div>
                                </div>

                                {/* Fellow Info */}
                                <div className="flex-1 mt-16 md:mt-4">
                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{fellow.name}</h1>
                                            <p className="text-gray-600 flex items-center gap-2 mb-2">
                                                <Icons.Mail className="w-4 h-4" />
                                                {fellow.email}
                                            </p>
                                            <p className="text-gray-600 flex items-center gap-2">
                                                <Icons.Phone className="w-4 h-4" />
                                                {fellow.phone}
                                            </p>
                                        </div>
                                        {getStatusBadge(fellow.status)}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                            <Icons.Hash className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-gray-600">Fellow ID</p>
                                                <p className="font-semibold text-gray-900">{fellow.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                            <Icons.Users className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <p className="text-xs text-gray-600">Cohort</p>
                                                <p className="font-semibold text-gray-900">{fellow.cohort}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                            <Icons.MapPin className="w-5 h-5 text-rose-600" />
                                            <div>
                                                <p className="text-xs text-gray-600">Location</p>
                                                <p className="font-semibold text-gray-900">{fellow.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                                            <Icons.Clock className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <p className="text-xs text-gray-600">Last Active</p>
                                                <p className="font-semibold text-gray-900">{fellow.lastActive}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <Icons.BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-3xl font-bold text-gray-900">{fellow.coursesEnrolled}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Courses Enrolled</p>
                            <p className="text-xs text-gray-500 mt-1">Total courses</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-emerald-50 rounded-xl">
                                    <Icons.CheckCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                                <span className="text-3xl font-bold text-gray-900">{fellow.coursesCompleted}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Completed</p>
                            <p className="text-xs text-gray-500 mt-1">Finished courses</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-50 rounded-xl">
                                    <Icons.Award className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="text-3xl font-bold text-gray-900">{fellow.certificatesEarned}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Certificates</p>
                            <p className="text-xs text-gray-500 mt-1">Earned certificates</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${fellow.daysRemaining < 30 ? 'bg-rose-50' : 'bg-blue-50'}`}>
                                    <Icons.Calendar className={`w-6 h-6 ${fellow.daysRemaining < 30 ? 'text-rose-600' : 'text-blue-600'}`} />
                                </div>
                                <span className={`text-3xl font-bold ${fellow.daysRemaining < 30 ? 'text-rose-600' : 'text-gray-900'}`}>{fellow.daysRemaining}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Days Remaining</p>
                            <p className="text-xs text-gray-500 mt-1">Until deadline</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="border-b border-gray-200">
                            <div className="flex overflow-x-auto">
                                {['overview', 'courses', 'activity', 'certificates'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-4 font-semibold capitalize transition-all whitespace-nowrap ${activeTab === tab
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Progress Section */}
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                <Icons.TrendingUp className="w-5 h-5 text-blue-600" />
                                                Overall Progress
                                            </h3>
                                            <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                {fellow.progress}%
                                            </span>
                                        </div>
                                        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                            <div
                                                className={`h-4 rounded-full transition-all duration-700 ${getProgressColor(fellow.progress)}`}
                                                style={{ width: `${fellow.progress}%` }}
                                            >
                                                <div className="h-full w-full bg-gradient-to-r from-white/30 to-transparent"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio & Info */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Icons.User className="w-5 h-5 text-blue-600" />
                                                About
                                            </h3>
                                            <p className="text-gray-700 mb-4">{fellow.bio}</p>
                                            <div className="space-y-2">
                                                {fellow.linkedIn && (
                                                    <a href={`https://${fellow.linkedIn}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                                                        <Icons.Linkedin className="w-4 h-4" />
                                                        <span className="text-sm">{fellow.linkedIn}</span>
                                                    </a>
                                                )}
                                                {fellow.github && (
                                                    <a href={`https://${fellow.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                                                        <Icons.Github className="w-4 h-4" />
                                                        <span className="text-sm">{fellow.github}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Icons.Info className="w-5 h-5 text-blue-600" />
                                                Program Details
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Enrolled:</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {new Date(fellow.enrolledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Deadline:</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {new Date(fellow.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Days Remaining:</span>
                                                    <span className={`font-semibold ${fellow.daysRemaining < 30 ? 'text-rose-600' : 'text-gray-900'}`}>
                                                        {fellow.daysRemaining} days
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Cohort:</span>
                                                    <span className="font-semibold text-gray-900">{fellow.cohort}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Courses Tab */}
                            {activeTab === 'courses' && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Enrolled Courses</h3>
                                    {courses.map((course) => (
                                        <div key={course.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-3 mb-2">
                                                        <h4 className="text-lg font-bold text-gray-900">{course.title}</h4>
                                                        {getCourseStatusBadge(course.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3">Instructor: {course.instructor}</p>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-600">Modules</p>
                                                            <p className="font-semibold text-gray-900">{course.completedModules}/{course.modules}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600">Time Spent</p>
                                                            <p className="font-semibold text-gray-900">{course.timeSpent}</p>
                                                        </div>
                                                        {course.grade && (
                                                            <div>
                                                                <p className="text-gray-600">Grade</p>
                                                                <p className="font-semibold text-emerald-600">{course.grade}%</p>
                                                            </div>
                                                        )}
                                                        {course.completionDate && (
                                                            <div>
                                                                <p className="text-gray-600">Completed</p>
                                                                <p className="font-semibold text-gray-900">
                                                                    {new Date(course.completionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:w-48">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-semibold text-gray-700">Progress</span>
                                                        <span className="text-lg font-bold text-gray-900">{course.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 'activity' && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                                    <div className="space-y-4">
                                        {activities.map((activity, index) => (
                                            <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-900 font-medium">{activity.action}</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certificates Tab */}
                            {activeTab === 'certificates' && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Earned Certificates</h3>
                                    {certificates.length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {certificates.map((cert) => (
                                                <div key={cert.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <Icons.Award className="w-12 h-12 text-blue-600" />
                                                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                                            {cert.grade}%
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">{cert.title}</h4>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        Issued: {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-4">
                                                        Credential ID: {cert.credentialId}
                                                    </p>
                                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                                        <Icons.Download className="w-4 h-4" />
                                                        Download Certificate
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                                            <Icons.Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600">No certificates earned yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-wrap gap-4">
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg">
                            <Icons.MessageCircle className="w-5 h-5" />
                            Send Message
                        </button>
                        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors shadow-lg border border-gray-200">
                            <Icons.Mail className="w-5 h-5" />
                            Send Email
                        </button>
                        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors shadow-lg border border-gray-200">
                            <Icons.FileText className="w-5 h-5" />
                            Generate Report
                        </button>
                        <button className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-6 py-3 rounded-xl font-medium transition-colors shadow-lg border border-rose-200">
                            <Icons.AlertCircle className="w-5 h-5" />
                            Flag for Review
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}