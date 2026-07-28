# Agent 01 · 合并 PR #3 并本地验收

| 项 | 内容 |
|----|------|
| **分支** | 不新建；合并后基于 `main` |
| **依赖** | 无 |
| **预估** | 小（审查 + 合并 + smoke） |

## 目标

把 [PR #3](https://github.com/Ragon7578/DuiYiDui/pull/3)（`cursor/f2-ux-polish-c614`）合入 `main`，确保 F2 + F3 准备代码成为基线。

## Must

- [ ] Review PR #3 diff（F2 UX + 邀请码 + 部署脚本 + 文档）
- [ ] CI/本地：`npm run build`、`npm run smoke`（API 本地起）
- [ ] 合并 PR；删分支 `cursor/f2-ux-polish-c614`（可选）
- [ ] 确认 `main` 上 `docs/roadmap/fast-launch.md` F2 为已勾选

## 不做

- 公网部署（交给 Agent 02/03）
- 新功能

## 验收

- `main` 包含注册邀请码、`scripts/deploy-staging.sh`、`f3-launch-checklist.md`
- 注册页 onboarding、目标页待兑现 CTA 可用

## 完成后

启动 [02-staging-compose.md](./02-staging-compose.md) 或 [03-public-https.md](./03-public-https.md)。
