import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/discussions`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const discussionService = {
  /** Get all discussion threads for a module.
   *  sort: 'recent' (newest first) | 'active' (most recently replied) */
  getModuleDiscussions: async (moduleId: string, sort: 'recent' | 'active' = 'recent') => {
    const response = await api.get(`/module/${moduleId}?sort=${sort}`);
    return response.data;
  },

  /** Get a single discussion thread with all replies. */
  getDiscussion: async (discussionId: string) => {
    const response = await api.get(`/${discussionId}`);
    return response.data;
  },

  /** Create a new discussion thread (instructor OR enrolled student). */
  createDiscussion: async (data: {
    moduleId: string;
    title: string;
    content: string;
    lessonTitle?: string;
  }) => {
    const response = await api.post('/', data);
    return response.data;
  },

  /** Add a reply to an existing discussion thread. */
  addReply: async (discussionId: string, content: string) => {
    const response = await api.post(`/${discussionId}/reply`, { content });
    return response.data;
  },

  /** Pin or unpin a discussion (instructor only). */
  pinDiscussion: async (discussionId: string) => {
    const response = await api.put(`/${discussionId}/pin`);
    return response.data;
  },

  /** Delete a discussion (creator or admin). */
  deleteDiscussion: async (discussionId: string) => {
    const response = await api.delete(`/${discussionId}`);
    return response.data;
  },

  /** Admin: get all discussions across the platform. */
  getAllDiscussions: async () => {
    const response = await api.get('/admin/all');
    return response.data;
  },
};

export default discussionService;
