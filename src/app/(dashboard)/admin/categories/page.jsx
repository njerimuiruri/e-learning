'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Save, ArrowLeft, Users, CreditCard, Globe, Check } from 'lucide-react';
import categoryService from '@/lib/api/categoryService';
import RichTextEditor from '@/components/ui/RichTextEditor';

const RICH_FIELDS = [
    { key: 'courseDescription', label: 'Course Description' },
    { key: 'overallObjectives', label: 'Overall Course Objectives' },
    { key: 'learningOutcomes', label: 'Learning Outcomes' },
    { key: 'academicStructure', label: 'Academic Structure' },
    { key: 'progressionFramework', label: 'Progression & Certification Framework' },
    { key: 'fellowshipLevels', label: 'Levels of the Fellowship' },
];

/**
 * Access type options with clear, unambiguous labels and descriptions.
 *
 * 'fellows_only'  → stored as accessType:'restricted', isPaid:true  — fellows in this category free; everyone else pays
 * 'paid'          → stored as accessType:'paid',       isPaid:true  — same payment rule; primarily for general public
 */
const ACCESS_TYPES = [
    {
        value: 'fellows_only',
        label: 'Fellows Priority',
        icon: Users,
        color: 'purple',
        summary: 'Fellows assigned here enroll free — anyone else can pay to access',
        details: [
            'Fellows you specifically assign to this category enroll for free',
            'Fellows assigned to other categories must pay — same as the general public',
            'Non-fellows can also pay the set price to access this category',
            'Set a price below — it applies to everyone who is not an assigned fellow',
        ],
    },
    {
        value: 'paid',
        label: 'Paid (Open Enrollment)',
        icon: CreditCard,
        color: 'orange',
        summary: 'Open to all — fellows assigned here enroll free, everyone else pays',
        details: [
            'Anyone can discover and enroll in this category by paying',
            'Fellows you specifically assign to this category still enroll for free',
            'Fellows assigned to other categories must pay just like the general public',
            'Set a price below — it applies to all non-assigned users',
        ],
    },
];

const emptyForm = {
    name: '',
    description: '',
    accessType: 'fellows_only', // UI value — mapped to backend on submit
    price: 0,
    courseDescription: '',
    overallObjectives: '',
    learningOutcomes: '',
    academicStructure: '',
    progressionFramework: '',
    fellowshipLevels: '',
};

/** Map the stored backend accessType back to the UI radio value */
function toUiAccessType(category) {
    if (category.accessType === 'paid') return 'paid';
    if (category.accessType === 'restricted') return 'fellows_only';
    return 'fellows_only'; // fallback for legacy 'free' categories
}

/** Build the payload fields that go to the backend */
function toApiAccessFields(uiAccessType, price) {
    if (uiAccessType === 'paid') {
        return { accessType: 'paid', isPaid: true, price: price || 0, paymentRequiredForNonEligible: true };
    }
    // fellows_only → 'restricted': fellows assigned here free; everyone else pays
    return { accessType: 'restricted', isPaid: true, price: price || 0, paymentRequiredForNonEligible: true };
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit'
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [expandedCards, setExpandedCards] = useState({});

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAllCategories();
            setCategories(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '').trim() : '';

    const handleCreate = () => {
        setEditingId(null);
        setFormData({ ...emptyForm });
        setMode('create');
    };

    const handleEdit = (category) => {
        setEditingId(category._id);
        setFormData({
            name: category.name || '',
            description: category.description || '',
            accessType: toUiAccessType(category),
            price: category.price || 0,
            courseDescription: category.courseDescription || '',
            overallObjectives: category.overallObjectives || '',
            learningOutcomes: category.learningOutcomes || '',
            academicStructure: category.academicStructure || '',
            progressionFramework: category.progressionFramework || '',
            fellowshipLevels: category.fellowshipLevels || '',
        });
        setMode('edit');
    };

    const handleCancel = () => {
        setMode('list');
        setEditingId(null);
        setFormData({ ...emptyForm });
        setError('');
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) { setError('Category name is required'); return; }
        if (!formData.price || formData.price <= 0) {
            setError('Please enter a valid price. Both category types require a price — it is charged to non-fellows and the general public.');
            return;
        }
        try {
            setSaving(true);
            setError('');
            const accessFields = toApiAccessFields(formData.accessType, formData.price);
            const payload = {
                name: formData.name,
                description: formData.description,
                courseDescription: formData.courseDescription,
                overallObjectives: formData.overallObjectives,
                learningOutcomes: formData.learningOutcomes,
                academicStructure: formData.academicStructure,
                progressionFramework: formData.progressionFramework,
                fellowshipLevels: formData.fellowshipLevels,
                ...accessFields,
            };
            if (editingId) {
                await categoryService.updateCategory(editingId, payload);
            } else {
                await categoryService.createCategory(payload);
            }
            await fetchCategories();
            handleCancel();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                setLoading(true);
                await categoryService.deleteCategory(id);
                await fetchCategories();
            } catch {
                setError('Failed to delete category');
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleCard = (id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    const hasRichContent = (category) => RICH_FIELDS.some(f => stripHtml(category[f.key]));

    // ── helper for list-view badge ───────────────────────────────────────────
    const accessBadge = (category) => {
        if (category.accessType === 'paid') {
            return (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CreditCard size={11} /> Paid
                    {category.price > 0 && <span className="ml-1 opacity-70">· ${category.price.toLocaleString()}</span>}
                </span>
            );
        }
        if (category.accessType === 'restricted') {
            return (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Users size={11} /> Fellows Priority
                    {category.price > 0 && <span className="ml-1 opacity-70">· ${category.price.toLocaleString()}</span>}
                </span>
            );
        }
        // Legacy 'free' — fully blocked
        return (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full flex items-center gap-1">
                <Users size={11} /> Fellows Only (Blocked)
            </span>
        );
    };

    // =========================================================================
    // CREATE / EDIT FORM
    // =========================================================================
    if (mode === 'create' || mode === 'edit') {
        const selectedType = ACCESS_TYPES.find(t => t.value === formData.accessType);

        return (
            <div className="p-6 max-w-4xl mx-auto">
                <button onClick={handleCancel} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium">
                    <ArrowLeft size={16} /> Back to Categories
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    {editingId ? 'Edit Category' : 'Create New Category'}
                </h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* ── Basic Info ─────────────────────────────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., AI for Climate Resilience"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief summary of this category"
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Access Type ────────────────────────────────────── */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Access Type</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Choose who can enroll in modules under this category.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {ACCESS_TYPES.map(opt => {
                                const Icon = opt.icon;
                                const selected = formData.accessType === opt.value;
                                const colorMap = {
                                    purple: {
                                        border: selected ? 'border-purple-500' : 'border-gray-200',
                                        bg: selected ? 'bg-purple-50' : 'bg-white hover:bg-gray-50',
                                        iconBg: 'bg-purple-100',
                                        iconColor: 'text-purple-600',
                                        check: 'bg-purple-600',
                                        bullet: 'text-purple-500',
                                    },
                                    orange: {
                                        border: selected ? 'border-orange-500' : 'border-gray-200',
                                        bg: selected ? 'bg-orange-50' : 'bg-white hover:bg-gray-50',
                                        iconBg: 'bg-orange-100',
                                        iconColor: 'text-orange-600',
                                        check: 'bg-orange-600',
                                        bullet: 'text-orange-500',
                                    },
                                };
                                const c = colorMap[opt.color];

                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, accessType: opt.value })}
                                        className={`relative text-left rounded-xl border-2 p-5 transition-all cursor-pointer ${c.border} ${c.bg}`}
                                    >
                                        {/* selected checkmark */}
                                        {selected && (
                                            <span className={`absolute top-3 right-3 w-6 h-6 rounded-full ${c.check} flex items-center justify-center`}>
                                                <Check size={14} className="text-white" />
                                            </span>
                                        )}

                                        <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center mb-3`}>
                                            <Icon size={20} className={c.iconColor} />
                                        </div>

                                        <p className="font-semibold text-gray-900 mb-1">{opt.label}</p>
                                        <p className="text-xs text-gray-500 mb-3">{opt.summary}</p>

                                        <ul className="space-y-1.5">
                                            {opt.details.map((d, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                                    <span className={`mt-0.5 font-bold ${c.bullet}`}>·</span>
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Price — always required for both options */}
                        <div className={`mt-5 rounded-xl p-4 border ${formData.accessType === 'fellows_only' ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'}`}>
                            <label className={`block text-sm font-semibold mb-2 ${formData.accessType === 'fellows_only' ? 'text-purple-800' : 'text-orange-800'}`}>
                                Enrollment Price <span className="text-red-500">*</span>
                                <span className={`font-normal ml-1 ${formData.accessType === 'fellows_only' ? 'text-purple-600' : 'text-orange-600'}`}>
                                    (charged to non-assigned users and the general public)
                                </span>
                            </label>
                            <div className="relative max-w-xs">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.price || ''}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g. 5000"
                                    className={`w-full pl-7 pr-4 py-2 rounded-lg focus:ring-2 focus:border-transparent bg-white text-sm border ${formData.accessType === 'fellows_only' ? 'border-purple-300 focus:ring-purple-500' : 'border-orange-300 focus:ring-orange-500'}`}
                                />
                            </div>
                            <p className={`text-xs mt-2 ${formData.accessType === 'fellows_only' ? 'text-purple-600' : 'text-orange-600'}`}>
                                Fellows you specifically assign to <strong>this category</strong> always enroll for free.
                                Everyone else — including fellows assigned to other categories — must pay this price.
                            </p>
                        </div>
                    </div>

                    {/* ── Rich Text Fields ───────────────────────────────── */}
                    {RICH_FIELDS.map(field => (
                        <div key={field.key} className="bg-white border border-gray-200 rounded-xl p-6">
                            <RichTextEditor
                                label={field.label}
                                value={formData[field.key]}
                                onChange={val => setFormData({ ...formData, [field.key]: val })}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                                height={180}
                            />
                        </div>
                    ))}

                    {/* ── Actions ────────────────────────────────────────── */}
                    <div className="flex gap-3 pt-4 pb-8">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // LIST VIEW
    // =========================================================================
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Course Categories</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage categories and their access rules for students.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus size={20} /> Add Category
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No categories found. Create one to get started!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {categories.map(category => (
                        <div key={category._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                            <div className="flex justify-between items-start p-5">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                        {accessBadge(category)}
                                        {hasRichContent(category) && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                                                Rich content
                                            </span>
                                        )}
                                    </div>
                                    {category.description && (
                                        <p className="text-gray-500 text-sm">{category.description}</p>
                                    )}
                                    {/* Access explainer line */}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {category.accessType === 'paid'
                                            ? `Open enrollment · $${(category.price || 0).toLocaleString()} · Assigned fellows enroll free — all others pay`
                                            : category.accessType === 'restricted'
                                            ? `Fellows Priority · $${(category.price || 0).toLocaleString()} · Assigned fellows free — public & non-assigned fellows pay`
                                            : 'Legacy — fellows only, public blocked (edit to update access type)'
                                        }
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Created: {new Date(category.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    {hasRichContent(category) && (
                                        <button
                                            onClick={() => toggleCard(category._id)}
                                            className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition"
                                            title="View details"
                                        >
                                            {expandedCards[category._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(category)}
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

                            {/* Expanded Rich Content Preview */}
                            {expandedCards[category._id] && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                                    {RICH_FIELDS.map(field => {
                                        const content = category[field.key];
                                        if (!stripHtml(content)) return null;
                                        return (
                                            <div key={field.key}>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">{field.label}</h4>
                                                <div
                                                    className="prose prose-sm max-w-none bg-white rounded-lg p-3 border border-gray-200"
                                                    dangerouslySetInnerHTML={{ __html: content }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
