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

// Redirect to /login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.__authToken = null
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
