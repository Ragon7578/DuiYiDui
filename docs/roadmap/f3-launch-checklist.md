# F3 · §0.1 反馈上线验收清单

> **目标上线日：** 2026-08-05 — 见 [launch-2026-08-05.md](./launch-2026-08-05.md)

对照 [fast-launch §0.1](../fast-launch.md)。**代码侧已就绪**标为「仓库 ✓」；**公网 / 人工**须上线时勾选。

| # | 标准 | 仓库 ✓ | 公网验收 |
|---|------|--------|----------|
| 1 | HTTPS 公网可访问 | 脚本 + Caddy 示例 | ☐ |
| 2 | 注册登录可用 | ✓ | ☐ |
| 3 | 主闭环可走通 | ✓ `npm run smoke` | ☐ |
| 4 | 待兑现可发现 | ✓ 首页 / 目标列表 | ☐ |
| 5 | 见证人轻路径 | ✓ 姓名 / 用户邀请 | ☐ |
| 6 | 契约基础可用 | ✓ | ☐ |
| 7 | 信任分中性展示 | ✓ | ☐ |
| 8 | 站内通知基本可用 | ✓ 含兑奖提醒 | ☐ |
| 9 | 反馈入口 | ✓ + 值班拉取 | ☐ |
| 10 | 隐私 / 用户协议 | ✓ `/privacy` `/terms` | ☐ |
| 11 | 数据不丢 | ✓ 卷 + `backup:db` | ☐ 平台备份 |
| 12 | 关键埋点或日志 | ✓ `/api/events` | ☐ |

## F3 闸门（人工）

- [ ] `REGISTRATION_INVITE_CODE` 已设（邀请制）或确认开放注册 + 限流足够  
- [ ] 值班表见 [feedback-duty.md](./feedback-duty.md)  
- [ ] 首批 ≥20 人已邀请  
- [ ] 对外宣布开始收反馈  

## 一键自检（本机 / Staging）

```bash
cp .env.example .env   # 填 JWT_SECRET 等
bash scripts/deploy-staging.sh
# 或已启动时: API_URL=... npm run smoke
```

公网：改 `.env` 域名 → `docker compose up -d --build` → 手机浏览器走主闭环 → 上表「公网验收」全勾。
