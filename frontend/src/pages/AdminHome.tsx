import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const ADMIN_TILES = [
  {
    to: "/admin/users",
    icon: "👥",
    title: "Users",
    body: "Approve new sign-ups, audit each user's strategies, rerun their backtests or remove an account.",
    gradient: "from-blue-500 to-indigo-600",
    cta: "Manage users",
  },
]

const ROADMAP = [
  {
    icon: "🛡️",
    title: "Audit log",
    body: "Track every approval, deletion and admin-triggered run on a single timeline.",
  },
  {
    icon: "📈",
    title: "Platform metrics",
    body: "See active users, queued jobs, and worker throughput at a glance.",
  },
  {
    icon: "🤖",
    title: "AutoTrade controls",
    body: "Review and pause live-trading deployments when AutoTrade launches.",
  },
]

export default function AdminHome() {
  const { user } = useAuth()
  const inboxName = user?.email ? user.email.split("@")[0] : "admin"

  return (
    <div className="space-y-10">

      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-8 sm:p-10 shadow-lg">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_15%_30%,rgba(96,165,250,0.30),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(99,102,241,0.25),transparent_50%)]"
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Admin console
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome back, <span className="capitalize">{inboxName}</span>
          </h1>
          <p className="mt-2 text-blue-100/90 max-w-xl">
            Keep the platform healthy — approve new accounts, take a look at the strategies
            your users are building, and step in when something needs attention.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/users"
              className="bg-white text-slate-900 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold shadow"
            >
              Open user list
            </Link>
          </div>
        </div>
      </section>

      {/* Admin tiles */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What you can do here</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ADMIN_TILES.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition"
            >
              <div className={`h-1.5 bg-gradient-to-r ${t.gradient}`} />
              <div className="p-6 flex flex-col flex-1">
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${t.gradient} text-white text-xl flex items-center justify-center shadow-md`}
                >
                  {t.icon}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {t.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed flex-1">
                  {t.body}
                </p>
                <div className="mt-4 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                  {t.cta} →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Coming next to the admin console</h2>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
            In progress
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {ROADMAP.map((r) => (
            <div
              key={r.title}
              className="relative bg-white rounded-2xl border border-dashed border-gray-300 p-6"
            >
              <div className="h-11 w-11 rounded-2xl bg-gray-50 text-xl flex items-center justify-center">
                {r.icon}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{r.title}</h3>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Soon
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
