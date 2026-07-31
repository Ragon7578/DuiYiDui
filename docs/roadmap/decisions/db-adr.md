# ADR · 数据库选型（初版 → 反馈后）

| 项 | 内容 |
|----|------|
| **状态** | 已采纳 |
| **日期** | 2026-07-28 |

**初版 / F3 反馈上线：** 使用 **SQLite**（`node:sqlite`），Docker 卷 `cs_data` 持久化，**WAL** + 在线 `backup` API。满足「数据不丢」与快速部署，**不挡** Web 收反馈。

**托管 Postgres：** 在 M-反馈 之后、日活或数据量明显上升时再迁；迁移前必须有备份与回滚方案。**不由 F3 闸门阻塞。**

**运维入口：** [database.md](../../database.md) · Agent [08-database.md](../agents/08-database.md)。
