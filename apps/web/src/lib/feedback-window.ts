/** 初版反馈窗口：控制首页/反馈页征集条展示 */
export const FEEDBACK_WINDOW = {
  /** 是否对外宣称「窗口开放」——关窗时改为 false */
  open: true,
  /** 展示用起止（含当日） */
  startLabel: "2026-08-01",
  endLabel: "2026-08-14",
  title: "初版反馈窗口已开放",
  blurb:
    "邀请制内测：用 3 分钟走完「写承诺 → 兑奖」，并告诉我们哪里顺、哪里卡。",
  askHints: [
    "注册后是否知道下一步？",
    "「奖励 / 兑奖」说得通吗？",
    "「我的 / 他人」分得清吗？",
  ],
} as const

export function isFeedbackWindowOpen() {
  return FEEDBACK_WINDOW.open
}
