# 数据库运维指南

> **引擎：** SQLite（`node:sqlite` / `DatabaseSync`）  
> **路径：** `DB_PATH` 或默认 `apps/api/data/contract-spirit.db`；Docker 卷 `/data/contract-spirit.db`  
> **Agent 职责：** [roadmap/agents/08-database.md](./roadmap/agents/08-database.md)

---

## 一、设计原则（初版快速轨）

| 项 | 决策 |
|----|------|
| 初版公网 | **SQLite + 卷持久化 + WAL**，不挡反馈上线 |
| 备份 | 在线 `backup` API + 周备份意识 |
| 迁移 | 启动时 `initSchema` + `migrateSchema` + 版本号 `schema_meta` |
| 后置 | 流量稳定后再迁 **托管 Postgres**（见 [db-adr.md](./roadmap/decisions/db-adr.md)） |

---

## 二、Schema 版本

- 当前逻辑版本：**3**（`apps/api/src/db/meta.ts` 中 `SCHEMA_VERSION`）
- 启动后写入 `schema_meta.schema_version`
- 健康检查：`GET /api/health` 含 `db.schemaVersion` / `expectedSchemaVersion`
- v3 要点：审计时间戳、`trust_ledger`、契约 `owner_user_id`、见证人唯一约束、反馈 `status`

---

## 三、日常命令

```bash
# 在线备份（推荐，VACUUM INTO 一致快照）
npm run backup:db
# 或指定路径
npm run db:backup -w @contract-spirit/api -- ../../backups/manual.db

# 完整性 + 版本
npm run db:verify

# 各表行数（运维）
npm run db:stats

# 恢复（交互确认，会覆盖）
bash scripts/restore-sqlite.sh backups/contract-spirit-XXXX.db
```

Docker 卷备份：`bash scripts/backup-sqlite.sh`（容器内 backup API）。

---

## 四、健康检查

### 公开 `GET /api/health`

```json
{
  "status": "ok",
  "db": {
    "ok": true,
    "integrity": "ok",
    "schemaVersion": 2,
    "expectedSchemaVersion": 2,
    "journalMode": "wal"
  }
}
```

`db.ok` 为 false 时 HTTP **503**，Compose healthcheck 会失败。

### 值班 `GET /api/db/stats` · `GET /api/db/health`

Header：`X-Feedback-Admin-Key` 或 `X-DB-Admin-Key`（与 `FEEDBACK_ADMIN_KEY` / `DB_ADMIN_KEY` 相同）。

---

## 五、改表流程

1. 在 `apps/api/src/db/schema.ts` 的 `migrateSchema()` 中加列（或新表 `CREATE IF NOT EXISTS`）  
2. 若需索引 / 重逻辑迁移：递增 `SCHEMA_VERSION`，在 `applyIndexesAndVersion()` 或新迁移函数中实现  
3. 更新 [data-model.md](./data-model.md)  
4. `npm run db:verify` + `npm run smoke`  
5. **生产**：先 `npm run backup:db`，再部署新版本  

---

## 六、Seed

```bash
npm run seed   # 清空业务表并写入演示用户（密码 password123）
```

**生产公网勿随意 seed**（会清库）。

---

## 七、相关文件

| 文件 | 说明 |
|------|------|
| `apps/api/src/db/schema.ts` | 建表、迁移、索引 |
| `apps/api/src/db/meta.ts` | schema 版本 |
| `apps/api/src/db/maintenance.ts` | 备份 / 校验 / 统计 |
| `apps/api/src/db/seed.ts` | 演示数据 |
| `scripts/backup-sqlite.sh` | 本机 / Docker 备份入口 |
| `scripts/restore-sqlite.sh` | 恢复 |

---

## 八、F3 上线检查（数据）

- [ ] 卷或 `DB_PATH` 已持久化  
- [ ] 至少跑过一次 `npm run backup:db` 或平台自动备份  
- [ ] `GET /api/health` 中 `db.ok` 为 true  
- [ ] 见 [f3-launch-checklist.md](./roadmap/f3-launch-checklist.md) #11
