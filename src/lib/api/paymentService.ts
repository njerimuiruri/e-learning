import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api/payments`,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface PaymentInitializationResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  amount: number;
  paymentId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  paymentId?: string;
  categoryId?: string;
  courseId?: string;
  amount?: number;
  status?: string;
}

export interface CourseAccessCheckResponse {
  allowed: boolean;
  requiresPayment: boolean;
  categoryId?: string;
  price?: number;
  reason?: string;
}

const paymentService = {
  /**
   * Initialize a Paystack payment for a course
   * @param courseId - ID of the course to purchase
   * @returns Payment initialization data with authorization URL
   */
  initializePayment: async (courseId: string, paymentType?: 'local' | 'international'): Promise<PaymentInitializationResponse> => {
    const { data } = await api.post('/initialize', { courseId, paymentType });
    return data;
  },

  /**
   * Verify a Paystack payment after completion
   * @param reference - Paystack transaction reference
   * @returns Payment verification result
   */
  verifyPayment: async (reference: string): Promise<PaymentVerificationResponse> => {
    const { data } = await api.get(`/verify/${reference}`);
    return data;
  },

  /**
   * Check if user can access a course and if payment is required
   * @param courseId - ID of the course to check
   * @returns Access status and payment requirement
   */
  checkCourseAccess: async (courseId: string): Promise<CourseAccessCheckResponse> => {
    const { data } = await api.get(`/check-access/${courseId}`);
    return data;
  },

  /**
   * Check payment status for a specific course
   * @param courseId - ID of the course
   * @returns Payment status information
   */
  checkPaymentStatus: async (courseId: string) => {
    const { data } = await api.get(`/status/${courseId}`);
    return data;
  },

  /**
   * Get user's payment history
   * @returns List of user's payments
   */
  getMyPayments: async () => {
    const { data } = await api.get('/my-payments');
    return data;
  },

  /**
   * Get payment details by ID
   * @param paymentId - Payment ID
   * @returns Payment details
   */
  getPaymentById: async (paymentId: string) => {
    const { data } = await api.get(`/${paymentId}`);
    return data;
  },

  /**
   * Initialize a Paystack payment for a module (category-level access)
   * @param moduleId - ID of the module to purchase access for
   * @returns Payment initialization data with authorization URL
   */
  initializeModulePayment: async (moduleId: string, paymentType?: 'local' | 'international'): Promise<PaymentInitializationResponse> => {
    const { data } = await api.post('/module/initialize', { moduleId, paymentType });
    return data;
  },

  /**
   * Check payment/access status for a specific module's category
   * @param moduleId - ID of the module
   * @returns Payment status: { hasPaid: boolean, status: string }
   */
  checkModulePaymentStatus: async (moduleId: string) => {
    const { data } = await api.get(`/module/status/${moduleId}`);
    return data;
  },

  /**
   * Redirect user to Paystack payment page
   * @param authorizationUrl - Paystack authorization URL
   */
  redirectToPaystack: (authorizationUrl: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = authorizationUrl;
    }
  },
};

export default paymentService;
