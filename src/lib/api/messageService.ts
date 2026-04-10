import api from './config';

export type MessagePayload = {
  receiverId: string;
  content: string;
  courseId?: string;
  moduleIndex?: number;
};

const messageService = {
  async sendMessage(payload: MessagePayload) {
    const response = await api.post('/messages', payload);
    return response.data?.data ?? response.data;
  },

  async getConversations() {
    const response = await api.get('/messages/conversations');
    return response.data?.data ?? response.data;
  },

  async getConversation(userId: string, limit = 50) {
    const response = await api.get(`/messages/conversation/${userId}`, { params: { limit } });
    return response.data?.data ?? response.data;
  },

  async markConversationAsRead(userId: string) {
    const response = await api.put(`/messages/conversation/${userId}/read`);
    return response.data?.data ?? response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/messages/unread-count');
    return response.data?.data ?? response.data;
  },

  /** Get the admin user's contact info so any user can start a support chat */
  async getAdminContact() {
    const response = await api.get('/api/users/admin-contact');
    return response.data?.data ?? response.data;
  },
};

export default messageService;
