import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  withCredentials: true,
  timeout: 10000,
})

// Attach JWT from memory on every request
api.interceptors.request.use((config) => {
  const token = window.__authToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and notify AuthContext via event (no page reload)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.__authToken = null
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
