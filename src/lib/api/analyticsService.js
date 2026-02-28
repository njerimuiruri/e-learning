import api from "./config";

class AnalyticsService {
  // Get comprehensive analytics overview
  async getOverview() {
    const response = await api.get("/api/admin/analytics/overview");
    return response.data;
  }

  // Get student progress analytics
  async getStudentProgress(limit, status) {
    const response = await api.get("/api/admin/analytics/student-progress", {
      params: { limit, status },
    });
    return response.data;
  }

  // Get instructor activity analytics
  async getInstructorActivity() {
    const response = await api.get("/api/admin/analytics/instructor-activity");
    return response.data;
  }

  // Get course completion analytics
  async getCourseCompletion() {
    const response = await api.get("/api/admin/analytics/course-completion");
    return response.data;
  }

  // Get user analytics (with date range)
  async getUserAnalytics(startDate, endDate) {
    const response = await api.get("/api/admin/analytics/users", {
      params: { startDate, endDate },
    });
    return response.data;
  }

  // Get revenue analytics (with date range)
  async getRevenueAnalytics(startDate, endDate) {
    const response = await api.get("/api/admin/analytics/revenue", {
      params: { startDate, endDate },
    });
    return response.data;
  }

  // Delete instructor
  async deleteInstructor(instructorId) {
    const response = await api.delete(`/api/admin/instructors/${instructorId}`);
    return response.data;
  }
}

export default new AnalyticsService();
