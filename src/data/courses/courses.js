// courses.js - Updated with student progress tracking

export const coursesData = [
  {
    id: 1,
    category: "Marketing",
    title: "Master Digital Marketing Success",
    slug: "master-digital-marketing",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    bannerImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    duration: "8 WEEKS",
    students: "12,450+ STUDENTS ENROLLED",
    rating: 4.8,
    level: "Beginner-Advanced",
    instructor: {
      name: "James Whitmore, MBA",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      bio: "Digital marketing expert with 15+ years of experience in SEO, SEM, and social media marketing.",
      email: "james@example.com",
    },
    badge: "Marketing",
    bgColor: "bg-blue-100",
    accentColor: "bg-orange-500",
    description:
      "Master the essential digital marketing skills needed to succeed in today's competitive landscape.",
    bonuses: [
      "Lifetime access to course materials",
      "Certificate of completion",
      "Interactive quizzes and assessments",
      "Downloadable resources",
      "Direct instructor support",
    ],

    // Module and lesson data remains the same
    modules: [
      {
        id: 1,
        title: "Foundations of Digital Marketing",
        description:
          "Learn the basics of digital marketing and customer journey",
        xpReward: 310,
        lessons: [
          {
            id: 1,
            title: "Introduction to Digital Marketing",
            content:
              "Explore the digital marketing landscape and success mindset...",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            duration: "15 mins",
            xpReward: 50,
            topics: [
              "What is Digital Marketing",
              "Success Mindset",
              "Digital Trends 2024",
            ],
            questions: [
              {
                id: 1,
                type: "multiple_choice",
                question: "What is the primary goal of digital marketing?",
                options: [
                  "To increase brand awareness and conversions",
                  "To spend more money on ads",
                  "To create social media accounts",
                  "To hire more staff",
                ],
                correctAnswer: 0,
              },
            ],
          },
          // ... other lessons
        ],
        assessment: {
          id: 1,
          title: "Module 1 Assessment: Digital Marketing Foundations",
          type: "quiz",
          passingScore: 30,
          questions: [
            // ... assessment questions
          ],
        },
      },
      // ... other modules
    ],

    finalAssessment: {
      id: 99,
      title: "Final Course Assessment: Digital Marketing Mastery",
      description:
        "Complete this final assessment to earn your certificate. You need 70% or higher to pass.",
      passingScore: 70,
      questions: [
        // ... final assessment questions
      ],
    },

    certificate: {
      template: "professional",
      signatories: [
        {
          name: "James Whitmore, MBA",
          title: "Course Instructor",
          signature: "signature-url",
        },
      ],
    },
  },
  // Add more courses...
];

export default coursesData;

// ====================================
// Student Progress Data Structure
// ====================================
// This would typically come from a backend/database
// For now, we'll use localStorage or state management

export const getStudentProgress = (studentId = "current-student") => {
  // In a real app, this would fetch from your backend
  // For demo purposes, return sample data

  return {
    studentId: studentId,
    enrolledCourses: [
      {
        courseId: 1,
        enrolledDate: new Date("2024-01-15"),
        lastAccessedDate: new Date("2024-01-19"),
        status: "in_progress", // 'not_started', 'in_progress', 'completed'
        progress: 31, // Overall course progress percentage

        // Track which module and lesson they're currently on
        currentModule: 1,
        currentLesson: 2,

        // Track completed lessons
        completedLessons: [1], // Array of lesson IDs

        // Track module completion
        completedModules: [], // Array of module IDs

        // XP earned from this course
        xpEarned: 50,

        // Assessment scores
        moduleAssessments: {
          1: { score: 0, completed: false },
          2: { score: 0, completed: false },
        },

        finalAssessment: {
          score: 0,
          completed: false,
          attempts: 0,
        },

        // Certificate
        certificateEarned: false,
        certificateDate: null,
      },
      // More enrolled courses...
    ],

    // Overall student stats
    totalXP: 310,
    totalCertificates: 0,
    totalCoursesCompleted: 0,
    totalCoursesInProgress: 1,
    learningStreak: 1,
    totalLearningHours: 2.5,
  };
};

// Helper function to get course with progress
export const getCourseWithProgress = (
  courseId,
  studentId = "current-student"
) => {
  const course = coursesData.find((c) => c.id === courseId);
  const progress = getStudentProgress(studentId);
  const courseProgress = progress.enrolledCourses.find(
    (ec) => ec.courseId === courseId
  );

  return {
    ...course,
    progress: courseProgress || null,
  };
};

// Helper to update student progress
export const updateStudentProgress = (courseId, updates) => {
  // In a real app, this would update the backend
  // For now, we'll use localStorage

  const storageKey = `student_progress_current-student`;
  const currentProgress = JSON.parse(localStorage.getItem(storageKey) || "{}");

  // Update the specific course progress
  const courseIndex =
    currentProgress.enrolledCourses?.findIndex(
      (ec) => ec.courseId === courseId
    ) ?? -1;

  if (courseIndex >= 0) {
    currentProgress.enrolledCourses[courseIndex] = {
      ...currentProgress.enrolledCourses[courseIndex],
      ...updates,
      lastAccessedDate: new Date(),
    };
  } else {
    // First time enrolling in this course
    currentProgress.enrolledCourses = currentProgress.enrolledCourses || [];
    currentProgress.enrolledCourses.push({
      courseId,
      enrolledDate: new Date(),
      lastAccessedDate: new Date(),
      status: "in_progress",
      progress: 0,
      currentModule: 1,
      currentLesson: 1,
      completedLessons: [],
      completedModules: [],
      xpEarned: 0,
      moduleAssessments: {},
      finalAssessment: { score: 0, completed: false, attempts: 0 },
      certificateEarned: false,
      certificateDate: null,
      ...updates,
    });
  }

  localStorage.setItem(storageKey, JSON.stringify(currentProgress));
  return currentProgress;
};

// Helper to calculate course progress
export const calculateCourseProgress = (course, completedLessons = []) => {
  const totalLessons = course.modules.reduce(
    (sum, module) => sum + module.lessons.length,
    0
  );

  const completed = completedLessons.length;
  return Math.round((completed / totalLessons) * 100);
};

// Get last accessed lesson for continue learning
export const getLastAccessedLesson = (courseId) => {
  const storageKey = `student_progress_current-student`;
  const progress = JSON.parse(localStorage.getItem(storageKey) || "{}");

  const courseProgress = progress.enrolledCourses?.find(
    (ec) => ec.courseId === courseId
  );

  if (!courseProgress) {
    return { moduleId: 1, lessonId: 1 }; // Default to first lesson
  }

  return {
    moduleId: courseProgress.currentModule || 1,
    lessonId: courseProgress.currentLesson || 1,
  };
};
