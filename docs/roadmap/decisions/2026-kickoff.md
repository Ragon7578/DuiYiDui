# Kickoff 确认 · 初版快速轨

| 项 | 内容 |
|----|------|
| **日期** | 2026-07-27 |
| **文档** | [初版](../versions/初版.md) · [fast-launch](./fast-launch.md) |
| **状态** | 已确认（仓库侧书面冻结） |

## 确认事项

1. **执行初版 + 快速上线计划**：优先 Web 公网「可收反馈」上线，约 8～12 周闸门。  
2. **上线标准** = [fast-launch §0.1](./fast-launch.md) 清单；**不以** App 商店过审为收反馈前提。  
3. **无盈利**：会员、内购、广告、品牌券等全部后置到 [终极版](../versions/终极版.md)。  
4. **反馈渠道（产品内）**：站内 `/feedback` 表单为主；值班用 `FEEDBACK_ADMIN_KEY` 拉取列表。  
5. **密码重置（F3 前临时方案）**：生产不暴露 `resetUrl`；服务端记日志；用户经 `SUPPORT_EMAIL` 或意见反馈联系值班（工作日 48h）。正式邮件商开通后替换。  
6. **数据**：初版 Staging/公网可用 **可备份 SQLite 卷**；Postgres 可在流量稳定后迁移，不挡反馈上线。  

## 仍需人工开通（代码无法代办）

- 购买/绑定域名与云主机  
- 按 [deployment.md](../deployment.md) + [deploy/Caddyfile](../../deploy/Caddyfile) 挂 HTTPS  
- 填写 `.env` 中 `JWT_SECRET` / `SUPPORT_EMAIL` / `FEEDBACK_ADMIN_KEY`  
- 邀请首批约 20 人  

## 相关

- 移动选型见 [decisions/mobile-adr.md](./decisions/mobile-adr.md)  
- Sprint：[iterations/sprint-01.md](./iterations/sprint-01.md)
