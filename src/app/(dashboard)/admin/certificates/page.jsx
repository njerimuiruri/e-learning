'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';

export default function CertificateManagementPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const certificateRef = useRef(null);

    const [certificateDesign, setCertificateDesign] = useState({
        template: 'elegant',
        primaryColor: '#2563eb',
        secondaryColor: '#60a5fa',
        logoUrl: '',
        institutionName: 'Learning Excellence Academy',
        signatureName: 'Dr. John Smith',
        signatureTitle: 'Director of Education',
        includeQRCode: true,
        borderStyle: 'classic',
        fontStyle: 'serif'
    });

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/certificates', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch certificates');

            const data = await response.json();
            setCertificates(data.data || []);
        } catch (err) {
            setError('Failed to load certificates');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const studentsData = certificates;

    const filteredStudents = studentsData.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.course.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'pending' ? student.status === 'pending' : activeTab === 'issued' ? student.status === 'issued' : true;
        return matchesSearch && matchesTab;
    });

    const handleIssueCertificate = (student) => {
        console.log('Issuing certificate for:', student.name);
        alert(`Certificate issued to ${student.name}!`);
        setSelectedStudent(null);
    };

    const downloadCertificateAsPDF = async (student) => {
        try {
            alert(`PDF download functionality requires html2canvas and jsPDF libraries to be installed in your Next.js project.\n\nFor now, you can:\n1. Take a screenshot of the certificate preview\n2. Right-click and "Print to PDF"\n3. Or install the libraries: npm install html2canvas jspdf`);
            window.print();
        } catch (error) {
            console.error('Error:', error);
            alert('Please use your browser\'s print function (Ctrl+P or Cmd+P) to save as PDF.');
        }
    };

    const CertificatePreview = ({ student }) => (
        <div
            ref={certificateRef}
            className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
                width: '850px',
                height: '600px',
                background: `linear-gradient(135deg, ${certificateDesign.primaryColor}08 0%, ${certificateDesign.secondaryColor}08 100%)`
            }}
        >
            <div
                className="absolute inset-0 m-4"
                style={{
                    border: certificateDesign.borderStyle === 'classic' ? '3px double' : '2px solid',
                    borderColor: certificateDesign.primaryColor,
                    borderRadius: '8px'
                }}
            >
                <div className="absolute -top-1 -left-1 w-20 h-20" style={{
                    borderTop: `4px solid ${certificateDesign.primaryColor}`,
                    borderLeft: `4px solid ${certificateDesign.primaryColor}`,
                    borderTopLeftRadius: '8px'
                }}></div>
                <div className="absolute -top-1 -right-1 w-20 h-20" style={{
                    borderTop: `4px solid ${certificateDesign.primaryColor}`,
                    borderRight: `4px solid ${certificateDesign.primaryColor}`,
                    borderTopRightRadius: '8px'
                }}></div>
                <div className="absolute -bottom-1 -left-1 w-20 h-20" style={{
                    borderBottom: `4px solid ${certificateDesign.primaryColor}`,
                    borderLeft: `4px solid ${certificateDesign.primaryColor}`,
                    borderBottomLeftRadius: '8px'
                }}></div>
                <div className="absolute -bottom-1 -right-1 w-20 h-20" style={{
                    borderBottom: `4px solid ${certificateDesign.primaryColor}`,
                    borderRight: `4px solid ${certificateDesign.primaryColor}`,
                    borderBottomRightRadius: '8px'
                }}></div>
            </div>

            <div className="relative flex flex-col items-center justify-between h-full p-12">
                <div className="text-center">
                    {certificateDesign.logoUrl && (
                        <img src={certificateDesign.logoUrl} alt="Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
                    )}
                    <h1
                        className={`text-3xl font-bold tracking-wide ${certificateDesign.fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`}
                        style={{ color: certificateDesign.primaryColor }}
                    >
                        {certificateDesign.institutionName}
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="w-16 h-0.5" style={{ backgroundColor: certificateDesign.secondaryColor }}></div>
                        <Icons.Award className="w-5 h-5" style={{ color: certificateDesign.secondaryColor }} />
                        <div className="w-16 h-0.5" style={{ backgroundColor: certificateDesign.secondaryColor }}></div>
                    </div>
                </div>

                <div className="text-center space-y-6">
                    <div>
                        <h2
                            className={`text-6xl font-bold mb-2 ${certificateDesign.fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`}
                            style={{
                                background: `linear-gradient(135deg, ${certificateDesign.primaryColor}, ${certificateDesign.secondaryColor})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}
                        >
                            Certificate
                        </h2>
                        <p className="text-xl text-gray-500 tracking-widest uppercase">of Achievement</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-600 text-lg">This is proudly presented to</p>
                        <h3
                            className={`text-5xl font-bold ${certificateDesign.fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`}
                            style={{ color: certificateDesign.primaryColor }}
                        >
                            {student ? student.name : 'Student Name'}
                        </h3>
                        <div className="w-96 mx-auto h-px bg-gray-300"></div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-gray-600">for successfully completing the course</p>
                        <h4 className="text-2xl font-semibold" style={{ color: certificateDesign.secondaryColor }}>
                            {student ? student.course : 'Course Name'}
                        </h4>
                        {student && (
                            <div className="flex items-center justify-center gap-4 text-sm">
                                <span className="px-4 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                                    Grade: {student.grade}
                                </span>
                                <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                    Score: {student.score}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-end justify-between w-full">
                    <div className="text-left">
                        <p className="text-sm text-gray-500 mb-3">Date of Completion</p>
                        <p className="text-gray-800 font-medium">
                            {student ? new Date(student.completedDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            }) : 'December 1, 2024'}
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="mb-3">
                            <div className="w-40 h-16 flex items-end justify-center">
                                <div className={`text-3xl ${certificateDesign.fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`} style={{ color: certificateDesign.primaryColor }}>
                                    {certificateDesign.signatureName.split(' ').map(n => n[0]).join('')}
                                </div>
                            </div>
                            <div className="w-40 h-px bg-gray-400 mx-auto"></div>
                        </div>
                        <p className="font-semibold text-gray-800">{certificateDesign.signatureName}</p>
                        <p className="text-sm text-gray-600">{certificateDesign.signatureTitle}</p>
                    </div>

                    <div className="text-right">
                        {certificateDesign.includeQRCode && (
                            <div className="flex flex-col items-end">
                                <div className="w-16 h-16 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center mb-2">
                                    <Icons.QrCode className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-500">Verify Certificate</p>
                            </div>
                        )}
                        {student?.certificateId && (
                            <p className="text-xs text-gray-500 mt-2 font-mono">{student.certificateId}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const stats = [
        { label: 'Pending', value: studentsData.filter(s => s.status === 'pending').length, icon: 'Clock', gradient: 'from-yellow-500 to-orange-500' },
        { label: 'Issued This Month', value: studentsData.filter(s => s.status === 'issued').length, icon: 'Award', gradient: 'from-green-500 to-emerald-500' },
        { label: 'Total Issued', value: '127', icon: 'CheckCircle', gradient: 'from-blue-500 to-indigo-500' },
        { label: 'Avg. Score', value: '93%', icon: 'TrendingUp', gradient: 'from-purple-500 to-pink-500' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <Icons.Award className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
                            <p className="text-gray-600 text-sm">Design, issue, and manage completion certificates</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat, idx) => {
                        const IconComponent = Icons[stat.icon];
                        return (
                            <div key={idx} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                                        {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                                <p className="text-sm text-gray-600">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'pending'
                                ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icons.Clock className="w-5 h-5" />
                            Pending
                            <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                {studentsData.filter(s => s.status === 'pending').length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('issued')}
                            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'issued'
                                ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icons.CheckCircle className="w-5 h-5" />
                            Issued
                            <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                {studentsData.filter(s => s.status === 'issued').length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('designer')}
                            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'designer'
                                ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icons.Palette className="w-5 h-5" />
                            Designer
                        </button>
                    </div>
                </div>

                {activeTab !== 'designer' && (
                    <>
                        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by student name, email, or course..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                            }`}
                                    >
                                        <Icons.LayoutGrid className="w-4 h-4" />
                                        Grid
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                            }`}
                                    >
                                        <Icons.Table className="w-4 h-4" />
                                        Table
                                    </button>
                                </div>
                            </div>
                        </div>

                        {viewMode === 'grid' && (
                            <div className="space-y-4">
                                {filteredStudents.map((student) => (
                                    <div key={student.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="relative">
                                                    <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-gray-100" />
                                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${student.status === 'issued' ? 'bg-green-500' : 'bg-yellow-500'
                                                        }`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{student.name}</h3>
                                                    <p className="text-sm text-gray-500 mb-2">{student.email}</p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                                            <Icons.BookOpen className="w-3 h-3" />
                                                            {student.course}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                                                            <Icons.Star className="w-3 h-3" />
                                                            {student.grade} · {student.score}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 md:items-end justify-between">
                                                <div className="text-sm text-gray-600">
                                                    <p className="flex items-center gap-1">
                                                        <Icons.Calendar className="w-4 h-4" />
                                                        Completed: {new Date(student.completedDate).toLocaleDateString()}
                                                    </p>
                                                    {student.status === 'issued' && (
                                                        <p className="flex items-center gap-1 text-green-600 mt-1">
                                                            <Icons.CheckCircle className="w-4 h-4" />
                                                            Issued: {new Date(student.issuedDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {student.certificateId && (
                                                        <p className="font-mono text-xs mt-1">{student.certificateId}</p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    {student.status === 'pending' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setShowPreview(true);
                                                            }}
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                            <Icons.Award className="w-4 h-4" />
                                                            Issue Certificate
                                                        </button>
                                                    )}
                                                    {student.status === 'issued' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStudent(student);
                                                                    setShowPreview(true);
                                                                }}
                                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                                                            >
                                                                <Icons.Eye className="w-4 h-4" />
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => downloadCertificateAsPDF(student)}
                                                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm flex items-center gap-2"
                                                            >
                                                                <Icons.Download className="w-4 h-4" />
                                                                Download
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performance</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completed</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{student.name}</p>
                                                                <p className="text-sm text-gray-500">{student.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-900">{student.course}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">{student.grade}</span>
                                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{student.score}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-600">{new Date(student.completedDate).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${student.status === 'issued'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {student.status === 'issued' ? <Icons.CheckCircle className="w-3 h-3" /> : <Icons.Clock className="w-3 h-3" />}
                                                            {student.status === 'issued' ? 'Issued' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {student.status === 'pending' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedStudent(student);
                                                                        setShowPreview(true);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                                                >
                                                                    Issue
                                                                </button>
                                                            )}
                                                            {student.status === 'issued' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedStudent(student);
                                                                            setShowPreview(true);
                                                                        }}
                                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                                    >
                                                                        <Icons.Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => downloadCertificateAsPDF(student)}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                    >
                                                                        <Icons.Download className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'designer' && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Icons.Settings className="w-6 h-6 text-blue-600" />
                                Certificate Design Settings
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                                    <input
                                        type="text"
                                        value={certificateDesign.institutionName}
                                        onChange={(e) => setCertificateDesign({ ...certificateDesign, institutionName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                                        <input
                                            type="color"
                                            value={certificateDesign.primaryColor}
                                            onChange={(e) => setCertificateDesign({ ...certificateDesign, primaryColor: e.target.value })}
                                            className="w-full h-12 rounded-lg cursor-pointer border border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                                        <input
                                            type="color"
                                            value={certificateDesign.secondaryColor}
                                            onChange={(e) => setCertificateDesign({ ...certificateDesign, secondaryColor: e.target.value })}
                                            className="w-full h-12 rounded-lg cursor-pointer border border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Signature Name</label>
                                    <input
                                        type="text"
                                        value={certificateDesign.signatureName}
                                        onChange={(e) => setCertificateDesign({ ...certificateDesign, signatureName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Signature Title</label>
                                    <input
                                        type="text"
                                        value={certificateDesign.signatureTitle}
                                        onChange={(e) => setCertificateDesign({ ...certificateDesign, signatureTitle: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (optional)</label>
                                    <input
                                        type="text"
                                        value={certificateDesign.logoUrl}
                                        onChange={(e) => setCertificateDesign({ ...certificateDesign, logoUrl: e.target.value })}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Border Style</label>
                                    <select
                                        value={certificateDesign.borderStyle}
                                        onChange={(e) => setCertificateDesign({ ...certificateDesign, borderStyle: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        <option value="classic">Classic Double Border</option>
                                        <option value="modern">Modern Single Border</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Style</label>
                                    <select
                                        value={certificateDesign.fontStyle}
                                        onChange={(e) => setCertificateDesign({ ...certificateDesign, fontStyle: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        <option value="serif">Serif (Classic)</option>
                                        <option value="sans">Sans-Serif (Modern)</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={certificateDesign.includeQRCode}
                                        onChange={(e) => setCertificateDesign({ ...certificateDesign, includeQRCode: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label className="text-sm font-medium text-gray-700">Include QR Code for Verification</label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Icons.Eye className="w-6 h-6 text-blue-600" />
                                Live Preview
                            </h2>
                            <div className="flex items-center justify-center overflow-auto" style={{ maxHeight: '700px' }}>
                                <div style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}>
                                    <CertificatePreview student={null} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showPreview && selectedStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowPreview(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                                <h2 className="text-xl font-bold text-gray-900">Certificate Preview</h2>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                    <Icons.X className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-8 flex flex-col items-center">
                                <CertificatePreview student={selectedStudent} />
                                <div className="flex gap-4 mt-8">
                                    {selectedStudent.status === 'pending' && (
                                        <button
                                            onClick={() => handleIssueCertificate(selectedStudent)}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2"
                                        >
                                            <Icons.Award className="w-5 h-5" />
                                            Issue Certificate
                                        </button>
                                    )}
                                    <button
                                        onClick={() => downloadCertificateAsPDF(selectedStudent)}
                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <Icons.Download className="w-5 h-5" />
                                        Download PDF
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