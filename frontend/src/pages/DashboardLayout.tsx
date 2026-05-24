import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
