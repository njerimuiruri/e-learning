'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import authService from '@/lib/api/authService';

export default function InstructorProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        bio: '',
        institution: '',
        country: '',
        organization: '',
        qualifications: '',
        expertise: '',
        linkedIn: '',
        portfolio: '',
        teachingExperience: '',
        yearsOfExperience: '',
        cvUrl: '',
        profilePhotoUrl: '',
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const user = await authService.fetchUserProfile();
                setProfileData({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    email: user?.email || '',
                    phoneNumber: user?.phoneNumber || '',
                    bio: user?.bio || '',
                    institution: user?.institution || '',
                    country: user?.country || '',
                    organization: user?.organization || '',
                    qualifications: user?.qualifications || '',
                    expertise: user?.expertise || '',
                    linkedIn: user?.linkedIn || '',
                    portfolio: user?.portfolio || '',
                    teachingExperience: user?.teachingExperience || '',
                    yearsOfExperience: user?.yearsOfExperience || '',
                    cvUrl: user?.cvUrl || '',
                    profilePhotoUrl: user?.profilePhotoUrl || '',
                });
            } catch (err) {
                setError('Failed to load profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const initials = useMemo(() => {
        const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
        return fullName ? fullName.split(' ').map((n) => n[0]).join('') : 'IN';
    }, [profileData.firstName, profileData.lastName]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await authService.updateProfile({
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phoneNumber: profileData.phoneNumber,
                bio: profileData.bio,
                institution: profileData.institution,
                country: profileData.country,
                organization: profileData.organization,
                qualifications: profileData.qualifications,
                expertise: profileData.expertise,
                linkedIn: profileData.linkedIn,
                portfolio: profileData.portfolio,
                teachingExperience: profileData.teachingExperience,
                yearsOfExperience: profileData.yearsOfExperience,
            });
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { user } = await authService.uploadProfilePhoto(file);
            setProfileData((prev) => ({ ...prev, profilePhotoUrl: user?.profilePhotoUrl || prev.profilePhotoUrl }));
            alert('Profile photo updated');
        } catch (err) {
            setError('Failed to upload profile photo. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                            My Profile
                        </h1>
                        <p className="text-gray-600">Manage your personal information and credentials</p>
                    </div>
                    <button
                        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                        disabled={isSaving}
                        className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${isEditing
                            ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        {isEditing ? (
                            <>
                                <Icons.Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </>
                        ) : (
                            <>
                                <Icons.Edit className="w-4 h-4" />
                                Edit Profile
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <Icons.AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.Camera className="w-5 h-5 text-emerald-600" />
                        Profile Photo
                    </h2>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            {profileData.profilePhotoUrl ? (
                                <>
                                    <img
                                        src={
                                            profileData.profilePhotoUrl.startsWith('http') 
                                                ? profileData.profilePhotoUrl 
                                                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/files/download/${profileData.profilePhotoUrl.split('/').pop()}?inline=true`
                                        }
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextElementSibling) {
                                                e.target.nextElementSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#16a34a] to-emerald-700 flex items-center justify-center text-white text-2xl font-bold" style={{ display: 'none' }}>
                                        {initials}
                                    </div>
                                </>
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#16a34a] to-emerald-700 flex items-center justify-center text-white text-2xl font-bold">
                                    {initials}
                                </div>
                            )}
                            {isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icons.Camera className="w-6 h-6 text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{profileData.firstName} {profileData.lastName}</h3>
                            <p className="text-sm text-gray-600">{profileData.email}</p>
                            {isEditing && (
                                <p className="text-xs text-gray-500 mt-2">Click on the photo to change</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.User className="w-5 h-5 text-emerald-600" />
                        Personal Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input
                                type="text"
                                value={profileData.firstName}
                                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input
                                type="text"
                                value={profileData.lastName}
                                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={profileData.email}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={profileData.phoneNumber}
                                onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                            <input
                                type="text"
                                value={profileData.institution}
                                onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                            <input
                                type="text"
                                value={profileData.country}
                                onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                            <input
                                type="text"
                                value={profileData.organization}
                                onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.FileText className="w-5 h-5 text-emerald-600" />
                        Bio
                    </h2>
                    <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={5}
                        placeholder="Tell students about yourself, your experience, and teaching philosophy..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                    />
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.Award className="w-5 h-5 text-emerald-600" />
                        Professional Information
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                            <textarea
                                value={profileData.qualifications}
                                onChange={(e) => setProfileData({ ...profileData, qualifications: e.target.value })}
                                disabled={!isEditing}
                                rows={3}
                                placeholder="Your academic qualifications and degrees..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expertise</label>
                            <textarea
                                value={profileData.expertise}
                                onChange={(e) => setProfileData({ ...profileData, expertise: e.target.value })}
                                disabled={!isEditing}
                                rows={3}
                                placeholder="Your areas of expertise and specialization..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Experience</label>
                            <textarea
                                value={profileData.teachingExperience}
                                onChange={(e) => setProfileData({ ...profileData, teachingExperience: e.target.value })}
                                disabled={!isEditing}
                                rows={3}
                                placeholder="Describe your teaching experience..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                            <input
                                type="text"
                                value={profileData.yearsOfExperience}
                                onChange={(e) => setProfileData({ ...profileData, yearsOfExperience: e.target.value })}
                                disabled={!isEditing}
                                placeholder="e.g., 5 years"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                            <input
                                type="url"
                                value={profileData.linkedIn}
                                onChange={(e) => setProfileData({ ...profileData, linkedIn: e.target.value })}
                                disabled={!isEditing}
                                placeholder="https://linkedin.com/in/yourprofile"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio/Website</label>
                            <input
                                type="url"
                                value={profileData.portfolio}
                                onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
                                disabled={!isEditing}
                                placeholder="https://yourportfolio.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.FileText className="w-5 h-5 text-emerald-600" />
                        Documents
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CV/Resume</label>
                        {profileData.cvUrl ? (
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/files/download/${profileData.cvUrl.split('/').pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                                <Icons.Download className="w-4 h-4" />
                                Download CV
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500">No CV uploaded</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
