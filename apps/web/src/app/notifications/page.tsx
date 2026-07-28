"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { AuthGuard } from "@/components/layout/auth-guard"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateWitness,
} from "@/lib/api-client"
import { formatDate } from "@/lib/utils"
import type { Notification } from "@/lib/types"

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  )
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  function load() {
    fetchNotifications()
      .then(setNotifications)
      .finally(() => setLoading(false))
  }

  async function handleRead(n: Notification) {
    if (n.read) return
    await markNotificationRead(n.id)
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
    )
  }

  async function handleReadAll() {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })))
  }

  async function handleWitnessAction(n: Notification, status: "confirmed" | "declined") {
    if (!n.relatedId) return
    const witnesses = await import("@/lib/api-client").then((m) =>
      m.fetchGoalWitnesses(n.relatedId!)
    )
    const mine = witnesses.find((w) => w.status === "pending")
    if (mine) {
      await updateWitness(n.relatedId, mine.id, status)
      await markNotificationRead(n.id)
      load()
    }
  }

  if (loading) return <p className="text-muted">加载中...</p>

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">通知</h1>
          <p className="mt-1 text-sm text-muted">见证邀约、达成与兑奖提醒</p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleReadAll}
            className="text-sm font-semibold text-seal hover:underline"
          >
            全部标为已读
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={n.read ? "opacity-60" : "border-l-4 border-l-seal"}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1" onClick={() => handleRead(n)}>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted">{n.message}</p>
                <p className="mt-2 text-xs text-muted">{formatDate(n.createdAt)}</p>
              </div>
              {n.type === "witness_invite" && n.relatedId && !n.read && (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleWitnessAction(n, "confirmed")}
                    className="btn-primary px-3 py-1 text-xs"
                  >
                    接受见证
                  </button>
                  <button
                    onClick={() => handleWitnessAction(n, "declined")}
                    className="rounded border border-line px-3 py-1 text-xs font-semibold hover:border-ink"
                  >
                    婉拒
                  </button>
                </div>
              )}
              {n.relatedId && n.type !== "witness_invite" && (
                <Link
                  href={n.type.includes("goal") || n.type.includes("reward") ? "/goals" : "/contracts"}
                  className="shrink-0 text-xs font-semibold text-seal hover:underline"
                  onClick={() => handleRead(n)}
                >
                  查看
                </Link>
              )}
            </div>
          </Card>
        ))}
        {notifications.length === 0 && (
          <div className="rounded border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">还没有消息</p>
            <p className="mt-2 text-sm text-muted">
              有人请你见证，或目标达成需要兑奖时，会在这里出现。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
