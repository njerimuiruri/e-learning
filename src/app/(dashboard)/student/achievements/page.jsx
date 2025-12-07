'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import Navbar from '@/components/navbar/navbar';

export default function AchievementsPage() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await courseService.getStudentDashboard();
            setDashboardData(data);
        } catch (err) {
            setError('Failed to load achievements');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic achievements based on actual student data from API
    const getAchievements = () => {
        if (!dashboardData) return [];

        const completedCourses = dashboardData.enrollments?.filter(e => e.isCompleted) || [];
        const inProgressCourses = dashboardData.enrollments?.filter(e => !e.isCompleted) || [];
        // Calculate total lessons completed across all courses
        const totalLessonsCompleted = dashboardData.enrollments?.reduce(
            (sum, e) => sum + (e.completedModules?.length || 0),
            0
        ) || 0;
        // Calculate XP: 10 XP per completed module
        const totalXP = totalLessonsCompleted * 10;
        // Calculate learning streak (not implemented, set to 0)
        const learningStreak = 0;
        // Calculate total learning hours (assume 0.5 hour per module)
        const totalLearningHours = totalLessonsCompleted * 0.5;

        return [
            {
                id: 1,
                title: 'First Steps',
                description: 'Complete your first lesson',
                icon: 'Footprints',
                earned: totalLessonsCompleted >= 1,
                earnedDate: totalLessonsCompleted >= 1 ? completedCourses[0]?.completedAt : null,
                xp: 50,
                category: 'learning',
                color: 'from-blue-400 to-blue-600',
                details: {
                    requirement: 'Complete 1 lesson',
                    reward: '50 XP',
                    tips: 'Start any course and finish your first lesson to unlock this achievement!',
                    progress: Math.min(totalLessonsCompleted, 1),
                    total: 1
                }
            },
            {
                id: 2,
                title: 'Knowledge Seeker',
                description: 'Earn 100 XP',
                icon: 'BookOpen',
                earned: totalXP >= 100,
                earnedDate: totalXP >= 100 ? new Date() : null,
                xp: 100,
                category: 'xp',
                color: 'from-purple-400 to-purple-600',
                details: {
                    requirement: 'Earn 100 XP',
                    reward: '100 XP Bonus',
                    tips: 'Complete lessons and assessments to earn XP!',
                    progress: Math.min(totalXP, 100),
                    total: 100
                }
            },
            {
                id: 3,
                title: 'Rising Star',
                description: 'Earn 500 XP',
                icon: 'Star',
                earned: totalXP >= 500,
                earnedDate: totalXP >= 500 ? new Date() : null,
                xp: 150,
                category: 'xp',
                color: 'from-yellow-400 to-orange-500',
                details: {
                    requirement: 'Earn 500 XP',
                    reward: '150 XP Bonus',
                    tips: 'Keep learning and completing courses to reach this milestone!',
                    progress: Math.min(totalXP, 500),
                    total: 500
                }
            },
            {
                id: 4,
                title: 'Week Warrior',
                description: 'Maintain a 7-day learning streak',
                icon: 'Flame',
                earned: learningStreak >= 7,
                earnedDate: learningStreak >= 7 ? new Date() : null,
                xp: 200,
                category: 'streak',
                color: 'from-orange-400 to-red-500',
                details: {
                    requirement: '7-day learning streak',
                    reward: '200 XP',
                    tips: 'Learn something every day for a week to unlock this!',
                    progress: Math.min(learningStreak, 7),
                    total: 7
                }
            },
            {
                id: 5,
                title: 'Course Conqueror',
                description: 'Complete your first course',
                icon: 'Trophy',
                earned: completedCourses.length >= 1,
                earnedDate: completedCourses.length >= 1 ? completedCourses[0]?.completedAt : null,
                xp: 300,
                category: 'courses',
                color: 'from-green-400 to-emerald-600',
                details: {
                    requirement: 'Complete 1 course',
                    reward: '300 XP',
                    tips: 'Finish all modules and assessments in any course!',
                    progress: completedCourses.length,
                    total: 1,
                    courses: completedCourses.map(ec => ec.courseId)
                }
            },
            {
                id: 6,
                title: 'Learning Marathon',
                description: 'Complete 10 lessons',
                icon: 'Target',
                earned: totalLessonsCompleted >= 10,
                earnedDate: totalLessonsCompleted >= 10 ? new Date() : null,
                xp: 150,
                category: 'learning',
                color: 'from-pink-400 to-rose-600',
                details: {
                    requirement: 'Complete 10 lessons',
                    reward: '150 XP',
                    tips: 'Keep learning across any courses!',
                    progress: Math.min(totalLessonsCompleted, 10),
                    total: 10
                }
            },
            {
                id: 7,
                title: 'Course Collection',
                description: 'Complete 3 courses',
                icon: 'Award',
                earned: completedCourses.length >= 3,
                earnedDate: completedCourses.length >= 3 ? new Date() : null,
                xp: 500,
                category: 'courses',
                color: 'from-indigo-400 to-purple-600',
                details: {
                    requirement: 'Complete 3 courses',
                    reward: '500 XP',
                    tips: 'Master multiple subjects to unlock this achievement!',
                    progress: completedCourses.length,
                    total: 3,
                    courses: completedCourses.map(ec => ec.courseId)
                }
            },
            {
                id: 8,
                title: 'Dedicated Learner',
                description: 'Spend 10 hours learning',
                icon: 'Clock',
                earned: totalLearningHours >= 10,
                earnedDate: totalLearningHours >= 10 ? new Date() : null,
                xp: 250,
                category: 'learning',
                color: 'from-amber-400 to-orange-500',
                details: {
                    requirement: '10 hours of learning',
                    reward: '250 XP',
                    tips: 'Time spent learning counts towards this achievement!',
                    progress: Math.min(totalLearningHours, 10),
                    total: 10
                }
            },
        ];
    };

    const achievements = getAchievements();

    const categories = [
        { id: 'all', label: 'All', icon: 'Grid3x3' },
        { id: 'learning', label: 'Learning', icon: 'BookOpen' },
        { id: 'xp', label: 'XP', icon: 'Zap' },
        { id: 'streak', label: 'Streaks', icon: 'Flame' },
        { id: 'courses', label: 'Courses', icon: 'GraduationCap' },
    ];

    const filteredAchievements = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const earnedCount = achievements.filter(a => a.earned).length;
    const totalXP = achievements.filter(a => a.earned).reduce((sum, a) => sum + a.xp, 0);
    const progressPercentage = Math.round((earnedCount / achievements.length) * 100);

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 mx-auto mb-4\"></div>
                    <p className="text-gray-600">Loading achievements...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                <main className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Header */}
                        <div className="mb-8">
                            <button
                                onClick={() => router.push('/student')}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                            >
                                <Icons.ChevronLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Back to Dashboard</span>
                            </button>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                                Your Achievements
                            </h1>
                            <p className="text-gray-600">
                                Track your learning milestones and earn rewards as you progress
                            </p>
                        </div>

                        {/* Progress Overview Card */}
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-xl">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                                        {earnedCount} of {achievements.length} Unlocked
                                    </h2>
                                    <p className="text-green-100 mb-4">
                                        You're {progressPercentage}% of the way to completing all achievements!
                                    </p>
                                    <div className="w-full bg-green-400/30 rounded-full h-3 mb-2">
                                        <div
                                            className="bg-white h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px]">
                                        <Icons.Trophy className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-3xl font-bold">{earnedCount}</p>
                                        <p className="text-sm text-green-100">Earned</p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px]">
                                        <Icons.Zap className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-3xl font-bold">{totalXP}</p>
                                        <p className="text-sm text-green-100">Total XP</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 mb-6 w-full shadow-sm">
                            <div className="overflow-x-auto scrollbar-hide">
                                <div className="flex gap-2">
                                    {categories.map((category) => {
                                        const IconComponent = Icons[category.icon];
                                        const count = category.id === 'all'
                                            ? achievements.length
                                            : achievements.filter(a => a.category === category.id).length;
                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => setSelectedCategory(category.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap flex-shrink-0 ${selectedCategory === category.id
                                                    ? 'bg-green-600 text-white shadow-md scale-105'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {IconComponent && <IconComponent className="w-4 h-4" />}
                                                <span>{category.label}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === category.id
                                                    ? 'bg-white/20'
                                                    : 'bg-gray-200'
                                                    }`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Achievements Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
                            {filteredAchievements.map((achievement) => {
                                const IconComponent = Icons[achievement.icon];
                                const progressPercent = achievement.details.progress && achievement.details.total
                                    ? Math.round((achievement.details.progress / achievement.details.total) * 100)
                                    : 0;

                                return (
                                    <button
                                        key={achievement.id}
                                        onClick={() => setSelectedAchievement(achievement)}
                                        className={`bg-white rounded-xl border-2 p-4 sm:p-6 transition-all text-left hover:scale-105 ${achievement.earned
                                            ? 'border-green-200 shadow-lg hover:shadow-xl'
                                            : 'border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300'
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center mb-3 sm:mb-4 relative ${!achievement.earned && 'grayscale opacity-50'
                                            }`}>
                                            {IconComponent && <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />}
                                            {achievement.earned && (
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                                    <Icons.Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Title & Description */}
                                        <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">{achievement.title}</h3>
                                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{achievement.description}</p>

                                        {/* Progress or Earned Status */}
                                        {achievement.earned ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-green-600">
                                                    <Icons.CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    <span className="text-xs sm:text-sm font-medium">Unlocked!</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Click for details</span>
                                                    <span className="flex items-center gap-1 text-yellow-600 font-medium">
                                                        <Icons.Zap className="w-3 h-3" />
                                                        +{achievement.xp} XP
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`bg-gradient-to-r ${achievement.color} h-2 rounded-full transition-all`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-600">{progressPercent}% Complete</span>
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <Icons.Zap className="w-3 h-3" />
                                                        {achievement.xp} XP
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {filteredAchievements.length === 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Icons.Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No achievements in this category yet</h3>
                                <p className="text-gray-600">Keep learning to unlock more achievements!</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Achievement Detail Modal */}
            {selectedAchievement && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
                        {/* Header */}
                        <div className={`bg-gradient-to-br ${selectedAchievement.color} p-6 sm:p-8 text-white relative`}>
                            <button
                                onClick={() => setSelectedAchievement(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                            >
                                <Icons.X className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                {(() => {
                                    const IconComponent = Icons[selectedAchievement.icon];
                                    return (
                                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 ${!selectedAchievement.earned && 'grayscale opacity-50'
                                            }`}>
                                            {IconComponent && <IconComponent className="w-10 h-10 sm:w-12 sm:h-12" />}
                                        </div>
                                    );
                                })()}

                                <h2 className="text-2xl sm:text-3xl font-bold mb-2">{selectedAchievement.title}</h2>
                                <p className="text-white/90 mb-4">{selectedAchievement.description}</p>

                                {selectedAchievement.earned ? (
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                        <Icons.CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Achievement Unlocked!</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                        <Icons.Lock className="w-5 h-5" />
                                        <span className="font-medium">Locked</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-8">
                            {/* Requirement */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Requirement</h3>
                                <p className="text-gray-900 font-medium">{selectedAchievement.details.requirement}</p>
                            </div>

                            {/* Progress */}
                            {!selectedAchievement.earned && selectedAchievement.details.progress !== undefined && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Your Progress</h3>
                                        <span className="text-sm font-medium text-gray-700">
                                            {selectedAchievement.details.progress} / {selectedAchievement.details.total}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`bg-gradient-to-r ${selectedAchievement.color} h-3 rounded-full transition-all`}
                                            style={{
                                                width: `${Math.round((selectedAchievement.details.progress / selectedAchievement.details.total) * 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Completed Courses (if applicable) */}
                            {selectedAchievement.details.courses && selectedAchievement.details.courses.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Completed Courses</h3>
                                    <div className="space-y-2">
                                        {selectedAchievement.details.courses.map((courseName, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm">
                                                <Icons.CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="text-gray-700">{courseName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reward */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Reward</h3>
                                <div className="flex items-center gap-2">
                                    <Icons.Zap className="w-5 h-5 text-yellow-600" />
                                    <span className="text-gray-900 font-bold text-lg">{selectedAchievement.details.reward}</span>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Tips</h3>
                                <p className="text-gray-700">{selectedAchievement.details.tips}</p>
                            </div>

                            {/* Date Earned */}
                            {selectedAchievement.earned && selectedAchievement.earnedDate && (
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Icons.Calendar className="w-4 h-4" />
                                        <span>Unlocked on {new Date(selectedAchievement.earnedDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={() => setSelectedAchievement(null)}
                                className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
}