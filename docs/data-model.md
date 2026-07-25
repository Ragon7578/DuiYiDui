# 数据模型

## 一、概念模型

```
User
 ├─ Goal（含 reward 字段，无独立 rewards 表）
 │    └─ GoalWitness
 ├─ Pledge
 ├─ Notification
 └─（作为 Party 参与）Contract
      ├─ Party
      └─ Clause
```

**说明：** 产品文档里的「奖励」在物理模型上是 `goals.reward` + `reward_claimed`，不是单独实体表。

## 二、UserProfile（API 形状）

| 字段 | 说明 |
|------|------|
| `id` / `name` | 主键；`name` 即登录用户名 |
| `email` / `phone` | 可选；登录后绑定 |
| `avatar` / `bio` | 可选 |
| `trustScore` | 信任分 |
| `totalGoals` / `achievedGoals` / `abandonedGoals` | 目标计数 |
| `totalContracts` / `fulfilledContracts` / `breachedContracts` | 契约计数 |

## 三、SQLite 表

### users

| 列 | 说明 |
|----|------|
| `id` | PK |
| `name` | 登录名，非空 |
| `email` | 可空，唯一（应用层约束） |
| `password_hash` | bcrypt |
| `phone` | 可空（迁移列） |
| `password_reset_token` / `password_reset_expires` | 重置密码（迁移列） |
| `avatar` / `bio` | |
| `trust_score` | 默认 50 |
| 各 `*_goals` / `*_contracts` 计数 | 默认 0 |

### goals

| 列 | 说明 |
|----|------|
| `id` / `user_id` | |
| `title` / `description` | |
| `reward` / `reward_claimed` | 奖励文案与是否已兑现 |
| `deadline` / `progress` | 0–100 |
| `status` | `active` \| `achieved` \| `reward_claimed` \| `abandoned` |
| `created_at` / `achieved_at` | |

### goal_witnesses

| 列 | 说明 |
|----|------|
| `goal_id` / `witness_user_id` / `witness_name` | |
| `status` | `pending` \| `confirmed` \| `declined` |
| `invited_at` / `confirmed_at` | |

### contracts / parties / clauses

- `contracts.status`：`draft` \| `active` \| `completed` \| `breached` \| `cancelled`  
- `parties.role`：`promisor` \| `promisee` \| `both`  
- `clauses.status`：`pending` \| `fulfilled` \| `breached`  

### pledges

含 `user_id`（可空兼容旧数据）；状态 `active` \| `fulfilled` \| `broken`。

### notifications

| 列 | 说明 |
|----|------|
| `user_id` / `type` / `title` / `message` | |
| `related_id` | 关联业务 id |
| `read` | 0/1 |
| `created_at` | |

## 四、信任分 / 成就点规则（与实现一致）

```
默认 50，范围约 0–100

【自己达成】
  目标达成（本人）     +5
  目标放弃（本人）     -5
  契约条款履行（本人） +10
  契约违约（本人）     -15

【监督他人达成】
  作为已确认见证人，对方目标达成  +3
```

说明：目标与契约是两条线；成就点都进同一套 `trust_score`。见证人须状态为 `confirmed` 才得分。

以 `apps/api/src/routes/goals.ts`、`contracts.ts` 中的 SQL 为准。

## 五、认证相关约定

- 注册不写邮箱；`email`/`phone` 通过 `PATCH /api/profile`  
- 找回密码依赖已绑定且唯一的 `email`  
- 重置成功后清空 `password_reset_token` / `expires`  

## 六、优先级（产品实体）

| 实体 | 优先级 | 说明 |
|------|--------|------|
| Goal + Reward 字段 | P0 | 核心 |
| UserProfile + Auth | P0 | 已实现 |
| Contract + Clause | P1 | 已实现 |
| Notification / Witness | P1 | 已实现 |
| Pledge | P2 | API+页面有，导航弱化 |
