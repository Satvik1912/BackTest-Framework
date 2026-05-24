import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { login } from "../api/auth"
import { useAuth } from "../context/AuthContext"
import AuthLayout from "../components/AuthLayout"

export default function LoginPage() {
  const navigate = useNavigate()
  const { saveAuth } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    setLoading(true)
    try {
      const response = await login(email, password)
      saveAuth(
        response.token,
        response.refreshToken,
        { userId: response.userId, email: response.email, role: response.role }
      )
      navigate("/dashboard")
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid email or password"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Profit Life account">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
          Create one
        </Link>
      </p>

      <p className="mt-2 text-center text-sm text-gray-500">
        Admin? <Link to="/admin/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in here</Link>
      </p>
    </AuthLayout>
  )
}
