# Agent 06 · 真邮件密码重置（后置）

| 项 | 内容 |
|----|------|
| **分支** | `cursor/email-reset-c614` |
| **依赖** | 公网已稳定；邮件商账号 |
| **优先级** | **不挡 F3** |

## 目标

接入 SMTP / Resend 等，忘记密码发邮件；保持 `EXPOSE_RESET_URL=false`。

## Must

- [ ] 选邮件商；环境变量文档
- [ ] `forgot-password` 发信，响应不含明文 `resetUrl`
- [ ] [deployment.md](../../deployment.md) 更新；移除「仅日志/人工」为主路径的表述

## 不做

- 手机号登录
