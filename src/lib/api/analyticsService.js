import api from "./config";

class AnalyticsService {
  async getOverview() {
    const { data } = await api.get("/api/admin/analytics/overview");
    return data;
  }

  async getStudentProgress(limit, status) {
    const { data } = await api.get("/api/admin/analytics/student-progress", {
      params: { limit, status },
    });
    return data;
  }

  async getInstructorActivity() {
    const { data } = await api.get("/api/admin/analytics/instructor-activity");
    return data;
  }

  async getCourseCompletion() {
    const { data } = await api.get("/api/admin/analytics/course-completion");
    return data;
  }

  async getUserAnalytics(startDate, endDate) {
    const { data } = await api.get("/api/admin/analytics/users", {
      params: { startDate, endDate },
    });
    return data;
  }

  async getRevenueAnalytics(startDate, endDate) {
    const { data } = await api.get("/api/admin/analytics/revenue", {
      params: { startDate, endDate },
    });
    return data;
  }

  async getAssessmentInsights() {
    const { data } = await api.get("/api/admin/analytics/assessment-insights");
    return data;
  }

  async getLearningBehavior(period = "weekly") {
    const { data } = await api.get("/api/admin/analytics/learning-behavior", {
      params: { period },
    });
    return data;
  }

  async getEngagement() {
    const { data } = await api.get("/api/admin/analytics/engagement");
    return data;
  }

  async getDemographics() {
    const { data } = await api.get("/api/admin/analytics/demographics");
    return data;
  }

  async deleteInstructor(instructorId) {
    const { data } = await api.delete(`/api/admin/instructors/${instructorId}`);
    return data;
  }
}

export default new AnalyticsService();
