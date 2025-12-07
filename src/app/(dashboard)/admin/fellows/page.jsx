'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';

export default function FellowsManagementPage() {
    const [activeTab, setActiveTab] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [fellows, setFellows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [deletingId, setDeletingId] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const [studentForm, setStudentForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        country: '',
    });

    const [instructorForm, setInstructorForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        institution: '',
        bio: '',
        country: '',
    });

    useEffect(() => {
        if (activeTab === 'list') {
            fetchFellows();
        }
    }, [filterStatus, pagination.page, activeTab]);

    const fetchFellows = async () => {
        try {
            setLoading(true);
            setError('');
            const filters = { page: pagination.page, limit: pagination.limit };
            if (filterStatus !== 'all') filters.status = filterStatus;

            console.log('Fetching fellows with filters:', filters);
            const response = await adminService.getAllStudents(filters);
            console.log('API Response:', response);

            const students = response.students || response.data || [];
            const paginationData = response.pagination || pagination;
            setFellows(Array.isArray(students) ? students : []);
            setPagination(paginationData);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load fellows data';
            console.error('Error fetching fellows:', err.response?.data || err.message);
            console.error('Status:', err.response?.status);
            console.error('Full error:', err);
            setError(errorMessage);
            setFellows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        if (!studentForm.firstName || !studentForm.lastName || !studentForm.email) {
            setSubmitMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setSubmitLoading(true);
        try {
            await adminService.createStudent(studentForm);
            setSubmitMessage({ type: 'success', text: 'Fellow created successfully! Credentials email sent.' });
            setStudentForm({ firstName: '', lastName: '', email: '', phoneNumber: '', country: '' });
            setTimeout(() => {
                setActiveTab('list');
                setSubmitMessage('');
                fetchFellows();
            }, 1500);
        } catch (err) {
            setSubmitMessage({ type: 'error', text: err.message || 'Failed to create student' });
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCreateInstructor = async (e) => {
        e.preventDefault();
        if (!instructorForm.firstName || !instructorForm.lastName || !instructorForm.email) {
            setSubmitMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setSubmitLoading(true);
        try {
            setSubmitMessage({ type: 'success', text: 'Instructor created successfully!' });
            setInstructorForm({ firstName: '', lastName: '', email: '', phoneNumber: '', institution: '', bio: '', country: '' });
            setTimeout(() => {
                setActiveTab('list');
                setSubmitMessage('');
            }, 1500);
        } catch (err) {
            setSubmitMessage({ type: 'error', text: err.message || 'Failed to create instructor' });
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDeleteFellow = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            setDeletingId(id);
            await adminService.deleteUser(id);
            alert('Fellow removed successfully');
            fetchFellows();
        } catch (err) {
            alert('Failed to remove fellow');
        } finally {
            setDeletingId(null);
        }
    };

    const FormInput = ({ label, name, value, onChange, type = 'text', placeholder, required = false }) => (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
        </div>
    );

    const CreateStudentForm = () => (
        <form onSubmit={handleCreateStudent} className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Fellow (Student)</h2>

            {submitMessage && (
                <div className={`mb-6 p-4 rounded-lg ${submitMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {submitMessage.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="First Name" name="firstName" value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} placeholder="John" required />
                <FormInput label="Last Name" name="lastName" value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} placeholder="Doe" required />
                <FormInput label="Email" name="email" type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="john@example.com" required />
                <FormInput label="Phone" name="phoneNumber" value={studentForm.phoneNumber} onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })} placeholder="+1234567890" />
                <FormInput label="Country" name="country" value={studentForm.country} onChange={(e) => setStudentForm({ ...studentForm, country: e.target.value })} placeholder="Country" />
            </div>

            <div className="flex gap-3 mt-6">
                <button type="submit" disabled={submitLoading} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                    {submitLoading ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.Plus className="w-4 h-4" />}
                    Create Fellow
                </button>
                <button type="button" onClick={() => setActiveTab('list')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium">Cancel</button>
            </div>
        </form>
    );

    const CreateInstructorForm = () => (
        <form onSubmit={handleCreateInstructor} className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Instructor</h2>

            {submitMessage && (
                <div className={`mb-6 p-4 rounded-lg ${submitMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {submitMessage.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="First Name" name="firstName" value={instructorForm.firstName} onChange={(e) => setInstructorForm({ ...instructorForm, firstName: e.target.value })} placeholder="Jane" required />
                <FormInput label="Last Name" name="lastName" value={instructorForm.lastName} onChange={(e) => setInstructorForm({ ...instructorForm, lastName: e.target.value })} placeholder="Smith" required />
                <FormInput label="Email" name="email" type="email" value={instructorForm.email} onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })} placeholder="jane@example.com" required />
                <FormInput label="Phone" name="phoneNumber" value={instructorForm.phoneNumber} onChange={(e) => setInstructorForm({ ...instructorForm, phoneNumber: e.target.value })} placeholder="+1234567890" />
                <FormInput label="Institution" name="institution" value={instructorForm.institution} onChange={(e) => setInstructorForm({ ...instructorForm, institution: e.target.value })} placeholder="University" />
                <FormInput label="Country" name="country" value={instructorForm.country} onChange={(e) => setInstructorForm({ ...instructorForm, country: e.target.value })} placeholder="Country" />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                <textarea value={instructorForm.bio} onChange={(e) => setInstructorForm({ ...instructorForm, bio: e.target.value })} placeholder="Brief biography..." rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>

            <div className="flex gap-3 mt-6">
                <button type="submit" disabled={submitLoading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                    {submitLoading ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.Plus className="w-4 h-4" />}
                    Create Instructor
                </button>
                <button type="button" onClick={() => setActiveTab('list')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium">Cancel</button>
            </div>
        </form>
    );

    if (activeTab === 'create-student') {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fellows Management</h1>
                        <p className="text-gray-600">Create and manage fellows and instructors</p>
                    </div>
                    <div className="bg-white rounded-xl p-8 border border-gray-200">
                        <CreateStudentForm />
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === 'create-instructor') {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fellows Management</h1>
                        <p className="text-gray-600">Create and manage fellows and instructors</p>
                    </div>
                    <div className="bg-white rounded-xl p-8 border border-gray-200">
                        <CreateInstructorForm />
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading fellows...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Fellows Management</h1>
                    <p className="text-gray-600">Create new fellows and manage instructor approvals</p>
                </div>

                {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button onClick={() => setActiveTab('create-student')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md">
                        <Icons.Plus className="w-5 h-5" />
                        Create New Fellow (Student)
                    </button>
                    <button onClick={() => setActiveTab('create-instructor')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md">
                        <Icons.Plus className="w-5 h-5" />
                        Create New Instructor
                    </button>
                </div>

                <div className="bg-white rounded-xl p-6 mb-8 border">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" placeholder="Search fellows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                            <option value="all">All Students</option>
                            <option value="active">Active</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {fellows.length === 0 ? (
                        <div className="bg-white rounded-xl text-center py-16">
                            <Icons.Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900">No fellows yet</h3>
                            <p className="text-gray-600">Create your first fellow to get started</p>
                        </div>
                    ) : (
                        fellows.map((fellow) => (
                            <div key={fellow._id} className="bg-white rounded-xl shadow border p-6">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {fellow.firstName?.[0]}{fellow.lastName?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900">{fellow.firstName} {fellow.lastName}</h3>
                                        <p className="text-sm text-gray-600">{fellow.email}</p>
                                        {fellow.phoneNumber && <p className="text-sm text-gray-600">{fellow.phoneNumber}</p>}
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => handleDeleteFellow(fellow._id)} disabled={deletingId === fellow._id} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
