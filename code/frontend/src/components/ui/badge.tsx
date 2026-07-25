import { getStatusColor, getStatusLabel } from "@/lib/utils"

export function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  )
}
