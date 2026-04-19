'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import ProtectedStudentRoute from '@/components/ProtectedStudentRoute';
import authService from '@/lib/api/authService';

// Profile is complete when admin data exists (fullName + region) AND student has uploaded a photo.
function isProfileComplete(user) {
    const hasName = !!(user?.fullName || (user?.firstName || user?.lastName));
    const hasRegion = !!(user?.region || user?.fellowData?.region);
    const hasPhoto = !!user?.profilePhotoUrl;
    return hasName && hasRegion && hasPhoto;
}

function AccountSettingsContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [profileComplete, setProfileComplete] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        country: '',
        region: '',
        profilePhotoUrl: '',
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const populateForm = (user) => {
        const fullName =
            user.fullName ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim();

        const region =
            user.region ||
            user.fellowData?.region ||
            '';

        setFormData({
            fullName,
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            country: user.country || '',
            region,
            profilePhotoUrl: user.profilePhotoUrl || '',
        });

        if (user.profilePhotoUrl) setImagePreview(user.profilePhotoUrl);
        setProfileComplete(isProfileComplete(user));
    };

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setErrorMessage('');

            // Load instantly from cookie (same source as navbar/sidebar)
            const cached = authService.getCurrentUser();
            if (cached) populateForm(cached);

            // Refresh from API in background for latest data
            try {
                const fresh = await authService.fetchUserProfile();
                if (fresh) populateForm(fresh);
            } catch (apiErr) {
                console.warn('Background profile refresh failed:', apiErr);
                // Already populated from cookie, not a hard error
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            setErrorMessage('Failed to load profile. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setErrorMessage('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage('Image size must be less than 5MB');
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
        setErrorMessage('');
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setErrorMessage('');
            setSuccessMessage('');

            let newPhotoUrl = formData.profilePhotoUrl;

            // Upload photo first if a new image was selected
            if (imageFile) {
                try {
                    const uploadResult = await authService.uploadProfilePhoto(imageFile);
                    newPhotoUrl =
                        uploadResult?.user?.profilePhotoUrl ||
                        uploadResult?.profilePhotoUrl ||
                        newPhotoUrl;
                    if (newPhotoUrl) setImagePreview(newPhotoUrl);
                    setImageFile(null);
                } catch (uploadErr) {
                    console.error('Photo upload failed:', uploadErr);
                    setErrorMessage('Photo upload failed. Please try again.');
                    setSaving(false);
                    return;
                }
            }

            // Save editable fields
            const result = await authService.updateProfile({
                phoneNumber: formData.phoneNumber,
                country: formData.country,
                region: formData.region,
            });

            const updatedUser = result?.user || result;
            const mergedPhoto = newPhotoUrl || updatedUser?.profilePhotoUrl || formData.profilePhotoUrl;

            setFormData((prev) => ({
                ...prev,
                country: updatedUser?.country || prev.country,
                region: updatedUser?.region || prev.region,
                phoneNumber: updatedUser?.phoneNumber || prev.phoneNumber,
                profilePhotoUrl: mergedPhoto,
            }));

            const isNowComplete = !!mergedPhoto;
            setProfileComplete(isNowComplete);

            // Sync auth cookie so navbar / sidebar update immediately
            authService.updateCurrentUser({
                fullName: updatedUser?.fullName || formData.fullName,
                country: updatedUser?.country,
                region: updatedUser?.region,
                phoneNumber: updatedUser?.phoneNumber,
                ...(mergedPhoto && { profilePhotoUrl: mergedPhoto }),
            });
            window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));

            setSuccessMessage(
                isNowComplete
                    ? '🎉 Profile complete! All your details are set.'
                    : 'Profile updated successfully!'
            );
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            console.error('Error saving profile:', err);
            setErrorMessage(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    // Initials from full name
    const nameParts = formData.fullName.trim().split(' ').filter(Boolean);
    const initials = (
        (nameParts[0]?.[0] || '') + (nameParts[nameParts.length - 1]?.[0] || nameParts[0]?.[1] || '')
    ).toUpperCase() || '?';

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#021d49] mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Loading your profile…</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-xl mx-auto">

                        {/* Header */}
                        <div className="mb-6">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 mb-4 text-sm font-medium"
                            >
                                <Icons.ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Account Settings</h1>
                                    <p className="text-sm text-gray-500">Complete your profile to get started</p>
                                </div>
                                {/* Profile completion badge */}
                                {profileComplete ? (
                                    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                        <Icons.CheckCircle className="w-3.5 h-3.5" />
                                        Profile Complete
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                        <Icons.AlertCircle className="w-3.5 h-3.5" />
                                        Incomplete
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* What's needed banner (shown until complete) */}
                        {!profileComplete && (
                            <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                <Icons.Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-0.5">One step to complete your profile</p>
                                    <p className="text-blue-600 text-xs">Upload a profile photo to mark your profile as complete.</p>
                                </div>
                            </div>
                        )}

                        {/* Alerts */}
                        {successMessage && (
                            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                                <Icons.CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <p className="text-green-700 text-sm font-medium">{successMessage}</p>
                            </div>
                        )}
                        {errorMessage && (
                            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                                <Icons.AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <p className="text-red-700 text-sm">{errorMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="space-y-4">

                            {/* ── Profile Photo Card ── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-base font-semibold text-gray-900">Profile Photo</h2>
                                    {!formData.profilePhotoUrl && !imageFile && (
                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Required</span>
                                    )}
                                    {(formData.profilePhotoUrl || imageFile) && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                                            <Icons.Check className="w-2.5 h-2.5" /> Done
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-5">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#021d49] to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-md ring-4 ring-white">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        {profileComplete && (
                                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <Icons.Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload */}
                                    <div className="flex-1">
                                        <label className="cursor-pointer block">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                disabled={saving}
                                            />
                                            <span className="inline-flex items-center gap-2 bg-[#021d49] hover:bg-[#032a66] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
                                                <Icons.Camera className="w-4 h-4" />
                                                {imageFile ? 'Change Photo' : (formData.profilePhotoUrl ? 'Change Photo' : 'Upload Photo')}
                                            </span>
                                        </label>
                                        <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF · max 5 MB</p>
                                        {imageFile && (
                                            <p className="text-xs text-[#021d49] mt-1 font-medium flex items-center gap-1">
                                                <Icons.Image className="w-3 h-3" />
                                                {imageFile.name} — will upload on save
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Personal Details Card ── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Personal Details</h2>

                                <div className="space-y-4">
                                    {/* Full Name — read-only, pre-filled by admin */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Full Name
                                            <span className="ml-2 text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Pre-filled</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            disabled
                                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Email — read-only */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Email Address
                                            <span className="ml-2 text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wide">Pre-filled</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Country */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Kenya"
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/25 focus:border-[#021d49] outline-none transition"
                                            />
                                        </div>

                                        {/* Region */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Region / State</label>
                                            <input
                                                type="text"
                                                name="region"
                                                value={formData.region}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Nairobi"
                                                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/25 focus:border-[#021d49] outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            placeholder="+254 712 000 000"
                                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/25 focus:border-[#021d49] outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Actions ── */}
                            <div className="flex items-center justify-between gap-3 pb-8">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    disabled={saving}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 sm:flex-none px-8 py-2.5 bg-[#021d49] hover:bg-[#032a66] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving…
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
