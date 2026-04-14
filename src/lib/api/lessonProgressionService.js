import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.elearning.arin-africa.org";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const lessonProgressionService = {
  /**
   * Check if student can access a lesson
   */
  async canAccessLesson(enrollmentId, lessonIndex) {
    try {
      const response = await api.get(
        `/lessons/progression/${enrollmentId}/can-access/${lessonIndex}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to check lesson access:", error);
      throw error;
    }
  },

  /**
   * Submit quiz answers and get evaluation
   */
  async submitQuiz(enrollmentId, lessonIndex, answers, moduleId) {
    try {
      const response = await api.post(
        `/lessons/progression/${enrollmentId}/evaluate-quiz/${lessonIndex}`,
        {
          answers,
          moduleId,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      throw error;
    }
  },

  /**
   * Mark lesson as complete (for lessons without quiz)
   */
  async completeLessonWithoutQuiz(enrollmentId, lessonIndex) {
    try {
      const response = await api.post(
        `/lessons/progression/${enrollmentId}/complete/${lessonIndex}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to complete lesson:", error);
      throw error;
    }
  },

  /**
   * Get next incomplete lesson
   */
  async getNextIncompleteLesson(enrollmentId, totalLessons) {
    try {
      const response = await api.get(
        `/lessons/progression/${enrollmentId}/next-lesson/${totalLessons}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get next lesson:", error);
      throw error;
    }
  },

  /**
   * Get lesson progress summary
   */
  async getLessonProgressSummary(enrollmentId, totalLessons) {
    try {
      const response = await api.get(
        `/lessons/progression/${enrollmentId}/summary/${totalLessons}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get lesson summary:", error);
      throw error;
    }
  },

  /**
   * Reset lesson progress (admin operation)
   */
  async resetLessonProgress(enrollmentId, lessonIndex) {
    try {
      const response = await api.post(
        `/lessons/progression/${enrollmentId}/reset/${lessonIndex}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to reset lesson progress:", error);
      throw error;
    }
  },
};

export default lessonProgressionService;
