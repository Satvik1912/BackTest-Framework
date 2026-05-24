import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { logout } from "../api/auth"

export default function Navbar() {
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken") || ""
      await logout(refreshToken)
    } catch {
      // ignore logout errors
    } finally {
      clearAuth()
      navigate("/login")
    }
  }

  const isActive = (path: string) =>
    location.pathname.startsWith(path)
      ? "text-blue-600 border-b-2 border-blue-600"
      : "text-gray-600 hover:text-gray-900"

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-2">

          <div className="flex items-center gap-3 sm:gap-8 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
              <img
                src="/profit-life.png"
                alt="Profit Life"
                className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
              />
              <span className="hidden sm:inline text-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                Profit Life
              </span>
            </Link>

            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              <Link
                to="/dashboard/strategies"
                className={`text-sm font-medium pb-1 transition-colors ${isActive("/dashboard/strategies")}`}>
                Strategies
              </Link>
              <Link
                to="/dashboard/jobs"
                className={`text-sm font-medium pb-1 transition-colors ${isActive("/dashboard/jobs")}`}>
                Jobs
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <span className="hidden md:inline text-sm text-gray-500 truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}
