import { getStatusColor, getStatusLabel } from "@/lib/utils"

export function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}
