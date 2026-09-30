/**
 * Authentication Service Abstraction
 * Supports Email Login, Phone OTP Login, Email OTP Login, Google Login, Sign Up, and Password Reset.
 * Can be connected to a live backend API by configuring API_BASE_URL.
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || null;

// Helper to simulate API call delay when backend is not connected
const mockApiCall = (data, shouldFail = false, errorMessage = "Authentication failed", delay = 1000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(errorMessage));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

export const authService = {
  /**
   * Login with Email and Password
   */
  async loginWithEmail(email, password, rememberMe = false) {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to log in with email.");
      }
      const data = await response.json();
      if (rememberMe) {
        localStorage.setItem("evolv_auth_token", data.token);
        localStorage.setItem("evolv_user", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("evolv_auth_token", data.token);
        sessionStorage.setItem("evolv_user", JSON.stringify(data.user));
      }
      return data;
    }

    // Simulated Authentication Flow
    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const mockUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name: email.split("@")[0].replace(".", " "),
      email: email,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + email,
    };
    const token = "jwt_mock_token_" + Date.now();

    const result = { user: mockUser, token };

    if (rememberMe) {
      localStorage.setItem("evolv_auth_token", token);
      localStorage.setItem("evolv_user", JSON.stringify(mockUser));
    } else {
      sessionStorage.setItem("evolv_auth_token", token);
      sessionStorage.setItem("evolv_user", JSON.stringify(mockUser));
    }

    return mockApiCall(result, false, "", 1200);
  },

  /**
   * Request OTP for Phone Authentication
   */
  async sendPhoneOTP(countryCode, phoneNumber) {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, phoneNumber }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send Phone OTP.");
      }
      return await response.json();
    }

    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 7) {
      throw new Error("Please enter a valid phone number.");
    }

    return mockApiCall(
      { success: true, message: `OTP sent to ${countryCode} ${phoneNumber}` },
      false,
      "",
      1000
    );
  },

  /**
   * Verify Phone OTP
   */
  async verifyPhoneOTP(countryCode, phoneNumber, otp) {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, phoneNumber, otp }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Invalid OTP code.");
      }
      const data = await response.json();
      localStorage.setItem("evolv_auth_token", data.token);
      localStorage.setItem("evolv_user", JSON.stringify(data.user));
      return data;
    }

    if (!otp || otp.length < 4) {
      throw new Error("Please enter the complete 6-digit OTP.");
    }

    // Allow '123456' or any 6-digit code for testing
    if (otp === "000000") {
      return mockApiCall(null, true, "Invalid OTP code. Please try again.", 800);
    }

    const mockUser = {
      id: "usr_phone_" + Math.random().toString(36).substr(2, 9),
      name: `User ${phoneNumber.slice(-4)}`,
      phone: `${countryCode} ${phoneNumber}`,
    };
    const token = "jwt_mock_phone_token_" + Date.now();

    localStorage.setItem("evolv_auth_token", token);
    localStorage.setItem("evolv_user", JSON.stringify(mockUser));

    return mockApiCall({ user: mockUser, token }, false, "", 1200);
  },

  /**
   * Request Email OTP
   */
  async sendEmailOTP(email) {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send Email OTP.");
      }
      return await response.json();
    }

    if (!email || !email.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }

    return mockApiCall(
      { success: true, message: `OTP sent to ${email}` },
      false,
      "",
      1000
    );
  },

  /**
   * Verify Email OTP
   */
  async verifyEmailOTP(email, otp) {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Invalid OTP code.");
      }
      const data = await response.json();
      localStorage.setItem("evolv_auth_token", data.token);
      localStorage.setItem("evolv_user", JSON.stringify(data.user));
      return data;
    }

    if (!otp || otp.length < 4) {
      throw new Error("Please enter the complete 6-digit OTP.");
    }

    const mockUser = {
      id: "usr_email_otp_" + Math.random().toString(36).substr(2, 9),
      name: email.split("@")[0],
      email: email,
    };
    const token = "jwt_mock_email_otp_token_" + Date.now();

    localStorage.setItem("evolv_auth_token", token);
    localStorage.setItem("evolv_user", JSON.stringify(mockUser));

    return mockApiCall({ user: mockUser, token }, false, "", 1200);
  },

  /**
   * Login with Google
   */
  async loginWithGoogle() {
    if (API_BASE_URL) {
      // Integration point for Google OAuth redirect or Google One Tap / Identity Services
      window.location.href = `${API_BASE_URL}/api/auth/google`;
      return;
    }

    // Simulated Google OAuth Flow
    const mockUser = {
      id: "usr_google_108472918",
      name: "Google User",
      email: "user.google@gmail.com",
      avatar: "https://lh3.googleusercontent.com/a/default-user",
    };
    const token = "jwt_mock_google_token_" + Date.now();

    localStorage.setItem("evolv_auth_token", token);
    localStorage.setItem("evolv_user", JSON.stringify(mockUser));

    return mockApiCall({ user: mockUser, token }, false, "", 1500);
  },

  /**
   * Sign Up / Create Account
   */
  async signup(name, email, password) {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Registration failed.");
      }
      const data = await response.json();
      localStorage.setItem("evolv_auth_token", data.token);
      localStorage.setItem("evolv_user", JSON.stringify(data.user));
      return data;
    }

    if (!name || !email || !password) {
      throw new Error("All fields are required.");
    }

    const mockUser = {
      id: "usr_new_" + Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
    };
    const token = "jwt_mock_signup_token_" + Date.now();

    localStorage.setItem("evolv_auth_token", token);
    localStorage.setItem("evolv_user", JSON.stringify(mockUser));

    return mockApiCall({ user: mockUser, token }, false, "", 1200);
  },

  /**
   * Send Password Reset Link
   */
  async resetPassword(email) {
    if (API_BASE_URL) {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send reset link.");
      }
      return await response.json();
    }

    if (!email || !email.includes("@")) {
      throw new Error("Please enter a valid email address.");
    }

    return mockApiCall(
      { success: true, message: `Password reset instructions sent to ${email}` },
      false,
      "",
      1000
    );
  },

  /**
   * Get Current Session User
   */
  getCurrentUser() {
    const userStr = localStorage.getItem("evolv_user") || sessionStorage.getItem("evolv_user");
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem("evolv_auth_token");
    localStorage.removeItem("evolv_user");
    sessionStorage.removeItem("evolv_auth_token");
    sessionStorage.removeItem("evolv_user");
  },
};
