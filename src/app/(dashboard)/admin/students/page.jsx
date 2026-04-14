'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';

export default function StudentManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        country: '',
    });

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await adminService.getAllStudents({
                limit: 100,
            });
            setStudents(response.students || []);
            setFilteredStudents(response.students || []);

            // Calculate stats
            const allStudents = response.students || [];
            setStats({
                total: allStudents.length,
                active: allStudents.filter(s => s.isActive).length,
                inactive: allStudents.filter(s => !s.isActive).length,
            });
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        const filtered = students.filter(
            s =>
                s.firstName.toLowerCase().includes(query.toLowerCase()) ||
                s.lastName.toLowerCase().includes(query.toLowerCase()) ||
                s.email.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredStudents(filtered);
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.email) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await adminService.createStudent(formData);
            alert('Student created successfully. Registration email sent.');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
                country: '',
            });
            setShowCreateModal(false);
            await fetchStudents();
        } catch (error) {
            console.error('Error creating student:', error);
            alert(error.response?.data?.message || 'Failed to create student');
        }
    };

    const handleDeleteStudent = async (id) => {
        if (!confirm('Are you sure you want to delete this student?')) return;

        try {
            await adminService.deleteStudent(id);
            alert('Student deleted successfully');
            await fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student');
        }
    };

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setShowDetailModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
                    <p className="mt-2 text-gray-600">Manage and create student accounts</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Icons.Plus size={20} />
                        Create Student
                    </button>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Icons.Upload size={20} />
                        Bulk Import
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Students</p>
                            <p className="text-3xl font-bold mt-2">{stats.total}</p>
                        </div>
                        <Icons.Users size={40} className="text-blue-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Active</p>
                            <p className="text-3xl font-bold mt-2">{stats.active}</p>
                        </div>
                        <Icons.CheckCircle size={40} className="text-green-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Inactive</p>
                            <p className="text-3xl font-bold mt-2">{stats.inactive}</p>
                        </div>
                        <Icons.XCircle size={40} className="text-red-500" />
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex gap-4 items-center justify-between">
                    <div className="flex-1 relative">
                        <Icons.Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Icons.List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Icons.Grid size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Students List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Icons.Loader className="animate-spin text-blue-500" size={40} />
                </div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map(student => (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-medium text-gray-900">{student.fullName || `${student.firstName} ${student.lastName}`}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{student.phoneNumber || '-'}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {student.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(student.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleViewDetails(student)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Icons.Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStudent(student._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Icons.Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map(student => (
                        <div key={student._id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Icons.User className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{student.fullName || `${student.firstName} ${student.lastName}`}</h3>
                                    <p className="text-sm text-gray-600">{student.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium">{student.phoneNumber || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Country:</span>
                                    <span className="font-medium">{student.country || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium ${student.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {student.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleViewDetails(student)}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Icons.Eye size={16} />
                                    View
                                </button>
                                <button
                                    onClick={() => handleDeleteStudent(student._id)}
                                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Icons.Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Student Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">Create New Student</h2>
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">Student Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-600">Name</label>
                                <p className="font-semibold text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Email</label>
                                <p className="font-semibold text-gray-900">{selectedStudent.email}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Phone</label>
                                <p className="font-semibold text-gray-900">{selectedStudent.phoneNumber || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Country</label>
                                <p className="font-semibold text-gray-900">{selectedStudent.country || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Status</label>
                                <p className={`font-semibold ${selectedStudent.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedStudent.isActive ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Joined</label>
                                <p className="font-semibold text-gray-900">{new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
