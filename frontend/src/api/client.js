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
    console.log(`🌐 API Request: ${method} ${path}`, token ? '(with token)' : '(no token)');
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
        const errorBody = await res.text().catch(() => "");
        console.error(`🚫 401 Unauthorized on ${path}:`, errorBody);
        console.error('Token being used:', token?.substring(0, 50) + '...');

        // TEMPORARY: Don't redirect immediately for debugging Safari issue
        if (typeof window !== 'undefined' && window.navigator.userAgent.includes('Safari') && !window.navigator.userAgent.includes('Chrome')) {
          alert(`Safari Debug: 401 on ${path}. Check console for details. Token: ${token?.substring(0, 20)}...`);
        }

        // Clear invalid token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }

      let msg = await res.text().catch(() => "");
      console.error(`❌ API Error ${res.status} on ${path}:`, msg);
      throw new Error(msg || `API ${res.status}`);
    }
    console.log(`✅ API Success: ${method} ${path}`);
    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The AI is taking longer than expected. Please try again.');
    }
    throw error;
  }
}
