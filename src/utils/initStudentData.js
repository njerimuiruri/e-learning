// utils/initStudentData.js
// Helper function to initialize sample student data for demo purposes

export const initializeSampleStudentData = () => {
  const sampleData = {
    studentId: "current-student",
    enrolledCourses: [
      {
        courseId: 1,
        enrolledDate: new Date("2024-01-15").toISOString(),
        lastAccessedDate: new Date("2024-01-19").toISOString(),
        status: "in_progress", // 'not_started', 'in_progress', 'completed'
        progress: 31,

        // Currently on Module 1, Lesson 2
        currentModule: 1,
        currentLesson: 2,

        // Completed lesson 1
        completedLessons: [1],

        // No modules completed yet
        completedModules: [],

        // XP earned from completing lesson 1
        xpEarned: 50,

        // Assessment tracking
        moduleAssessments: {
          1: { score: 0, completed: false },
          2: { score: 0, completed: false },
        },

        finalAssessment: {
          score: 0,
          completed: false,
          attempts: 0,
        },

        // Certificate not earned yet
        certificateEarned: false,
        certificateDate: null,
      },
    ],

    // Overall student stats
    totalXP: 310,
    totalCertificates: 0,
    totalCoursesCompleted: 0,
    totalCoursesInProgress: 1,
    learningStreak: 1,
    totalLearningHours: 2.5,
  };

  // Store in localStorage
  localStorage.setItem(
    "student_progress_current-student",
    JSON.stringify(sampleData)
  );

  console.log("✅ Sample student data initialized!");
  return sampleData;
};

// Call this function once when the app loads or when user first registers
// You can add this to your registration flow or call it manually in the browser console:
// initializeSampleStudentData()
