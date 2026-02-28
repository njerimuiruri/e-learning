'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import InstructorSidebar from '@/components/instructor/InstructorSidebar';

export default function InstructorModulesPage() {
    const router = useRouter();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const data = await moduleService.getInstructorModules();
            setModules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setModules([]);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredModules = () => {
        let filtered = modules;

        // Filter by status
        if (activeTab !== 'all') {
            filtered = filtered.filter(module => {
                if (activeTab === 'published') return module.status === 'published';
                if (activeTab === 'draft') return module.status === 'draft';
                if (activeTab === 'submitted') return module.status === 'submitted';
                if (activeTab === 'approved') return module.status === 'approved';
                if (activeTab === 'rejected') return module.status === 'rejected';
                return true;
            });
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(module =>
                module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
            submitted: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
            approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
            published: { color: 'bg-emerald-100 text-emerald-700', label: 'Published' },
        };
        const badge = badges[status] || badges.draft;
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const getLevelBadge = (level) => {
        const badges = {
            beginner: { color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Beginner', icon: 'GraduationCap' },
            intermediate: { color: 'bg-purple-50 text-purple-600 border-purple-200', label: 'Intermediate', icon: 'Zap' },
            advanced: { color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Advanced', icon: 'Trophy' },
        };
        const badge = badges[level] || badges.beginner;
        const IconComponent = Icons[badge.icon];

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${badge.color}`}>
                <IconComponent className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const filteredModules = getFilteredModules();
    const tabCounts = {
        all: modules.length,
        published: modules.filter(m => m.status === 'published').length,
        draft: modules.filter(m => m.status === 'draft').length,
        submitted: modules.filter(m => m.status === 'submitted').length,
        approved: modules.filter(m => m.status === 'approved').length,
        rejected: modules.filter(m => m.status === 'rejected').length,
    };

    return (
        <>
            <InstructorSidebar />
            <div className="lg:ml-4 min-h-screen bg-gray-50">
                <div className="pt-20 lg:pt-4 px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    <Icons.Layers className="w-8 h-8 text-emerald-600" />
                                    My Modules
                                    <span className="ml-2 px-2 py-1 text-xs font-bold bg-emerald-500 text-white rounded-full">
                                        NEW
                                    </span>
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage your learning modules with lessons and assessments
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/instructor/modules/create')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <Icons.PlusCircle className="w-5 h-5" />
                                Create New Module
                            </button>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Icons.Info className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                    Module-Based Learning System
                                </h3>
                                <p className="text-sm text-gray-700">
                                    Create focused learning modules with multiple lessons. Each module includes a final assessment and generates certificates upon completion.
                                    Modules are organized by level (Beginner → Intermediate → Advanced).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search modules by title or description..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Tabs */}
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                            {[
                                { key: 'all', label: 'All Modules', icon: 'Layers' },
                                { key: 'published', label: 'Published', icon: 'CheckCircle' },
                                { key: 'draft', label: 'Drafts', icon: 'FileEdit' },
                                { key: 'submitted', label: 'Submitted', icon: 'Send' },
                                { key: 'approved', label: 'Approved', icon: 'ThumbsUp' },
                                { key: 'rejected', label: 'Rejected', icon: 'XCircle' },
                            ].map((tab) => {
                                const IconComponent = Icons[tab.icon];
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.key
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                        {tab.label}
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === tab.key ? 'bg-white text-emerald-600' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {tabCounts[tab.key]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Modules Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading modules...</p>
                            </div>
                        </div>
                    ) : filteredModules.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Layers className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {searchQuery || activeTab !== 'all' ? 'No modules found' : 'No modules yet'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || activeTab !== 'all'
                                    ? 'Try adjusting your filters or search query'
                                    : 'Get started by creating your first learning module'}
                            </p>
                            <button
                                onClick={() => router.push('/instructor/modules/create')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <Icons.PlusCircle className="w-5 h-5" />
                                Create Your First Module
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredModules.map((module) => (
                                <div
                                    key={module._id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
                                >
                                    {/* Module Banner */}
                                    <div className="relative h-40 bg-gradient-to-br from-emerald-400 to-teal-500 overflow-hidden">
                                        {module.bannerUrl ? (
                                            <img
                                                src={module.bannerUrl}
                                                alt={module.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icons.Layers className="w-16 h-16 text-white opacity-50" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            {getStatusBadge(module.status)}
                                        </div>
                                    </div>

                                    {/* Module Content */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                                                {module.title}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            {getLevelBadge(module.level)}
                                            {module.categoryId?.name && (
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                                                    {module.categoryId.name}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                            {module.description
                                                ? (() => {
                                                    const tempDiv = document.createElement("div");
                                                    tempDiv.innerHTML = module.description;
                                                    return tempDiv.textContent?.trim() || "No description provided";
                                                })()
                                                : "No description provided"}
                                        </p>


                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-1">
                                                <Icons.BookOpen className="w-4 h-4" />
                                                <span>{module.lessons?.length || 0} Lessons</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Icons.Users className="w-4 h-4" />
                                                <span>{module.enrollmentCount || 0} Students</span>
                                            </div>
                                            {module.completionRate > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Icons.TrendingUp className="w-4 h-4" />
                                                    <span>{module.completionRate}%</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Rejection Reason */}
                                        {module.status === 'rejected' && module.rejectionReason && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                                                <p className="text-xs text-red-700">{module.rejectionReason}</p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.push(`/instructor/modules/${module._id}`)}
                                                className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                View Details
                                            </button>
                                            {(module.status === 'draft' || module.status === 'rejected') && (
                                                <button
                                                    onClick={() => router.push(`/instructor/modules/${module._id}/edit`)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    <Icons.Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
