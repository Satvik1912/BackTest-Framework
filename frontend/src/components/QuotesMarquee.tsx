type Quote = { text: string; author: string }

const QUOTES: Quote[] = [
  { text: "Be fearful when others are greedy, and greedy when others are fearful.", author: "Warren Buffett" },
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "In the short run, the market is a voting machine. In the long run, it is a weighing machine.", author: "Benjamin Graham" },
  { text: "The intelligent investor is a realist who sells to optimists and buys from pessimists.", author: "Benjamin Graham" },
  { text: "Know what you own, and know why you own it.", author: "Peter Lynch" },
  { text: "The four most dangerous words in investing are: this time it's different.", author: "Sir John Templeton" },
  { text: "Time in the market beats timing the market.", author: "Investing proverb" },
]

export default function QuotesMarquee({ className = "" }: { className?: string }) {
  // Duplicate so the loop is seamless when the first copy scrolls off.
  const loop = [...QUOTES, ...QUOTES]

  return (
    <div
      className={`relative overflow-hidden border-y border-amber-500/20 ${className}`}
      aria-label="Investor quotes"
      style={{
        background:
          "linear-gradient(90deg, #050810 0%, #0b1424 50%, #050810 100%)",
      }}
    >
      {/* warm radial accent behind the strip */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 30% 50%, rgba(245,158,11,0.10), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(217,119,6,0.08), transparent 60%)",
        }}
      />

      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
           style={{ background: "linear-gradient(90deg, #050810 0%, transparent 100%)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
           style={{ background: "linear-gradient(270deg, #050810 0%, transparent 100%)" }} />

      <div className="relative flex whitespace-nowrap py-4 group">
        <ul className="flex shrink-0 items-center gap-14 pr-14 animate-[marqueeScroll_50s_linear_infinite] group-hover:[animation-play-state:paused]">
          {loop.map((q, i) => (
            <li key={i} className="flex items-center gap-3 text-[15px] sm:text-base">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                fill="url(#goldGradient)"
              >
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"  stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <path d="M7.17 6.17A5.5 5.5 0 0 0 4 11v6h6v-6H6.5a3 3 0 0 1 2.83-3 .5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.66-.47A5.5 5.5 0 0 0 7.17 6.17ZM17.17 6.17A5.5 5.5 0 0 0 14 11v6h6v-6h-3.5a3 3 0 0 1 2.83-3 .5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.66-.47 5.5 5.5 0 0 0-2 .14Z" />
              </svg>
              <span className="italic font-medium text-amber-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                "{q.text}"
              </span>
              <span className="not-italic font-semibold text-amber-300">
                — {q.author}
              </span>
              <span aria-hidden className="text-amber-500/40 text-lg">✦</span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
