import api from './config';

export const noteService = {
  /**
   * Create a new note
   */
  async createNote(noteData: {
    courseId: string;
    courseName: string;
    lessonName: string;
    content: string;
    moduleIndex?: number;
    moduleName?: string;
    lessonIndex?: number;
  }) {
    try {
      const response = await api.post('/notes', noteData);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create note');
    }
  },

  /**
   * Get all notes for the student
   */
  async getAllNotes() {
    try {
      const response = await api.get('/notes');
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notes');
    }
  },

  /**
   * Get notes grouped by course
   */
  async getNotesGroupedByCourse() {
    try {
      const response = await api.get('/notes/grouped');
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch grouped notes');
    }
  },

  /**
   * Get notes for a specific course
   */
  async getCourseNotes(courseId: string) {
    try {
      const response = await api.get(`/notes/course/${courseId}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch course notes');
    }
  },

  /**
   * Get a single note
   */
  async getNote(noteId: string) {
    try {
      const response = await api.get(`/notes/${noteId}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch note');
    }
  },

  /**
   * Update a note
   */
  async updateNote(noteId: string, updateData: { content: string; category?: string; tags?: string[] }) {
    try {
      const response = await api.put(`/notes/${noteId}`, updateData);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update note');
    }
  },

  /**
   * Delete a note
   */
  async deleteNote(noteId: string) {
    try {
      const response = await api.delete(`/notes/${noteId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete note');
    }
  },

  /**
   * Toggle bookmark on a note
   */
  async toggleBookmark(noteId: string) {
    try {
      const response = await api.put(`/notes/${noteId}/toggle-bookmark`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle bookmark');
    }
  },

  /**
   * Search notes
   */
  async searchNotes(keyword: string) {
    try {
      const response = await api.get(`/notes/search/${encodeURIComponent(keyword)}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search notes');
    }
  },

  /**
   * Get bookmarked notes
   */
  async getBookmarkedNotes() {
    try {
      const response = await api.get('/notes/bookmarked');
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch bookmarked notes');
    }
  },
};

export default noteService;
