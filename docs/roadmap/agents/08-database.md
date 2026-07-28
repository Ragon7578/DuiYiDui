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

- [x] `SCHEMA_VERSION` + `schema_meta`  
- [x] 查询索引（goals / notifications / feedback / analytics）  
- [x] WAL + `busy_timeout` + `synchronous=NORMAL`  
- [x] `npm run db:backup` / `db:verify` / `db:stats`（SQLite backup API）  
- [x] `scripts/restore-sqlite.sh`；改进 `backup-sqlite.sh`  
- [x] `/api/health` 含 DB 状态；`/api/db/*` 值班统计  
- [x] seed 清理 `feedback` / `analytics_events`  
- [x] [database.md](../../database.md)、[db-adr.md](../decisions/db-adr.md)

## 其他 Agent 勿重复做

- 公网域名 / HTTPS → Agent 03  
- 业务 API 逻辑 → 反馈迭代 Agent 05  
- 真邮件 → Agent 06  

## 验收

```bash
npm run build -w @contract-spirit/api
npm run seed && npm run db:verify && npm run db:stats
npm run backup:db
npm run smoke   # API 已起
```

## 后续可选（本 Agent  backlog）

- [ ] Postgres 迁移 ADR 细化 + 双写/导出脚本  
- [ ] 定时备份 cron 示例（云主机）  
- [ ] 埋点表按周聚合查询（值班报表）
