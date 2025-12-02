'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { getStudentProgress } from '@/data/courses/courses';

export default function AchievementsPage() {
    const [studentProgress, setStudentProgress] = useState(null);

    useEffect(() => {
        const progress = getStudentProgress();
        setStudentProgress(progress);
    }, []);

    const leaderboardData = [
        { rank: 1, name: 'Ngonidzaishe Bernard M.', xp: 425, certificates: 1, learningStreak: 11, avatar: 'NB' },
        { rank: 2, name: 'MUNISEKHAR M.', xp: 415, certificates: 4, learningStreak: 5, avatar: 'MM' },
        { rank: 3, name: 'Elvis M.', xp: 405, certificates: 4, learningStreak: 11, avatar: 'EM' },
        { rank: 4, name: 'Helen Uche O.', xp: 315, certificates: 1, learningStreak: 1, avatar: 'HU' },
        {
            rank: 5,
            name: 'Faith M. (You)',
            xp: studentProgress?.totalXP || 310,
            certificates: studentProgress?.totalCertificates || 0,
            learningStreak: studentProgress?.learningStreak || 1,
            avatar: 'FM',
            isCurrentUser: true
        },
        { rank: 6, name: 'Andreea M.', xp: 305, certificates: 1, learningStreak: 1, avatar: 'AM' },
    ];

    if (!studentProgress) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading achievements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-12 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <Icons.Trophy className="w-10 h-10" />
                        <h1 className="text-4xl font-black">Your Achievements</h1>
                    </div>
                    <p className="text-orange-100 text-lg">Track your progress and compete with others</p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Stats & Streaks */}
                    <div className="space-y-6">
                        {/* XP Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-yellow-100 p-3 rounded-xl">
                                    <Icons.Zap className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Total XP</h3>
                            </div>
                            <p className="text-5xl font-black text-gray-900 mb-2">{studentProgress.totalXP}</p>
                            <p className="text-sm text-gray-600">Level 5 • 300-399 XP</p>
                            <div className="mt-4 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                                    style={{ width: '10%' }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">90 XP until Level 6</p>
                        </div>

                        {/* Learning Streak */}
                        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Learning Streak</h3>
                                <Icons.Fire className="w-8 h-8" />
                            </div>
                            <div className="text-center mb-4">
                                <div className="text-6xl font-black mb-2">{studentProgress.learningStreak}</div>
                                <p className="text-orange-100">Day{studentProgress.learningStreak !== 1 ? 's' : ''} Streak</p>
                                <p className="text-sm opacity-90 mt-2">Highest: 3</p>
                            </div>
                        </div>

                        {/* XP Trend */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.TrendingUp className="w-6 h-6 text-orange-600" />
                                Your XP Trend
                            </h3>
                            <div className="text-center py-8">
                                <div className="w-full h-32 flex items-end justify-around gap-2">
                                    {[40, 60, 45, 70, 50, 65, 55].map((height, idx) => (
                                        <div
                                            key={idx}
                                            className="flex-1 bg-gradient-to-t from-orange-400 to-pink-500 rounded-t-lg"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                    Keep learning to see your XP trends grow!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column - Leaderboard */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icons.Trophy className="w-6 h-6 text-orange-600" />
                                        <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
                                    </div>
                                    <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                        Filter
                                        <Icons.ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-4 bg-gradient-to-r from-orange-50 to-pink-50 p-3 rounded-lg border border-orange-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Level 5</span>
                                        <span className="text-sm text-gray-600">300 - 399 XP</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-3">
                                {leaderboardData.map((user) => (
                                    <div
                                        key={user.rank}
                                        className={`flex items-center gap-4 p-4 rounded-lg ${user.isCurrentUser
                                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300'
                                            : 'hover:bg-gray-50 border border-gray-100'
                                            }`}
                                    >
                                        <span className="text-lg font-bold text-gray-500 w-10">#{user.rank}</span>
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
                                            {user.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{user.name}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Icons.Zap className="w-5 h-5 text-yellow-500" />
                                                <span className="font-bold">{user.xp}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Icons.Award className="w-5 h-5 text-blue-500" />
                                                <span className="font-bold">{user.certificates}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Icons.BookOpen className="w-5 h-5 text-green-500" />
                                                <span className="font-bold">{user.learningStreak}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 border-t border-gray-100">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-700">
                                        You're just <span className="font-bold text-orange-600">90 XP</span> away from entering Level 6. Keep going to reach the next level and catch up with the top achievers!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Achieve More Section */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Achieve More</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-lg">
                                        <Icons.Star className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Review A Course ✍️</h4>
                                        <p className="text-sm text-gray-600 mb-3">Share your thoughts and earn XP rewards!</p>
                                        <button className="text-green-600 font-semibold text-sm hover:text-green-700">
                                            Leave A Review
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-lg">
                                        <Icons.Award className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Claim Your Certificate 🏆</h4>
                                        <p className="text-sm text-gray-600 mb-3">Get a Certificate and score big on XP!</p>
                                        <button className="text-green-600 font-semibold text-sm hover:text-green-700">
                                            Claim Certificate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}