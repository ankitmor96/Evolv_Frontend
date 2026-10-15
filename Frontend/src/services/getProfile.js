
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL;
const TOKEN_KEY = "evolv_auth_token";

const getToken = () =>
  localStorage.getItem(TOKEN_KEY) ||
  sessionStorage.getItem(TOKEN_KEY);

export const getProfile = {
  async getProfile() {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        result?.message || `Failed to fetch profile (${response.status})`
      );
      error.status = response.status;
      error.payload = result;
      throw error;
    }

    // Support common backend response formats.
    return result?.profile ?? result?.data?.profile ?? result?.data ?? result;
  },
};

export default getProfile;
