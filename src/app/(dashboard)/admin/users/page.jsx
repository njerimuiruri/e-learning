'use client';

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminUsers() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);

    const users = [
        {
            id: 1,
            name: 'Alice Wanjiku',
            email: 'alice.wanjiku@email.com',
            role: 'student',
            status: 'active',
            joinedDate: '2024-01-15',
            lastActive: '2024-12-05',
            coursesEnrolled: 5,
            coursesCompleted: 2,
            certificatesEarned: 2,
            totalSpent: 12500
        },
        {
            id: 2,
            name: 'Dr. James Ochieng',
            email: 'james.ochieng@email.com',
            role: 'instructor',
            status: 'active',
            joinedDate: '2024-02-20',
            lastActive: '2024-12-05',
            coursesCreated: 4,
            totalStudents: 234,
            rating: 4.8,
            totalEarnings: 45000
        },
        {
            id: 3,
            name: 'Sarah Mutua',
            email: 'sarah.mutua@email.com',
            role: 'fellow',
            status: 'active',
            joinedDate: '2024-09-01',
            lastActive: '2024-12-04',
            fellowshipEndDate: '2025-02-28',
            coursesEnrolled: 8,
            coursesCompleted: 5,
            progress: 62
        },
        {
            id: 4,
            name: 'Michael Kimani',
            email: 'michael.kimani@email.com',
            role: 'student',
            status: 'suspended',
            joinedDate: '2024-03-10',
            lastActive: '2024-11-20',
            coursesEnrolled: 3,
            coursesCompleted: 0,
            suspendedReason: 'Payment dispute'
        },
        {
            id: 5,
            name: 'Grace Akinyi',
            email: 'grace.akinyi@email.com',
            role: 'student',
            status: 'active',
            joinedDate: '2024-05-12',
            lastActive: '2024-12-05',
            coursesEnrolled: 7,
            coursesCompleted: 4,
            certificatesEarned: 4,
            totalSpent: 18900
        }
    ];

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        students: users.filter(u => u.role === 'student').length,
        instructors: users.filter(u => u.role === 'instructor').length,
        fellows: users.filter(u => u.role === 'fellow').length,
        suspended: users.filter(u => u.status === 'suspended').length
    };

    const openDetails = (user) => {
        setSelectedUser(user);
        setShowDetailsDialog(true);
    };

    const handleSuspend = (user) => {
        setSelectedUser(user);
        setShowSuspendDialog(true);
    };

    const confirmSuspend = () => {
        console.log('Suspending user:', selectedUser.name);
        alert(`${selectedUser.name} has been suspended`);
        setShowSuspendDialog(false);
        setShowDetailsDialog(false);
    };

    const handleReactivate = (user) => {
        console.log('Reactivating user:', user.name);
        alert(`${user.name} has been reactivated`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-16 pb-20 lg:pb-8">
            <div className="lg:pl-64">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
                            <p className="text-gray-600">Manage all platform users and their activities</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">Active</p>
                                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">Students</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">Instructors</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.instructors}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">Fellows</p>
                                <p className="text-2xl font-bold text-indigo-600">{stats.fellows}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1">Suspended</p>
                                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
                            </div>
                        </div>

                        {/* Search and Filter */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            type="text"
                                            placeholder="Search users by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={filterRole} onValueChange={setFilterRole}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="student">Students</SelectItem>
                                        <SelectItem value="instructor">Instructors</SelectItem>
                                        <SelectItem value="fellow">Fellows</SelectItem>
                                    </SelectContent>
                                </Select>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                                    <Icons.Download className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">User</th>
                                            <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Role</th>
                                            <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Status</th>
                                            <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Joined</th>
                                            <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Last Active</th>
                                            <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Activity</th>
                                            <th className="text-left text-xs font-semibold text-gray-600 px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'instructor' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                                                            user.role === 'fellow' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' :
                                                                'bg-gradient-to-br from-blue-400 to-blue-600'
                                                            }`}>
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{user.name}</p>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={
                                                        user.role === 'instructor' ? 'default' :
                                                            user.role === 'fellow' ? 'secondary' :
                                                                'outline'
                                                    }>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                                                        {user.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(user.joinedDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(user.lastActive).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.role === 'student' && (
                                                        <div className="text-sm">
                                                            <p className="text-gray-900">{user.coursesEnrolled} enrolled</p>
                                                            <p className="text-gray-500">{user.coursesCompleted} completed</p>
                                                        </div>
                                                    )}
                                                    {user.role === 'instructor' && (
                                                        <div className="text-sm">
                                                            <p className="text-gray-900">{user.coursesCreated} courses</p>
                                                            <p className="text-gray-500">{user.totalStudents} students</p>
                                                        </div>
                                                    )}
                                                    {user.role === 'fellow' && (
                                                        <div className="text-sm">
                                                            <p className="text-gray-900">{user.progress}% progress</p>
                                                            <p className="text-gray-500">{user.coursesCompleted}/{user.coursesEnrolled} courses</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openDetails(user)}
                                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                        >
                                                            View
                                                        </button>
                                                        {user.status === 'active' ? (
                                                            <button
                                                                onClick={() => handleSuspend(user)}
                                                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                            >
                                                                Suspend
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleReactivate(user)}
                                                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                            >
                                                                Reactivate
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
                    </div>
                </main>
            </div>

            {/* User Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this user
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${selectedUser.role === 'instructor' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                                    selectedUser.role === 'fellow' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' :
                                        'bg-gradient-to-br from-blue-400 to-blue-600'
                                    }`}>
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                                    <p className="text-gray-600">{selectedUser.email}</p>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant="secondary">{selectedUser.role}</Badge>
                                        <Badge variant={selectedUser.status === 'active' ? 'success' : 'destructive'}>
                                            {selectedUser.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-600">Joined Date</Label>
                                    <p className="font-medium">{new Date(selectedUser.joinedDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-600">Last Active</Label>
                                    <p className="font-medium">{new Date(selectedUser.lastActive).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {selectedUser.role === 'student' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-600">Courses Enrolled</Label>
                                        <p className="font-medium text-xl">{selectedUser.coursesEnrolled}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Courses Completed</Label>
                                        <p className="font-medium text-xl">{selectedUser.coursesCompleted}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Certificates Earned</Label>
                                        <p className="font-medium text-xl">{selectedUser.certificatesEarned}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Total Spent</Label>
                                        <p className="font-medium text-xl">KES {selectedUser.totalSpent?.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {selectedUser.role === 'instructor' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-600">Courses Created</Label>
                                        <p className="font-medium text-xl">{selectedUser.coursesCreated}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Total Students</Label>
                                        <p className="font-medium text-xl">{selectedUser.totalStudents}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Rating</Label>
                                        <p className="font-medium text-xl flex items-center gap-1">
                                            <Icons.Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                            {selectedUser.rating}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Total Earnings</Label>
                                        <p className="font-medium text-xl">KES {selectedUser.totalEarnings?.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}

                            {selectedUser.role === 'fellow' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-600">Fellowship End Date</Label>
                                        <p className="font-medium">{new Date(selectedUser.fellowshipEndDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Overall Progress</Label>
                                        <p className="font-medium text-xl">{selectedUser.progress}%</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Courses Enrolled</Label>
                                        <p className="font-medium text-xl">{selectedUser.coursesEnrolled}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Courses Completed</Label>
                                        <p className="font-medium text-xl">{selectedUser.coursesCompleted}</p>
                                    </div>
                                </div>
                            )}

                            {selectedUser.status === 'suspended' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <Label className="text-red-700 font-semibold">Suspension Reason</Label>
                                    <p className="text-red-600 mt-1">{selectedUser.suspendedReason}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <button
                            onClick={() => setShowDetailsDialog(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Close
                        </button>
                        {selectedUser?.status === 'active' && (
                            <button
                                onClick={() => {
                                    setShowDetailsDialog(false);
                                    handleSuspend(selectedUser);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Suspend User
                            </button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspend Dialog */}
            <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to suspend {selectedUser?.name}? They will not be able to access the platform.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <button
                            onClick={() => setShowSuspendDialog(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmSuspend}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Confirm Suspension
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}