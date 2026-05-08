import api from './config';

export type ContextType = 'module' | 'lesson' | 'essay' | 'progress' | 'assessment' | 'general';

export interface MessageContext {
  type: ContextType;
  referenceId?: string;
  title: string;
  metadata?: Record<string, unknown>;
}

export interface MessagePayload {
  receiverId: string;
  content: string;
  context?: MessageContext;
  // legacy compat fields
  courseId?: string;
  moduleIndex?: number;
}

const messageService = {
  async sendMessage(payload: MessagePayload) {
    const response = await api.post('/messages', payload);
    return response.data?.data ?? response.data;
  },

  async getConversations() {
    const response = await api.get('/messages/conversations');
    return response.data?.data ?? response.data;
  },

  async getConversation(userId: string, limit = 100) {
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

  async getAdminContact() {
    const response = await api.get('/api/users/admin-contact');
    return response.data?.data ?? response.data;
  },

  // Instructor: list/search students available for direct messaging
  async getStudentsForMessaging(search?: string) {
    const extra = search ? { search, q: search } : {};
    const params = { limit: 50, ...extra };
    try {
      const response = await api.get('/messages/students', { params });
      const raw = response.data?.data ?? response.data;
      return Array.isArray(raw) ? raw : (raw?.users ?? raw?.data ?? []);
    } catch {
      try {
        const response = await api.get('/api/admin/users', { params: { role: 'student', ...params } });
        const raw = response.data?.data ?? response.data;
        return Array.isArray(raw) ? raw : (raw?.users ?? raw?.data ?? []);
      } catch {
        try {
          const response = await api.get('/api/admin/fellows', { params });
          const raw = response.data?.data ?? response.data;
          return Array.isArray(raw) ? raw : (raw?.fellows ?? raw?.users ?? raw?.data ?? []);
        } catch {
          return [];
        }
      }
    }
  },

  // Admin: see ALL conversations platform-wide (oversight)
  async adminGetAllConversations() {
    const response = await api.get('/messages/admin/all-conversations');
    return response.data?.data ?? response.data;
  },

  // Admin: read all messages between two specific users (oversight)
  async adminGetConversation(user1Id: string, user2Id: string, limit = 100) {
    const response = await api.get('/messages/admin/conversation', {
      params: { user1Id, user2Id, limit },
    });
    return response.data?.data ?? response.data;
  },
};

export default messageService;
