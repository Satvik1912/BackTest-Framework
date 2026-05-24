/**
 * Decorative candlestick chart used as a subtle hero backdrop.
 * Pointer-events disabled; positioned absolutely by the parent.
 */
type Candle = {
  x: number
  wickTop: number
  wickBottom: number
  bodyTop: number
  bodyBottom: number
  bullish: boolean
}

const SEED_CANDLES: Candle[] = [
  { x: 30,  wickTop: 60,  wickBottom: 230, bodyTop: 110, bodyBottom: 200, bullish: true  },
  { x: 80,  wickTop: 90,  wickBottom: 250, bodyTop: 130, bodyBottom: 220, bullish: false },
  { x: 130, wickTop: 40,  wickBottom: 190, bodyTop: 80,  bodyBottom: 170, bullish: true  },
  { x: 180, wickTop: 70,  wickBottom: 210, bodyTop: 110, bodyBottom: 195, bullish: true  },
  { x: 230, wickTop: 100, wickBottom: 260, bodyTop: 140, bodyBottom: 240, bullish: false },
  { x: 280, wickTop: 55,  wickBottom: 200, bodyTop: 95,  bodyBottom: 180, bullish: true  },
  { x: 330, wickTop: 80,  wickBottom: 230, bodyTop: 130, bodyBottom: 215, bullish: false },
  { x: 380, wickTop: 35,  wickBottom: 175, bodyTop: 70,  bodyBottom: 160, bullish: true  },
  { x: 430, wickTop: 60,  wickBottom: 210, bodyTop: 100, bodyBottom: 195, bullish: true  },
  { x: 480, wickTop: 90,  wickBottom: 250, bodyTop: 135, bodyBottom: 240, bullish: false },
  { x: 530, wickTop: 50,  wickBottom: 195, bodyTop: 85,  bodyBottom: 180, bullish: true  },
  { x: 580, wickTop: 70,  wickBottom: 230, bodyTop: 110, bodyBottom: 200, bullish: true  },
  { x: 630, wickTop: 110, wickBottom: 270, bodyTop: 150, bodyBottom: 250, bullish: false },
  { x: 680, wickTop: 45,  wickBottom: 185, bodyTop: 80,  bodyBottom: 170, bullish: true  },
  { x: 730, wickTop: 75,  wickBottom: 215, bodyTop: 115, bodyBottom: 195, bullish: false },
  { x: 780, wickTop: 50,  wickBottom: 200, bodyTop: 90,  bodyBottom: 185, bullish: true  },
  { x: 830, wickTop: 90,  wickBottom: 245, bodyTop: 130, bodyBottom: 230, bullish: false },
  { x: 880, wickTop: 30,  wickBottom: 175, bodyTop: 70,  bodyBottom: 160, bullish: true  },
  { x: 930, wickTop: 60,  wickBottom: 220, bodyTop: 100, bodyBottom: 205, bullish: true  },
]

const BODY_WIDTH = 22

export default function CandlestickBackdrop({
  className = "",
  opacity = 0.18,
}: {
  className?: string
  opacity?: number
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 960 320"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <defs>
        <linearGradient id="candleBullish" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="candleBearish" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#f87171" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>

      {/* Faint gridlines */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1={0}
          x2={960}
          y1={40 + i * 50}
          y2={40 + i * 50}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={1}
        />
      ))}

      {SEED_CANDLES.map((c, i) => {
        const fill = c.bullish ? "url(#candleBullish)" : "url(#candleBearish)"
        const stroke = c.bullish ? "#34d399" : "#f87171"
        return (
          <g
            key={i}
            style={{
              animation: `candleFloat 6s ease-in-out ${i * 0.18}s infinite alternate`,
            }}
          >
            <line
              x1={c.x}
              x2={c.x}
              y1={c.wickTop}
              y2={c.wickBottom}
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <rect
              x={c.x - BODY_WIDTH / 2}
              y={c.bodyTop}
              width={BODY_WIDTH}
              height={Math.max(2, c.bodyBottom - c.bodyTop)}
              rx={3}
              fill={fill}
            />
          </g>
        )
      })}

      <style>{`
        @keyframes candleFloat {
          0%   { transform: translateY(0px); }
          100% { transform: translateY(-4px); }
        }
      `}</style>
    </svg>
  )
}
