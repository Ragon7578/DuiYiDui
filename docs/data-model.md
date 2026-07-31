# 数据模型

> **引擎：** SQLite · 逻辑版本 **3**（`schema_meta.schema_version`）  
> **运维：** [database.md](./database.md) · Agent [08-database.md](./roadmap/agents/08-database.md)

## 一、概念模型（Self / Supervise）

产品按角色拆成两套数据域（见 [product-roles.md](./product-roles.md)），**不是单用户模型**：

```
User（真实账号）
 ├─ TrustLedger（履约档案 / 信任分流水）
 ├─ Self 域
 │    └─ self_commitments（我对己的承诺 + reward 兑现）
 │         └─ supervise_witnesses（他人见证该承诺；见证人 ∈ User）
 └─ Supervise 域
      └─ supervise_agreements
           ├─ supervise_parties（user_id 必填，真实用户）
           └─ supervise_clauses
```

共享：`users`（含信任分与计数）、`notifications`、`pledges`（弱化）、`feedback` / `analytics_events` / `trust_ledger`。

**规则：** 监督关系必须指向真实 `user_id`，禁止虚构姓名占位。

API 过渡：HTTP 仍为 `/api/goals`、`/api/contracts`；物理表已用上表名。响应里 Goal.`userId` = `owner_user_id`；Party.`id` = `user_id`。

**说明：** 产品「奖励」= `self_commitments.reward` + `reward_claimed`（+ `reward_claimed_at`），不是单独实体。

---

## 二、表一览（初版）

| 表 | 用途 | 优先级 |
|----|------|--------|
| `users` | 账号、信任分、计数 | P0 |
| `self_commitments` | Self 承诺 + 奖励闭环 | P0 |
| `supervise_witnesses` | 见证人（真实用户） | P0 |
| `trust_ledger` | 信任分增减流水 | P0 |
| `notifications` | 站内通知 | P1 |
| `supervise_agreements` / `supervise_parties` / `supervise_clauses` | Supervise 约定 | P1 |
| `feedback` | 意见反馈 | P0（上线） |
| `analytics_events` | 漏斗埋点 | P0（上线） |
| `pledges` | 轻量承诺（弱导航） | P2 |
| `schema_meta` | schema 版本 | 运维 |

**初版不做的表（终极版）：** 会员、押金、徽章、积分商城、公开广场等。

---

## 三、字段明细

### users

| 列 | 说明 |
|----|------|
| `id` | PK |
| `name` | 登录名；**唯一索引** |
| `email` | 可空，UNIQUE |
| `phone` | 可空 |
| `password_hash` | bcrypt |
| `password_reset_token` / `password_reset_expires` | 找回密码 |
| `avatar` / `bio` | 资料 |
| `trust_score` | 0～100，默认 50 |
| `total_goals` / `achieved_goals` / `abandoned_goals` | **Self** 计数（列名历史遗留） |
| `total_contracts` / `fulfilled_contracts` / `breached_contracts` | **Supervise** 计数（列名历史遗留） |
| `supervise_unlocked_at` | Supervise 解锁时间 |
| `created_at` / `updated_at` | 审计 |

### self_commitments（Self）

| 列 | 说明 |
|----|------|
| `id` / `owner_user_id` | 所有者 → `users.id` |
| `title` / `description` | |
| `reward` / `reward_claimed` | 奖励文案与是否已兑现 |
| `deadline` / `progress` | 0–100 |
| `status` | `active` \| `achieved` \| `reward_claimed` \| `abandoned` |
| `created_at` / `updated_at` | |
| `achieved_at` / `reward_claimed_at` / `abandoned_at` | 状态时间戳 |

### supervise_witnesses（Supervise · 见证 Self）

| 列 | 说明 |
|----|------|
| `id` / `commitment_id` | → `self_commitments.id` |
| `witness_user_id` | **必填** → `users.id` |
| `status` | `pending` \| `confirmed` \| `declined` |
| `invited_at` / `confirmed_at` | |

**约束：** 部分唯一索引 — 同一 `commitment_id` 仅允许一条 `pending|confirmed`（初版 1 人）。

### trust_ledger

| 列 | 说明 |
|----|------|
| `user_id` | FK |
| `delta` | 实际变动（触顶/触底后可能为 0） |
| `balance_after` | 变动后分数 |
| `reason` | `goal_achieved` / `goal_abandoned` / `witness_goal_achieved` / `contract_fulfilled` / `contract_breached` |
| `related_type` / `related_id` | 关联业务 |
| `created_at` | |

写入统一走 `apps/api/src/db/trust.ts` → `adjustTrustScore`。

### supervise_agreements / supervise_parties / supervise_clauses

- `supervise_agreements.created_by_user_id`：创建人  
- `status`：`draft` \| `active` \| `completed` \| `breached` \| `cancelled`  
- `supervise_parties`：PK `(agreement_id, user_id)`；`display_name` 冗余展示  
- `role`：`promisor` \| `promisee` \| `both`  
- `supervise_clauses.status`：`pending` \| `fulfilled` \| `breached`；含 `updated_at`

### notifications

`user_id` / `type` / `title` / `message` / `related_id` / `read` / `created_at`

### feedback

| 列 | 说明 |
|----|------|
| `user_id` / `contact` / `message` | 可匿名 |
| `status` | `new` \| `reviewed` \| `archived` |
| `created_at` / `reviewed_at` | |

### analytics_events

`event` + 可选 `payload` JSON 字符串 + `user_id` + `created_at`

### pledges

`user_id` 可空兼容旧数据；`updated_at`；状态 active / fulfilled / broken

### schema_meta

`key` / `value` — 如 `schema_version` = `3`

### 迁移

启动时若仍存在旧表 `goals` / `contracts` / `parties` / `clauses` / `goal_witnesses`，会一次性迁入 Self / Supervise 表后 **DROP** 旧表（见 `apps/api/src/db/schema.ts`）。

---

## 四、信任分规则（与实现一致）

```
默认 50，范围 0–100

【Self】
  承诺达成（本人）     +5
  承诺放弃（本人）     -5

【Supervise】
  约定履约（参与方）   +10
  约定违约（参与方）   -15
  已确认见证人，对方承诺达成  +3
```

每次变动写入 `trust_ledger`（经 `adjustTrustScore`）。

---

## 五、索引（v3）

| 索引 | 用途 |
|------|------|
| `idx_users_name` UNIQUE | 登录名 |
| `idx_users_email` / `idx_users_reset_token` | 邮箱 / 重置 |
| `idx_self_commitments_owner_status` | 列表与待兑现 |
| `idx_self_commitments_deadline` | 截止提醒 |
| `idx_commitment_one_active_witness` UNIQUE partial | 一承诺一见证 |
| `idx_supervise_agreements_created_by` / `status` | 约定归属 |
| `idx_supervise_parties_user` | 参与方查询 |
| `idx_notifications_user_read` | 未读 |
| `idx_feedback_status` / `idx_feedback_created` | 值班 |
| `idx_trust_ledger_user` | 履约档案 |
| `idx_analytics_events_event` | 漏斗 |

---

## 六、认证约定

- 注册只写 `name` + `password_hash`；邮箱/手机后补（`PATCH /api/profile`）  
- 找回密码依赖已绑定唯一 `email`  
- 重置成功清空 token / expires  

---

## 七、UserProfile（API 形状）

| 字段 | 说明 |
|------|------|
| `id` / `name` | |
| `email` / `phone` / `avatar` / `bio` | |
| `trustScore` | |
| `totalGoals` / `achievedGoals` / `abandonedGoals` | Self |
| `totalContracts` / `fulfilledContracts` / `breachedContracts` | Supervise |

---

## 八、优先级

| 实体 | 域 | 优先级 |
|------|----|--------|
| self_commitments + reward | Self | P0 |
| User + Auth + trust_ledger | 共享 | P0 |
| supervise_agreements + parties + clauses | Supervise | P1 |
| supervise_witnesses / notifications | Supervise / 共享 | P1 |
| pledges | — | P2 |
