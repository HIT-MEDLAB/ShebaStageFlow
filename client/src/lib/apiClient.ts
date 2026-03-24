import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')
    ) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
