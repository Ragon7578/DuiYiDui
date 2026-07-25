import { apiFetch } from "./api"

export type AnalyticsEvent =
  | "register"
  | "login"
  | "create_goal"
  | "achieve_goal"
  | "claim_reward"
  | "invite_witness"
  | "submit_feedback"
  | "page_home"
  | "page_create"

/** Fire-and-forget product analytics for fast-launch funnel. */
export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  void apiFetch<void>("/api/events", {
    method: "POST",
    body: JSON.stringify({ event, payload }),
  }).catch(() => {})
}

export function submitFeedback(message: string, contact?: string) {
  return apiFetch<{ id: string; message: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify({ message, contact: contact || undefined }),
  })
}
