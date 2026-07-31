# Agent 08 · 数据库（本 Agent 负责）

| 项 | 内容 |
|----|------|
| **分支** | `cursor/database-c614` |
| **依赖** | 建议先合并 PR #3（F2/F3 基线） |
| **Owner** | **数据库专项 Cloud Agent** |

## 职责范围

- SQLite schema、迁移、索引、`schema_meta` 版本  
- 备份 / 恢复 / 校验脚本与 `GET /api/health` 中 `db` 字段  
- 值班接口 `GET /api/db/stats`、`/api/db/health`  
- 文档：[database.md](../../database.md)、[data-model.md](../../data-model.md)、[db-adr.md](../decisions/db-adr.md)  
- **后置：** Postgres 迁移方案（不挡 F3）

## 已完成（本分支）

- [x] `SCHEMA_VERSION` + `schema_meta`（当前 **v3**）  
- [x] 查询索引；见证人一目标一活跃唯一约束  
- [x] WAL + `busy_timeout` + `synchronous=NORMAL`  
- [x] `npm run db:backup` / `db:verify` / `db:stats`  
- [x] `/api/health` 含 DB 状态；`/api/db/*` 值班统计  
- [x] **表设计完善 v3：** 审计列、`trust_ledger`、`contracts.owner_user_id`、`parties.user_id`、`feedback.status`、兑现/放弃时间戳  
- [x] 信任分统一 `adjustTrustScore` 写流水  
- [x] [database.md](../../database.md)、[data-model.md](../../data-model.md)、[db-adr.md](../decisions/db-adr.md)

## 后续可选（本 Agent backlog）

- [ ] Postgres 迁移 ADR 细化 + 导出脚本  
- [ ] 定时备份 cron 示例（云主机）  
- [ ] 履约档案 API：`GET /api/profile/trust-ledger`  
- [ ] 反馈值班 `PATCH` 标记 `reviewed`