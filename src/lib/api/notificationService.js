import api from './config';

const notificationService = {
    /** Get all dashboard notifications for the current user */
    getMyNotifications: async (limit = 20) => {
        const response = await api.get(`/notifications?limit=${limit}`);
        return response.data;
    },

    /** Get student reminders (from instructors / admin bulk messages) */
    getMyReminders: async () => {
        const response = await api.get('/notifications/reminders');
        return response.data;
    },

    /** Mark a notification as read */
    markAsRead: async (notificationId) => {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },

    /** Mark all notifications as read */
    markAllAsRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },

    /** Get unread notification count */
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
};

export default notificationService;
