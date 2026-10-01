/**
 * Authentication Service
 *
 * Every method talks to the real NestJS backend. There is no mock/simulated mode.
 *
 * The backend serves its routes under the global `/api` prefix, so each request
 * targets `<API_BASE_URL>/api/auth/<route>`.
 *
 * API_BASE_URL is the backend *origin*:
 *  - left unset, requests use relative `/api/...` URLs, which the Vite dev server
 *    proxies to the backend (the backend has no CORS enabled).
 *  - set VITE_API_BASE_URL to call a different origin directly instead.
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "";

const TOKEN_KEY = "evolv_auth_token";
const USER_KEY = "evolv_user";

/** The backend stores emails in mixed case on register/login but lowercases
 * them on the OTP routes, so the same address typed with different casing would
 * not match. Normalising here keeps every flow consistent. */
const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

/** class-validator returns `message` as an array of strings on a 400. */
const extractErrorMessage = (payload, fallback) => {
  const { message } = payload ?? {};
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string" && message.trim()) return message;
  return payload?.error || fallback;
};

const request = async (route, body) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `Request failed with status ${response.status}.`)
    );
  }

  return payload;
};

/** Maps the backend's `{ message, data }` envelope onto the flat shape the UI
 * already consumes. `token` is null when the backend issues no access token
 * (register and email-otp/verify only confirm the address). */
const toAuthResult = (payload) => {
  const data = payload?.data ?? null;
  return {
    message: payload?.message ?? "",
    user: data
      ? {
          id: data.id,
          name: data.name ?? null,
          email: data.email ?? null,
          emailVerified: data.emailVerified ?? null,
        }
      : null,
    token: data?.accessToken ?? null,
  };
};

const persistSession = ({ user, token }, rememberMe) => {
  const target = rememberMe ? localStorage : sessionStorage;
  const stale = rememberMe ? sessionStorage : localStorage;

  stale.removeItem(TOKEN_KEY);
  stale.removeItem(USER_KEY);
  target.setItem(TOKEN_KEY, token);
  target.setItem(USER_KEY, JSON.stringify(user));
};

/** Reads the claims out of a JWT payload without verifying it. The backend has
 * already signed the token, so this is only used to read `sub`. */
const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

export const authService = {
  /**
   * Login with Email and Password
   */
  async loginWithEmail(email, password, rememberMe = false) {
    const result = toAuthResult(await request("login", {
      email: normalizeEmail(email),
      password,
    }));

    persistSession(result, rememberMe);

    return result;
  },

  /**
   * Sign Up / Create Account
   * The backend does not issue a token here, so the caller must log in after.
   */
  async signup(name, email, password) {
    return toAuthResult(
      await request("register", {
        name: String(name ?? "").trim(),
        email: normalizeEmail(email),
        password,
      })
    );
  },

  /**
   * Request Email OTP
   */
  async sendEmailOTP(email) {
    return request("email-otp/send", { email: normalizeEmail(email) });
  },

  /**
   * Verify Email OTP
   * A valid OTP signs the user in, so the returned token is persisted.
   */
  async verifyEmailOTP(email, otp, rememberMe = true) {
    const result = toAuthResult(
      await request("email-otp/verify", {
        email: normalizeEmail(email),
        otp: String(otp ?? "").trim(),
      })
    );

    persistSession(result, rememberMe);

    return result;
  },

  /**
   * Forgot Password – Step 1
   * Asks the backend to generate a 6-digit OTP and email it to this address.
   */
  async forgotPassword(email) {
    return request("forgot-password", { email: normalizeEmail(email) });
  },

  /**
   * Forgot Password – Step 2
   * Verifies the OTP and stores the new password. The backend owns OTP
   * validity, expiry and hashing.
   */
  async resetPasswordWithOtp(email, otp, newPassword) {
    return request("reset-password", {
      email: normalizeEmail(email),
      otp: String(otp ?? "").trim(),
      newPassword,
    });
  },

  /**
   * Login with Google
   * Redirects to the backend OAuth entry point. No backend endpoint exists for
   * logging out, so logout is handled purely on the client.
   */
  async loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  },

  /**
   * Finish a Google sign-in.
   * The backend redirects back to /login with the access token in the query
   * string, so the session is persisted from there.
   */
  completeGoogleRedirect({ token, email, name }) {
    if (!token) throw new Error("Missing Google access token.");

    const claims = decodeJwt(token);

    if (!claims) throw new Error("Unreadable Google access token.");

    const user = {
      id: claims.sub,
      name: name || claims.name || null,
      email: email || claims.email || null,
    };

    persistSession({ user, token }, true);

    return user;
  },

  /**
   * Get Current Session User
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};