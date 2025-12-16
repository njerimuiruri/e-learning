'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import courseService from '@/lib/api/courseService';
import uploadService from '@/lib/api/uploadService';
import categoryService from '@/lib/api/categoryService';

export default function CourseUploadPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [courseData, setCourseData] = useState({
        title: '',
        description: '',
        category: '',
        level: 'Beginner',
        duration: '',
        price: '',
        bannerImage: null,
        bannerImageUrl: null,
        modules: [],
        finalAssessment: null
    });

    const [currentModule, setCurrentModule] = useState({
        title: '',
        description: '',
        lessons: [],
        moduleAssessment: null
    });

    const [currentLesson, setCurrentLesson] = useState({
        title: '',
        content: '',
        type: 'video',
        videoUrl: '',
        videoFile: null,
        duration: '',
        topics: [],
        questions: []
    });

    const editorRef = useRef(null);
    const imageInputRef = useRef(null);

    const [moduleAssessments, setModuleAssessments] = useState({}); // Store assessment for each module index
    const [selectedModuleIdx, setSelectedModuleIdx] = useState(null); // Track which module is currently being edited

    const [currentModuleAssessment, setCurrentModuleAssessment] = useState({
        title: '',
        description: '',
        passingScore: 70,
        questions: []
    });

    const [currentModuleQuestion, setCurrentModuleQuestion] = useState({
        text: '',
        type: 'multiple-choice',
        points: 10,
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: ''
    });

    const [finalAssessment, setFinalAssessment] = useState({
        title: 'Final Course Assessment',
        description: '',
        passingScore: 70,
        questions: []
    });

    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        type: 'multiple-choice',
        points: 10,
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: ''
    });

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const data = await categoryService.getAllCategories();
                setCategories(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to load categories:', error);
                setCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Persist the currently edited module assessment into the map for its module index
    const persistCurrentModuleAssessment = () => {
        if (selectedModuleIdx === null) return;

        const hasQuestions = currentModuleAssessment?.questions?.length > 0;
        const hasMeta = (currentModuleAssessment?.title || currentModuleAssessment?.description);

        // Only store if there is meaningful data
        if (!hasQuestions && !hasMeta) return;

        setModuleAssessments((prev) => ({
            ...prev,
            [selectedModuleIdx]: { ...currentModuleAssessment }
        }));
    };

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

    const focusEditor = () => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    const syncEditorContent = () => {
        const rawContent = editorRef.current?.innerHTML || '';
        const cleanedContent = cleanHtmlContent(rawContent);
        setCurrentLesson(prev => ({ ...prev, content: cleanedContent }));
    };

    const applyEditorCommand = (command, value = null) => {
        focusEditor();
        document.execCommand(command, false, value);
        syncEditorContent();
    };

    const insertHtmlIntoEditor = (html) => {
        if (!editorRef.current) return;
        focusEditor();
        document.execCommand('insertHTML', false, html);
        syncEditorContent();
    };

    const handleAddLink = () => {
        const url = window.prompt('Enter URL to link');
        if (url) {
            applyEditorCommand('createLink', url);
        }
    };

    const handleInlineImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const imageUrl = await uploadService.uploadImage(file);
            insertHtmlIntoEditor(`<img src="${imageUrl}" alt="Lesson media" class="rounded-lg my-2" />`);
        } catch (error) {
            alert('Failed to upload image. Please try again.');
            console.error('Lesson image upload error:', error);
        } finally {
            setUploading(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    const getVideoEmbedMarkup = (url) => {
        if (!url) return '';
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = new URL(url).searchParams.get('v');
            if (videoId) {
                return `<div class="my-3 overflow-hidden rounded-lg"><iframe width="100%" height="320" src="https://www.youtube.com/embed/${videoId}" allowfullscreen class="w-full"></iframe></div>`;
            }
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1];
            if (videoId) {
                return `<div class="my-3 overflow-hidden rounded-lg"><iframe width="100%" height="320" src="https://www.youtube.com/embed/${videoId}" allowfullscreen class="w-full"></iframe></div>`;
            }
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1];
            if (videoId) {
                return `<div class="my-3 overflow-hidden rounded-lg"><iframe src="https://player.vimeo.com/video/${videoId}" width="100%" height="320" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
            }
        }
        return `<video controls class="w-full rounded-lg my-3"><source src="${url}"></video>`;
    };

    const handleInlineVideoEmbed = () => {
        const url = window.prompt('Paste video URL (YouTube, Vimeo, or direct link)');
        if (!url) return;
        insertHtmlIntoEditor(getVideoEmbedMarkup(url));
    };

    const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '').trim();

    // Remove unwanted data-* attributes injected by some browsers/editors
    const cleanHtmlContent = (html) => {
        if (!html) return '';
        return html
            .replace(/\s*data-start="[^"]*"/g, '')
            .replace(/\s*data-end="[^"]*"/g, '')
            .trim();
    };

    useEffect(() => {
        // Only update innerHTML when switching lessons or clearing (not during typing)
        if (editorRef.current) {
            const isClearing = currentLesson.content === '' && editorRef.current.innerHTML !== '';
            const isSwitching = currentLesson.content && !editorRef.current.innerHTML;

            if (isClearing || isSwitching) {
                editorRef.current.innerHTML = currentLesson.content || '';
            }
        }
    }, [currentLesson.title]); // Only run when lesson changes, not on every content update

    const addLesson = () => {
        const hasRichContent = stripHtml(currentLesson.content).length > 0;
        if (currentLesson.title && (currentLesson.videoUrl || currentLesson.videoFile || hasRichContent)) {
            const cleanedLesson = {
                ...currentLesson,
                content: cleanHtmlContent(currentLesson.content)
            };
            setCurrentModule({
                ...currentModule,
                lessons: [...currentModule.lessons, { ...cleanedLesson, id: Date.now() }]
            });
            setCurrentLesson({
                title: '',
                content: '',
                type: 'video',
                videoUrl: '',
                videoFile: null,
                duration: '',
                topics: [],
                questions: []
            });
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
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
                lessons: [],
                moduleAssessment: null
            });
            setCurrentStep(2);
        }
    };

    const addQuestionToFinalAssessment = () => {
        if (!currentQuestion.text) {
            alert('Question text is required');
            return;
        }

        if (currentQuestion.type === 'multiple-choice') {
            if (!currentQuestion.correctAnswer || currentQuestion.options.some(o => !o)) {
                alert('Provide all options and select the correct answer');
                return;
            }
        }

        setFinalAssessment({
            ...finalAssessment,
            questions: [...finalAssessment.questions, { ...currentQuestion, id: Date.now() }]
        });

        setCurrentQuestion({
            text: '',
            type: 'multiple-choice',
            points: 10,
            options: ['', '', '', ''],
            correctAnswer: '',
            explanation: ''
        });
    };

    const removeQuestionFromFinalAssessment = (questionId) => {
        setFinalAssessment({
            ...finalAssessment,
            questions: finalAssessment.questions.filter(q => q.id !== questionId)
        });
    };

    const handleSubmit = async () => {
        if (courseData.title && courseData.modules.length > 0) {
            try {
                setUploading(true);
                // Transform modules to match backend format
                const transformedModules = courseData.modules.map((module, idx) => ({
                    title: module.title,
                    description: module.description,
                    content: module.description,
                    duration: module.lessons.reduce((sum, lesson) => {
                        // Extract minutes from duration string like "15 mins"
                        const minutes = parseInt(lesson.duration) || 0;
                        return sum + minutes;
                    }, 0),
                    videoUrl: module.lessons[0]?.videoUrl || '',
                    // Include lessons with their questions
                    lessons: module.lessons.map(lesson => ({
                        title: lesson.title,
                        content: lesson.content,
                        videoUrl: lesson.videoUrl,
                        duration: lesson.duration,
                        topics: lesson.topics || [],
                        questions: lesson.questions.map(({ id, ...q }) => q) // Remove temp IDs
                    })),
                    questions: [], // Optional for now
                    // Add module assessment if available
                    ...(moduleAssessments[idx] && {
                        moduleAssessment: {
                            title: moduleAssessments[idx].title,
                            description: moduleAssessments[idx].description,
                            passingScore: moduleAssessments[idx].passingScore,
                            questions: moduleAssessments[idx].questions.map(({ id, ...q }) => q)
                        }
                    })
                }));

                const coursePayload = {
                    title: courseData.title,
                    description: courseData.description,
                    category: courseData.category,
                    level: courseData.level.toLowerCase(),
                    modules: transformedModules
                };

                // Add final assessment if questions were added
                if (finalAssessment.questions.length > 0) {
                    coursePayload.finalAssessment = {
                        title: finalAssessment.title,
                        description: finalAssessment.description,
                        passingScore: finalAssessment.passingScore,
                        questions: finalAssessment.questions.map(({ id, ...q }) => q)
                    };
                }

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
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${currentStep >= step
                                    ? 'bg-gradient-to-br from-[#16a34a] to-emerald-700 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {step}
                                </div>
                                {step < 5 && (
                                    <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-emerald-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm gap-1">
                        <span className={currentStep >= 1 ? 'text-emerald-600 font-medium text-xs' : 'text-gray-500 text-xs'}>
                            Course Details
                        </span>
                        <span className={currentStep >= 2 ? 'text-emerald-600 font-medium text-xs' : 'text-gray-500 text-xs'}>
                            Modules & Lessons
                        </span>
                        <span className={currentStep >= 3 ? 'text-emerald-600 font-medium text-xs' : 'text-gray-500 text-xs'}>
                            Module Assessments
                        </span>
                        <span className={currentStep >= 4 ? 'text-emerald-600 font-medium text-xs' : 'text-gray-500 text-xs'}>
                            Final Assessment
                        </span>
                        <span className={currentStep >= 5 ? 'text-emerald-600 font-medium text-xs' : 'text-gray-500 text-xs'}>
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
                                        {categoriesLoading ? (
                                            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                                                Loading categories...
                                            </div>
                                        ) : (
                                            <select
                                                value={courseData.category}
                                                onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(cat => (
                                                    <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        )}
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
                        {/* Step Info */}
                        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 border-emerald-200 rounded-xl p-6">
                            <h2 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
                                <Icons.FolderPlus className="w-5 h-5" />
                                Add Multiple Modules to Your Course
                            </h2>
                            <p className="text-emerald-800 text-sm leading-relaxed">
                                A course can have <span className="font-semibold">unlimited modules</span>. Each module can have multiple lessons followed by an assessment. Students must complete each module's assessment before unlocking the next module.
                            </p>
                        </div>

                        {/* Current Modules */}
                        {courseData.modules.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Modules Added ({courseData.modules.length})</h2>
                                        <p className="text-sm text-gray-600 mt-1">You can add as many modules as needed</p>
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-600">{courseData.modules.length}</div>
                                </div>
                                <div className="space-y-3">
                                    {courseData.modules.map((module, idx) => (
                                        <div key={module.id} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 hover:shadow-md transition-shadow">
                                            <h3 className="font-semibold text-gray-900">Module {idx + 1}: {module.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                <Icons.Video className="w-4 h-4 inline mr-1 text-emerald-600" />
                                                {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <Icons.Info className="w-4 h-4 inline mr-2" />
                                        Continue adding more modules below, or proceed to the next step
                                    </p>
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
                                        <div className="border border-gray-300 rounded-lg">
                                            <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50 rounded-t-lg">
                                                <button
                                                    type="button"
                                                    onClick={() => applyEditorCommand('bold')}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                                >
                                                    Bold
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => applyEditorCommand('italic')}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                                >
                                                    Italic
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => applyEditorCommand('underline')}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                                >
                                                    Underline
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => applyEditorCommand('insertUnorderedList')}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                                >
                                                    Bullets
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => applyEditorCommand('insertOrderedList')}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                                >
                                                    Numbered
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleAddLink}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                                >
                                                    Link
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => imageInputRef.current?.click()}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1"
                                                >
                                                    <Icons.Image className="w-4 h-4" />
                                                    Image
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleInlineVideoEmbed}
                                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1"
                                                >
                                                    <Icons.Video className="w-4 h-4" />
                                                    Video
                                                </button>
                                            </div>
                                            <div
                                                ref={editorRef}
                                                contentEditable
                                                className="min-h-[160px] w-full px-3 py-2 focus:outline-none"
                                                data-placeholder="Lesson overview, learning objectives, and inline media..."
                                                onInput={syncEditorContent}
                                                suppressContentEditableWarning
                                            />
                                        </div>
                                        <input
                                            type="file"
                                            ref={imageInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleInlineImageUpload}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Format text, add links, and drop inline images or embedded videos directly inside your lesson content.
                                        </p>
                                        <style jsx>{`
                                            [contenteditable][data-placeholder]:empty:before {
                                                content: attr(data-placeholder);
                                                color: #9ca3af;
                                                pointer-events: none;
                                            }
                                        `}</style>
                                    </div>
                                    <button
                                        onClick={addLesson}
                                        disabled={!currentLesson.title || (!currentLesson.videoUrl && !currentLesson.videoFile && !stripHtml(currentLesson.content).length)}
                                        className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Icons.Plus className="w-4 h-4" />
                                        Add Lesson to Module
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                                        <Icons.FolderPlus className="w-4 h-4" />
                                        Multiple Modules Support
                                    </h4>
                                    <p className="text-sm text-emerald-800">
                                        This course will have <span className="font-semibold">{currentModule.title || 'this module'}</span> as Module {courseData.modules.length + 1}. You can add more modules after this one.
                                    </p>
                                </div>
                                <button
                                    onClick={addModule}
                                    disabled={!currentModule.title || currentModule.lessons.length === 0}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                                >
                                    <Icons.Check className="w-5 h-5" />
                                    Save This Module + Add Another
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 items-center">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Icons.ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
                                <Icons.Info className="w-4 h-4 inline mr-2" />
                                You have <span className="font-semibold">{courseData.modules.length}</span> module{courseData.modules.length !== 1 ? 's' : ''}. You can add more or proceed.
                            </div>
                            <button
                                onClick={() => {
                                    // Initialize module assessments for all modules if not already done
                                    const assessments = { ...moduleAssessments };
                                    courseData.modules.forEach((_, idx) => {
                                        if (!assessments[idx]) {
                                            assessments[idx] = null;
                                        }
                                    });
                                    setModuleAssessments(assessments);
                                    setCurrentStep(3);
                                }}
                                disabled={courseData.modules.length === 0}
                                className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                            >
                                Next: Add Module Assessments
                                <Icons.ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Module Assessments */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                            <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <Icons.Target className="w-5 h-5" />
                                Module Assessments
                            </h2>
                            <p className="text-blue-800 text-sm">
                                Create an assessment for each module. Students must pass each module's assessment before proceeding to the next module.
                            </p>
                        </div>

                        {/* Module Selection */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-md font-bold text-gray-900 mb-4">Select Module to Add Assessment</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {courseData.modules.map((module, idx) => (
                                    <button
                                        key={module.id}
                                        onClick={() => {
                                            // Save the assessment for the currently selected module before switching
                                            persistCurrentModuleAssessment();

                                            setSelectedModuleIdx(idx); // Track selected module
                                            // Load existing assessment if available
                                            const existing = moduleAssessments[idx];
                                            setCurrentModuleAssessment(existing || {
                                                title: `${module.title} Assessment`,
                                                description: '',
                                                passingScore: 70,
                                                questions: []
                                            });
                                            setCurrentModuleQuestion({
                                                text: '',
                                                type: 'multiple-choice',
                                                points: 10,
                                                options: ['', '', '', ''],
                                                correctAnswer: '',
                                                explanation: ''
                                            });
                                        }}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${moduleAssessments[idx]
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 bg-gray-50 hover:border-emerald-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-900">Module {idx + 1}</div>
                                        <div className="text-sm text-gray-600">{module.title}</div>
                                        {moduleAssessments[idx] && (
                                            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                                <Icons.Check className="w-3 h-3" />
                                                {moduleAssessments[idx].questions?.length || 0} questions
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assessment Form */}
                        {currentModuleAssessment && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-md font-bold text-gray-900 mb-4">Assessment Details</h3>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Title</label>
                                        <input
                                            type="text"
                                            value={currentModuleAssessment.title}
                                            onChange={(e) => setCurrentModuleAssessment({ ...currentModuleAssessment, title: e.target.value })}
                                            placeholder="e.g., Module 1 Assessment"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={currentModuleAssessment.description}
                                            onChange={(e) => setCurrentModuleAssessment({ ...currentModuleAssessment, description: e.target.value })}
                                            placeholder="Describe the assessment..."
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={currentModuleAssessment.passingScore}
                                            onChange={(e) => setCurrentModuleAssessment({ ...currentModuleAssessment, passingScore: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Questions */}
                                {currentModuleAssessment.questions && currentModuleAssessment.questions.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-gray-900 mb-3">Questions Added</h4>
                                        <div className="space-y-2">
                                            {currentModuleAssessment.questions.map((q, qIdx) => (
                                                <div key={q.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{qIdx + 1}. {q.text?.substring(0, 50)}...</p>
                                                        <p className="text-xs text-gray-500">{q.type} • {q.points} points</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setCurrentModuleAssessment({
                                                                ...currentModuleAssessment,
                                                                questions: currentModuleAssessment.questions.filter(qq => qq.id !== q.id)
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-700 transition"
                                                    >
                                                        <Icons.Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add Question Form */}
                                <div className="border-t pt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Icons.Plus className="w-4 h-4 text-emerald-600" />
                                        Add Question
                                    </h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                                            <textarea
                                                value={currentModuleQuestion.text}
                                                onChange={(e) => setCurrentModuleQuestion({ ...currentModuleQuestion, text: e.target.value })}
                                                placeholder="Enter the question..."
                                                rows={2}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                                                <select
                                                    value={currentModuleQuestion.type}
                                                    onChange={(e) => setCurrentModuleQuestion({ ...currentModuleQuestion, type: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="multiple-choice">Multiple Choice</option>
                                                    <option value="true-false">True/False</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={currentModuleQuestion.points}
                                                    onChange={(e) => setCurrentModuleQuestion({ ...currentModuleQuestion, points: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Options */}
                                        {currentModuleQuestion.type === 'multiple-choice' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                                                <div className="space-y-2">
                                                    {currentModuleQuestion.options.map((option, oIdx) => (
                                                        <input
                                                            key={oIdx}
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => {
                                                                const newOptions = [...currentModuleQuestion.options];
                                                                newOptions[oIdx] = e.target.value;
                                                                setCurrentModuleQuestion({ ...currentModuleQuestion, options: newOptions });
                                                            }}
                                                            placeholder={`Option ${oIdx + 1}`}
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Correct Answer {currentModuleQuestion.type === 'multiple-choice' ? '(Option text or number)' : '(True/False)'}
                                            </label>
                                            {currentModuleQuestion.type === 'true-false' ? (
                                                <select
                                                    value={currentModuleQuestion.correctAnswer}
                                                    onChange={(e) => setCurrentModuleQuestion({ ...currentModuleQuestion, correctAnswer: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="">Select correct answer</option>
                                                    <option value="true">True</option>
                                                    <option value="false">False</option>
                                                </select>
                                            ) : (
                                                <select
                                                    value={currentModuleQuestion.correctAnswer}
                                                    onChange={(e) => setCurrentModuleQuestion({ ...currentModuleQuestion, correctAnswer: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="">Select correct option</option>
                                                    {currentModuleQuestion.options.map((opt, idx) => (
                                                        <option key={idx} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                                            <textarea
                                                value={currentModuleQuestion.explanation}
                                                onChange={(e) => setCurrentModuleQuestion({ ...currentModuleQuestion, explanation: e.target.value })}
                                                placeholder="Why is this the correct answer?"
                                                rows={2}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (!currentModuleQuestion.text) {
                                                    alert('Question text is required');
                                                    return;
                                                }
                                                if (!currentModuleQuestion.correctAnswer) {
                                                    alert('Correct answer is required');
                                                    return;
                                                }
                                                if (currentModuleQuestion.type === 'multiple-choice' && currentModuleQuestion.options.some(o => !o)) {
                                                    alert('All options must be filled in');
                                                    return;
                                                }

                                                setCurrentModuleAssessment({
                                                    ...currentModuleAssessment,
                                                    questions: [...(currentModuleAssessment.questions || []), { ...currentModuleQuestion, id: Date.now() }]
                                                });

                                                setCurrentModuleQuestion({
                                                    text: '',
                                                    type: 'multiple-choice',
                                                    points: 10,
                                                    options: ['', '', '', ''],
                                                    correctAnswer: '',
                                                    explanation: ''
                                                });
                                            }}
                                            className="w-full px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Icons.Plus className="w-4 h-4" />
                                            Add Question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between gap-3">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Icons.ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    // Save current module assessment before moving on
                                    persistCurrentModuleAssessment();
                                    setCurrentStep(4);
                                }}
                                className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                            >
                                Continue to Final Assessment
                                <Icons.ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Final Assessment */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.CheckCircle className="w-5 h-5 text-emerald-600" />
                                Final Course Assessment (Required)
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Title</label>
                                    <input
                                        type="text"
                                        value={finalAssessment.title}
                                        onChange={(e) => setFinalAssessment({ ...finalAssessment, title: e.target.value })}
                                        placeholder="e.g., Final Course Assessment"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={finalAssessment.description}
                                        onChange={(e) => setFinalAssessment({ ...finalAssessment, description: e.target.value })}
                                        placeholder="Describe the final assessment..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Passing Score (%) - Required for Certificate
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={finalAssessment.passingScore}
                                        onChange={(e) => setFinalAssessment({ ...finalAssessment, passingScore: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-bold text-gray-900 mb-4">Add Questions</h3>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                                        <textarea
                                            value={currentQuestion.text}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                            placeholder="Enter the question..."
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                                            <select
                                                value={currentQuestion.type}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            >
                                                <option value="multiple-choice">Multiple Choice</option>
                                                <option value="true-false">True/False</option>
                                                <option value="essay">Essay</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={currentQuestion.points}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {currentQuestion.type === 'multiple-choice' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                                            <div className="space-y-2">
                                                {currentQuestion.options.map((option, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="correctAnswer"
                                                            checked={currentQuestion.correctAnswer === `${idx}`}
                                                            onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: `${idx}` })}
                                                            className="w-4 h-4 text-emerald-600"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => {
                                                                const newOptions = [...currentQuestion.options];
                                                                newOptions[idx] = e.target.value;
                                                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                                            }}
                                                            placeholder={`Option ${idx + 1}`}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentQuestion.type === 'true-false' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                                            <select
                                                value={currentQuestion.correctAnswer}
                                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            >
                                                <option value="">Select answer</option>
                                                <option value="true">True</option>
                                                <option value="false">False</option>
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                                        <textarea
                                            value={currentQuestion.explanation}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                                            placeholder="Explain the correct answer..."
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>

                                    <button
                                        onClick={addQuestionToFinalAssessment}
                                        className="w-full px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icons.Plus className="w-4 h-4" />
                                        Add Question
                                    </button>
                                </div>

                                {finalAssessment.questions.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-gray-900">Questions ({finalAssessment.questions.length})</h4>
                                        {finalAssessment.questions.map((question, idx) => (
                                            <div key={question.id} className="p-3 bg-gray-50 rounded-lg flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{idx + 1}. {question.text}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{question.type} • {question.points} points</p>
                                                </div>
                                                <button
                                                    onClick={() => removeQuestionFromFinalAssessment(question.id)}
                                                    className="ml-2 text-red-600 hover:text-red-700"
                                                >
                                                    <Icons.X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <button
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Icons.ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(5)}
                                className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                            >
                                Review Course
                                <Icons.ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Review & Publish */}
                {currentStep === 5 && (
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
                                        <li>• Students must score {finalAssessment.passingScore}% on the final assessment to get a certificate</li>
                                        <li>• You can edit your course after submission</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3">
                            <button
                                onClick={() => setCurrentStep(3)}
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
