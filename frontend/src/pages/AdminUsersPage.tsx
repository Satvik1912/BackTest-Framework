import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { approveUser, deleteUser, listUsers } from "../api/admin"
import { AdminUser } from "../types"

type Busy = { id: string; action: "approve" | "delete" } | null

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [busy, setBusy] = useState<Busy>(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (userId: string) => {
    setBusy({ id: userId, action: "approve" })
    setError("")
    try {
      const updated = await approveUser(userId)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch (err: any) {
      setError(err.response?.data?.message || "Approval failed")
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    const ok = window.confirm(
      `Delete account ${user.email}?\n\nThis permanently removes the user, their strategies, jobs, and results.`
    )
    if (!ok) return
    setBusy({ id: user.id, action: "delete" })
    setError("")
    setInfo("")
    try {
      await deleteUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setInfo(`Deleted ${user.email}`)
    } catch (err: any) {
      setError(err.response?.data?.message || "Delete failed")
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-500">Loading users...</p>
      </div>
    )
  }

  const isBusy = (id: string, action: "approve" | "delete") =>
    busy?.id === id && busy.action === action

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 text-sm">
          Approve sign-ups, inspect each user's strategies, or remove an account.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {info && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {info}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium">Last login</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-3 px-4 text-gray-900">{u.email}</td>
                <td className="py-3 px-4">
                  {u.isApproved ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end items-center gap-2 flex-wrap">
                    <Link
                      to={`/admin/users/${u.id}/strategies`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View strategies
                    </Link>
                    {!u.isApproved && (
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={isBusy(u.id, "approve")}
                        className="bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isBusy(u.id, "approve") ? "Approving..." : "Approve"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={isBusy(u.id, "delete")}
                      className="bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isBusy(u.id, "delete") ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
