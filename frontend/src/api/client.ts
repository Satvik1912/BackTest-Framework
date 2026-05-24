import axios from "axios"

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      let role: string | null = null
      try {
        const stored = localStorage.getItem("user")
        if (stored) role = JSON.parse(stored)?.role ?? null
      } catch {
        role = null
      }
      localStorage.removeItem("token")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("user")
      window.location.href = role === "ADMIN" ? "/admin/login" : "/login"
    }
    return Promise.reject(error)
  }
)

export default apiClient
