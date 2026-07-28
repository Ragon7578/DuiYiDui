# Sprint 01 · F0 冻结 + F1 启动（快速轨）

| 项 | 内容 |
|----|------|
| **日期** | 2026-07-20 → 2026-08-02（可平移） |
| **阶段** | [fast-launch F0→F1](../fast-launch.md) |
| **目标** | 冻结「Web 先反馈、无盈利」；开通云/域名/库；开始公网部署 |

---

## Must

- [x] 书面确认执行 [初版](../../versions/初版.md) + [fast-launch](../fast-launch.md) → [decisions/2026-kickoff.md](../decisions/2026-kickoff.md)  
- [x] 确认：上线标准 = Web 反馈上线；App 不挡反馈；无盈利  
- [x] 域名 + HTTPS **方案**确定（见 [deployment.md](../../deployment.md) + [deploy/Caddyfile](../../../deploy/Caddyfile)；**购买/DNS 待人工**）  
- [ ] 云账号 + 主机申请/开通（**待人工**；初版可用可备份 SQLite 卷，见 kickoff）  
- [x] 邮件服务商申请（或明确临时重置方案 ≤ F3）→ 临时方案已写入 deployment / kickoff（`EXPOSE_RESET_URL` + `SUPPORT_EMAIL`）  
- [x] 反馈渠道选定 → **站内 `/feedback` 表单**；值班 `FEEDBACK_ADMIN_KEY`  
- [x] Staging 部署流水线开工 → Compose healthcheck + Caddy 示例 + `npm run smoke` / `backup:db`（**公网挂载待人工**）  

## Should

- [x] 移动选型 ADR 一句话 → [decisions/mobile-adr.md](../decisions/mobile-adr.md)  
- [x] 隐私政策草稿大纲 → 已有 `/privacy` `/terms` 页草案  

## 不做

- 原生 App 工程  
- 会员/押金/终极版功能  
- 完美 OpenAPI、手机号登录  

---

## 任务拆分

| 任务 | 负责人 | 预估（天） | 状态 |
|------|--------|------------|------|
| 范围确认纪要 | | 0.5 | **完成** |
| 域名 / DNS / HTTPS | | 1 | 方案完成；购买/DNS **待人工** |
| 托管库开通 | | 1 | SQLite 卷方案就绪；云开通 **待人工** |
| 邮件商申请 | | 0.5 | 临时重置方案已落地；真邮件后置 |
| 反馈渠道建好 | | 0.5 | **完成**（站内表单 + 值班拉取） |
| Staging 部署初通 | | 3～4 | 脚本就绪；公网 **待人工** |

---

## 验收

- [x] F0 清单可勾选（除云资源人工项）  
- [ ] Staging 至少一个服务**公网**可访问（待域名/主机）  
- [x] Sprint 02 可接「库接通 + 主闭环冒烟」（本地 `npm run smoke`）  
