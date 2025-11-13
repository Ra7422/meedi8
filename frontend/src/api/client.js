// Use environment variable with fallback to localhost
// In production (Vercel), set VITE_API_URL to https://meedi8-production.up.railway.app
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

console.log(`🔗 API_URL: ${API_URL}`);

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
      credentials: 'include', // Required for Safari/Firefox CORS with credentials
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Handle 401 Unauthorized - token expired or invalid
      if (res.status === 401) {
        const errorBody = await res.text().catch(() => "");
        console.error(`🚫 401 Unauthorized on ${path}:`, errorBody);
        console.error('Token being used:', token?.substring(0, 50) + '...');

        // Clear invalid token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }

      // Handle 402 Payment Required and 413 Payload Too Large (paywall errors)
      if (res.status === 402 || res.status === 413) {
        try {
          const errorData = await res.json();
          console.error(`💳 Paywall Error ${res.status} on ${path}:`, errorData);
          const error = new Error(errorData.detail?.message || errorData.detail || 'Upgrade required');
          error.paywallError = true;
          error.statusCode = res.status;
          error.details = errorData.detail;
          throw error;
        } catch (parseError) {
          if (parseError.paywallError) throw parseError;
          // JSON parse failed, fall back to text
          const msg = await res.text().catch(() => "Upgrade required");
          const error = new Error(msg);
          error.paywallError = true;
          error.statusCode = res.status;
          throw error;
        }
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
