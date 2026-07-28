# 停用 Agent 交接说明（项目进展 Cloud Agent）

> **状态：** 该 Cloud Agent **不再使用**。功能与文档已拆到 [agents/README.md](./README.md) 各任务。  
> **仓库：** `github.com/Ragon7578/DuiYiDui`  
> **最后活跃分支：** `cursor/f2-ux-polish-c614`

---

## 该 Agent 已完成（已在 main 或 PR #3）

### 已合并 `main`

| PR | 内容 |
|----|------|
| [#1](https://github.com/Ragon7578/DuiYiDui/pull/1) | Monorepo、文档、快启首页 |
| [#2](https://github.com/Ragon7578/DuiYiDui/pull/2) | Sprint 01：临时重置、反馈值班 API、Compose healthcheck、Caddy 示例、smoke/backup 脚本、Kickoff/ADR、W31 周报 |

### 待合并 — [**PR #3**](https://github.com/Ragon7578/DuiYiDui/pull/3)（`cursor/f2-ux-polish-c614`）

| 模块 | 说明 |
|------|------|
| **F2 体验** | 注册→onboarding 竞态修复；单屏引导；见证人姓名邀请；待兑现 CTA；空态/通知去 Todo |
| **F3 准备** | `REGISTRATION_INVITE_CODE`；`deploy-staging.sh`；`f3-launch-checklist.md`；`feedback-duty.md` |
| **文档** | `fast-launch` F2/F3 勾选、Sprint 03/04、`api.md` |

**新 Agent 第一步：** 执行任务 [01-merge-pr3.md](./01-merge-pr3.md)。

---

## 未完成（交给其他 Agent / 人工）

| 项 | 交给 |
|----|------|
| 合并 PR #3 | Agent **01** |
| 公网域名 + HTTPS | Agent **03**（需账号） |
| 填生产 `.env`、Compose 公网 | Agent **02** / **03** |
| 邀 ≥20 人、宣布收反馈 | Agent **04** |
| 真邮件服务 | Agent **06**（后置） |
| App / Expo | Agent **07**（反馈后） |

---

## 曾用分支（勿再推）

| 分支 | 说明 |
|------|------|
| `cursor/fast-launch-ops-c614` | 已合入 #2，可删远程 |
| `cursor/f2-ux-polish-c614` | PR #3，合并后删 |

---

## 关键环境变量（生产）

见 `.env.example`：`JWT_SECRET`、`APP_URL`、`FRONTEND_ORIGIN`、`NEXT_PUBLIC_API_URL`、`SUPPORT_EMAIL`、`FEEDBACK_ADMIN_KEY`、可选 `REGISTRATION_INVITE_CODE`、`EXPOSE_RESET_URL=false`。
