import api from "./config";

class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await api.get("/api/admin/stats");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch dashboard stats"
      );
    }
  }

  /**
   * Get all users with filters
   */
  async getAllUsers(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(`/api/admin/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch users");
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    try {
      const response = await api.get(`/api/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch user");
    }
  }

  /**
   * Activate user
   */
  async activateUser(id) {
    try {
      const response = await api.put(`/api/admin/users/${id}/activate`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to activate user"
      );
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id) {
    try {
      const response = await api.put(`/api/admin/users/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to deactivate user"
      );
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    try {
      const response = await api.delete(`/api/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete user");
    }
  }

  /**
   * Get pending instructor applications
   */
  async getPendingInstructors() {
    try {
      const response = await api.get("/api/admin/instructors/pending");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch pending instructors"
      );
    }
  }

  /**
   * Get all instructors with filters
   */
  async getAllInstructors(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(
        `/api/admin/instructors?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch instructors"
      );
    }
  }

  /**
   * Get instructor details
   */
  async getInstructorDetails(id) {
    try {
      const response = await api.get(`/api/admin/instructors/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch instructor details"
      );
    }
  }

  /**
   * Approve instructor
   */
  async approveInstructor(id) {
    try {
      const response = await api.put(`/api/admin/instructors/${id}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to approve instructor"
      );
    }
  }

  /**
   * Reject instructor
   */
  async rejectInstructor(id, reason) {
    try {
      const response = await api.put(`/api/admin/instructors/${id}/reject`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to reject instructor"
      );
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 10, type = null) {
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (type) params.append("type", type);

      const response = await api.get(
        `/api/admin/activity?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch recent activity"
      );
    }
  }

  /**
   * Get all students
   */
  async getAllStudents(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(
        `/api/admin/students?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch students"
      );
    }
  }

  /**
   * Get all fellows
   */
  async getAllFellows(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(`/api/admin/fellows?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch fellows"
      );
    }
  }

  /**
   * Get fellows at risk
   */
  async getFellowsAtRisk() {
    try {
      const response = await api.get("/api/admin/fellows/at-risk");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch fellows at risk"
      );
    }
  }

  /**
   * Send reminder to fellow
   */
  async sendFellowReminder(id, message) {
    try {
      const response = await api.post(
        `/api/admin/fellows/${id}/send-reminder`,
        {
          message,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to send reminder"
      );
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(
        `/api/admin/analytics/users?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch user analytics"
      );
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(
        `/api/admin/analytics/revenue?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch revenue analytics"
      );
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(id) {
    try {
      const response = await api.get(`/api/admin/students/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch student"
      );
    }
  }

  /**
   * Create a new student
   */
  async createStudent(studentData) {
    try {
      const response = await api.post("/api/admin/students", studentData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create student"
      );
    }
  }

  /**
   * Delete a student
   */
  async deleteStudent(id) {
    try {
      const response = await api.delete(`/api/admin/students/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete student"
      );
    }
  }
}

// Export a single instance
export default new AdminService();
