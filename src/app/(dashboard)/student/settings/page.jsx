'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

export default function AccountSettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        firstName: 'Faith',
        lastName: 'Muiruri',
        email: 'faith.muiruri@example.com',
        phone: '+254 700 000 000',
        bio: 'Passionate learner exploring digital marketing and technology',
        location: 'Nairobi, Kenya',
        emailNotifications: true,
        courseUpdates: true,
        marketingEmails: false,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Settings updated successfully!');
    };

    const tabs = [
        { id: 'profile', label: 'Profile Information', icon: 'User' },
        { id: 'security', label: 'Security', icon: 'Lock' },
        { id: 'notifications', label: 'Notifications', icon: 'Bell' },
        { id: 'preferences', label: 'Preferences', icon: 'Settings' },
    ];

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-12 px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-4">
                            {Icons.Settings ? <Icons.Settings className="w-10 h-10" /> : null}
                            <h1 className="text-4xl font-black">Account Settings</h1>
                        </div>
                        <p className="text-orange-100 text-lg">Manage your account preferences and security</p>
                    </div>
                </div>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-8 py-12">
                    <div className="grid lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                                <nav className="space-y-1">
                                    {tabs.map((tab) => {
                                        const IconComponent = Icons[tab.icon];
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                                    ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 font-semibold'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {IconComponent && (
                                                    <IconComponent
                                                        className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-500'}`}
                                                    />
                                                )}
                                                <span className="text-sm">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3">
                            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                                {/* Profile Information */}
                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h2>
                                            <p className="text-gray-600">Update your personal information and profile details</p>
                                        </div>

                                        {/* Profile Picture */}
                                        <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                                                FM
                                            </div>
                                            <div>
                                                <button
                                                    type="button"
                                                    className="bg-[#021d49] hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all mb-2"
                                                >
                                                    Upload New Photo
                                                </button>
                                                <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB</p>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Bio
                                            </label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Security */}
                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                                            <p className="text-gray-600">Manage your password and account security</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex gap-3">
                                                {Icons.Shield ? <Icons.Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" /> : null}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-1">Password Requirements</h4>
                                                    <ul className="text-sm text-gray-600 space-y-1">
                                                        <li>• At least 8 characters long</li>
                                                        <li>• Contains uppercase and lowercase letters</li>
                                                        <li>• Includes at least one number</li>
                                                        <li>• Has at least one special character</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notifications */}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                                            <p className="text-gray-600">Choose what notifications you want to receive</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                                                    <p className="text-sm text-gray-600">Receive email updates about your account</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="emailNotifications"
                                                        checked={formData.emailNotifications}
                                                        onChange={handleInputChange}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#021d49]"></div>
                                                </label>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Course Updates</h4>
                                                    <p className="text-sm text-gray-600">Get notified about new lessons and materials</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="courseUpdates"
                                                        checked={formData.courseUpdates}
                                                        onChange={handleInputChange}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#021d49]"></div>
                                                </label>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">Marketing Emails</h4>
                                                    <p className="text-sm text-gray-600">Receive promotional content and offers</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="marketingEmails"
                                                        checked={formData.marketingEmails}
                                                        onChange={handleInputChange}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#021d49]"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Preferences */}
                                {activeTab === 'preferences' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Preferences</h2>
                                            <p className="text-gray-600">Customize your learning experience</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-6">
                                            <h4 className="font-semibold text-gray-900 mb-4">Coming Soon</h4>
                                            <p className="text-gray-600">We're working on adding more customization options for your learning experience.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
}