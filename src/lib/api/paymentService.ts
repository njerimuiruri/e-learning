import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';

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
  moduleId?: string;
  amount?: number;
  status?: string;
  requiresStudentVerification?: boolean;
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
   */
  initializeModulePayment: async (moduleId: string, paymentType?: 'local' | 'international'): Promise<PaymentInitializationResponse> => {
    const { data } = await api.post('/module/initialize', { moduleId, paymentType });
    return data;
  },

  /**
   * Initialize payment with tier selection (student/non-student)
   */
  initializeModulePaymentWithTier: async (
    moduleId: string,
    userTier: 'student' | 'non-student',
    paymentType?: 'local' | 'international',
  ): Promise<PaymentInitializationResponse & { isStudentPrice: boolean; userTier: string }> => {
    const { data } = await api.post('/module/initialize', { moduleId, userTier, paymentType });
    return data;
  },

  /**
   * Get tiered pricing info for a category
   */
  getCategoryPricing: async (categoryId: string) => {
    const { data } = await api.get(`/category-pricing/${categoryId}`);
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
   * Initialize a Paystack payment directly for a category (no module required)
   * Used by the Arin Publishing Academy page
   */
  initializeCategoryPayment: async (
    categoryId: string,
    userTier: 'student' | 'non-student',
    paymentOption: 'full' | 'installment1' | 'installment2',
    paymentType?: 'local' | 'international',
  ) => {
    const { data } = await api.post('/category/initialize', {
      categoryId,
      userTier,
      paymentOption,
      paymentType,
    });
    return data;
  },

  /**
   * Check access/payment status for a category directly
   */
  checkCategoryStatus: async (categoryId: string) => {
    const { data } = await api.get(`/category/status/${categoryId}`);
    return data;
  },

  /**
   * Admin: get all payments for a specific category
   */
  adminGetCategoryPayments: async (categoryId: string, page = 1, limit = 50) => {
    const { data } = await api.get(`/admin/category/${categoryId}`, { params: { page, limit } });
    return data;
  },

  /**
   * Admin: get all payments across all categories
   */
  adminGetAllPayments: async (page = 1, limit = 50, status?: string) => {
    const { data } = await api.get('/admin/all', { params: { page, limit, status } });
    return data;
  },

  /**
   * Admin: get installment overview for a category
   */
  adminGetInstallmentOverview: async (categoryId: string) => {
    const { data } = await api.get(`/admin/category/${categoryId}/installments`);
    return data;
  },

  /**
   * Admin: send installment 2 reminder emails
   */
  adminSendInstallment2Reminders: async (categoryId: string) => {
    const { data } = await api.post(`/admin/category/${categoryId}/send-installment2-reminders`);
    return data;
  },

  /**
   * Admin: look up a user by email — returns their category associations and
   * Publishing Academy payment status.
   */
  adminLookupUserCategories: async (email: string) => {
    const { data } = await api.get('/admin/user-lookup', { params: { email } });
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
