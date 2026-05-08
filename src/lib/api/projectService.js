import api from "./config";

const projectService = {
  // Student: submit a new project (multipart)
  submitProject: async (formData) => {
    const { data } = await api.post("/api/projects", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return data;
  },

  // Student: get my submissions
  getMySubmissions: async () => {
    const { data } = await api.get("/api/projects/my");
    return data;
  },

  // Student: update a pending submission (JSON body)
  updateSubmission: async (id, payload) => {
    const { data } = await api.put(`/api/projects/${id}`, payload);
    return data;
  },

  // Student/Fellow: get admin-uploaded resources visible to me
  getAdminResources: async () => {
    const { data } = await api.get("/api/projects/admin-resources");
    return data;
  },

  // Public: get community (approved, student-submitted) projects
  getCommunityProjects: async (params = {}) => {
    const { data } = await api.get("/api/projects", { params });
    return data;
  },

  // Student: rate a project
  rateProject: async (id, rating) => {
    const { data } = await api.post(`/api/projects/${id}/rate`, { rating });
    return data;
  },

  // Student: delete pending submission
  deleteSubmission: async (id) => {
    const { data } = await api.delete(`/api/projects/${id}`);
    return data;
  },

  // Admin: upload a resource for fellows
  adminUploadResource: async (formData) => {
    const { data } = await api.post("/api/admin/projects/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return data;
  },

  // Admin: get all submissions with optional filters
  getAdminSubmissions: async (params = {}) => {
    const { data } = await api.get("/api/admin/projects", { params });
    return data;
  },

  // Admin: approve a project
  approveProject: async (id, feedback = "") => {
    const { data } = await api.put(`/api/admin/projects/${id}/approve`, { feedback });
    return data;
  },

  // Admin: reject a project
  rejectProject: async (id, feedback = "") => {
    const { data } = await api.put(`/api/admin/projects/${id}/reject`, { feedback });
    return data;
  },

  // Admin: send feedback comment to student
  addFeedback: async (id, comment) => {
    const { data } = await api.post(`/api/admin/projects/${id}/feedback`, { comment });
    return data;
  },

  // Admin: delete a resource
  adminDeleteResource: async (id) => {
    const { data } = await api.delete(`/api/admin/projects/${id}`);
    return data;
  },
};

export default projectService;
