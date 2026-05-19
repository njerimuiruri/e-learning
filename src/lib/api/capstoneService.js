import api from "./config";

const capstoneService = {
  // ─── Student ────────────────────────────────────────────────────────────────

  /** Get the student's own capstone record (latest / most recent) */
  getMyCapstone: async () => {
    const { data } = await api.get("/api/capstone/my");
    return data;
  },

  /** Submit the initial capstone proposal (multipart) */
  submitProposal: async (formData) => {
    const { data } = await api.post("/api/capstone", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return data;
  },

  /** Resubmit after a revision request (multipart) */
  resubmitRevision: async (id, formData) => {
    const { data } = await api.put(`/api/capstone/${id}/resubmit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return data;
  },

  /** Upload implementation files once the proposal is approved (multipart) */
  submitImplementation: async (id, formData) => {
    const { data } = await api.put(`/api/capstone/${id}/implementation`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return data;
  },

  // ─── Instructor / Admin ─────────────────────────────────────────────────────

  /** List all capstone submissions (with optional filters: status, search, page) */
  getAllCapstones: async (params = {}) => {
    const { data } = await api.get("/api/capstone/admin", { params });
    return data;
  },

  /** Get a single capstone record by ID */
  getCapstoneById: async (id) => {
    const { data } = await api.get(`/api/capstone/${id}`);
    return data;
  },

  /** Approve the capstone proposal, unlocking the implementation stage */
  approveProposal: async (id, comment = "") => {
    const { data } = await api.put(`/api/capstone/${id}/approve`, { comment });
    return data;
  },

  /** Request revision — student must resubmit (counts against their 2 attempts) */
  requestRevision: async (id, comment) => {
    const { data } = await api.put(`/api/capstone/${id}/revision`, { comment });
    return data;
  },

  /** Outright reject the capstone */
  rejectCapstone: async (id, comment = "") => {
    const { data } = await api.put(`/api/capstone/${id}/reject`, { comment });
    return data;
  },

  /** Add an inline comment / feedback to any stage without changing status */
  addComment: async (id, comment) => {
    const { data } = await api.post(`/api/capstone/${id}/comment`, { comment });
    return data;
  },

  /**
   * Grade the final implementation.
   * @param {string} id - Capstone record ID
   * @param {{ grade: number, feedback: string, passed: boolean }} payload
   */
  gradeCapstone: async (id, payload) => {
    const { data } = await api.put(`/api/capstone/${id}/grade`, payload);
    return data;
  },

  /** Student withdraws (deletes) their own submission — only allowed when pending/revision */
  withdrawCapstone: async (id) => {
    const { data } = await api.delete(`/api/capstone/${id}`);
    return data;
  },

  /** Instructor/admin force-deletes any capstone submission */
  forceDeleteCapstone: async (id) => {
    const { data } = await api.delete(`/api/capstone/${id}/force`);
    return data;
  },
};

export default capstoneService;
