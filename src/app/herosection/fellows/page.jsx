'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export default function AdminFellowsManagement() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedFellow, setSelectedFellow] = useState(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
    const [showExtendDialog, setShowExtendDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [extensionMonths, setExtensionMonths] = useState('3');

    const pendingApplications = [
        {
            id: 1,
            name: 'Alice Wanjiru',
            email: 'alice.wanjiru@email.com',
            phone: '+254 712 345 678',
            institution: 'University of Nairobi',
            course: 'Computer Science',
            yearOfStudy: '3rd Year',
            reason: 'Passionate about web development and want to enhance my skills in React and Node.js',
            interests: ['Web Development', 'UI/UX Design', 'Mobile Development'],
            appliedDate: '2024-12-01',
            cv: 'alice_wanjiru_cv.pdf',
            transcripts: 'transcripts.pdf',
            status: 'pending'
        },
        {
            id: 2,
            name: 'Brian Kiprop',
            email: 'brian.kiprop@email.com',
            phone: '+254 723 456 789',
            institution: 'Kenyatta University',
            course: 'Information Technology',
            yearOfStudy: '2nd Year',
            reason: 'I want to become a full-stack developer and this fellowship will help me achieve that goal',
            interests: ['Backend Development', 'Database Management', 'Cloud Computing'],
            appliedDate: '2024-12-02',
            cv: 'brian_kiprop_cv.pdf',
            transcripts: 'transcripts.pdf',
            status: 'pending'
        }
    ];

    const activeFellows = [
        {
            id: 3,
            name: 'Carol Muthoni',
            email: 'carol.muthoni@email.com',
            phone: '+254 734 567 890',
            institution: 'Strathmore University',
            fellowshipStartDate: '2024-09-01',
            fellowshipEndDate: '2025-02-28',
            daysLeft: 85,
            coursesEnrolled: 8,
            coursesCompleted: 5,
            progress: 62,
            status: 'active',
            permissions: {
                accessAllCourses: true,
                downloadCertificates: true,
                accessDiscussions: true,
                submitAssignments: true,
                accessMentorship: true
            },
            lastActive: '2024-12-05'
        },
        {
            id: 4,
            name: 'David Omondi',
            email: 'david.omondi@email.com',
            phone: '+254 745 678 901',
            institution: 'Technical University of Kenya',
            fellowshipStartDate: '2024-09-01',
            fellowshipEndDate: '2025-02-28',
            daysLeft: 85,
            coursesEnrolled: 10,
            coursesCompleted: 8,
            progress: 80,
            status: 'active',
            permissions: {
                accessAllCourses: true,
                downloadCertificates: true,
                accessDiscussions: true,
                submitAssignments: true,
                accessMentorship: true
            },
            lastActive: '2024-12-05'
        },
        {
            id: 5,
            name: 'Emily Akinyi',
            email: 'emily.akinyi@email.com',
            phone: '+254 756 789 012',
            institution: 'Jomo Kenyatta University',
            fellowshipStartDate: '2024-09-01',
            fellowshipEndDate: '2025-02-28',
            daysLeft: 85,
            coursesEnrolled: 6,
            coursesCompleted: 2,
            progress: 33,
            status: 'at-risk',
            permissions: {
                accessAllCourses: true,
                downloadCertificates: true,
                accessDiscussions: true,
                submitAssignments: true,
                accessMentorship: true
            },
            lastActive: '2024-11-28'
        }
    ];

    const completedFellows = [
        {
            id: 6,
            name: 'Frank Kibet',
            email: 'frank.kibet@email.com',
            institution: 'Moi University',
            fellowshipStartDate: '2024-03-01',
            fellowshipEndDate: '2024-08-31',
            coursesCompleted: 12,
            finalScore: 92,
            status: 'completed',
            completionDate: '2024-08-30'
        }
    ];

    const [permissions, setPermissions] = useState({
        accessAllCourses: true,
        downloadCertificates: true,
        accessDiscussions: true,
        submitAssignments: true,
        accessMentorship: true,
        accessCareerServices: false,
        accessPremiumContent: false
    });

    const stats = {
        totalFellows: activeFellows.length + completedFellows.length,
        activeFellows: activeFellows.filter(f => f.status === 'active').length,
        pendingApplications: pendingApplications.length,
        atRisk: activeFellows.filter(f => f.status === 'at-risk').length,
        completed: completedFellows.length,
        averageProgress: Math.round(activeFellows.reduce((acc, f) => acc + f.progress, 0) / activeFellows.length)
    };

    const openDetails = (fellow) => {
        setSelectedFellow(fellow);
        setShowDetailsDialog(true);
    };

    const handleApprove = () => {
        console.log('Approving fellow:', selectedFellow.name);
        alert(`${selectedFellow.name} has been approved as a fellow!`);
        setShowApproveDialog(false);
        setShowDetailsDialog(false);
    };

    const handleReject = () => {
        console.log('Rejecting application:', selectedFellow.name, 'Reason:', rejectReason);
        alert(`Application rejected. Reason: ${rejectReason}`);
        setShowRejectDialog(false);
        setShowDetailsDialog(false);
        setRejectReason('');
    };

    const openPermissions = (fellow) => {
        setSelectedFellow(fellow);
        setPermissions(fellow.permissions || permissions);
        setShowPermissionsDialog(true);
    };

    const savePermissions = () => {
        console.log('Saving permissions for:', selectedFellow.name, permissions);
        alert(`Permissions updated for ${selectedFellow.name}`);
        setShowPermissionsDialog(false);
    };

    const handleExtend = () => {
        console.log('Extending fellowship for:', selectedFellow.name, 'by', extensionMonths, 'months');
        alert(`Fellowship extended by ${extensionMonths} months`);
        setShowExtendDialog(false);
    };

    const sendReminder = (fellow) => {
        console.log('Sending reminder to:', fellow.name);
        alert(`Reminder sent to ${fellow.name}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-16 pb-20 lg:pb-8">
            <div className="lg:pl-64">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">Fellows Management</h1>
                                <button
                                    onClick={() => router.push('/admin/fellows/add')}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                                >
                                    <Icons.UserPlus className="w-4 h-4" />
                                    Add Fellows
                                </button>
                            </div>
                            <p className="text-gray-600">Manage fellowship applications, permissions, and progress</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.Users className="w-5 h-5 text-blue-600" />
                                    <p className="text-xs text-gray-500">Total Fellows</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalFellows}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.UserCheck className="w-5 h-5 text-green-600" />
                                    <p className="text-xs text-gray-500">Active</p>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{stats.activeFellows}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.Clock className="w-5 h-5 text-orange-600" />
                                    <p className="text-xs text-gray-500">Pending</p>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.AlertTriangle className="w-5 h-5 text-red-600" />
                                    <p className="text-xs text-gray-500">At Risk</p>
                                </div>
                                <p className="text-2xl font-bold text-red-600">{stats.atRisk}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.Award className="w-5 h-5 text-purple-600" />
                                    <p className="text-xs text-gray-500">Completed</p>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icons.TrendingUp className="w-5 h-5 text-indigo-600" />
                                    <p className="text-xs text-gray-500">Avg Progress</p>
                                </div>
                                <p className="text-2xl font-bold text-indigo-600">{stats.averageProgress}%</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            type="text"
                                            placeholder="Search fellows by name, email, or institution..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="at-risk">At Risk</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="pending" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="pending">
                                    Pending Applications ({pendingApplications.length})
                                </TabsTrigger>
                                <TabsTrigger value="active">
                                    Active Fellows ({activeFellows.length})
                                </TabsTrigger>
                                <TabsTrigger value="completed">
                                    Completed ({completedFellows.length})
                                </TabsTrigger>
                            </TabsList>

                            {/* Pending Applications */}
                            <TabsContent value="pending">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingApplications.map((fellow) => (
                                        <div
                                            key={fellow.id}
                                            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {fellow.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{fellow.name}</h3>
                                                        <p className="text-xs text-gray-500">{fellow.institution}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                    Pending
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Icons.Mail className="w-4 h-4" />
                                                    <span className="truncate">{fellow.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Icons.GraduationCap className="w-4 h-4" />
                                                    <span>{fellow.course} - {fellow.yearOfStudy}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Icons.Calendar className="w-4 h-4" />
                                                    <span>Applied: {new Date(fellow.appliedDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-xs text-gray-500 mb-2">Interests:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {fellow.interests.map((interest, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {interest}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openDetails(fellow)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Review Application
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedFellow(fellow);
                                                        setShowApproveDialog(true);
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                                >
                                                    <Icons.Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedFellow(fellow);
                                                        setShowRejectDialog(true);
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                                                >
                                                    <Icons.X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Active Fellows */}
                            <TabsContent value="active">
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Fellow</th>
                                                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Institution</th>
                                                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Progress</th>
                                                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Days Left</th>
                                                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Status</th>
                                                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {activeFellows.map((fellow) => (
                                                    <tr key={fellow.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${fellow.status === 'at-risk'
                                                                    ? 'bg-gradient-to-br from-red-400 to-red-600'
                                                                    : 'bg-gradient-to-br from-green-400 to-green-600'
                                                                    }`}>
                                                                    {fellow.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{fellow.name}</p>
                                                                    <p className="text-sm text-gray-500">{fellow.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{fellow.institution}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                                    <div
                                                                        className={`h-2 rounded-full ${fellow.progress >= 70 ? 'bg-green-500' :
                                                                            fellow.progress >= 40 ? 'bg-yellow-500' :
                                                                                'bg-red-500'
                                                                            }`}
                                                                        style={{ width: `${fellow.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900">{fellow.progress}%</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {fellow.coursesCompleted}/{fellow.coursesEnrolled} courses
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-medium ${fellow.daysLeft < 30 ? 'text-red-600' :
                                                                fellow.daysLeft < 60 ? 'text-orange-600' :
                                                                    'text-green-600'
                                                                }`}>
                                                                {fellow.daysLeft} days
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant={fellow.status === 'active' ? 'success' : 'destructive'}>
                                                                {fellow.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => openPermissions(fellow)}
                                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                                                >
                                                                    <Icons.Shield className="w-4 h-4" />
                                                                    Permissions
                                                                </button>
                                                                {fellow.status === 'at-risk' && (
                                                                    <button
                                                                        onClick={() => sendReminder(fellow)}
                                                                        className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                                                                    >
                                                                        <Icons.Send className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Completed Fellows */}
                            <TabsContent value="completed">
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="space-y-4">
                                        {completedFellows.map((fellow) => (
                                            <div key={fellow.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">
                                                            <Icons.Award className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900">{fellow.name}</h3>
                                                            <p className="text-sm text-gray-600">{fellow.email}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {fellow.institution} • Completed {new Date(fellow.completionDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-green-600">{fellow.finalScore}%</p>
                                                        <p className="text-xs text-gray-500">{fellow.coursesCompleted} courses completed</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>

            {/* Application Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Fellowship Application Review</DialogTitle>
                        <DialogDescription>
                            Review the complete application before approval
                        </DialogDescription>
                    </DialogHeader>

                    {selectedFellow && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {selectedFellow.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedFellow.name}</h3>
                                    <p className="text-gray-600">{selectedFellow.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-600">Phone</Label>
                                    <p className="font-medium">{selectedFellow.phone}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-600">Applied Date</Label>
                                    <p className="font-medium">{new Date(selectedFellow.appliedDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-600">Institution</Label>
                                    <p className="font-medium">{selectedFellow.institution}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-600">Course</Label>
                                    <p className="font-medium">{selectedFellow.course}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-600">Year of Study</Label>
                                <p className="font-medium">{selectedFellow.yearOfStudy}</p>
                            </div>

                            <div>
                                <Label className="text-gray-600">Why They Want to Join</Label>
                                <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">{selectedFellow.reason}</p>
                            </div>

                            <div>
                                <Label className="text-gray-600">Areas of Interest</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedFellow.interests?.map((interest, idx) => (
                                        <Badge key={idx} variant="secondary">{interest}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-600">CV Document</Label>
                                    <button className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
                                        <Icons.Download className="w-4 h-4" />
                                        {selectedFellow.cv}
                                    </button>
                                </div>
                                <div>
                                    <Label className="text-gray-600">Transcripts</Label>
                                    <button className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
                                        <Icons.Download className="w-4 h-4" />
                                        {selectedFellow.transcripts}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <button
                            onClick={() => {
                                setShowDetailsDialog(false);
                                setShowRejectDialog(true);
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => {
                                setShowDetailsDialog(false);
                                setShowApproveDialog(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Approve
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Fellowship Application</DialogTitle>
                        <DialogDescription>
                            Approve {selectedFellow?.name} as a fellow. They will receive full access to all fellowship benefits.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="duration">Fellowship Duration (Months)</Label>
                            <Select defaultValue="6">
                                <SelectTrigger id="duration">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 Months</SelectItem>
                                    <SelectItem value="6">6 Months</SelectItem>
                                    <SelectItem value="12">12 Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Icons.Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">Default Permissions Will Include:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Access to all courses</li>
                                        <li>Download certificates</li>
                                        <li>Participate in discussions</li>
                                        <li>Submit assignments</li>
                                        <li>Access mentorship program</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setShowApproveDialog(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprove}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Confirm Approval
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Fellowship Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. This will be sent to the applicant.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setShowRejectDialog(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={!rejectReason.trim()}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Rejection
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permissions Dialog */}
            <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Manage Fellow Permissions</DialogTitle>
                        <DialogDescription>
                            Configure access permissions for {selectedFellow?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div className="flex-1">
                                <Label className="font-medium text-gray-900">Access All Courses</Label>
                                <p className="text-sm text-gray-500">Allow access to all platform courses</p>
                            </div>
                            <Switch
                                checked={permissions.accessAllCourses}
                                onCheckedChange={(checked) => setPermissions({ ...permissions, accessAllCourses: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div className="flex-1">
                                <Label className="font-medium text-gray-900">Download Certificates</Label>
                                <p className="text-sm text-gray-500">Enable certificate downloads</p>
                            </div>
                            <Switch
                                checked={permissions.downloadCertificates}
                                onCheckedChange={(checked) => setPermissions({ ...permissions, downloadCertificates: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div className="flex-1">
                                <Label className="font-medium text-gray-900">Access Discussions</Label>
                                <p className="text-sm text-gray-500">Participate in course discussions</p>
                            </div>
                            <Switch
                                checked={permissions.accessDiscussions}
                                onCheckedChange={(checked) => setPermissions({ ...permissions, accessDiscussions: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div className="flex-1">
                                <Label className="font-medium text-gray-900">Submit Assignments</Label>
                                <p className="text-sm text-gray-500">Submit and receive feedback on assignments</p>
                            </div>
                            <Switch
                                checked={permissions.submitAssignments}
                                onCheckedChange={(checked) => setPermissions({ ...permissions, submitAssignments: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div className="flex-1">
                                <Label className="font-medium text-gray-900">Access Mentorship</Label>
                                <p className="text-sm text-gray-500">Connect with mentors and get guidance</p>
                            </div>
                            <Switch
                                checked={permissions.accessMentorship}
                                onCheckedChange={(checked) => setPermissions({ ...permissions, accessMentorship: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div className="flex-1">
                                <Label className="font-medium text-gray-900">Access Career Services</Label>
                                <p className="text-sm text-gray-500">Job board and career counseling</p>
                            </div>
                            <Switch
                                checked={permissions.accessCareerServices}
                                onCheckedChange={(checked) => setPermissions({ ...permissions, accessCareerServices: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between py-3">
                            <div className="flex-1">
                                <Label className="font-medium text-gray-900">Access Premium Content</Label>
                                <p className="text-sm text-gray-500">Access to premium courses and materials</p>
                            </div>
                            <Switch
                                checked={permissions.accessPremiumContent}
                                onCheckedChange={(checked) => setPermissions({ ...permissions, accessPremiumContent: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setShowPermissionsDialog(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={savePermissions}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Save Permissions
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Extend Fellowship Dialog */}
            <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Extend Fellowship Duration</DialogTitle>
                        <DialogDescription>
                            Extend the fellowship period for {selectedFellow?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="extension">Extension Period</Label>
                            <Select value={extensionMonths} onValueChange={setExtensionMonths}>
                                <SelectTrigger id="extension">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Month</SelectItem>
                                    <SelectItem value="2">2 Months</SelectItem>
                                    <SelectItem value="3">3 Months</SelectItem>
                                    <SelectItem value="6">6 Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setShowExtendDialog(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExtend}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Confirm Extension
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}