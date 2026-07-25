import { getDb } from "../db/schema.js"
import { v4 as uuid } from "uuid"

export type NotificationType =
  | "goal_deadline"
  | "goal_achieved"
  | "reward_ready"
  | "witness_invite"
  | "witness_confirmed"
  | "contract_update"

export function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuid(), userId, type, title, message, relatedId || null)
}

export function notifyGoalAchieved(userId: string, goalTitle: string, goalId: string): void {
  createNotification(
    userId,
    "goal_achieved",
    "目标已达成",
    `恭喜！你已完成目标「${goalTitle}」，记得兑现奖励。`,
    goalId
  )
  createNotification(
    userId,
    "reward_ready",
    "奖励待兑现",
    `目标「${goalTitle}」的奖励可以兑现了。`,
    goalId
  )
}

export function checkDeadlineNotifications(userId: string): void {
  const db = getDb()
  const goals = db.prepare(`
    SELECT id, title, deadline FROM goals
    WHERE user_id = ? AND status = 'active' AND deadline IS NOT NULL
  `).all(userId) as { id: string; title: string; deadline: string }[]

  const now = new Date()
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  for (const goal of goals) {
    const deadline = new Date(goal.deadline)
    if (deadline <= inThreeDays && deadline >= now) {
      const existing = db.prepare(`
        SELECT id FROM notifications
        WHERE user_id = ? AND type = 'goal_deadline' AND related_id = ?
      `).get(userId, goal.id)
      if (!existing) {
        createNotification(
          userId,
          "goal_deadline",
          "目标即将到期",
          `目标「${goal.title}」将在 ${goal.deadline} 到期，加油！`,
          goal.id
        )
      }
    }
  }
}
