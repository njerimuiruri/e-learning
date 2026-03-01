import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/module-enrollments`,
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

const moduleEnrollmentService = {
  async enrollInModule(moduleId) {
    const response = await api.post(`/modules/${moduleId}/enroll`);
    return response.data;
  },

  async getMyEnrollments() {
    const response = await api.get('/my-enrollments');
    return response.data;
  },

  async getMyEnrollmentForModule(moduleId) {
    const response = await api.get(`/modules/${moduleId}/my-enrollment`);
    return response.data;
  },

  async getEnrollmentById(enrollmentId) {
    const response = await api.get(`/${enrollmentId}`);
    return response.data;
  },

  async completeLesson(enrollmentId, lessonIndex) {
    const response = await api.put(`/${enrollmentId}/lessons/${lessonIndex}/complete`);
    return response.data;
  },

  async submitLessonAssessment(enrollmentId, lessonIndex, answers) {
    const response = await api.post(`/${enrollmentId}/lessons/${lessonIndex}/assessment`, { answers });
    return response.data;
  },

  async submitFinalAssessment(enrollmentId, answers) {
    const response = await api.post(`/${enrollmentId}/final-assessment`, { answers });
    return response.data;
  },

  // Instructor: get all submissions for their modules
  async getInstructorSubmissions(params: {
    moduleId?: string;
    submissionType?: 'essay' | 'mcq' | 'all';
    status?: 'pending' | 'passed' | 'failed' | 'all';
  } = {}) {
    const response = await api.get('/instructor/submissions', { params });
    return response.data;
  },

  // Instructor: list their assigned modules (for filter dropdown)
  async getInstructorModulesList() {
    const response = await api.get('/instructor/modules');
    return response.data;
  },

  // Instructor: grade an essay submission (Pass/Fail + feedback)
  async gradeEssay(enrollmentId: string, body: { pass: boolean; feedback: string; score?: number }) {
    const response = await api.post(`/${enrollmentId}/grade-essay`, body);
    return response.data;
  },
};

export default moduleEnrollmentService;
