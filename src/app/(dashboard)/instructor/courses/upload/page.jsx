'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import uploadService from '@/lib/api/uploadService';

export default function CourseUploadPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [courseData, setCourseData] = useState({
        title: '',
        description: '',
        category: '',
        level: 'Beginner',
        duration: '',
        price: '',
        bannerImage: null,
        bannerImageUrl: null,
        modules: []
    });

    const [currentModule, setCurrentModule] = useState({
        title: '',
        description: '',
        lessons: []
    });

    const [currentLesson, setCurrentLesson] = useState({
        title: '',
        content: '',
        type: 'video',
        videoUrl: '',
        videoFile: null,
        duration: '',
        topics: []
    });

    const categories = ['Marketing', 'Programming', 'Design', 'Business', 'Data Science', 'Other'];
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploading(true);
            try {
                // Show preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setCourseData({ ...courseData, bannerImage: reader.result });
                };
                reader.readAsDataURL(file);

                // Upload to Cloudinary
                const imageUrl = await uploadService.uploadImage(file);
                setCourseData(prev => ({ ...prev, bannerImageUrl: imageUrl }));
            } catch (error) {
                alert('Failed to upload image. Please try again.');
                console.error('Image upload error:', error);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCurrentLesson({ ...currentLesson, videoFile: file });
        }
    };

    const addLesson = () => {
        if (currentLesson.title && (currentLesson.videoUrl || currentLesson.videoFile)) {
            setCurrentModule({
                ...currentModule,
                lessons: [...currentModule.lessons, { ...currentLesson, id: Date.now() }]
            });
            setCurrentLesson({
                title: '',
                content: '',
                type: 'video',
                videoUrl: '',
                videoFile: null,
                duration: '',
                topics: []
            });
        }
    };

    const addModule = () => {
        if (currentModule.title && currentModule.lessons.length > 0) {
            setCourseData({
                ...courseData,
                modules: [...courseData.modules, { ...currentModule, id: Date.now() }]
            });
            setCurrentModule({
                title: '',
                description: '',
                lessons: []
            });
            setCurrentStep(2);
        }
    };

    const handleSubmit = async () => {
        if (courseData.title && courseData.modules.length > 0) {
            try {
                setUploading(true);
                // Transform modules to match backend format
                const transformedModules = courseData.modules.map(module => ({
                    title: module.title,
                    description: module.description,
                    content: module.description,
                    duration: module.lessons.reduce((sum, lesson) => {
                        // Extract minutes from duration string like "15 mins"
                        const minutes = parseInt(lesson.duration) || 0;
                        return sum + minutes;
                    }, 0),
                    videoUrl: module.lessons[0]?.videoUrl || '',
                    questions: [] // Optional for now
                }));

                const coursePayload = {
                    title: courseData.title,
                    description: courseData.description,
                    category: courseData.category,
                    level: courseData.level,
                    modules: transformedModules
                };

                // Add thumbnail URL if image was uploaded
                if (courseData.bannerImageUrl) {
                    coursePayload.thumbnailUrl = courseData.bannerImageUrl;
                }

                console.log('Submitting course:', coursePayload);
                await courseService.createCourse(coursePayload);
                alert('Course created successfully! You can now submit it for approval.');
                router.push('/instructor/courses');
            } catch (error) {
                console.error('Error creating course:', error);
                alert(`Failed to create course: ${error.response?.data?.message || error.message}`);
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pt-20 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                        Upload New Course
                    </h1>
                    <p className="text-gray-600">Create and publish your course content</p>
                </div>

                {/* Steps Indicator */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${currentStep >= step
                                        ? 'bg-gradient-to-br from-[#16a34a] to-emerald-700 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-emerald-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className={currentStep >= 1 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                            Course Details
                        </span>
                        <span className={currentStep >= 2 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                            Add Modules & Lessons
                        </span>
                        <span className={currentStep >= 3 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                            Review & Publish
                        </span>
                    </div>
                </div>

                {/* Step 1: Course Details */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.BookOpen className="w-5 h-5 text-emerald-600" />
                                Basic Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label>
                                    <input
                                        type="text"
                                        value={courseData.title}
                                        onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                                        placeholder="e.g., Master Digital Marketing Success"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea
                                        value={courseData.description}
                                        onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                                        placeholder="Describe what students will learn..."
                                        rows={5}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                        <select
                                            value={courseData.category}
                                            onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                                        <select
                                            value={courseData.level}
                                            onChange={(e) => setCourseData({ ...courseData, level: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            {levels.map(level => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                                        <input
                                            type="text"
                                            value={courseData.duration}
                                            onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                                            placeholder="e.g., 8 WEEKS"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD)</label>
                                        <input
                                            type="number"
                                            value={courseData.price}
                                            onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                                            placeholder="0 for free"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Banner Image</label>
                                    <div className="flex items-center gap-4">
                                        {courseData.bannerImage && (
                                            <img src={courseData.bannerImage} alt="Banner" className="w-32 h-32 object-cover rounded-lg" />
                                        )}
                                        <label className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors flex items-center gap-2">
                                            <Icons.Upload className="w-4 h-4" />
                                            Upload Image
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setCurrentStep(2)}
                                disabled={!courseData.title || !courseData.category}
                                className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Next: Add Content
                                <Icons.ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Add Modules & Lessons */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        {/* Current Modules */}
                        {courseData.modules.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Added Modules ({courseData.modules.length})</h2>
                                <div className="space-y-3">
                                    {courseData.modules.map((module, idx) => (
                                        <div key={module.id} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <h3 className="font-semibold text-gray-900">Module {idx + 1}: {module.title}</h3>
                                            <p className="text-sm text-gray-600">{module.lessons.length} lessons</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add New Module */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.FolderPlus className="w-5 h-5 text-emerald-600" />
                                Add New Module
                            </h2>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Module Title *</label>
                                    <input
                                        type="text"
                                        value={currentModule.title}
                                        onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })}
                                        placeholder="e.g., Foundations of Digital Marketing"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Module Description</label>
                                    <textarea
                                        value={currentModule.description}
                                        onChange={(e) => setCurrentModule({ ...currentModule, description: e.target.value })}
                                        placeholder="Brief description of this module..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Lessons in Current Module */}
                            {currentModule.lessons.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">Lessons in this module:</h3>
                                    <div className="space-y-2">
                                        {currentModule.lessons.map((lesson, idx) => (
                                            <div key={lesson.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Icons.Video className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-sm font-medium">{idx + 1}. {lesson.title}</span>
                                                    <span className="text-xs text-gray-500">{lesson.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add Lesson Form */}
                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Plus className="w-4 h-4 text-emerald-600" />
                                    Add Lesson
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Title *</label>
                                        <input
                                            type="text"
                                            value={currentLesson.title}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                                            placeholder="e.g., Introduction to Digital Marketing"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Video URL (YouTube/Vimeo)</label>
                                            <input
                                                type="url"
                                                value={currentLesson.videoUrl}
                                                onChange={(e) => setCurrentLesson({ ...currentLesson, videoUrl: e.target.value })}
                                                placeholder="https://youtube.com/..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload Video File</label>
                                            <label className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                                                <Icons.Upload className="w-4 h-4 text-emerald-600" />
                                                <span className="text-sm text-gray-600">
                                                    {currentLesson.videoFile ? currentLesson.videoFile.name : 'Choose video file'}
                                                </span>
                                                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                        <input
                                            type="text"
                                            value={currentLesson.duration}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, duration: e.target.value })}
                                            placeholder="e.g., 15 mins"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Content/Description</label>
                                        <textarea
                                            value={currentLesson.content}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, content: e.target.value })}
                                            placeholder="Lesson overview and learning objectives..."
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <button
                                        onClick={addLesson}
                                        disabled={!currentLesson.title || (!currentLesson.videoUrl && !currentLesson.videoFile)}
                                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Icons.Plus className="w-4 h-4" />
                                        Add Lesson to Module
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t">
                                <button
                                    onClick={addModule}
                                    disabled={!currentModule.title || currentModule.lessons.length === 0}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Icons.Check className="w-5 h-5" />
                                    Save Module and Continue
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Icons.ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(3)}
                                disabled={courseData.modules.length === 0}
                                className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Review Course
                                <Icons.ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Publish */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Review Your Course</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-2xl mb-2">{courseData.title}</h3>
                                    <p className="text-gray-600">{courseData.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                        {courseData.category}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                        {courseData.level}
                                    </span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                        {courseData.duration}
                                    </span>
                                </div>
                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold text-gray-900 mb-3">Course Content:</h4>
                                    <div className="space-y-3">
                                        {courseData.modules.map((module, idx) => (
                                            <div key={module.id} className="p-4 bg-gray-50 rounded-lg">
                                                <h5 className="font-semibold text-gray-900 mb-2">
                                                    Module {idx + 1}: {module.title}
                                                </h5>
                                                <ul className="ml-4 space-y-1">
                                                    {module.lessons.map((lesson, lessonIdx) => (
                                                        <li key={lesson.id} className="text-sm text-gray-600 flex items-center gap-2">
                                                            <Icons.Check className="w-3 h-3 text-emerald-600" />
                                                            {lessonIdx + 1}. {lesson.title}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <Icons.AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Before You Submit</h3>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• Your course will be reviewed by the admin team</li>
                                        <li>• Review typically takes 1-2 business days</li>
                                        <li>• You'll receive an email notification once approved</li>
                                        <li>• You can edit your course after submission</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Icons.ArrowLeft className="w-4 h-4" />
                                Back to Edit
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-lg font-semibold"
                            >
                                <Icons.Send className="w-5 h-5" />
                                Submit for Review
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
