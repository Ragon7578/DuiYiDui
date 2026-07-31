# 兑一兑 · Agent 态势板（STATUS）

> **维护人：** 总负责人（Cursor `dui-yi-dui`）  
> **更新：** 2026-07-31  
> **用途：** 推进 / 监督 / 掌握全仓 Agent 更新的唯一快照。任务说明见同目录各 `NN-*.md`。

## 总览

| 优先级 | 项 | 状态 | 负责人 / 分支 | 下一步 |
|--------|----|------|---------------|--------|
| ~~P0~~ | 合入 F2/F3 基线（原 PR #3） | **已合入 main**（`23df53b`） | 原 `cursor/f2-ux-polish-c614` | 可删远程分支 |
| ~~P0~~ | Self/Supervise + 测试 + 总负责人约定 | **已在 main** | 原 `docs-engineering-and-intro` | — |
| ~~P1~~ | 数据库专项 | **已合入 main**（`172873d`） | 原 `cursor/database-c614` | 可删远程分支 |
| **P0** | Staging Compose | **下一优先** | 任务 02 | 本机/`deploy:staging` 跑通 |
| **P0** | 公网 HTTPS | 未开工（需账号） | 任务 03 | 等 02；需用户域名/主机 |
| **P1** | F3 开放收反馈 | 未开工 | 任务 04 | 等 03 |
| **P1** | 反馈迭代 | 流程就绪，公网未开 | `feedback-ops` + 任务 05 | 上线后每周五 digest |
| 后置 | 真邮件 / 移动端 | 未开工 | 任务 06 / 07 | 不挡反馈 |

## 远端分支台账

| 分支 | 最新（合入前） | 相对 `main` | 处置 |
|------|----------------|-------------|------|
| `main` | 含 F2/F3 + DB + Self/Supervise | — | **当前基线** |
| `cursor/f2-ux-polish-c614` | `695cc7d` | 已吸收 | **可删远程** |
| `cursor/docs-engineering-and-intro` | 与历史 main 对齐过 | 已吸收 | 可删或保留作工作枝 |
| `cursor/database-c614` | `b303be9` | 已吸收 | **可删远程** |
| `cursor/fast-launch-ops-c614` | `b93b920` | 旧 | **勿再推**；可删远程 |

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
| 公网上线 | 任务 03 强依赖用户域名与主机账号 |
| GitHub `gh` API | 本环境曾 Forbidden；合并已用本地 git 完成 |

## 总负责人即时裁定（2026-07-31）

1. **任务 01 / 08 完成：** F2/F3 + 数据库已进 `main`；`npm run build` / `npm test` 通过  
2. **下一优先：** 任务 02 Staging Compose；完成后推进 03（需用户账号）  
3. **停用分支清理：** 推送 `main` 后可删 `f2-ux-polish` / `database` / `fast-launch-ops` 远程枝
