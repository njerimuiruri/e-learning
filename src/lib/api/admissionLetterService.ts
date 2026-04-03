import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

const api = axios.create({
  baseURL: `${API_URL}/api/admission-letters`,
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

export interface PdfTemplate {
  _id: string;
  name: string;
  pdfUrl: string;
  pdfPublicId: string;
  uploadedBy: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface FromEmail {
  _id: string;
  email: string;
  displayName: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Fellow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  fellowData?: {
    fellowId?: string;
    cohort?: string;
    fellowshipStatus?: string;
    track?: string;
    region?: string;
    assignedCategories?: string[];
  };
}

export interface SendLettersPayload {
  templateId: string;
  subject: string;
  bodyHtml?: string;
  fromEmail: string;
  fromName: string;
  ccEmails?: string[];
  recipientIds: string[];
  signOffName: string;
  signOffTitle: string;
}

export interface SendLog {
  _id: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  openedCount: number;
  acknowledgedCount: number;
  signOffName: string;
  signOffTitle: string;
  sentBy: { firstName: string; lastName: string; email: string };
  templateId: { name: string; pdfUrl: string };
  createdAt: string;
}

const admissionLetterService = {
  // PDF Templates
  listPdfs: async (): Promise<{ success: boolean; templates: PdfTemplate[] }> => {
    const { data } = await api.get('/pdfs');
    return data;
  },
  savePdf: async (payload: {
    name: string;
    pdfUrl: string;
    pdfPublicId: string;
  }): Promise<{ success: boolean; template: PdfTemplate }> => {
    const { data } = await api.post('/pdfs', payload);
    return data;
  },
  deletePdf: async (id: string) => {
    const { data } = await api.delete(`/pdfs/${id}`);
    return data;
  },

  // Sender Email Addresses
  listFromEmails: async (): Promise<{ success: boolean; emails: FromEmail[] }> => {
    const { data } = await api.get('/from-emails');
    return data;
  },
  addFromEmail: async (payload: {
    email: string;
    displayName: string;
    isDefault?: boolean;
  }) => {
    const { data } = await api.post('/from-emails', payload);
    return data;
  },
  removeFromEmail: async (id: string) => {
    const { data } = await api.delete(`/from-emails/${id}`);
    return data;
  },

  // Fellows for recipient selection
  getFellows: async (params?: {
    search?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    fellows: Fellow[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> => {
    const { data } = await api.get('/fellows', { params });
    return data;
  },

  // Send
  sendLetters: async (
    payload: SendLettersPayload,
  ): Promise<{
    success: boolean;
    message: string;
    sendId: string;
    totalRecipients: number;
  }> => {
    const { data } = await api.post('/send', payload);
    return data;
  },

  // Logs
  getLogs: async (params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    logs: SendLog[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> => {
    const { data } = await api.get('/logs', { params });
    return data;
  },
  getLogDetail: async (id: string) => {
    const { data } = await api.get(`/logs/${id}`);
    return data;
  },
};

export default admissionLetterService;
