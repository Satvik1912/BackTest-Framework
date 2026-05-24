type Variant = "icon" | "row"

export default function Logo({
  size = 36,
  variant = "icon",
  className = "",
  withWordmark = false,
  wordmarkClassName = "",
}: {
  size?: number
  variant?: Variant
  className?: string
  withWordmark?: boolean
  wordmarkClassName?: string
}) {
  const img = (
    <img
      src="/profit-life.png"
      alt="Profit Life"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )

  if (variant === "row" || withWordmark) {
    return (
      <span className="inline-flex items-center gap-2">
        {img}
        <span className={`font-bold tracking-tight ${wordmarkClassName || "text-lg"}`}>
          Profit Life
        </span>
      </span>
    )
  }

  return img
}
