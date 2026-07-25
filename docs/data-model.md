# 数据模型

## 一、目标（Goal）

目标是用户对自己做出的承诺，附带有奖励。这是平台的核心实体。

### 状态枚举

```
active（进行中）→ achieved（已达成）→ reward_claimed（奖励已兑现）
                → abandoned（放弃）
```

### 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一标识 |
| `title` | `string` | 是 | 目标标题，如"瘦到60公斤" |
| `description` | `string` | 否 | 详细描述 |
| `reward` | `string` | 是 | 达成后的奖励，如"买一个包包" |
| `rewardClaimed` | `boolean` | 否 | 奖励是否已兑现 |
| `deadline` | `string` (ISO) | 否 | 截止日期 |
| `status` | `GoalStatus` | 是 | 当前状态 |
| `progress` | `number` | 否 | 进度百分比 (0-100) |
| `createdAt` | `string` (ISO) | 是 | 创建时间 |
| `achievedAt` | `string` (ISO) | 否 | 达成时间 |
| `userId` | `string` | 是 | 所属用户 |

```typescript
type GoalStatus = "active" | "achieved" | "reward_claimed" | "abandoned"
```

---

## 二、奖励（Reward）

奖励是目标的附属概念，但在设计上独立建模以便扩展。

### 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一标识 |
| `goalId` | `string` | 是 | 关联目标 |
| `description` | `string` | 是 | 奖励描述，如"买一双 Nike 跑鞋" |
| `estimatedCost` | `number` | 否 | 预估金额 |
| `claimed` | `boolean` | 否 | 是否已兑现 |
| `claimedAt` | `string` (ISO) | 否 | 兑现时间 |

---

## 三、契约（Contract）

契约是 **与他人之间** 的约定，包含参与方和条款。

### 状态枚举

```
draft → active → completed
              → breached
              → cancelled
```

### 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一标识 |
| `title` | `string` | 是 | 契约标题 |
| `description` | `string` | 否 | 描述 |
| `parties` | `Party[]` | 是 | 参与方列表 |
| `clauses` | `Clause[]` | 是 | 条款列表 |
| `status` | `ContractStatus` | 是 | 当前状态 |
| `reward` | `string` | 否 | 契约约定的奖励 |
| `createdAt` | `string` (ISO) | 是 | 创建时间 |
| `updatedAt` | `string` (ISO) | 是 | 更新时间 |
| `signedAt` | `string` (ISO) | 否 | 签署时间 |

---

## 四、参与方（Party）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 用户 ID |
| `name` | `string` | 是 | 显示名称 |
| `role` | `"promisor" \| "promisee" \| "both"` | 是 | 承诺方 / 接受方 / 双方 |
| `signedAt` | `string` (ISO) | 否 | 签署时间 |

---

## 五、条款（Clause）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一标识 |
| `content` | `string` | 是 | 条款内容 |
| `status` | `"pending" \| "fulfilled" \| "breached"` | 是 | 履行状态 |
| `dueDate` | `string` (ISO) | 否 | 截止日期 |

---

## 六、承诺（Pledge）

承诺是轻量的个人保证，目标的前身概念。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一标识 |
| `title` | `string` | 是 | 承诺标题 |
| `description` | `string` | 否 | 描述 |
| `maker` | `string` | 是 | 承诺人 |
| `deadline` | `string` (ISO) | 否 | 截止日期 |
| `status` | `"active" \| "fulfilled" \| "broken"` | 是 | 状态 |
| `createdAt` | `string` (ISO) | 是 | 创建时间 |

---

## 七、用户（UserProfile）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 用户 ID |
| `name` | `string` | 是 | 用户名 |
| `avatar` | `string` | 否 | 头像 URL |
| `trustScore` | `number` | 是 | 信任分 (0-100) |
| `totalGoals` | `number` | 否 | 总目标数 |
| `achievedGoals` | `number` | 否 | 已达成目标数 |
| `abandonedGoals` | `number` | 否 | 放弃目标数 |
| `bio` | `string` | 否 | 个人简介 |

### 信任分算法

```
信任分 = 50（基础分）
       + 已达成目标数 × 5
       - 放弃目标数 × 5
       + 已履行契约数 × 10
       - 违约次数 × 15
```

---

## 八、ER 关系

```
UserProfile (1) ────< (N) Goal        (用户有多个目标)
UserProfile (1) ────< (N) Contract    (用户参与多个契约)
UserProfile (1) ────< (N) Pledge      (用户创建多个承诺)
Goal        (1) ──── (1) Reward      (每个目标有对应奖励)
Contract    (1) ────< (N) Clause      (契约包含多个条款)
Contract    (1) ────< (N) Party       (契约有多个参与方)
Party       (N) ────> (1) UserProfile (参与方对应一个用户)
```

## 九、核心实体权重

| 实体 | 优先级 | 说明 |
|------|--------|------|
| Goal + Reward | P0 | 平台核心，先做 |
| Contract | P1 | 多人协作场景 |
| Pledge | P2 | 轻量承诺，可被 Goal 覆盖 |
| UserProfile | P0 | 用户系统 |
