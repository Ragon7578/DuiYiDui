# 数据模型

> **引擎：** SQLite · 逻辑版本 **3**（`schema_meta.schema_version`）  
> **运维：** [database.md](./database.md) · Agent [08-database.md](./roadmap/agents/08-database.md)

## 一、概念模型

```
User
 ├─ Goal（reward / reward_claimed；无独立 rewards 表）
 │    └─ GoalWitness（初版每个目标最多 1 个 pending|confirmed）
 ├─ TrustLedger（履约档案流水）
 ├─ Pledge
 ├─ Notification
 ├─ Feedback
 ├─ AnalyticsEvent
 └─ Contract（owner_user_id）
      ├─ Party（可选 user_id）
      └─ Clause
```

**说明：** 产品「奖励」= `goals.reward` + `reward_claimed`（+ `reward_claimed_at`），不是单独实体。

---

## 二、表一览（初版）

| 表 | 用途 | 优先级 |
|----|------|--------|
| `users` | 账号、信任分、计数 | P0 |
| `goals` | 带奖励目标闭环 | P0 |
| `goal_witnesses` | 见证人 ×1 | P0 |
| `trust_ledger` | 信任分增减流水 | P0 |
| `notifications` | 站内通知 | P1 |
| `contracts` / `parties` / `clauses` | 契约基础 | P1 |
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
| `total_goals` / `achieved_goals` / `abandoned_goals` | 目标计数 |
| `total_contracts` / `fulfilled_contracts` / `breached_contracts` | 契约计数 |
| `created_at` / `updated_at` | 审计 |

### goals

| 列 | 说明 |
|----|------|
| `id` / `user_id` | FK → users，CASCADE |
| `title` / `description` | |
| `reward` / `reward_claimed` | 奖励文案与是否已兑现 |
| `deadline` / `progress` | 0–100 |
| `status` | `active` \| `achieved` \| `reward_claimed` \| `abandoned` |
| `created_at` / `updated_at` | |
| `achieved_at` / `reward_claimed_at` / `abandoned_at` | 状态时间戳 |

### goal_witnesses

| 列 | 说明 |
|----|------|
| `goal_id` / `witness_user_id` / `witness_name` | 可仅写姓名（未注册） |
| `status` | `pending` \| `confirmed` \| `declined` |
| `invited_at` / `confirmed_at` | |

**约束：** 部分唯一索引 — 同一 `goal_id` 仅允许一条 `pending|confirmed`（初版 1 人）。

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

### contracts / parties / clauses

| 表 | 要点 |
|----|------|
| `contracts` | `owner_user_id` 创建人；status 含 draft/active/completed/breached/cancelled |
| `parties` | `id`+`contract_id` 复合主键；可选 `user_id` 链到注册用户 |
| `clauses` | pending / fulfilled / breached；`updated_at` |

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

---

## 四、信任分规则（与实现一致）

```
默认 50，范围 0–100

【自己】
  目标达成     +5
  目标放弃     -5
  契约完成     +10
  契约违约     -15

【监督他人】
  已确认见证人，对方目标达成  +3
```

每次变动写入 `trust_ledger`。

---

## 五、索引（v3）

| 索引 | 用途 |
|------|------|
| `idx_users_name` UNIQUE | 登录名 |
| `idx_users_email` / `idx_users_reset_token` | 邮箱 / 重置 |
| `idx_goals_user_status` | 列表与待兑现 |
| `idx_goals_deadline` | 截止提醒 |
| `idx_goal_one_active_witness` UNIQUE partial | 一目标一见证 |
| `idx_contracts_owner` / `idx_parties_user` | 契约归属 |
| `idx_notifications_user_read` | 未读 |
| `idx_feedback_status` / `idx_feedback_created` | 值班 |
| `idx_trust_ledger_user` | 履约档案 |
| `idx_analytics_events_event` | 漏斗 |

---

## 六、认证约定

- 注册只写 `name` + `password_hash`；邮箱/手机后补  
- 找回密码依赖已绑定唯一 `email`  
- 重置成功清空 token / expires  

---

## 七、UserProfile（API 形状）

| 字段 | 说明 |
|------|------|
| `id` / `name` | |
| `email` / `phone` / `avatar` / `bio` | |
| `trustScore` | |
| `totalGoals` / `achievedGoals` / `abandonedGoals` | |
| `totalContracts` / `fulfilledContracts` / `breachedContracts` | |
