export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: "bg-paper-deep text-muted",
    active: "bg-info-soft text-info",
    achieved: "bg-ok-soft text-ok",
    reward_claimed: "bg-ok-soft text-ok",
    abandoned: "bg-warn-soft text-warn",
    confirmed: "bg-ok-soft text-ok",
    declined: "bg-seal-soft text-seal",
    completed: "bg-ok-soft text-ok",
    breached: "bg-seal-soft text-seal",
    cancelled: "bg-warn-soft text-warn",
    fulfilled: "bg-ok-soft text-ok",
    broken: "bg-seal-soft text-seal",
    pending: "bg-paper-deep text-muted",
  }
  return map[status] || "bg-paper-deep text-muted"
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "草稿",
    active: "进行中",
    completed: "已完成",
    breached: "违约",
    cancelled: "已取消",
    achieved: "已达成",
    reward_claimed: "奖励已兑现",
    abandoned: "已放弃",
    fulfilled: "已履行",
    broken: "未履行",
    pending: "待处理",
    confirmed: "已确认",
    declined: "已拒绝",
  }
  return map[status] || status
}
