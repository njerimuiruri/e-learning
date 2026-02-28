import api from "./config";

class ReminderService {
  /**
   * Get students who need reminders (inactive for 7+ days)
   */
  async getStudentsNeedingReminders(limit = 50) {
    try {
      const response = await api.get(
        `/api/admin/reminders/students-needing-reminders?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch students needing reminders"
      );
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats() {
    try {
      const response = await api.get("/api/admin/reminders/stats");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch reminder statistics"
      );
    }
  }

  /**
   * Get reminder settings
   */
  async getReminderSettings() {
    try {
      const response = await api.get("/api/admin/reminders/settings");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch reminder settings"
      );
    }
  }

  /**
   * Update reminder settings
   */
  async updateReminderSettings(settings) {
    try {
      const response = await api.put("/api/admin/reminders/settings", settings);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update reminder settings"
      );
    }
  }

  /**
   * Send manual reminder to a single student
   */
  async sendManualReminder(enrollmentId) {
    try {
      const response = await api.post(
        `/api/admin/reminders/send/${enrollmentId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to send reminder"
      );
    }
  }

  /**
   * Send reminders to multiple students
   */
  async sendBulkReminders(enrollmentIds) {
    try {
      const response = await api.post("/api/admin/reminders/send-bulk", {
        enrollmentIds,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to send bulk reminders"
      );
    }
  }

  /**
   * Manually trigger automatic reminders (for testing)
   */
  async triggerAutomaticReminders() {
    try {
      const response = await api.post("/api/admin/reminders/trigger-automatic");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to trigger automatic reminders"
      );
    }
  }
}

export default new ReminderService();
