# Agent 02 · Staging Compose 部署与冒烟

| 项 | 内容 |
|----|------|
| **分支** | `cursor/staging-compose-c614`（仅当需改脚本/文档时） |
| **依赖** | [01-merge-pr3.md](./01-merge-pr3.md) |
| **预估** | 中 |

## 目标

在**一台机器**（本机或云主机）用 Docker Compose 跑通 API+Web，并完成 `npm run smoke`。

## Must

- [ ] `cp .env.example .env`，填写 `JWT_SECRET`（强随机）
- [ ] `npm run deploy:staging`（兼容 `docker compose` / `docker-compose`；**需 daemon**）
- [x] `GET /api/health` 正常（本地 :4000）；浏览器 Web 待 Compose
- [ ] 可选：`REGISTRATION_INVITE_CODE` 测邀请注册
- [ ] 更新 [Sprint 02](../iterations/sprint-02.md) 本机/Staging 可勾项
- [ ] 周报 `progress/` 一条记录

> **2026-08-04：** 本地 **npm 生产模式** 预部署已过 `smoke`（Web :3000 / API :4000）。Docker Compose 仍待 daemon（Colima/Desktop）。见 [launch-2026-08-05.md](../launch-2026-08-05.md)。

## Should

- [ ] `npm run backup:db` 试跑
- [ ] 文档补充：实际 Staging URL（若已有内网 IP）

## 不做

- 买域名 / HTTPS（Agent 03）
- 邀真实用户（Agent 04）

## 验收

- `deploy-staging.sh` 无报错结束
- 外网或本机手机浏览器能注册→建目标→达成→兑奖（手动或 smoke）
