# 数据模型

## 一、概念模型（Self / Supervise）

产品按角色拆成两套数据域（见 [product-roles.md](./product-roles.md)），**不是单用户模型**：

```
User（真实账号）
 ├─ Self 域
 │    └─ self_commitments（我对己的承诺 + reward 兑现）
 │         └─ supervise_witnesses（他人见证该承诺；见证人 ∈ User）
 └─ Supervise 域
      └─ supervise_agreements
           ├─ supervise_parties（user_id 必填，真实用户）
           └─ supervise_clauses
```

共享：`users`（含信任分与计数）、`notifications`、`pledges`（弱化）、`feedback` / `analytics_events`。

**规则：** 监督关系必须指向真实 `user_id`，禁止虚构姓名占位。

API 过渡：HTTP 仍为 `/api/goals`、`/api/contracts`；物理表已用上表名。响应里 Goal.`userId` = `owner_user_id`；Party.`id` = `user_id`。

---

## 二、UserProfile（API 形状）

| 字段 | 说明 |
|------|------|
| `id` / `name` | 主键；`name` 即登录用户名 |
| `email` / `phone` | 可选；登录后绑定 |
| `avatar` / `bio` | 可选 |
| `trustScore` | 信任分（两域共用） |
| `totalGoals` / `achievedGoals` / `abandonedGoals` | **Self** 计数（列名历史遗留） |
| `totalContracts` / `fulfilledContracts` / `breachedContracts` | **Supervise** 计数（列名历史遗留） |

---

## 三、SQLite 表

### users

| 列 | 说明 |
|----|------|
| `id` | PK |
| `name` | 登录名，非空 |
| `email` | 可空，唯一（应用层约束） |
| `password_hash` | bcrypt |
| `phone` / `password_reset_*` | 可选 |
| `avatar` / `bio` | |
| `trust_score` | 默认 50 |
| `*_goals` / `*_contracts` | Self / Supervise 计数，默认 0 |

### self_commitments（Self）

| 列 | 说明 |
|----|------|
| `id` / `owner_user_id` | 所有者 |
| `title` / `description` | |
| `reward` / `reward_claimed` | 奖励文案与是否已兑现 |
| `deadline` / `progress` | 0–100 |
| `status` | `active` \| `achieved` \| `reward_claimed` \| `abandoned` |
| `created_at` / `achieved_at` | |

### supervise_witnesses（Supervise · 见证 Self）

| 列 | 说明 |
|----|------|
| `id` / `commitment_id` | → `self_commitments.id` |
| `witness_user_id` | **必填** → `users.id` |
| `status` | `pending` \| `confirmed` \| `declined` |
| `invited_at` / `confirmed_at` | |

### supervise_agreements / supervise_parties / supervise_clauses

- `supervise_agreements.created_by_user_id`：创建人  
- `status`：`draft` \| `active` \| `completed` \| `breached` \| `cancelled`  
- `supervise_parties`：PK `(agreement_id, user_id)`；`display_name` 冗余展示  
- `role`：`promisor` \| `promisee` \| `both`  
- `supervise_clauses.status`：`pending` \| `fulfilled` \| `breached`  

### pledges / notifications / feedback / analytics_events

与此前一致；`pledges` 不进主导航。

### 迁移

启动时若仍存在旧表 `goals` / `contracts` / `parties` / `clauses` / `goal_witnesses`，会一次性迁入新表后 **DROP** 旧表（见 `apps/api/src/db/schema.ts`）。

### feedback

| 列 | 说明 |
|----|------|
| `id` / `user_id` | 可匿名（`user_id` 可空） |
| `contact` / `message` | |
| `created_at` | |

### analytics_events

| 列 | 说明 |
|----|------|
| `id` / `user_id` | 埋点事件 |
| `event` / `payload` | JSON 字符串 |
| `created_at` | |

### schema_meta

| 列 | 说明 |
|----|------|
| `key` / `value` | 如 `schema_version` → 当前逻辑版本号 |

---

## 四、信任分 / 成就点规则（与实现一致）

```
默认 50，范围约 0–100

【Self】
  承诺达成（本人）     +5
  承诺放弃（本人）     -5

【Supervise】
  约定履约（参与方）   +10
  约定违约（参与方）   -15
  已确认见证人，对方承诺达成  +3
```

以 `apps/api/src/routes/goals.ts`、`contracts.ts` 中的 SQL 为准。

---

## 五、认证相关约定

- 注册不写邮箱；`email`/`phone` 通过 `PATCH /api/profile`  
- 找回密码依赖已绑定且唯一的 `email`  

---

## 六、优先级

| 实体 | 域 | 优先级 |
|------|----|--------|
| self_commitments + reward | Self | P0 |
| User + Auth | 共享 | P0 |
| supervise_agreements + parties + clauses | Supervise | P1 |
| supervise_witnesses / notifications | Supervise / 共享 | P1 |
| pledges | — | P2 |
