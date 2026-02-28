'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import adminService from '@/lib/api/adminService';
import categoryService from '@/lib/api/categoryService';

// Password generator
const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

export default function FellowsManagementPage() {
    const [activeTab, setActiveTab] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [fellows, setFellows] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [deletingId, setDeletingId] = useState(null);

    // Student form state
    const [studentStep, setStudentStep] = useState(1);
    const [studentForm, setStudentForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        country: '',
        organization: '',
        otherOrganization: '',
        profilePicture: null,
        dateOfBirth: '',
        gender: '',
        educationLevel: '',
        fieldOfStudy: '',
        linkedIn: '',
        motivation: '',
        assignedCategories: []
    });
    const [studentSubmitLoading, setStudentSubmitLoading] = useState(false);
    const [studentSubmitMessage, setStudentSubmitMessage] = useState('');
    const [showOtherOrgStudent, setShowOtherOrgStudent] = useState(false);

    // Instructor form state
    const [instructorStep, setInstructorStep] = useState(1);
    const [instructorForm, setInstructorForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        country: '',
        organization: '',
        otherOrganization: '',
        institution: '',
        profilePicture: null,
        bio: '',
        qualifications: '',
        expertise: '',
        linkedIn: '',
        portfolio: '',
        teachingExperience: '',
        yearsOfExperience: '',
        cv: null,
    });
    const [instructorSubmitLoading, setInstructorSubmitLoading] = useState(false);
    const [instructorSubmitMessage, setInstructorSubmitMessage] = useState('');
    const [showOtherOrgInstructor, setShowOtherOrgInstructor] = useState(false);

    const organizationOptions = [
        'University',
        'Research Institute',
        'NGO',
        'Government Agency',
        'Private Company',
        'Consulting Firm',
        'Individual/Freelance',
        'Other'
    ];

    // Generate passwords and fetch categories on client-side only
    useEffect(() => {
        setStudentForm(prev => ({ ...prev, password: generatePassword() }));
        setInstructorForm(prev => ({ ...prev, password: generatePassword() }));
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchFellows = async () => {
        try {
            setLoading(true);
            setError('');
            const filters = { page: pagination.page, limit: pagination.limit };
            if (filterStatus !== 'all') filters.status = filterStatus;

            const response = await adminService.getAllStudents(filters);
            const students = response.students || response.data || [];
            const paginationData = response.pagination || pagination;
            setFellows(Array.isArray(students) ? students : []);
            setPagination(paginationData);
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load fellows data';
            setError(errorMessage);
            setFellows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFellow = async (id) => {
        if (!confirm('Are you sure you want to delete this fellow?')) return;
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

    const handleStudentSubmit = async () => {
        setStudentSubmitLoading(true);
        try {
            const submitData = {
                ...studentForm,
                organization: studentForm.organization === 'Other' ? studentForm.otherOrganization : studentForm.organization,
                // Mark this student as a Fellow so the backend
                // can grant them fellowship-based access rights.
                //
                // NOTE: The backend should treat `isFellow: true`
                // as meaning: "this user is part of the Fellows program"
                // and restrict their free access to the configured
                // Fellow-only course(s) only.
                isFellow: true,
                assignedCategories: studentForm.assignedCategories,
            };
            await adminService.createStudent(submitData);
            setStudentSubmitMessage({ type: 'success', text: 'Fellow created successfully! Login credentials have been sent to their email.' });
            setTimeout(() => {
                setActiveTab('list');
                setStudentStep(1);
                setStudentForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    phoneNumber: '',
                    country: '',
                    organization: '',
                    otherOrganization: '',
                    profilePicture: null,
                    dateOfBirth: '',
                    gender: '',
                    educationLevel: '',
                    fieldOfStudy: '',
                    linkedIn: '',
                    motivation: '',
                    assignedCategories: []
                });
                // Generate new password for next use
                setTimeout(() => {
                    setStudentForm(prev => ({ ...prev, password: generatePassword() }));
                }, 100);
                setStudentSubmitMessage('');
                setShowOtherOrgStudent(false);
                fetchFellows();
            }, 2000);
        } catch (err) {
            setStudentSubmitMessage({ type: 'error', text: err.message || 'Failed to create student' });
        } finally {
            setStudentSubmitLoading(false);
        }
    };

    const handleInstructorSubmit = async () => {
        setInstructorSubmitLoading(true);
        try {
            const submitData = {
                ...instructorForm,
                organization: instructorForm.organization === 'Other' ? instructorForm.otherOrganization : instructorForm.organization
            };
            await adminService.createInstructor(submitData);
            setInstructorSubmitMessage({ type: 'success', text: 'Instructor created successfully! Login credentials have been sent to their email.' });
            setTimeout(() => {
                setActiveTab('list');
                setInstructorStep(1);
                setInstructorForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    phoneNumber: '',
                    country: '',
                    organization: '',
                    otherOrganization: '',
                    institution: '',
                    profilePicture: null,
                    bio: '',
                    qualifications: '',
                    expertise: '',
                    linkedIn: '',
                    portfolio: '',
                    teachingExperience: '',
                    yearsOfExperience: '',
                    cv: null,
                });
                // Generate new password for next use
                setTimeout(() => {
                    setInstructorForm(prev => ({ ...prev, password: generatePassword() }));
                }, 100);
                setInstructorSubmitMessage('');
                setShowOtherOrgInstructor(false);
            }, 2000);
        } catch (err) {
            setInstructorSubmitMessage({ type: 'error', text: err.message || 'Failed to create instructor' });
        } finally {
            setInstructorSubmitLoading(false);
        }
    };

    const FormInput = ({ label, name, value, onChange, type = 'text', placeholder, required = false, disabled = false }) => (
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
                disabled={disabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
        </div>
    );

    const FormTextarea = ({ label, name, value, onChange, placeholder, required = false, rows = 4 }) => (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                rows={rows}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
        </div>
    );

    const FormSelect = ({ label, name, value, onChange, options, required = false }) => (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
                <option value="">Select {label}</option>
                {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );

    const FormFileInput = ({ label, name, onChange, accept, required = false }) => (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="file"
                name={name}
                onChange={onChange}
                accept={accept}
                required={required}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
        </div>
    );

    const StepIndicator = ({ currentStep, totalSteps, steps }) => (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep > index + 1 ? 'bg-emerald-600 text-white' :
                                currentStep === index + 1 ? 'bg-emerald-600 text-white' :
                                    'bg-gray-300 text-gray-600'
                                }`}>
                                {currentStep > index + 1 ? <Icons.Check className="w-5 h-5" /> : index + 1}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${currentStep === index + 1 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                {step}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 ${currentStep > index + 1 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    const CreateStudentForm = () => {
        const studentSteps = ['Basic Info', 'Contact & Organization', 'Profile Details', 'Review'];

        const validateStep = (step) => {
            if (step === 1) {
                return studentForm.firstName && studentForm.lastName && studentForm.email;
            }
            if (step === 2) {
                return studentForm.country && (studentForm.organization !== 'Other' || studentForm.otherOrganization);
            }
            return true;
        };

        return (
            <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Fellow (Student)</h2>

                {studentSubmitMessage && (
                    <div className={`mb-6 p-4 rounded-lg ${studentSubmitMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {studentSubmitMessage.text}
                    </div>
                )}

                <StepIndicator currentStep={studentStep} totalSteps={4} steps={studentSteps} />

                {/* Step 1: Basic Info */}
                {studentStep === 1 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="First Name"
                                name="firstName"
                                value={studentForm.firstName}
                                onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                                placeholder="John"
                                required
                            />
                            <FormInput
                                label="Last Name"
                                name="lastName"
                                value={studentForm.lastName}
                                onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                                placeholder="Doe"
                                required
                            />
                            <FormInput
                                label="Email Address"
                                name="email"
                                type="email"
                                value={studentForm.email}
                                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                placeholder="john.doe@example.com"
                                required
                            />
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Auto-Generated Password <span className="text-emerald-600">(Will be sent via email)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={studentForm.password}
                                        disabled
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setStudentForm({ ...studentForm, password: generatePassword() })}
                                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium"
                                    >
                                        <Icons.RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Date of Birth"
                                name="dateOfBirth"
                                type="date"
                                value={studentForm.dateOfBirth}
                                onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                            />
                            <FormSelect
                                label="Gender"
                                name="gender"
                                value={studentForm.gender}
                                onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                                options={['Male', 'Female', 'Non-binary', 'Prefer not to say']}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Contact & Organization */}
                {studentStep === 2 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Organization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Phone Number"
                                name="phoneNumber"
                                value={studentForm.phoneNumber}
                                onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                                placeholder="+254 700 000 000"
                            />
                            <FormInput
                                label="Country"
                                name="country"
                                value={studentForm.country}
                                onChange={(e) => setStudentForm({ ...studentForm, country: e.target.value })}
                                placeholder="Kenya"
                                required
                            />
                        </div>
                        <FormSelect
                            label="Organization"
                            name="organization"
                            value={studentForm.organization}
                            onChange={(e) => {
                                setStudentForm({ ...studentForm, organization: e.target.value });
                                setShowOtherOrgStudent(e.target.value === 'Other');
                            }}
                            options={organizationOptions}
                        />
                        {showOtherOrgStudent && (
                            <FormInput
                                label="Specify Organization"
                                name="otherOrganization"
                                value={studentForm.otherOrganization}
                                onChange={(e) => setStudentForm({ ...studentForm, otherOrganization: e.target.value })}
                                placeholder="Enter your organization"
                                required
                            />
                        )}
                        <FormFileInput
                            label="Profile Picture"
                            name="profilePicture"
                            accept="image/*"
                            onChange={(e) => setStudentForm({ ...studentForm, profilePicture: e.target.files[0] })}
                        />
                    </div>
                )}

                {/* Step 3: Profile Details */}
                {studentStep === 3 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect
                                label="Education Level"
                                name="educationLevel"
                                value={studentForm.educationLevel}
                                onChange={(e) => setStudentForm({ ...studentForm, educationLevel: e.target.value })}
                                options={['High School', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other']}
                            />
                            <FormInput
                                label="Field of Study"
                                name="fieldOfStudy"
                                value={studentForm.fieldOfStudy}
                                onChange={(e) => setStudentForm({ ...studentForm, fieldOfStudy: e.target.value })}
                                placeholder="Computer Science, Business, etc."
                            />
                        </div>
                        <FormInput
                            label="LinkedIn Profile (Optional)"
                            name="linkedIn"
                            value={studentForm.linkedIn}
                            onChange={(e) => setStudentForm({ ...studentForm, linkedIn: e.target.value })}
                            placeholder="https://linkedin.com/in/yourprofile"
                        />
                        <FormTextarea
                            label="Motivation / Why do you want to join?"
                            name="motivation"
                            value={studentForm.motivation}
                            onChange={(e) => setStudentForm({ ...studentForm, motivation: e.target.value })}
                            placeholder="Tell us why you're interested in joining this program..."
                            rows={5}
                        />

                        {/* Category Assignment */}
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Category Assignment</h4>
                            <p className="text-sm text-gray-600 mb-4">
                                Assign categories to grant this fellow free access to all courses in those categories.
                            </p>

                            {categories.length === 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                    <Icons.AlertTriangle className="w-4 h-4 inline mr-2" />
                                    No categories available. Please create categories first.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                                    {categories.map((category) => (
                                        <label
                                            key={category._id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={studentForm.assignedCategories.includes(category._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setStudentForm({
                                                            ...studentForm,
                                                            assignedCategories: [...studentForm.assignedCategories, category._id]
                                                        });
                                                    } else {
                                                        setStudentForm({
                                                            ...studentForm,
                                                            assignedCategories: studentForm.assignedCategories.filter(id => id !== category._id)
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{category.name}</span>
                                                    {category.isPaid ? (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                                                            Paid - ${category.price?.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                            Free
                                                        </span>
                                                    )}
                                                </div>
                                                {category.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {studentForm.assignedCategories.length > 0 && (
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <p className="text-sm text-emerald-800">
                                        <Icons.CheckCircle className="w-4 h-4 inline mr-2" />
                                        <strong>{studentForm.assignedCategories.length}</strong> {studentForm.assignedCategories.length === 1 ? 'category' : 'categories'} assigned.
                                        This fellow will have free access to all courses in the selected {studentForm.assignedCategories.length === 1 ? 'category' : 'categories'}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {studentStep === 4 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
                        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                                <p><strong>Name:</strong> {studentForm.firstName} {studentForm.lastName}</p>
                                <p><strong>Email:</strong> {studentForm.email}</p>
                                <p><strong>Date of Birth:</strong> {studentForm.dateOfBirth || 'Not provided'}</p>
                                <p><strong>Gender:</strong> {studentForm.gender || 'Not provided'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Contact & Organization</h4>
                                <p><strong>Phone:</strong> {studentForm.phoneNumber || 'Not provided'}</p>
                                <p><strong>Country:</strong> {studentForm.country}</p>
                                <p><strong>Organization:</strong> {studentForm.organization === 'Other' ? studentForm.otherOrganization : studentForm.organization || 'Not provided'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Profile Details</h4>
                                <p><strong>Education:</strong> {studentForm.educationLevel || 'Not provided'}</p>
                                <p><strong>Field of Study:</strong> {studentForm.fieldOfStudy || 'Not provided'}</p>
                                <p><strong>LinkedIn:</strong> {studentForm.linkedIn || 'Not provided'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Category Assignment</h4>
                                {studentForm.assignedCategories.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600 mb-2">
                                            This fellow will have free access to <strong>{studentForm.assignedCategories.length}</strong> {studentForm.assignedCategories.length === 1 ? 'category' : 'categories'}:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {studentForm.assignedCategories.map(catId => {
                                                const category = categories.find(c => c._id === catId);
                                                return category ? (
                                                    <span key={catId} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                                                        {category.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-600">No categories assigned. This fellow will need to pay for all paid courses.</p>
                                )}
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <p className="text-sm text-emerald-800">
                                    <Icons.Info className="w-4 h-4 inline mr-2" />
                                    The generated password will be sent to <strong>{studentForm.email}</strong> upon creation.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <button
                        type="button"
                        onClick={() => {
                            if (studentStep === 1) {
                                setActiveTab('list');
                            } else {
                                setStudentStep(studentStep - 1);
                            }
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" />
                        {studentStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {studentStep < 4 ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (validateStep(studentStep)) {
                                    setStudentStep(studentStep + 1);
                                } else {
                                    alert('Please fill in all required fields');
                                }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            Next
                            <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleStudentSubmit}
                            disabled={studentSubmitLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            {studentSubmitLoading ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.Check className="w-4 h-4" />}
                            Create Fellow
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const CreateInstructorForm = () => {
        const instructorSteps = ['Basic Info', 'Professional Details', 'Qualifications', 'Review'];

        const validateStep = (step) => {
            if (step === 1) {
                return instructorForm.firstName && instructorForm.lastName && instructorForm.email && instructorForm.phoneNumber && instructorForm.country;
            }
            if (step === 2) {
                return instructorForm.bio && instructorForm.expertise;
            }
            if (step === 3) {
                return instructorForm.qualifications && instructorForm.teachingExperience && instructorForm.cv;
            }
            return true;
        };

        return (
            <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Instructor</h2>

                {instructorSubmitMessage && (
                    <div className={`mb-6 p-4 rounded-lg ${instructorSubmitMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {instructorSubmitMessage.text}
                    </div>
                )}

                <StepIndicator currentStep={instructorStep} totalSteps={4} steps={instructorSteps} />

                {/* Step 1: Basic Info */}
                {instructorStep === 1 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="First Name"
                                name="firstName"
                                value={instructorForm.firstName}
                                onChange={(e) => setInstructorForm({ ...instructorForm, firstName: e.target.value })}
                                placeholder="Jane"
                                required
                            />
                            <FormInput
                                label="Last Name"
                                name="lastName"
                                value={instructorForm.lastName}
                                onChange={(e) => setInstructorForm({ ...instructorForm, lastName: e.target.value })}
                                placeholder="Smith"
                                required
                            />
                            <FormInput
                                label="Email Address"
                                name="email"
                                type="email"
                                value={instructorForm.email}
                                onChange={(e) => setInstructorForm({ ...instructorForm, email: e.target.value })}
                                placeholder="jane.smith@example.com"
                                required
                            />
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Auto-Generated Password <span className="text-blue-600">(Will be sent via email)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={instructorForm.password}
                                        disabled
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setInstructorForm({ ...instructorForm, password: generatePassword() })}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                                    >
                                        <Icons.RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Phone Number"
                                name="phoneNumber"
                                value={instructorForm.phoneNumber}
                                onChange={(e) => setInstructorForm({ ...instructorForm, phoneNumber: e.target.value })}
                                placeholder="+254 700 000 000"
                                required
                            />
                            <FormInput
                                label="Country"
                                name="country"
                                value={instructorForm.country}
                                onChange={(e) => setInstructorForm({ ...instructorForm, country: e.target.value })}
                                placeholder="Kenya"
                                required
                            />
                        </div>
                        <FormSelect
                            label="Organization"
                            name="organization"
                            value={instructorForm.organization}
                            onChange={(e) => {
                                setInstructorForm({ ...instructorForm, organization: e.target.value });
                                setShowOtherOrgInstructor(e.target.value === 'Other');
                            }}
                            options={organizationOptions}
                        />
                        {showOtherOrgInstructor && (
                            <FormInput
                                label="Specify Organization"
                                name="otherOrganization"
                                value={instructorForm.otherOrganization}
                                onChange={(e) => setInstructorForm({ ...instructorForm, otherOrganization: e.target.value })}
                                placeholder="Enter your organization"
                                required
                            />
                        )}
                        <FormInput
                            label="Institution Name"
                            name="institution"
                            value={instructorForm.institution}
                            onChange={(e) => setInstructorForm({ ...instructorForm, institution: e.target.value })}
                            placeholder="Your institution"
                        />
                        <FormFileInput
                            label="Profile Picture"
                            name="profilePicture"
                            accept="image/*"
                            onChange={(e) => setInstructorForm({ ...instructorForm, profilePicture: e.target.files[0] })}
                        />
                    </div>
                )}

                {/* Step 2: Professional Details */}
                {instructorStep === 2 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
                        <FormTextarea
                            label="Bio / Short Introduction"
                            name="bio"
                            value={instructorForm.bio}
                            onChange={(e) => setInstructorForm({ ...instructorForm, bio: e.target.value })}
                            placeholder="Tell us about your experience, teaching style, and what you bring to the program..."
                            rows={5}
                            required
                        />
                        <FormTextarea
                            label="Expertise / Skills"
                            name="expertise"
                            value={instructorForm.expertise}
                            onChange={(e) => setInstructorForm({ ...instructorForm, expertise: e.target.value })}
                            placeholder="List the subjects or topics you can teach (e.g., Web Development, Data Science, Machine Learning)"
                            rows={3}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Years of Teaching Experience"
                                name="yearsOfExperience"
                                value={instructorForm.yearsOfExperience}
                                onChange={(e) => setInstructorForm({ ...instructorForm, yearsOfExperience: e.target.value })}
                                placeholder="5"
                            />
                            <FormInput
                                label="LinkedIn Profile"
                                name="linkedIn"
                                value={instructorForm.linkedIn}
                                onChange={(e) => setInstructorForm({ ...instructorForm, linkedIn: e.target.value })}
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <FormInput
                            label="Portfolio URL"
                            name="portfolio"
                            value={instructorForm.portfolio}
                            onChange={(e) => setInstructorForm({ ...instructorForm, portfolio: e.target.value })}
                            placeholder="https://portfolio.com"
                        />
                    </div>
                )}

                {/* Step 3: Qualifications */}
                {instructorStep === 3 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualifications & Credentials</h3>
                        <FormTextarea
                            label="Qualifications"
                            name="qualifications"
                            value={instructorForm.qualifications}
                            onChange={(e) => setInstructorForm({ ...instructorForm, qualifications: e.target.value })}
                            placeholder="List your degrees, certifications, or relevant experience (e.g., PhD in Computer Science, AWS Certified Solutions Architect)"
                            rows={4}
                            required
                        />
                        <FormTextarea
                            label="Teaching Experience Details"
                            name="teachingExperience"
                            value={instructorForm.teachingExperience}
                            onChange={(e) => setInstructorForm({ ...instructorForm, teachingExperience: e.target.value })}
                            placeholder="Describe your teaching experience, courses taught, institutions worked with..."
                            rows={4}
                            required
                        />
                        <FormFileInput
                            label="CV / Resume (Required)"
                            name="cv"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setInstructorForm({ ...instructorForm, cv: e.target.files[0] })}
                            required
                        />
                    </div>
                )}

                {/* Step 4: Review */}
                {instructorStep === 4 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Information</h3>
                        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                                <p><strong>Name:</strong> {instructorForm.firstName} {instructorForm.lastName}</p>
                                <p><strong>Email:</strong> {instructorForm.email}</p>
                                <p><strong>Phone:</strong> {instructorForm.phoneNumber || 'Not provided'}</p>
                                <p><strong>Country:</strong> {instructorForm.country}</p>
                                <p><strong>Organization:</strong> {instructorForm.organization === 'Other' ? instructorForm.otherOrganization : instructorForm.organization || 'Not provided'}</p>
                                <p><strong>Institution:</strong> {instructorForm.institution || 'Not provided'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Professional Details</h4>
                                <p><strong>Bio:</strong> {instructorForm.bio ? instructorForm.bio.substring(0, 150) + (instructorForm.bio.length > 150 ? '...' : '') : 'Not provided'}</p>
                                <p><strong>Expertise:</strong> {instructorForm.expertise || 'Not provided'}</p>
                                <p><strong>Years of Experience:</strong> {instructorForm.yearsOfExperience || 'Not provided'}</p>
                                <p><strong>LinkedIn:</strong> {instructorForm.linkedIn || 'Not provided'}</p>
                                <p><strong>Portfolio:</strong> {instructorForm.portfolio || 'Not provided'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Qualifications</h4>
                                <p><strong>Qualifications:</strong> {instructorForm.qualifications || 'Not provided'}</p>
                                <p><strong>Teaching Experience:</strong> {instructorForm.teachingExperience ? instructorForm.teachingExperience.substring(0, 100) + '...' : 'Not provided'}</p>
                                <p><strong>CV:</strong> {instructorForm.cv ? instructorForm.cv.name : 'Not uploaded'}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <Icons.Info className="w-4 h-4 inline mr-2" />
                                    The generated password will be sent to <strong>{instructorForm.email}</strong> upon creation.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <button
                        type="button"
                        onClick={() => {
                            if (instructorStep === 1) {
                                setActiveTab('list');
                            } else {
                                setInstructorStep(instructorStep - 1);
                            }
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" />
                        {instructorStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {instructorStep < 4 ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (validateStep(instructorStep)) {
                                    setInstructorStep(instructorStep + 1);
                                } else {
                                    alert('Please fill in all required fields');
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            Next
                            <Icons.ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleInstructorSubmit}
                            disabled={instructorSubmitLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            {instructorSubmitLoading ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.Check className="w-4 h-4" />}
                            Create Instructor
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (activeTab === 'create-student') {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fellows Management</h1>
                        <p className="text-gray-600">Create and manage fellows and instructors</p>
                    </div>
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
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
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
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
                    <button onClick={() => setActiveTab('create-student')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md transition-all">
                        <Icons.Plus className="w-5 h-5" />
                        Create New Fellow (Student)
                    </button>
                    <button onClick={() => setActiveTab('create-instructor')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md transition-all">
                        <Icons.Plus className="w-5 h-5" />
                        Create New Instructor
                    </button>
                </div>

                <div className="bg-white rounded-xl p-6 mb-8 border shadow-sm">
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
                        <div className="bg-white rounded-xl text-center py-16 shadow-sm">
                            <Icons.Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900">No fellows yet</h3>
                            <p className="text-gray-600 mt-2">Create your first fellow to get started</p>
                        </div>
                    ) : (
                        fellows.map((fellow) => (
                            <div key={fellow._id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {fellow.firstName?.[0]}{fellow.lastName?.[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900">{fellow.firstName} {fellow.lastName}</h3>
                                        <p className="text-sm text-gray-600">{fellow.email}</p>
                                        {fellow.phoneNumber && <p className="text-sm text-gray-600">{fellow.phoneNumber}</p>}
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => handleDeleteFellow(fellow._id)} disabled={deletingId === fellow._id} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 transition-colors">
                                                {deletingId === fellow._id ? 'Deleting...' : 'Delete'}
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