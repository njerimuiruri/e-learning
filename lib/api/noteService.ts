import { API_BASE_URL } from './config';

const NOTES_API = `${API_BASE_URL}/notes`;

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
    const response = await fetch(NOTES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(noteData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create note');
    }
    return data.data;
  },

  /**
   * Get all notes for the student
   */
  async getAllNotes() {
    const response = await fetch(NOTES_API, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch notes');
    }
    return data.data;
  },

  /**
   * Get notes grouped by course
   */
  async getNotesGroupedByCourse() {
    const response = await fetch(`${NOTES_API}/grouped`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch grouped notes');
    }
    return data.data;
  },

  /**
   * Get notes for a specific course
   */
  async getCourseNotes(courseId: string) {
    const response = await fetch(`${NOTES_API}/course/${courseId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch course notes');
    }
    return data.data;
  },

  /**
   * Get a single note
   */
  async getNote(noteId: string) {
    const response = await fetch(`${NOTES_API}/${noteId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch note');
    }
    return data.data;
  },

  /**
   * Update a note
   */
  async updateNote(noteId: string, updateData: { content: string; category?: string; tags?: string[] }) {
    const response = await fetch(`${NOTES_API}/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update note');
    }
    return data.data;
  },

  /**
   * Delete a note
   */
  async deleteNote(noteId: string) {
    const response = await fetch(`${NOTES_API}/${noteId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete note');
    }
    return data;
  },

  /**
   * Toggle bookmark on a note
   */
  async toggleBookmark(noteId: string) {
    const response = await fetch(`${NOTES_API}/${noteId}/toggle-bookmark`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to toggle bookmark');
    }
    return data.data;
  },

  /**
   * Search notes
   */
  async searchNotes(keyword: string) {
    const response = await fetch(`${NOTES_API}/search/${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to search notes');
    }
    return data.data;
  },

  /**
   * Get bookmarked notes
   */
  async getBookmarkedNotes() {
    const response = await fetch(`${NOTES_API}/bookmarked`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bookmarked notes');
    }
    return data.data;
  },
};

export default noteService;
