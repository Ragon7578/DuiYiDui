interface StatsCardProps {
  label: string
  value: string | number
  description?: string
}

export function StatsCard({ label, value, description }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
    </div>
  )
}
