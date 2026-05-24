import apiClient from "./client"
import { AuthResponse } from "../types"

export const register = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiClient.post(
    "/api/auth/register",
    { email, password }
  )
  return response.data
}

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiClient.post(
    "/api/auth/login",
    { email, password }
  )
  return response.data
}

export const registerAdmin = async (
  email: string,
  password: string,
  adminKey: string
): Promise<AuthResponse> => {
  const response = await apiClient.post(
    "/api/auth/admin/register",
    { email, password, adminKey }
  )
  return response.data
}

export const loginAdmin = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiClient.post(
    "/api/auth/admin/login",
    { email, password }
  )
  return response.data
}

export const logout = async (
  refreshToken: string
): Promise<void> => {
  await apiClient.post("/api/auth/logout", { refreshToken })
}
