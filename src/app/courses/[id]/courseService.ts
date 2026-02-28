import api from './api';

/**
 * Confirms the purchase of a course by sending payment details to the backend.
 * This is called from the checkout page after a successful (mock) payment.
 *
 * @param {string} courseId - The ID of the course being purchased.
 * @param {object} paymentData - An object containing payment information.
 * @param {string} paymentData.paymentToken - The token/ID from the payment gateway (e.g., a Stripe transaction ID).
 * @returns {Promise<any>} The response from the server, confirming enrollment.
 */
const confirmPurchase = async (courseId, paymentData) => {
    // The backend expects a body with both courseId and paymentToken.
    const payload = {
        courseId,
        paymentToken: paymentData.paymentToken,
    };
    // Make a POST request to the secure endpoint.
    const response = await api.post('/checkout/confirm-payment', payload);
    return response.data;
};

/**
 * Fetches the details for a single course.
 */
const getCourseById = async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
};

/**
 * Checks if the current user is already enrolled in a specific course.
 * This will return a 404 if not enrolled, which is handled in the checkout page.
 */
const getEnrollment = async (courseId) => {
    const response = await api.get(`/enrollments/course/${courseId}`);
    return response.data;
};

const courseService = {
    confirmPurchase,
    getCourseById,
    getEnrollment,
};

export default courseService;