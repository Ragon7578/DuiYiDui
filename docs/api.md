# REST API 参考

后端基于 **Express 4 + TypeScript + SQLite**，默认运行在 `http://localhost:4000`。

所有响应均为 JSON。错误响应格式：

```json
{ "error": "错误描述" }
```

---

## 通用说明

| 项目 | 说明 |
|------|------|
| Base URL | `http://localhost:4000` |
| Content-Type | `application/json` |
| 认证 | 暂无（当前硬编码用户 `u1`） |
| 日期格式 | ISO 8601 字符串，如 `"2026-07-25"` |

---

## 健康检查

### `GET /api/health`

检查服务是否正常运行。

**响应 200**

```json
{
  "status": "ok",
  "timestamp": "2026-07-25T02:30:00.000Z"
}
```

---

## 目标 Goals

### `GET /api/goals`

获取所有目标，按创建时间倒序。

**响应 200** — `Goal[]`

```json
[
  {
    "id": "g1",
    "title": "连续跑步 30 天",
    "description": "每天至少跑 3 公里",
    "reward": "买一双 Nike 跑鞋",
    "rewardClaimed": false,
    "deadline": "2026-08-15",
    "status": "active",
    "progress": 60,
    "createdAt": "2026-07-01",
    "achievedAt": null,
    "userId": "u1"
  }
]
```

### `GET /api/goals/:id`

获取单个目标。

**响应 200** — `Goal`  
**响应 404** — 目标不存在

### `POST /api/goals`

创建新目标。

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 目标标题 |
| `reward` | string | 是 | 达成奖励 |
| `description` | string | 否 | 详细描述 |
| `deadline` | string | 否 | 截止日期 |
| `userId` | string | 否 | 用户 ID，默认 `u1` |

**示例**

```json
{
  "title": "读完 20 本书",
  "reward": "买一台 Kindle",
  "deadline": "2026-12-31"
}
```

**响应 201** — 创建的 `Goal`  
**响应 400** — 缺少必填字段

**副作用**：对应用户的 `total_goals` +1。

### `PATCH /api/goals/:id`

更新目标。只传需要修改的字段。

**请求体**

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题 |
| `description` | string | 描述 |
| `reward` | string | 奖励 |
| `deadline` | string | 截止日期 |
| `status` | GoalStatus | 状态 |
| `progress` | number | 进度 0-100 |
| `rewardClaimed` | boolean | 奖励是否已兑现 |

**GoalStatus**: `"active"` | `"achieved"` | `"reward_claimed"` | `"abandoned"`

**自动行为**：
- `progress` 设为 100 → 自动标记为 `achieved`，记录 `achievedAt`
- `status` 变为 `achieved` → 用户 `achieved_goals` +1，信任分 +5
- `status` 变为 `abandoned` → 用户 `abandoned_goals` +1，信任分 -5

**响应 200** — 更新后的 `Goal`  
**响应 404** — 目标不存在

### `DELETE /api/goals/:id`

删除目标。

**响应 204** — 无内容  
**响应 404** — 目标不存在

**副作用**：对应用户的 `total_goals` -1。

---

## 契约 Contracts

### `GET /api/contracts`

获取所有契约（含参与方和条款），按创建时间倒序。

**响应 200** — `Contract[]`

```json
[
  {
    "id": "c1",
    "title": "合作协议",
    "description": "双方合作开发开源项目",
    "status": "active",
    "reward": "项目上线后一起庆祝",
    "createdAt": "2026-06-01",
    "updatedAt": "2026-06-15",
    "signedAt": null,
    "parties": [
      { "id": "u1", "name": "张三", "role": "promisor", "signedAt": "2026-06-01" },
      { "id": "u2", "name": "李四", "role": "promisee", "signedAt": "2026-06-01" }
    ],
    "clauses": [
      { "id": "cl1", "content": "每周提交代码", "status": "pending", "dueDate": "2026-07-01" }
    ]
  }
]
```

### `GET /api/contracts/:id`

获取单个契约详情。

**响应 200** — `Contract`  
**响应 404** — 契约不存在

### `POST /api/contracts`

创建新契约。

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 契约标题 |
| `parties` | Party[] | 是 | 至少一个参与方 |
| `clauses` | ClauseInput[] | 是 | 至少一条条款 |
| `description` | string | 否 | 描述 |
| `reward` | string | 否 | 约定奖励 |

**Party 结构**

```json
{ "id": "u1", "name": "张三", "role": "promisor" }
```

`role`: `"promisor"` | `"promisee"` | `"both"`

**ClauseInput 结构**

```json
{ "content": "每周提交代码", "dueDate": "2026-07-01" }
```

**响应 201** — 创建的 `Contract`（状态为 `active`）  
**响应 400** — 缺少必填字段

### `PATCH /api/contracts/:id`

更新契约基本信息。

**请求体**

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题 |
| `description` | string | 描述 |
| `status` | ContractStatus | 状态 |
| `reward` | string | 奖励 |

**ContractStatus**: `"draft"` | `"active"` | `"completed"` | `"breached"` | `"cancelled"`

**自动行为**：
- `status` 变为 `completed` → 参与用户 `fulfilled_contracts` +1，信任分 +10
- `status` 变为 `breached` → 参与用户 `breached_contracts` +1，信任分 -15

**响应 200** — 更新后的 `Contract`

### `PATCH /api/contracts/:id/clauses/:clauseId`

更新单条条款状态。

**请求体**

```json
{ "status": "fulfilled" }
```

**自动行为**：
- 所有条款均为 `fulfilled` → 契约自动标记为 `completed`
- 任一条款为 `breached` → 契约自动标记为 `breached`
- 同步更新参与用户的信任分

**响应 200** — 更新后的 `Contract`（含最新条款状态）

### `DELETE /api/contracts/:id`

删除契约（级联删除参与方和条款）。

**响应 204** — 无内容

---

## 承诺 Pledges

### `GET /api/pledges`

获取所有承诺，按创建时间倒序。

**响应 200** — `Pledge[]`

### `GET /api/pledges/:id`

获取单个承诺。

**响应 200** — `Pledge`  
**响应 404** — 承诺不存在

### `POST /api/pledges`

创建新承诺。

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 承诺标题 |
| `description` | string | 否 | 描述 |
| `maker` | string | 否 | 承诺人，默认 `"anonymous"` |
| `deadline` | string | 否 | 截止日期 |

**响应 201** — 创建的 `Pledge`

### `PATCH /api/pledges/:id`

更新承诺。

**请求体**

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题 |
| `description` | string | 描述 |
| `status` | string | `"active"` | `"fulfilled"` | `"broken"` |
| `deadline` | string | 截止日期 |

**响应 200** — 更新后的 `Pledge`

### `DELETE /api/pledges/:id`

删除承诺。

**响应 204** — 无内容

---

## 用户 Profile

> 当前仅支持硬编码用户 `u1`（张三）。

### `GET /api/profile`

获取当前用户资料。

**响应 200** — `UserProfile`

```json
{
  "id": "u1",
  "name": "张三",
  "avatar": null,
  "trustScore": 78,
  "totalGoals": 8,
  "achievedGoals": 5,
  "abandonedGoals": 2,
  "totalContracts": 24,
  "fulfilledContracts": 20,
  "breachedContracts": 1,
  "bio": "说到做到，对自己诚实。"
}
```

### `PATCH /api/profile`

更新用户资料。

**请求体**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 用户名 |
| `avatar` | string | 头像 URL |
| `bio` | string | 个人简介 |

**响应 200** — 更新后的 `UserProfile`

### `GET /api/profile/stats`

获取聚合统计数据（用于首页仪表盘）。

**响应 200** — `Stats`

```json
{
  "totalGoals": 4,
  "achievedGoals": 1,
  "abandonedGoals": 1,
  "activeGoals": 2,
  "totalContracts": 3,
  "completedContracts": 1,
  "breachedContracts": 1,
  "activeContracts": 1,
  "totalPledges": 3,
  "fulfilledPledges": 1,
  "trustScore": 78
}
```

---

## 信任分规则

| 事件 | 分数变化 |
|------|----------|
| 基础分 | 50 |
| 目标达成 | +5 |
| 目标放弃 | -5 |
| 契约完成 | +10 |
| 契约违约 | -15 |

分数范围：0 ~ 100。

---

## 错误码

| HTTP 状态码 | 场景 |
|-------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无响应体） |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 404 | 未知路由（`{ "error": "Not found" }`） |

---

## 前端联调示例

在 `apps/web/src/lib/api.ts` 中封装 API 调用（待实现）：

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch(`${API_URL}/api/goals`)
  if (!res.ok) throw new Error("Failed to fetch goals")
  return res.json()
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const res = await fetch(`${API_URL}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create goal")
  return res.json()
}
```
