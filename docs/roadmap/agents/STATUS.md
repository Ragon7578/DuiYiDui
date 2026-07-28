# 兑一兑 · Agent 态势板（STATUS）

> **维护人：** 总负责人（Cursor `dui-yi-dui`）  
> **更新：** 2026-07-28  
> **用途：** 推进 / 监督 / 掌握全仓 Agent 更新的唯一快照。任务说明见同目录各 `NN-*.md`。

## 总览

| 优先级 | 项 | 状态 | 负责人 / 分支 | 下一步 |
|--------|----|------|---------------|--------|
| **P0** | 合入 F2/F3 基线（原 PR #3） | 远端已推，**未进 main** | `cursor/f2-ux-polish-c614` | 总负责人审查并合并（任务 01） |
| **P0** | Self/Supervise + 测试 + 总负责人约定 | 已推，**未进 main** | `cursor/docs-engineering-and-intro` @ `43ecfcb` | 与 #3 / DB 分支协调合并顺序 |
| **P1** | 数据库专项 | 远端已推，**未进 main**；依赖建议先合 F2 基线 | `cursor/database-c614` @ `b303be9` | 任务 08；合完 01 后再合 |
| **P1** | Staging Compose | 未开工 | 任务 02 | 等 01 |
| **P1** | 公网 HTTPS | 未开工（需账号） | 任务 03 | 等 02；需用户提供域名/证书账号 |
| **P2** | F3 开放收反馈 | 未开工 | 任务 04 | 等 03 |
| **P2** | 反馈迭代 | 流程就绪，公网未开 | `feedback-ops` + 任务 05 | 上线后每周五 digest |
| 后置 | 真邮件 / 移动端 | 未开工 | 任务 06 / 07 | 不挡反馈 |

## 远端分支台账

| 分支 | 最新 | 相对 `main` | 处置 |
|------|------|-------------|------|
| `main` | `5372ae9` | — | 基线（仅含至 Sprint 01 / PR #2） |
| `cursor/f2-ux-polish-c614` | `695cc7d` | 超前（F2+F3 准备+Agent 任务板） | **待合并（01）**；合并后可删 |
| `cursor/docs-engineering-and-intro` | `43ecfcb` | 超前（角色服务拆分/Vitest/总负责人） | 待与 01 协调合并 |
| `cursor/database-c614` | `b303be9` | 超前（含 f2 历史 + DB） | 待 01 后审查合并（08） |
| `cursor/fast-launch-ops-c614` | `b93b920` | 旧；内容多已进 #2 / 被 f2 覆盖 | **勿再推**；可删远程 |

## 本地 Cursor Agent

| Agent | 角色 | 状态 |
|-------|------|------|
| `dui-yi-dui` | **总负责人** | 活跃：分派、监督、收口、同步 |
| `feedback-ops` | 反馈征集与简报 | 待命；简报收件人为总负责人 |

## 监督节奏（总负责人执行）

1. **开工 / 每日（开发日）：** `git fetch origin`；对照本 STATUS 与远端分支 SHA  
2. **合并前：** 冲突预检、验收命令、更新本文件与 `fast-launch` 勾选  
3. **合并后：** 关闭/删除已完成分支；启动下一任务 Agent 或亲自推进  
4. **周五：** 若已上线，催 `feedback-ops` digest → 裁剪 Sprint Must  

## 阻塞与风险

| 项 | 说明 |
|----|------|
| 多分支未合 `main` | docs / F2 / DB / 角色重构分叉，拖延会放大冲突 |
| GitHub PR API | 本环境 `gh` GraphQL 曾 Forbidden；合并可用网页或修好鉴权后 `gh pr` |
| 公网上线 | 任务 03 强依赖用户域名与主机账号 |

## 总负责人即时裁定（2026-07-28）

1. **合并顺序：** `f2-ux-polish`（01）→ 再吸收 `docs-engineering-and-intro` → 再 `database-c614`（08）  
2. **停用：** 不再使用旧 Cloud「项目进展」Agent；`fast-launch-ops-c614` 只读  
3. **明日优先：** 执行任务 01（审查并合 F2/F3 基线进 `main`）
