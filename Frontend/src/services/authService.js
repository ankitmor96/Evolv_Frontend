const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TOKEN_KEY = "evolv_auth_token";
const USER_KEY = "evolv_user";
const DRAFT_KEY = "evolve-onboarding-draft";
const DRAFT_OWNER_KEY = "evolve-onboarding-draft-owner";
import { fetchProfileOnce } from "./profileFetch.js";

const clearOnboardingDraft = () => {
  localStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(DRAFT_OWNER_KEY);
};

/** The backend stores emails in mixed case on register/login but lowercases
 * them on the OTP routes, so the same address typed with different casing would
 * not match. Normalising here keeps every flow consistent. */
const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

/** class-validator returns `message` as an array of strings on a 400.
 * For 500s the NestJS default filter returns { message: 'Internal server error' }
 * which is not helpful on its own — we log the full payload for DevTools. */
const extractErrorMessage = (payload, fallback) => {
  const { message } = payload ?? {};
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string" && message.trim() && message !== "Internal server error")
    return message;
  // For true 500s show a more helpful message pointing to the console
  if (payload?.statusCode === 500)
    return "Server error (500) — check browser Console → Network for details.";
  return payload?.error || fallback;
};

const request = async (route, body) => {
  const url = `${API_BASE_URL}/api/auth/${route}`;
  console.debug(`[authService] POST ${url}`, body);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  console.debug(`[authService] ${response.status} ←`, payload);

  if (!response.ok) {
    const err = new Error(
      extractErrorMessage(payload, `Request failed with status ${response.status}.`)
    );
    err.status = response.status;
    throw err;
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
  if (!token || !user) return;

  // If the draft belongs to a different account, throw it away
  const owner = localStorage.getItem(DRAFT_OWNER_KEY);
  if (owner !== String(user.id)) {
    localStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(DRAFT_KEY);
    localStorage.setItem(DRAFT_OWNER_KEY, String(user.id));
  }

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

const authGet = async (path) => {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json().catch(() => null);
};

const rows = (r) => (Array.isArray(r) ? r : r?.data ?? r?.items ?? []);

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
  //  sendEmailOTP
  async sendEmailOTP(email, mode = "login", name = "") {
    return request("email-otp/send", {
      email: normalizeEmail(email),
      mode,
      ...(name.trim() ? { name: name.trim() } : {}),
    });
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
   */
  async forgotPassword(email) {
    return request("forgot-password", { email: normalizeEmail(email) });
  },

  /**
   * Forgot Password – Step 2
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
   */

  loginWithGoogle(mode = "login") {
    const backendUrl =
      import.meta.env.VITE_API_BASE_URL ||
      "https://evolve-backend-4lux.onrender.com";

    const googleUrl = new URL(`${backendUrl}/api/auth/google`);
    googleUrl.searchParams.set("returnUrl", window.location.origin);
    googleUrl.searchParams.set("mode", mode);   // NEW

    window.location.href = googleUrl.toString();
  },

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
 * Onboarding is complete only when ALL of these exist:
 * username + avatar + a role + at least one curiosity skill.
 */
  async getOnboardingStatus() {
    const [profileRes, identitiesRes, curiosityRes] = await Promise.all([
      fetchProfileOnce(),
      authGet("/api/user-identities"),
      authGet("/api/skills/curiosity"),
    ]);

    const data = profileRes?.data ?? profileRes;
    const profile = data?.profile ?? data;

    return {
      hasUsername: Boolean(profile?.username?.trim()),
      hasAvatar: Boolean(profile?.avatarUrl),
      hasRole: rows(identitiesRes).length > 0,
      hasInterests: rows(curiosityRes).length > 0,
    };
  },

  async isOnboardingComplete() {
    try {
      const status = await authService.getOnboardingStatus();
      return Object.values(status).every(Boolean);
    } catch (err) {
      if (err.status === 401) {
        authService.logout();
        throw err;
      }
      return false;
    }
  },

  async getPostLoginRoute() {
    const token =
      localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (!token) return "/login";

    try {
      const complete = await authService.isOnboardingComplete();
      return complete ? "/home" : "/onboarding";
    } catch (err) {
      if (err.status === 401) return "/login";
      return "/onboarding";
    }
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
    clearOnboardingDraft();
  },

};