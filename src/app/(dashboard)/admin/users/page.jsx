"use client";

import React, { useEffect, useMemo, useState } from 'react';
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
import adminService from '@/lib/api/adminService';

export default function AdminUsers() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getAllUsers();
            setUsers(Array.isArray(data) ? data : data?.users || []);
        } catch (err) {
            console.error('Failed to load users', err);
            setError('Unable to load users right now.');
        } finally {
            setLoading(false);
        }
    };

    const normalizedUsers = useMemo(() => users.map((user) => {
        const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const statusText = user.status || (user.isActive ? 'active' : 'inactive');
        return {
            ...user,
            fullName: fullName || 'Unknown User',
            statusText,
            joinedAt: user.joinedDate || user.createdAt,
            lastActiveAt: user.lastActive || user.lastLogin,
        };
    }), [users]);

    const filteredUsers = useMemo(() => normalizedUsers.filter((user) => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    }), [normalizedUsers, searchTerm, filterRole]);

    const stats = useMemo(() => ({
        totalUsers: normalizedUsers.length,
        activeUsers: normalizedUsers.filter(u => u.isActive || u.statusText === 'active').length,
        students: normalizedUsers.filter(u => u.role === 'student').length,
        instructors: normalizedUsers.filter(u => u.role === 'instructor').length,
        fellows: normalizedUsers.filter(u => u.role === 'fellow').length,
        suspended: normalizedUsers.filter(u => u.statusText === 'suspended' || u.isActive === false).length,
    }), [normalizedUsers]);

    const openDetails = async (user) => {
        setShowDetailsDialog(true);
        setDetailsLoading(true);
        try {
            const id = user._id || user.id;
            let detail;
            if (user.role === 'instructor') {
                detail = await adminService.getInstructorDetails(id);
            } else {
                detail = await adminService.getUserById(id);
            }
            const resolved = detail?.user || detail?.data || detail || {};
            setSelectedUser({ ...user, ...resolved });
        } catch (err) {
            console.error('Failed to load user details', err);
            setSelectedUser(user);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleSuspend = (user) => {
        setSelectedUser(user);
        setShowSuspendDialog(true);
    };

    const confirmSuspend = async () => {
        if (!selectedUser) return;
        try {
            await adminService.deactivateUser(selectedUser._id || selectedUser.id);
            alert(`${selectedUser.fullName || selectedUser.name} has been suspended`);
            setShowSuspendDialog(false);
            setShowDetailsDialog(false);
            fetchUsers();
        } catch (err) {
            console.error('Suspend failed', err);
            alert('Unable to suspend user right now.');
        }
    };

    const handleReactivate = async (user) => {
        try {
            await adminService.activateUser(user._id || user.id);
            alert(`${user.fullName || user.name} has been reactivated`);
            fetchUsers();
        } catch (err) {
            console.error('Reactivate failed', err);
            alert('Unable to reactivate user right now.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 pb-20 lg:pb-8">
            <div className="lg:pl-64">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

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
                                <button onClick={fetchUsers} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                                    <Icons.RefreshCw className="w-4 h-4" />
                                    Refresh
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
                                            <tr key={user._id || user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'instructor' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                                                            user.role === 'fellow' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' :
                                                                'bg-gradient-to-br from-blue-400 to-blue-600'
                                                            }`}>
                                                            {(user.fullName || user.name || '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{user.fullName || user.name}</p>
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
                                                    <Badge variant={user.isActive || user.statusText === 'active' ? 'success' : 'destructive'}>
                                                        {user.statusText || (user.isActive ? 'active' : 'inactive')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : ''}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : ''}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.role === 'student' && (
                                                        <div className="text-sm">
                                                            <p className="text-gray-900">{user.coursesEnrolled || user.enrollmentCount || 0} enrolled</p>
                                                            <p className="text-gray-500">{user.coursesCompleted || user.completedCount || 0} completed</p>
                                                        </div>
                                                    )}
                                                    {user.role === 'instructor' && (
                                                        <div className="text-sm">
                                                            <p className="text-gray-900">{user.coursesCreated || user.totalCourses || (user.courses?.length || 0)} courses</p>
                                                            <p className="text-gray-500">{user.totalStudents || 0} students</p>
                                                        </div>
                                                    )}
                                                    {user.role === 'fellow' && (
                                                        <div className="text-sm">
                                                            <p className="text-gray-900">{user.progress || user.fellowData?.progress || 0}% progress</p>
                                                            <p className="text-gray-500">{user.coursesCompleted || 0}/{user.coursesEnrolled || 0} courses</p>
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
                                                        {user.isActive || user.statusText === 'active' ? (
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
                            {detailsLoading ? (
                                <div className="flex items-center justify-center py-6 text-gray-600">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mr-3"></div>
                                    Loading user details
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${selectedUser.role === 'instructor' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                                            selectedUser.role === 'fellow' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' :
                                                'bg-gradient-to-br from-blue-400 to-blue-600'
                                            }`}>
                                            {(selectedUser.fullName || selectedUser.name || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{selectedUser.fullName || selectedUser.name}</h3>
                                            <p className="text-gray-600">{selectedUser.email}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary">{selectedUser.role}</Badge>
                                                <Badge variant={selectedUser.isActive || selectedUser.statusText === 'active' ? 'success' : 'destructive'}>
                                                    {selectedUser.statusText || (selectedUser.isActive ? 'active' : 'inactive')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-600">Joined Date</Label>
                                            <p className="font-medium">{selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString() : ''}</p>
                                        </div>
                                        <div>
                                            <Label className="text-gray-600">Last Active</Label>
                                            <p className="font-medium">{selectedUser.lastActiveAt ? new Date(selectedUser.lastActiveAt).toLocaleDateString() : ''}</p>
                                        </div>
                                    </div>

                                    {selectedUser.role === 'instructor' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-600">Courses Created</Label>
                                                    <p className="font-medium text-xl">{selectedUser.coursesCreated || selectedUser.totalCourses || (selectedUser.courses?.length || 0)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-gray-600">Total Students</Label>
                                                    <p className="font-medium text-xl">{selectedUser.totalStudents || 0}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-gray-600">Rating</Label>
                                                    <p className="font-medium text-xl flex items-center gap-1">
                                                        <Icons.Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                                        {(selectedUser.avgRating || selectedUser.rating || 0).toFixed?.(1) || selectedUser.avgRating || selectedUser.rating || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-gray-600">Status</Label>
                                                    <p className="font-medium text-xl capitalize">{selectedUser.instructorStatus || 'pending'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-gray-600">Institution</Label>
                                                    <p className="font-medium">{selectedUser.institution || ''}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-gray-600">CV</Label>
                                                    {selectedUser.cvUrl ? (
                                                        <a className="text-blue-600 underline" href={selectedUser.cvUrl} target="_blank" rel="noreferrer">View CV</a>
                                                    ) : <p className="text-gray-500">Not uploaded</p>}
                                                </div>
                                            </div>
                                            {selectedUser.bio && (
                                                <div>
                                                    <Label className="text-gray-600">Bio</Label>
                                                    <p className="text-gray-800 leading-relaxed mt-1">{selectedUser.bio}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedUser.role === 'student' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-gray-600">Courses Enrolled</Label>
                                                <p className="font-medium text-xl">{selectedUser.coursesEnrolled || selectedUser.enrollmentCount || 0}</p>
                                            </div>
                                            <div>
                                                <Label className="text-gray-600">Courses Completed</Label>
                                                <p className="font-medium text-xl">{selectedUser.coursesCompleted || selectedUser.completedCount || 0}</p>
                                            </div>
                                            <div>
                                                <Label className="text-gray-600">Certificates Earned</Label>
                                                <p className="font-medium text-xl">{selectedUser.certificatesEarned || 0}</p>
                                            </div>
                                            <div>
                                                <Label className="text-gray-600">Total Points</Label>
                                                <p className="font-medium text-xl">{selectedUser.totalPoints || 0}</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedUser.role === 'fellow' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-gray-600">Fellowship End Date</Label>
                                                <p className="font-medium">{selectedUser.fellowData?.deadline ? new Date(selectedUser.fellowData.deadline).toLocaleDateString() : ''}</p>
                                            </div>
                                            <div>
                                                <Label className="text-gray-600">Overall Progress</Label>
                                                <p className="font-medium text-xl">{selectedUser.progress || selectedUser.fellowData?.progress || 0}%</p>
                                            </div>
                                            <div>
                                                <Label className="text-gray-600">Courses Enrolled</Label>
                                                <p className="font-medium text-xl">{selectedUser.coursesEnrolled || 0}</p>
                                            </div>
                                            <div>
                                                <Label className="text-gray-600">Courses Completed</Label>
                                                <p className="font-medium text-xl">{selectedUser.coursesCompleted || 0}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
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
                        {(selectedUser?.isActive || selectedUser?.statusText === 'active') && (
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
                            Are you sure you want to suspend {selectedUser?.fullName || selectedUser?.name}? They will not be able to access the platform.
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
