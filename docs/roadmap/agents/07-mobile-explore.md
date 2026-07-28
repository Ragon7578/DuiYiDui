# Agent 07 · 移动 RN/Expo（反馈后）

| 项 | 内容 |
|----|------|
| **分支** | `cursor/mobile-explore-c614` |
| **依赖** | [04-f3-launch-ops.md](./04-f3-launch-ops.md) 有反馈样本 |
| **优先级** | 反馈稳定后 |

## 目标

按 [mobile-adr.md](../decisions/mobile-adr.md)：Expo 脚手架 + 与现有 REST API 联调，**不挡 Web**。

## Must

- [ ] `apps/mobile` 或文档化 monorepo 位置
- [ ] 登录 + 目标列表 + 创建（只读也可先 PR）

## 不做

- 商店上架为本任务目标
- 改 Web 主导航结构
