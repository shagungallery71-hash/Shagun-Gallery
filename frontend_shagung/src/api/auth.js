const API_BASE = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_BASE}/api/auth`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.success === false) {
    const message = data?.message || `Request failed with status ${res.status}`
    throw new Error(message)
  }

  return data
}





export const authApi = {
  // User registration - POST /api/auth/register
  async register({ username, email, password }) {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  },

  // User login - POST /api/auth/login with JSON body
  async login({ email, password }) {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  // Email verification (typically from email link)
  async verifyEmail({ token, userId }) {
    const query = new URLSearchParams({ token, user_id: String(userId) }).toString()
    return request(`/verify-email?${query}`, { method: 'GET' })
  },

  // Trigger forgot password email
  async forgetPassword({ email }) {
    return request('/forget-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  // Verify OTP
  async verifyOtp({ email, otp }) {
    return request('/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    })
  },

  // Reset password via OTP OR token (legacy)
  async resetPassword({ email, otp, newPassword, token, userId }) {
    let query = ''
    if (token && userId) {
      query = `?${new URLSearchParams({ token, user_id: String(userId) }).toString()}`
    }
    return request(`/reset-password${query}`, {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    })
  },

  // Create admin user (admin only) - POST /api/auth/create-admin
  async createAdmin({ username, email, password }, token) {
    return request('/create-admin', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username, email, password }),
    })
  },

  // Delete user (admin only) - DELETE /api/auth/delete-user
  async deleteUser({ email }, token) {
    return request('/delete-user', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    })
  },
}
