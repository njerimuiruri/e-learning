import api from "./config";

class AuthService {
  /**
   * Register a student
   * @param {Object} data - Student registration data
   * @returns {Promise<Object>} Registration response
   */
  async registerStudent(data) {
    try {
      const response = await api.post("/api/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: "student",
        country: data.country || "",
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Student registration failed"
      );
    }
  }

  /**
   * Register an instructor
   * @param {Object} data - Instructor registration data with files
   * @returns {Promise<Object>} Registration response
   */
  async registerInstructor(data) {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("institution", data.institution);
      formData.append("bio", data.bio);
      formData.append("role", "instructor");

      // Add optional country
      if (data.country) {
        formData.append("country", data.country);
      }

      // Add profile image if provided
      if (data.profileImage) {
        formData.append("profileImage", data.profileImage);
      }

      // Add CV file (required for instructors)
      if (data.cvFile) {
        formData.append("cvFile", data.cvFile);
      }

      const response = await api.post("/api/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Instructor registration failed"
      );
    }
  }

  /**
   * Login user
   * @param {Object} data - Login credentials
   * @returns {Promise<Object>} Login response with token and user
   */
  async login(data) {
    try {
      const response = await api.post("/api/auth/login", {
        email: data.email,
        password: data.password,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  }

  /**
   * Logout user - Clear all stored data
   */
  logout() {
    try {
      // Clear localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Clear sessionStorage
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Clear any other stored data
      localStorage.removeItem("studentProgress");
      localStorage.removeItem("courseData");

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  /**
   * Get current user from localStorage
   * @returns {Object|null} User object or null
   */
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Update current user in localStorage
   * @param {Object} userData - Updated user data
   */
  updateCurrentUser(userData) {
    try {
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error("Error updating user data:", error);
      return null;
    }
  }

  /**
   * Fetch current user profile from backend
   * @returns {Promise<Object>} User profile data
   */
  async fetchUserProfile() {
    try {
      const response = await api.get("/api/auth/me");

      // Update localStorage with fresh data
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data.user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch user profile"
      );
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if token exists
   */
  isAuthenticated() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return !!token;
  }

  /**
   * Get user token
   * @returns {string|null} JWT token or null
   */
  getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  /**
   * Get user role
   * @returns {string|null} User role (student/instructor/admin) or null
   */
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Verify token validity
   * @returns {Promise<boolean>} True if token is valid
   */
  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) return false;

      await this.fetchUserProfile();
      return true;
    } catch (error) {
      console.error("Token verification failed:", error);
      // Clear invalid token
      this.logout();
      return false;
    }
  }

  /**
   * Upload user profile photo
   * @param {File} file - Image file
   * @returns {Promise<Object>} Updated user data
   */
  async uploadProfilePhoto(file) {
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await api.post("/api/auth/upload-photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update localStorage with new photo URL
      if (response.data.user) {
        this.updateCurrentUser({
          profilePhotoUrl: response.data.user.profilePhotoUrl,
        });
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to upload photo"
      );
    }
  }

  /**
   * Update user profile
   * @param {Object} data - Profile data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(data) {
    try {
      const response = await api.put("/api/auth/profile", data);

      // Update localStorage
      if (response.data.user) {
        this.updateCurrentUser(response.data.user);
      }

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }
}

// Export a single instance
export default new AuthService();
