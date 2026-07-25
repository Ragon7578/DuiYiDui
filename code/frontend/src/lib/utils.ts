export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    breached: "bg-red-100 text-red-700",
    cancelled: "bg-yellow-100 text-yellow-700",
    fulfilled: "bg-green-100 text-green-700",
    broken: "bg-red-100 text-red-700",
    pending: "bg-gray-100 text-gray-700",
  }
  return map[status] || "bg-gray-100 text-gray-700"
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "草稿",
    active: "进行中",
    completed: "已完成",
    breached: "违约",
    cancelled: "已取消",
    fulfilled: "已履行",
    broken: "未履行",
    pending: "待处理",
  }
  return map[status] || status
}
