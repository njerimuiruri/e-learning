'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export default function StudentResponsesPage() {
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const studentResponses = [
        {
            id: 1,
            student: 'John Doe',
            course: 'Master Digital Marketing',
            assessment: 'Module 1 Quiz',
            score: 85,
            status: 'passed',
            submittedAt: '2 hours ago',
            feedback: ''
        },
        {
            id: 2,
            student: 'Jane Smith',
            course: 'Master Digital Marketing',
            assessment: 'Final Exam',
            score: 92,
            status: 'passed',
            submittedAt: '5 hours ago',
            feedback: ''
        },
        {
            id: 3,
            student: 'Mike Johnson',
            course: 'Master Digital Marketing',
            assessment: 'Module 2 Quiz',
            score: 65,
            status: 'failed',
            submittedAt: '1 day ago',
            feedback: ''
        },
        {
            id: 4,
            student: 'Sarah Williams',
            course: 'Master Digital Marketing',
            assessment: 'Module 1 Quiz',
            score: 0,
            status: 'pending',
            submittedAt: '3 hours ago',
            feedback: ''
        },
    ];

    const [responses, setResponses] = useState(studentResponses);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [feedback, setFeedback] = useState('');

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed': return 'bg-green-100 text-green-700';
            case 'failed': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleProvideFeedback = (response) => {
        setSelectedResponse(response);
        setFeedback(response.feedback || '');
        setShowFeedbackModal(true);
    };

    const saveFeedback = () => {
        const updatedResponses = responses.map(r =>
            r.id === selectedResponse.id ? { ...r, feedback } : r
        );
        setResponses(updatedResponses);
        setShowFeedbackModal(false);
        alert('Feedback saved successfully!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                        Student Responses
                    </h1>
                    <p className="text-gray-600">Review and provide feedback on student submissions</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Courses</option>
                                <option value="marketing">Master Digital Marketing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending Review</option>
                                <option value="passed">Passed</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button className="w-full px-4 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2">
                                <Icons.Filter className="w-4 h-4" />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Icons.FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
                                <p className="text-xs text-gray-600">Total Submissions</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <Icons.Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{responses.filter(r => r.status === 'pending').length}</p>
                                <p className="text-xs text-gray-600">Pending Review</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <Icons.CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{responses.filter(r => r.status === 'passed').length}</p>
                                <p className="text-xs text-gray-600">Passed</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <Icons.TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Math.round(responses.reduce((sum, r) => sum + r.score, 0) / responses.length)}%
                                </p>
                                <p className="text-xs text-gray-600">Avg Score</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Responses List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900">Recent Submissions</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {responses.map((response) => (
                                    <tr key={response.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16a34a] to-emerald-700 flex items-center justify-center text-white font-bold text-sm">
                                                    {response.student.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{response.student}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{response.assessment}</p>
                                            <p className="text-xs text-gray-500">{response.course}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-bold text-gray-900">{response.score}%</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(response.status)}`}>
                                                {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {response.submittedAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-medium">
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleProvideFeedback(response)}
                                                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                                                >
                                                    Feedback
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feedback Modal */}
                {showFeedbackModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Provide Feedback</h2>
                                <button onClick={() => setShowFeedbackModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600">Student: <span className="font-semibold text-gray-900">{selectedResponse?.student}</span></p>
                                    <p className="text-sm text-gray-600">Assessment: <span className="font-semibold text-gray-900">{selectedResponse?.assessment}</span></p>
                                    <p className="text-sm text-gray-600">Score: <span className="font-semibold text-gray-900">{selectedResponse?.score}%</span></p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Feedback</label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Provide constructive feedback to help the student improve..."
                                        rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowFeedbackModal(false)}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveFeedback}
                                        className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700"
                                    >
                                        Save Feedback
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
