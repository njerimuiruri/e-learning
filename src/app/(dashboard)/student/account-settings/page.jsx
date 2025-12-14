'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';

function AccountSettingsContent() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        bio: '',
        institution: '',
        phoneNumber: '',
        country: '',
        profilePhotoUrl: '',
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            if (!userId || !token) {
                router.push('/login');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to fetch profile');

            const data = await response.json();
            setUser(data);
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                bio: data.bio || '',
                institution: data.institution || '',
                phoneNumber: data.phoneNumber || '',
                country: data.country || '',
                profilePhotoUrl: data.profilePhotoUrl || '',
            });

            if (data.profilePhotoUrl) {
                setImagePreview(data.profilePhotoUrl);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setErrorMessage('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrorMessage('Please select an image file');
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setErrorMessage('Image size must be less than 5MB');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            setErrorMessage('');
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setErrorMessage('First name and last name are required');
            return;
        }

        try {
            setSaving(true);
            setErrorMessage('');
            setSuccessMessage('');

            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            // If there's a new image, upload it first
            let profilePhotoUrl = formData.profilePhotoUrl;
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);

                const uploadResponse = await fetch(
                    `${apiUrl}/api/users/${userId}/upload-profile-photo`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: uploadFormData,
                    }
                );

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload image');
                }

                const uploadData = await uploadResponse.json();
                profilePhotoUrl = uploadData.profilePhotoUrl || uploadData.url;
                setImageFile(null);
            }

            // Update profile
            const response = await fetch(
                `${apiUrl}/api/users/${userId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        bio: formData.bio,
                        institution: formData.institution,
                        phoneNumber: formData.phoneNumber,
                        country: formData.country,
                        profilePhotoUrl,
                    }),
                }
            );

            if (!response.ok) throw new Error('Failed to update profile');

            const updatedData = await response.json();
            setUser(updatedData);
            setFormData((prev) => ({
                ...prev,
                profilePhotoUrl: updatedData.profilePhotoUrl || prev.profilePhotoUrl,
            }));
            setSuccessMessage('Profile updated successfully!');
        } catch (err) {
            console.error('Error saving profile:', err);
            setErrorMessage(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                            >
                                <Icons.ChevronLeft className="w-5 h-5" />
                                Back
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
                            <p className="text-gray-600">Manage your profile information and preferences</p>
                        </div>

                        {/* Alert Messages */}
                        {successMessage && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                <Icons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <p className="text-green-700">{successMessage}</p>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                <Icons.AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <p className="text-red-700">{errorMessage}</p>
                            </div>
                        )}

                        {/* Profile Form */}
                        <form onSubmit={handleSaveProfile} className="bg-white rounded-lg shadow">
                            {/* Profile Photo Section */}
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Photo</h2>
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    {/* Photo Preview */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0 overflow-hidden">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                formData.firstName?.[0] + (formData.lastName?.[0] || '')
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2 text-center">
                                            {formData.firstName} {formData.lastName}
                                        </p>
                                    </div>

                                    {/* Upload Controls */}
                                    <div className="flex-1">
                                        <label className="block">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                disabled={saving}
                                            />
                                            <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors">
                                                <Icons.Upload className="w-4 h-4" />
                                                Choose Photo
                                            </span>
                                        </label>
                                        <p className="text-sm text-gray-600 mt-2">
                                            JPG, PNG or GIF (max 5MB)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Info Section */}
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* First Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 outline-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    {/* Country */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            placeholder="United States"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    {/* Institution */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Institution / Organization
                                        </label>
                                        <input
                                            type="text"
                                            name="institution"
                                            value={formData.institution}
                                            onChange={handleInputChange}
                                            placeholder="Your school or company"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about yourself..."
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formData.bio.length}/500 characters
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-6 bg-gray-50 rounded-b-lg flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    disabled={saving}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Icons.Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </>
    );
}

export default function AccountSettingsPage() {
    return (
        <ProtectedStudentRoute>
            <AccountSettingsContent />
        </ProtectedStudentRoute>
    );
}
