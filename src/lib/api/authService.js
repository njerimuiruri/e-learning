import api from "./config";

class AuthService {
  /**
   * Helper to set cookie
   */
  setCookie(name, value, days = 1) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieString = `${name}=${encodeURIComponent(
      value
    )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookieString;
  }

  /**
   * Helper to get cookie value
   */
  getCookie(name) {
    if (typeof document === "undefined") return null;

    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  }

  /**
   * Helper to delete cookie
   */
  deleteCookie(name) {
    this.setCookie(name, "", -1);
  }

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
        organization: data.organization || "",
        otherOrganization: data.otherOrganization || "",
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
      formData.append("country", data.country || "");
      formData.append("organization", data.organization || "");
      formData.append("otherOrganization", data.otherOrganization || "");
      formData.append("institution", data.institution);
      formData.append("bio", data.bio);
      formData.append("qualifications", data.qualifications);
      formData.append("expertise", data.expertise);
      formData.append("linkedIn", data.linkedIn || "");
      formData.append("portfolio", data.portfolio || "");
      formData.append("teachingExperience", data.teachingExperience);
      formData.append("yearsOfExperience", data.yearsOfExperience);
      formData.append("role", "instructor");

      // Add profile picture if provided
      if (data.profilePicture) {
        formData.append("profilePicture", data.profilePicture);
      }

      // Add CV file (required for instructors)
      if (data.cv) {
        formData.append("cv", data.cv);
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

      // Cookies are automatically set by the backend
      // Persist token and user to localStorage so axios can attach Authorization
      if (typeof window !== "undefined") {
        if (response.data.token) {
          window.localStorage.setItem("token", response.data.token);
        }
        if (response.data.user) {
          window.localStorage.setItem(
            "user",
            JSON.stringify(response.data.user)
          );
        }
      }

      // Also store user in a non-httpOnly cookie for convenience
      if (response.data.user) {
        this.setCookie("user", JSON.stringify(response.data.user), 1);
      }

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  }

  /**
   * Google OAuth login
   * @param {Object} data - Google login data with idToken
   * @returns {Promise<Object>} Login response with token and user
   */
  async googleLogin(data) {
    try {
      const response = await api.post("/api/auth/google", {
        idToken: data.idToken,
        role: data.role || "student",
      });

      // Cookies are automatically set by the backend
      // Store user data in a non-httpOnly cookie for client-side access
      if (response.data.user) {
        this.setCookie("user", JSON.stringify(response.data.user), 1);
      }

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Google login failed");
    }
  }

  /**
   * Logout user - Notify backend and clear all stored data
   */
  logout() {
    // Clear cookies immediately and synchronously
    this.deleteCookie("user");
    this.deleteCookie("token");

    // Also clear using the most aggressive method to ensure cookies are gone
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Clear localStorage (for any other stored data)
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("studentProgress");
      localStorage.removeItem("courseData");
      localStorage.removeItem("pendingEnrollment");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    // Notify backend asynchronously (don't block)
    api.post("/api/auth/logout").catch((err) => {
      console.error("Error notifying backend of logout:", err);
    });

    console.log("User logged out successfully");
  }

  /**
   * Get current user from cookie
   * @returns {Object|null} User object or null
   */
  getCurrentUser() {
    const userCookie = this.getCookie("user");
    if (userCookie) {
      try {
        return JSON.parse(userCookie);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  }

  /**
   * Update current user in cookie
   * @param {Object} userData - Updated user data
   */
  updateCurrentUser(userData) {
    try {
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...userData };
      this.setCookie("user", JSON.stringify(updatedUser), 1);
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

      // Update cookie with fresh data
      if (response.data.user) {
        this.setCookie("user", JSON.stringify(response.data.user), 1);
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
   * @returns {boolean} True if token cookie exists
   */
  isAuthenticated() {
    // Check if user cookie exists (token is httpOnly and can't be accessed from JS)
    return !!this.getCookie("user");
  }

  /**
   * Get user token (for API requests, token is sent via cookies automatically)
   * @returns {string|null} JWT token or null
   */
  getToken() {
    // Token is stored in httpOnly cookie and sent automatically
    // We can't access it from JavaScript, but axios will send it
    return this.getCookie("token") || null;
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

      // Update cookie with new photo URL
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

      // Update cookie
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

  /**
   * Change user password
   * @param {Object} data - Password change data
   * @returns {Promise<Object>} Response data
   */
  async changePassword(data) {
    try {
      const response = await api.put("/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.newPassword, // Backend expects confirmPassword
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to change password"
      );
    }
  }
}

// Export a single instance
export default new AuthService();
