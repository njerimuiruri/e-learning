'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';
import moduleRatingService from '@/lib/api/moduleRatingService';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: 'FileEdit' },
    submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-700', icon: 'Clock' },
    approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: 'CheckCircle' },
    published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: 'Globe' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: 'XCircle' },
    archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500', icon: 'Archive' },
};

const LEVEL_CONFIG = {
    beginner: { label: 'Beginner', color: 'bg-emerald-100 text-emerald-700' },
    intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700' },
    advanced: { label: 'Advanced', color: 'bg-red-100 text-red-700' },
};

export default function AdminModulesPage() {
    const router = useRouter();
    const [modules, setModules] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('cards');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    // Action modals
    const [selectedModule, setSelectedModule] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [modalReviews, setModalReviews] = useState([]);

    useEffect(() => {
        fetchModules();
        fetchStats();
    }, [statusFilter, levelFilter, pagination.page]);

    useEffect(() => {
        if (selectedModule?.status === 'published' && showDetailModal) {
            moduleRatingService.getModuleReviews(selectedModule._id, 1, 5)
                .then((data) => setModalReviews(data?.reviews || []))
                .catch(() => setModalReviews([]));
        } else {
            setModalReviews([]);
        }
    }, [selectedModule?._id, showDetailModal]);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const filters = {
                page: pagination.page,
                limit: pagination.limit,
            };
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (levelFilter !== 'all') filters.level = levelFilter;

            const data = await adminService.getAllModules(filters);
            setModules(data.modules || []);
            setPagination(prev => ({ ...prev, ...data.pagination }));
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await adminService.getModuleDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching module stats:', error);
        }
    };

    const filteredModules = useMemo(() => {
        if (!searchQuery.trim()) return modules;
        const q = searchQuery.toLowerCase();
        return modules.filter(m =>
            m.title?.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.categoryId?.name?.toLowerCase().includes(q) ||
            m.instructorIds?.some(i => `${i.firstName} ${i.lastName}`.toLowerCase().includes(q))
        );
    }, [modules, searchQuery]);

    const handleApprove = async (moduleId) => {
        if (!confirm('Are you sure you want to approve this module?')) return;
        setActionLoading(true);
        try {
            await adminService.approveModule(moduleId);
            fetchModules();
            fetchStats();
            setShowDetailModal(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve module');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePublish = async (moduleId) => {
        if (!confirm('Are you sure you want to publish this module? It will become visible to students.')) return;
        setActionLoading(true);
        try {
            await adminService.publishModule(moduleId);
            fetchModules();
            fetchStats();
            setShowDetailModal(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to publish module');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        setActionLoading(true);
        try {
            await adminService.rejectModule(selectedModule._id, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            fetchModules();
            fetchStats();
            setShowDetailModal(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reject module');
        } finally {
            setActionLoading(false);
        }
    };

    const openModuleDetail = (mod) => {
        router.push(`/admin/modules/${mod._id}`);
    };

    const getInstructorNames = (instructorIds) => {
        if (!instructorIds || instructorIds.length === 0) return 'No instructor';
        return instructorIds.map(i => `${i.firstName || ''} ${i.lastName || ''}`.trim()).join(', ');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const stripHtml = (html) => {
        if (!html) return '';
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Module Management</h1>
                    <p className="text-gray-600 mt-1">Review, approve, and manage learning modules</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Icons.BookOpen className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalModules}</p>
                            <p className="text-xs text-gray-500">Total Modules</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Icons.Clock className="w-4 h-4 text-yellow-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-yellow-600">{stats.modulesByStatus?.submitted || 0}</p>
                            <p className="text-xs text-gray-500">Pending Review</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Icons.Globe className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{stats.modulesByStatus?.published || 0}</p>
                            <p className="text-xs text-gray-500">Published</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Icons.CheckCircle className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{stats.modulesByStatus?.approved || 0}</p>
                            <p className="text-xs text-gray-500">Approved</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Icons.Users className="w-4 h-4 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{stats.totalModuleEnrollments || 0}</p>
                            <p className="text-xs text-gray-500">Enrollments</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Icons.TrendingUp className="w-4 h-4 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">{stats.moduleCompletionRate || '0%'}</p>
                            <p className="text-xs text-gray-500">Completion Rate</p>
                        </div>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                    <div className="p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                                <option value="published">Published</option>
                                <option value="rejected">Rejected</option>
                            </select>

                            {/* Level Filter */}
                            <select
                                value={levelFilter}
                                onChange={(e) => { setLevelFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>

                            {/* Search */}
                            <div className="relative">
                                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search modules..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Icons.LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Icons.List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredModules.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                        <Icons.BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search query.</p>
                    </div>
                ) : viewMode === 'cards' ? (
                    /* Card View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredModules.map((mod) => {
                            const statusCfg = STATUS_CONFIG[mod.status] || STATUS_CONFIG.draft;
                            const levelCfg = LEVEL_CONFIG[mod.level] || LEVEL_CONFIG.beginner;
                            const StatusIcon = Icons[statusCfg.icon];

                            return (
                                <div
                                    key={mod._id}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                                    onClick={() => openModuleDetail(mod)}
                                >
                                    {/* Banner */}
                                    <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                                        {mod.bannerUrl && (
                                            <img src={mod.bannerUrl} alt="" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelCfg.color}`}>
                                                {levelCfg.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{mod.title}</h3>
                                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{stripHtml(mod.description)}</p>

                                        {/* Ratings */}
                                        {mod.status === 'published' && (mod.avgRating > 0 || mod.totalRatings > 0) && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Icons.Star
                                                            key={s}
                                                            className={`w-3.5 h-3.5 ${s <= Math.round(mod.avgRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">{(mod.avgRating || 0).toFixed(1)}</span>
                                                <span className="text-xs text-gray-500">({mod.totalRatings || 0})</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                            <Icons.Tag className="w-3 h-3" />
                                            <span>{mod.categoryId?.name || 'No category'}</span>
                                            <span className="mx-1">|</span>
                                            <Icons.User className="w-3 h-3" />
                                            <span className="truncate">{getInstructorNames(mod.instructorIds)}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Icons.BookOpen className="w-3 h-3" />
                                                {mod.lessons?.length || 0} lessons
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Icons.Users className="w-3 h-3" />
                                                {mod.enrollmentCount || 0} enrolled
                                            </span>
                                            <span>{formatDate(mod.createdAt)}</span>
                                        </div>

                                        {/* Quick Actions for submitted modules */}
                                        {mod.status === 'submitted' && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(mod._id); }}
                                                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedModule(mod); setShowRejectModal(true); }}
                                                    className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {mod.status === 'approved' && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePublish(mod._id); }}
                                                    className="w-full px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    Publish Module
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Module</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Category</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Level</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Instructor</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Lessons</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Enrolled</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Rating</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Created</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredModules.map((mod) => {
                                        const statusCfg = STATUS_CONFIG[mod.status] || STATUS_CONFIG.draft;
                                        const levelCfg = LEVEL_CONFIG[mod.level] || LEVEL_CONFIG.beginner;

                                        return (
                                            <tr
                                                key={mod._id}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => openModuleDetail(mod)}
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-900 text-sm line-clamp-1">{mod.title}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{mod.categoryId?.name || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelCfg.color}`}>
                                                        {levelCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                                                    {getInstructorNames(mod.instructorIds)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{mod.lessons?.length || 0}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{mod.enrollmentCount || 0}</td>
                                                <td className="px-4 py-3">
                                                    {mod.status === 'published' && mod.totalRatings > 0 ? (
                                                        <div className="flex items-center gap-1">
                                                            <Icons.Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                            <span className="text-sm font-medium text-gray-800">{(mod.avgRating || 0).toFixed(1)}</span>
                                                            <span className="text-xs text-gray-400">({mod.totalRatings})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(mod.createdAt)}</td>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-1">
                                                        {mod.status === 'submitted' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(mod._id)}
                                                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <Icons.Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedModule(mod); setShowRejectModal(true); }}
                                                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <Icons.X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {mod.status === 'approved' && (
                                                            <button
                                                                onClick={() => handlePublish(mod._id)}
                                                                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                                title="Publish"
                                                            >
                                                                <Icons.Globe className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openModuleDetail(mod)}
                                                            className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Icons.Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-600">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} modules
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                let pageNum;
                                if (pagination.pages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.pages - 2) {
                                    pageNum = pagination.pages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                                        className={`px-3 py-1.5 text-sm rounded-lg ${pagination.page === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.pages}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Module Detail Modal */}
            {showDetailModal && selectedModule && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-lg font-bold text-gray-900">Module Details</h2>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <Icons.X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Title & Status */}
                            <div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${(STATUS_CONFIG[selectedModule.status] || STATUS_CONFIG.draft).color}`}>
                                        {(STATUS_CONFIG[selectedModule.status] || STATUS_CONFIG.draft).label}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${(LEVEL_CONFIG[selectedModule.level] || LEVEL_CONFIG.beginner).color}`}>
                                        {(LEVEL_CONFIG[selectedModule.level] || LEVEL_CONFIG.beginner).label}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedModule.title}</h3>
                                <p className="text-gray-600 mt-1">{stripHtml(selectedModule.description)}</p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Category</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedModule.categoryId?.name || '-'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Instructor(s)</p>
                                    <p className="text-sm font-medium text-gray-900">{getInstructorNames(selectedModule.instructorIds)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Lessons</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedModule.lessons?.length || 0}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedModule.duration || 'Not set'}</p>
                                </div>
                            </div>

                            {/* Enrollment Stats */}
                            {selectedModule.enrollmentStats && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Enrollment Statistics</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-3">
                                            <p className="text-xs text-blue-600">Total Enrollments</p>
                                            <p className="text-lg font-bold text-blue-700">{selectedModule.enrollmentStats.totalEnrollments}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3">
                                            <p className="text-xs text-green-600">Completed</p>
                                            <p className="text-lg font-bold text-green-700">{selectedModule.enrollmentStats.completedCount}</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-3">
                                            <p className="text-xs text-purple-600">Completion Rate</p>
                                            <p className="text-lg font-bold text-purple-700">{selectedModule.enrollmentStats.completionRate}%</p>
                                        </div>
                                        <div className="bg-amber-50 rounded-lg p-3">
                                            <p className="text-xs text-amber-600">Avg Progress</p>
                                            <p className="text-lg font-bold text-amber-700">{selectedModule.enrollmentStats.avgProgress}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Ratings */}
                            {selectedModule.status === 'published' && (selectedModule.avgRating > 0 || selectedModule.totalRatings > 0) && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Icons.Star className="w-4 h-4 text-amber-500" /> Student Ratings
                                    </h4>
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-3 flex items-center gap-4">
                                        <div className="text-center flex-shrink-0">
                                            <p className="text-3xl font-bold text-gray-900 leading-none">{(selectedModule.avgRating || 0).toFixed(1)}</p>
                                            <div className="flex justify-center mt-1.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Icons.Star
                                                        key={s}
                                                        className={`w-4 h-4 ${s <= Math.round(selectedModule.avgRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {selectedModule.totalRatings || 0} rating{(selectedModule.totalRatings || 0) !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recent Reviews */}
                                    {modalReviews.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Reviews</p>
                                            {modalReviews.map((rev, idx) => (
                                                <div key={rev._id || idx} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                {rev.studentId?.firstName?.[0] || '?'}
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-700">
                                                                {rev.studentId
                                                                    ? `${rev.studentId.firstName} ${rev.studentId.lastName}`
                                                                    : 'Student'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <Icons.Star
                                                                        key={s}
                                                                        className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-xs text-gray-400 ml-1">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    {rev.review && (
                                                        <p className="text-xs text-gray-600 ml-8 leading-relaxed">{rev.review}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lessons List */}
                            {selectedModule.lessons && selectedModule.lessons.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Lessons ({selectedModule.lessons.length})</h4>
                                    <div className="space-y-2">
                                        {selectedModule.lessons.map((lesson, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        {lesson.duration && <span>{lesson.duration}</span>}
                                                        {lesson.videoUrl && <span className="flex items-center gap-1"><Icons.Play className="w-3 h-3" /> Video</span>}
                                                        {lesson.assessment && <span className="flex items-center gap-1"><Icons.FileText className="w-3 h-3" /> Assessment</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Final Assessment */}
                            {selectedModule.finalAssessment && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Final Assessment</h4>
                                    <div className="bg-indigo-50 rounded-lg p-4">
                                        <p className="font-medium text-indigo-900">{selectedModule.finalAssessment.title}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-indigo-600">
                                            <span>{selectedModule.finalAssessment.questions?.length || 0} questions</span>
                                            <span>Passing: {selectedModule.finalAssessment.passingScore}%</span>
                                            <span>Max attempts: {selectedModule.finalAssessment.maxAttempts === -1 ? 'Unlimited' : selectedModule.finalAssessment.maxAttempts}</span>
                                            {selectedModule.finalAssessment.timeLimit && <span>Time: {selectedModule.finalAssessment.timeLimit} min</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Learning Outcomes */}
                            {selectedModule.learningOutcomes && selectedModule.learningOutcomes.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Learning Outcomes</h4>
                                    <ul className="space-y-1">
                                        {selectedModule.learningOutcomes.map((outcome, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                <Icons.CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                {outcome}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Rejection Reason (if rejected) */}
                            {selectedModule.status === 'rejected' && selectedModule.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</h4>
                                    <p className="text-sm text-red-600">{selectedModule.rejectionReason}</p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <span>Created: {formatDate(selectedModule.createdAt)}</span>
                                {selectedModule.submittedAt && <span>Submitted: {formatDate(selectedModule.submittedAt)}</span>}
                                {selectedModule.approvedAt && <span>Approved: {formatDate(selectedModule.approvedAt)}</span>}
                                {selectedModule.publishedAt && <span>Published: {formatDate(selectedModule.publishedAt)}</span>}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                {selectedModule.status === 'submitted' && (
                                    <>
                                        <button
                                            onClick={() => handleApprove(selectedModule._id)}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Icons.CheckCircle className="w-4 h-4" />
                                            Approve Module
                                        </button>
                                        <button
                                            onClick={() => { setShowRejectModal(true); }}
                                            disabled={actionLoading}
                                            className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Icons.XCircle className="w-4 h-4" />
                                            Reject Module
                                        </button>
                                    </>
                                )}
                                {selectedModule.status === 'approved' && (
                                    <button
                                        onClick={() => handlePublish(selectedModule._id)}
                                        disabled={actionLoading}
                                        className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Icons.Globe className="w-4 h-4" />
                                        Publish Module
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
                    <div className="bg-white rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <Icons.XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Reject Module</h3>
                                    <p className="text-sm text-gray-500">
                                        {selectedModule?.title}
                                    </p>
                                </div>
                            </div>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Provide a reason for rejection. This will be visible to the instructor..."
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading || !rejectReason.trim()}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Rejecting...' : 'Reject Module'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
