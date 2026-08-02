# Agent 03 · 公网 HTTPS 与 F1 收尾

| 项 | 内容 |
|----|------|
| **分支** | `cursor/public-https-c614` |
| **依赖** | [02-staging-compose.md](./02-staging-compose.md) |
| **预估** | 中（**需域名与云账号**） |
| **上线日** | **2026-08-05** — [launch-2026-08-05.md](../launch-2026-08-05.md) §8/3～8/4 |

## 目标

公网 **HTTPS** 可访问 Web + API；对照 [f3-launch-checklist.md](../f3-launch-checklist.md) 勾「公网验收」列（#1～#12）。

## Must

- [ ] 域名 DNS → 云主机；`deploy/Caddyfile` 改真实域名
- [ ] `.env` 全改为 `https://…`；**重建 web**（`NEXT_PUBLIC_API_URL` 构建期写入）
- [ ] `EXPOSE_RESET_URL=false`；`SUPPORT_EMAIL`、`FEEDBACK_ADMIN_KEY` 已填
- [ ] 手机浏览器公网主闭环通过
- [ ] [f3-launch-checklist.md](../f3-launch-checklist.md) 公网列勾选
- [ ] 平台或 cron：`backup:db` / 卷备份说明写入 [deployment.md](../../deployment.md)

## Should

- [ ] `REGISTRATION_INVITE_CODE` 开启邀请制

## 不做

- 大规模新功能
- App

## 验收

- `curl https://api…/api/health`
- Sprint 02 Must 可勾

## 完成后

交给 [04-f3-launch-ops.md](./04-f3-launch-ops.md)。
