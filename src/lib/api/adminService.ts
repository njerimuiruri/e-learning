import axios from 'axios';

// Admin API Service - Force rebuild
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/api/admin`,
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

const adminService = {
  // Users
  getAllUsers: async (filters: { role?: string | null; status?: string | null; page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/users', { params: filters });
    return data;
  },
  getUserById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
  activateUser: async (id: string) => {
    const { data } = await api.put(`/users/${id}/activate`);
    return data;
  },
  deactivateUser: async (id: string) => {
    const { data } = await api.put(`/users/${id}/deactivate`);
    return data;
  },
  deleteUser: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const { data } = await api.get('/stats');
    return data;
  },
  getPendingInstructors: async () => {
    const { data } = await api.get('/instructors/pending');
    return data;
  },
  getFellowsAtRisk: async () => {
    const { data } = await api.get('/fellows/at-risk');
    return data;
  },
  getRecentActivity: async (limit = 5, type?: string) => {
    const { data } = await api.get('/activity', { params: { limit, type } });
    return data;
  },

  // Instructors
  getAllInstructors: async (filters: { status?: string | null; page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/instructors', { params: filters });
    return data;
  },
  getInstructorDetails: async (id: string) => {
    const { data } = await api.get(`/instructors/${id}`);
    return data;
  },
  approveInstructor: async (id: string) => {
    const { data } = await api.put(`/instructors/${id}/approve`);
    return data;
  },
  rejectInstructor: async (id: string, reason: string) => {
    const { data } = await api.put(`/instructors/${id}/reject`, { reason });
    return data;
  },

  // Students
  getAllStudents: async (filters: { page?: number; limit?: number; search?: string } = {}) => {
    const { data } = await api.get('/students', { params: filters });
    return data;
  },
  getStudentById: async (id: string) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
  },
  createStudent: async (payload: any) => {
    const { data } = await api.post('/students', payload);
    return data;
  },
  deleteStudent: async (id: string) => {
    const { data } = await api.delete(`/students/${id}`);
    return data;
  },

  // Fellows
  getAllFellows: async (filters: { status?: string; page?: number; limit?: number; search?: string } = {}) => {
    const { data } = await api.get('/fellows', { params: filters });
    return data;
  },
  createFellow: async (payload: any) => {
    const { data } = await api.post('/fellows', payload);
    return data;
  },
  bulkCreateFellows: async (fellows: any[], sendEmails = false) => {
    const { data } = await api.post('/fellows/bulk', { fellows, sendEmails });
    return data;
  },
  updateFellow: async (id: string, updateData: any) => {
    const { data } = await api.put(`/fellows/${id}`, updateData);
    return data;
  },
  deleteFellow: async (id: string) => {
    const { data } = await api.delete(`/fellows/${id}`);
    return data;
  },
  sendBulkEmail: async (fellowIds: string[], subject: string, message: string, cc?: string[], bcc?: string[]) => {
    const { data } = await api.post('/fellows/bulk-email', { fellowIds, subject, message, cc, bcc });
    return data;
  },
  sendFellowInvitations: async (fellowIds: string[]) => {
    const { data } = await api.post('/fellows/send-invitations', { fellowIds });
    return data;
  },
  sendFellowReminder: async (id: string, message: string) => {
    const { data } = await api.post(`/fellows/${id}/send-reminder`, { message });
    return data;
  },

  // Fellow Progress Tracking
  getFellowProgressStats: async () => {
    const { data } = await api.get('/fellows/progress/stats');
    return data;
  },
  getFellowsProgress: async (filters: {
    status?: string;
    categoryId?: string;
    cohort?: string;
    risk?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const { data } = await api.get('/fellows/progress', { params: filters });
    return data;
  },
  getFellowProgressDetail: async (id: string) => {
    const { data } = await api.get(`/fellows/${id}/progress`);
    return data;
  },
  updateFellowProgressAction: async (
    id: string,
    action: 'allow_proceed' | 'deactivate' | 'mark_completed',
    note?: string,
  ) => {
    const { data } = await api.put(`/fellows/${id}/progress-action`, { action, note });
    return data;
  },

  // Courses
  getPendingCourses: async (filters: { page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/courses/pending', { params: filters });
    return data;
  },
  getAllCourses: async (filters: { status?: string | null; page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/courses', { params: filters });
    return data;
  },
  approveCourse: async (id: string, feedback?: string) => {
    const { data } = await api.put(`/courses/${id}/approve`, { feedback });
    return data;
  },
  rejectCourse: async (id: string, reason: string) => {
    const { data } = await api.put(`/courses/${id}/reject`, { reason });
    return data;
  },

  // Modules
  createModuleAsAdmin: async (payload: any) => {
    const { data } = await api.post('/modules', payload);
    return data;
  },
  getAllModules: async (filters: { status?: string | null; level?: string | null; category?: string | null; page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/modules', { params: filters });
    return data;
  },
  getPendingModules: async (filters: { page?: number; limit?: number } = {}) => {
    const { data } = await api.get('/modules/pending', { params: filters });
    return data;
  },
  getModuleDashboardStats: async () => {
    const { data } = await api.get('/modules/stats');
    return data;
  },
  getModuleById: async (id: string) => {
    const { data } = await api.get(`/modules/${id}`);
    return data;
  },
  approveModule: async (id: string) => {
    const { data } = await api.put(`/modules/${id}/approve`);
    return data;
  },
  publishModule: async (id: string) => {
    const { data } = await api.put(`/modules/${id}/publish`);
    return data;
  },
  rejectModule: async (id: string, reason: string) => {
    const { data } = await api.put(`/modules/${id}/reject`, { reason });
    return data;
  },
  updateModule: async (id: string, payload: any) => {
    const { data } = await api.put(`/modules/${id}`, payload);
    return data;
  },
  addModuleLesson: async (id: string, lessonData: any) => {
    const { data } = await api.post(`/modules/${id}/lessons`, lessonData);
    return data;
  },
  deleteModuleLesson: async (id: string, lessonIndex: number) => {
    const { data } = await api.delete(`/modules/${id}/lessons/${lessonIndex}`);
    return data;
  },
  deleteModule: async (id: string) => {
    const { data } = await api.delete(`/modules/${id}`);
    return data;
  },
  approveAssessment: async (id: string) => {
    const { data } = await api.put(`/modules/${id}/approve-assessment`);
    return data;
  },
  rejectAssessment: async (id: string, reason: string) => {
    const { data } = await api.put(`/modules/${id}/reject-assessment`, { reason });
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Email API — routed through /api/bulk-messaging (not /api/admin)
// ─────────────────────────────────────────────────────────────────────────────

const bulkEmailApi = axios.create({
  baseURL: `${API_URL}/bulk-messaging`,
});

bulkEmailApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type BulkEmailFilterType =
  | 'all_fellows'
  | 'by_category'
  | 'by_cohort'
  | 'all_students'
  | 'all_instructors'
  | 'manual';

export interface CcBccEntry { email: string; name?: string }
export interface BulkEmailAttachment { filename: string; url: string; mimeType: string; size?: number }

export interface PreviewRecipientsPayload {
  filterType: BulkEmailFilterType;
  filterCategoryIds?: string[];
  filterCohorts?: string[];
  manualUserIds?: string[];
}

export interface SendBulkEmailPayload extends PreviewRecipientsPayload {
  subject: string;
  body: string;
  cc?: CcBccEntry[];
  bcc?: CcBccEntry[];
  attachments?: BulkEmailAttachment[];
}

export const bulkEmailService = {
  /** Preview recipients before sending */
  previewRecipients: async (payload: PreviewRecipientsPayload) => {
    const { data } = await bulkEmailApi.post('/admin/bulk-email/preview-recipients', payload);
    return data;
  },

  /** Compose and send bulk email (starts background job) */
  send: async (payload: SendBulkEmailPayload) => {
    const { data } = await bulkEmailApi.post('/admin/bulk-email/send', payload);
    return data;
  },

  /** List all campaigns */
  getCampaigns: async (limit = 20, offset = 0) => {
    const { data } = await bulkEmailApi.get('/admin/bulk-email', { params: { limit, offset } });
    return data;
  },

  /** Get single campaign with per-recipient delivery status */
  getCampaign: async (id: string) => {
    const { data } = await bulkEmailApi.get(`/admin/bulk-email/${id}`);
    return data;
  },

  /** Upload an attachment and get back { url, filename, mimeType, size } */
  uploadAttachment: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await bulkEmailApi.post('/admin/bulk-email/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export default adminService;
