import axios from 'axios';
export { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';
import { resolveAssetUrl } from '@/lib/utils/resolveAssetUrl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const uploadService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Images are embedded as <img src> in HTML content so must be absolute
    return resolveAssetUrl(response.data.url);
  },

  uploadVideo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Videos go to Cloudinary — already a full URL
    return response.data.url;
  },

  uploadDocument: async (file: File): Promise<{ url: string; originalName: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      url: response.data.url, // relative path; resolve with resolveAssetUrl() at display time
      originalName: response.data.originalName || file.name,
    };
  },
};

export default uploadService;
