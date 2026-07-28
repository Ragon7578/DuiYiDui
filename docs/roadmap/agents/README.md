# 兑一兑 · Cloud Agent 任务拆分

> **本目录：** 把快速轨剩余工作拆成**可并行、可交接**的 Agent 任务。  
> **原 Cloud Agent（项目进展 / fast-launch-ops / f2-ux）已停用** — 见 [retired-handoff.md](./retired-handoff.md)。  
> **新 Agent 请只认领一条任务**，分支名 `cursor/<任务 slug>-c614`，base `main`（或任务里写明的依赖 PR）。

---

## 先看什么

| 顺序 | 文档 |
|------|------|
| 1 | [retired-handoff.md](./retired-handoff.md) — 已完成什么、开着的 PR |
| 2 | [fast-launch.md](../fast-launch.md) — 当前轨道 F0～F3 |
| 3 | [f3-launch-checklist.md](../f3-launch-checklist.md) — 上线验收表 |

---

## 任务索引（按推荐顺序）

| ID | 任务 | 分支建议 | 依赖 | 谁做 |
|----|------|----------|------|------|
| **01** | [合并 PR #3 并验收](./01-merge-pr3.md) | —（合并，不新开功能分支） | 无 | **最先** |
| **02** | [本机 / Staging Compose 部署](./02-staging-compose.md) | `cursor/staging-compose-c614` | 01 | 需云主机或本机 |
| **03** | [公网 HTTPS + 域名](./03-public-https.md) | `cursor/public-https-c614` | 02 | **需你方账号** |
| **04** | [F3 开放：邀人 + 宣布收反馈](./04-f3-launch-ops.md) | `cursor/f3-launch-ops-c614` | 03 | 产品 + Agent 文档 |
| **05** | [反馈迭代 Sprint 05+](./05-feedback-iteration.md) | `cursor/feedback-iter-c614` | 04 | 持续 |

**后置（不挡反馈）：**

| ID | 任务 | 分支建议 |
|----|------|----------|
| **06** | [真邮件重置 SMTP](./06-email-reset.md) | `cursor/email-reset-c614` |
| **07** | [移动 RN/Expo 脚手架](./07-mobile-explore.md) | `cursor/mobile-adr-c614` |

---

## 给新 Agent 的固定约定

1. 分支：`cursor/<slug>-c614`，小写。  
2. 只改任务范围内文件；盈利 / 终极版功能打回 [终极版](../../versions/终极版.md)。  
3. 验收命令：`npm run build`、`npm run smoke`（API 已起时）。  
4. 周报写入 `docs/roadmap/progress/YYYY-Www.md`。  
5. 合并 PR 用仓库 `ManagePullRequest` / GitHub，**不要**假设「项目进展」那个 Cloud Run 还在。

---

## 仓库能力地图（避免重复造）

| 能力 | 位置 |
|------|------|
| 主闭环 API | `apps/api/src/routes/goals.ts` 等 |
| 临时密码重置 | `EXPOSE_RESET_URL` / `SUPPORT_EMAIL` · [deployment.md](../../deployment.md) |
| 反馈提交 + 值班拉取 | `POST /api/feedback` · `GET` + `FEEDBACK_ADMIN_KEY` |
| 注册邀请码 | `REGISTRATION_INVITE_CODE` · `GET /api/auth/registration-policy` |
| 部署 | `docker-compose.yml` · `deploy/Caddyfile` · `npm run deploy:staging` |
| 冒烟 | `npm run smoke` · `scripts/smoke.sh` |
| 备份 | `npm run backup:db` |
