// ALWAYS use HTTPS for production Railway backend
// No environment variables - hardcoded to eliminate any caching issues
const API_URL = "https://meedi8-production.up.railway.app";

console.log(`🔗 API_URL (hardcoded HTTPS): ${API_URL}`);

// Export the converted API_URL so other files can use it
export { API_URL };

export async function apiRequest(path, method = "GET", body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Create an AbortController with 90 second timeout for long AI operations
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (res.status === 401) {
        // Clear invalid token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }

      let msg = await res.text().catch(() => "");
      throw new Error(msg || `API ${res.status}`);
    }
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The AI is taking longer than expected. Please try again.');
    }
    throw error;
  }
}
