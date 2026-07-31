# 兑一兑 · Agent 态势板（STATUS）

> **维护人：** 总负责人（Cursor `dui-yi-dui`）  
> **更新：** 2026-07-31  
> **用途：** 推进 / 监督 / 掌握全仓 Agent 更新的唯一快照。任务说明见同目录各 `NN-*.md`。

## 总览

| 优先级 | 项 | 状态 | 负责人 / 分支 | 下一步 |
|--------|----|------|---------------|--------|
| ~~P0~~ | 合入 F2/F3 基线 | **已合入 main** | 原 `f2-ux-polish-c614` | 可删远程 |
| ~~P0~~ | Self/Supervise + 测试 | **已在 main** | — | — |
| ~~P1~~ | 数据库专项（含 schema v3） | **已合入 main**（`0a6b6c7`） | 原 `database-c614` | 可删远程 |
| ~~P1~~ | 首轮反馈窗口文案/推广 | **已在 main**（`dfcaf0c`） | 总负责人 | 公网后执行邀人 |
| **P0** | Staging Compose | **下一优先** | 任务 02 | `deploy:staging` + smoke |
| **P0** | 公网 HTTPS | 未开工（需账号） | 任务 03 | 等 02；需用户域名/主机 |
| **P1** | F3 开放收反馈 | 推广计划已备，待公网 | 任务 04 | 等 03 |
| **P1** | 反馈迭代 | `feedback-ops` 待命 | 任务 05 | 上线后每周五 digest |
| 后置 | 真邮件 / 移动端 | 未开工 | 任务 06 / 07 | 不挡反馈 |

## 远端分支台账

| 分支 | 处置 |
|------|------|
| `main` | **当前基线**（F2/F3 + DB v3 + 反馈窗口） |
| `cursor/f2-ux-polish-c614` | 已吸收 → **可删** |
| `cursor/database-c614` | 已吸收（含 v3）→ **可删** |
| `cursor/docs-engineering-and-intro` | 历史工作枝 → 可删或同步 main |
| `cursor/fast-launch-ops-c614` | 旧 → **可删** |

## 本地 Cursor Agent

| Agent | 角色 | 状态 |
|-------|------|------|
| `dui-yi-dui` | **总负责人** | 活跃 |
| `feedback-ops` | 反馈征集与简报 | 待命（推广窗已开文档） |

## 总负责人即时裁定（2026-07-31 晚）

1. **01 / 08 完成**；schema v3（trust_ledger + 审计列）已进本地 `main`（`0a6b6c7` + `2574385`）  
2. **推送阻塞：** 本环境连不上 `github.com:443`；本地 `main` **ahead 3**，需网络恢复后 `git push origin main`  
3. **任务 02：** 本机无 Docker；已用本地 API 跑通 `npm run smoke`（OK）。Compose 部署待装 Docker 或上云主机  
4. **任务 03** 仍依赖用户域名/主机账号  
5. 清理已吸收远程分支延后到 push 成功后执行
