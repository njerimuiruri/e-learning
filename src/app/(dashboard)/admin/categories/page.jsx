'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import categoryService from '@/lib/api/categoryService';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAllCategories();
            setCategories(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingId(category._id);
            setFormData({
                name: category.name,
                description: category.description || '',
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Category name is required');
            return;
        }

        try {
            setLoading(true);
            if (editingId) {
                await categoryService.updateCategory(editingId, formData);
            } else {
                await categoryService.createCategory(formData);
            }
            await fetchCategories();
            handleCloseModal();
            setError('');
        } catch (err) {
            console.error('Failed to save category:', err);
            setError(err.response?.data?.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                setLoading(true);
                await categoryService.deleteCategory(id);
                await fetchCategories();
                setError('');
            } catch (err) {
                console.error('Failed to delete category:', err);
                setError('Failed to delete category');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Course Categories</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && !showModal ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No categories found. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {categories.map((category) => (
                        <div
                            key={category._id}
                            className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start hover:shadow-md transition"
                        >
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                {category.description && (
                                    <p className="text-gray-600 mt-1">{category.description}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-2">
                                    Created: {new Date(category.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(category)}
                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                                    title="Edit"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(category._id)}
                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                                    title="Delete"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingId ? 'Edit Category' : 'Add New Category'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., AI for Climate Resilience"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description for this category"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {editingId ? 'Update' : 'Create'} Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
