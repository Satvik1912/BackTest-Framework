import { ReactNode } from "react"
import { Link } from "react-router-dom"
import CandlestickBackdrop from "./CandlestickBackdrop"

const QUOTE = {
  text: "The stock market is a device for transferring money from the impatient to the patient.",
  author: "Warren Buffett",
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  accent = "blue",
}: {
  title: string
  subtitle?: string
  children: ReactNode
  accent?: "blue" | "slate"
}) {
  const heroGradient =
    accent === "slate"
      ? "from-slate-950 via-slate-900 to-blue-950"
      : "from-slate-900 via-blue-900 to-indigo-900"

  return (
    <div className="min-h-screen grid lg:grid-cols-[6fr_5fr] bg-slate-950">
      {/* Left brand panel */}
      <aside
        className={`relative overflow-hidden hidden lg:flex flex-col justify-between text-white bg-gradient-to-br ${heroGradient} p-12`}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.35),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(168,85,247,0.30),transparent_50%)]"
        />
        <CandlestickBackdrop className="absolute inset-x-0 bottom-0 w-full h-[55%]" opacity={0.22} />
        {/* warm gold corner glow */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.35), transparent 65%)" }}
        />

        <div className="relative flex flex-col h-full">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src="/profit-life.png"
              alt="Profit Life"
              className="h-12 w-12 object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.45)]"
            />
            <span className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                Profit Life
              </span>
            </span>
          </Link>

          <div className="mt-auto">
            <p className="text-3xl font-bold leading-tight max-w-sm">
              Build, test and trade<br />
              <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                your own strategies.
              </span>
            </p>
            <p className="mt-4 max-w-md text-blue-100/85 text-sm">
              One platform for everything that happens after you have an idea —
              research it, automate it, and stay on top of it with live alerts.
            </p>

            <blockquote className="mt-10 max-w-md rounded-2xl border border-amber-500/20 bg-black/30 backdrop-blur-sm p-5">
              <p className="text-amber-50 italic">"{QUOTE.text}"</p>
              <p className="mt-2 text-sm font-semibold text-amber-300">— {QUOTE.author}</p>
            </blockquote>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="relative flex flex-col items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-slate-50 to-white">
        {/* mobile brand strip (visible only on small screens) */}
        <div className="lg:hidden w-full mb-6 flex items-center justify-center gap-2">
          <img src="/profit-life.png" alt="Profit Life" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold tracking-tight text-slate-900">Profit Life</span>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
          </div>
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-950/5 border border-gray-200 p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
