interface StatsCardProps {
  label: string
  value: string | number
  description?: string
  accent?: boolean
}

export function StatsCard({ label, value, description, accent }: StatsCardProps) {
  return (
    <div
      className={`panel p-5 transition ${
        accent ? "border-seal/40 bg-seal-soft/40" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-4xl font-black leading-none tracking-tight ${
          accent ? "text-seal" : "text-ink"
        }`}
      >
        {value}
      </p>
      {description && (
        <p className="mt-2 text-xs text-muted">{description}</p>
      )}
    </div>
  )
}
