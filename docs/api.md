# REST API 参考

Base URL：`http://localhost:4000`  
Content-Type：`application/json`  
错误格式：`{ "error": "说明" }`

## 鉴权

| 类型 | 说明 |
|------|------|
| 公开 | `GET /api/health`；`GET /api/auth/registration-policy`；`POST /api/auth/register`、`login`、`forgot-password`、`reset-password`；`POST /api/feedback`；`POST /api/events` |
| 需登录 | 其余业务接口 |
| 值班密钥 | `GET /api/feedback`（`X-Feedback-Admin-Key`） |

请求头：

```http
Authorization: Bearer <jwt>
```

登录/注册成功响应：

```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": null, "phone": null, "trustScore": 50 }
}
```

| HTTP | 含义 |
|------|------|
| 400 | 参数错误 |
| 401 | 未登录 / 用户名密码错误 / token 无效 |
| 404 | 资源不存在 |
| 409 | 冲突（用户名或邮箱占用等） |

---

## 健康检查

### `GET /api/health`

```json
{ "status": "ok", "timestamp": "..." }
```

---

## 认证 `/api/auth`

### `POST /api/auth/register`

Body：`{ "username", "password", "confirmPassword?", "inviteCode?" }`  
规则：用户名 2–20；密码 ≥ 6。若服务端配置 `REGISTRATION_INVITE_CODE`，须传正确 `inviteCode`。  
**201** → `{ token, user }`

### `GET /api/auth/registration-policy`

**200** → `{ "inviteCodeRequired": boolean }`（是否必须邀请码）

### `POST /api/auth/login`

Body：`{ "username", "password" }`（亦兼容 `name`）  
**200** → `{ token, user }`

### `POST /api/auth/forgot-password`

Body：`{ "email" }`  
限流：约 5 次/分钟。  
**200** → `{ "message": "...", "resetUrl?": "..." }`  
说明：仅当 `EXPOSE_RESET_URL=true`（或非 production 且未显式关闭）时带 `resetUrl`；生产默认关闭。未绑定邮箱时仍返回通用文案（不暴露是否存在）。服务端始终记日志。

### `POST /api/auth/reset-password`

Body：`{ "token", "password", "confirmPassword?" }`  
限流：约 10 次/分钟。  
**200** → `{ "message": "..." }`

### `GET /api/auth/me`

需鉴权。返回当前 `UserProfile`。

### `GET /api/auth/users`

需鉴权。返回 `{ id, name }[]`（选见证人等）。

---

## 目标 `/api/goals`（Self 域 · 物理表 `self_commitments`）

均需鉴权；列表/写操作按当前用户隔离。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/goals` | 当前用户目标列表 |
| GET | `/api/goals/:id` | 详情 |
| POST | `/api/goals` | 创建 |
| PATCH | `/api/goals/:id` | 更新（含 progress/status） |
| DELETE | `/api/goals/:id` | 删除 |
| POST | `/api/goals/:id/claim-reward` | 达成后兑现奖励 |
| GET | `/api/goals/:id/witnesses` | 见证人列表 |
| POST | `/api/goals/:id/witnesses` | 邀请见证人 |
| PATCH | `/api/goals/:id/witnesses/:witnessId` | 确认/拒绝 |

### 创建 Body 示例

```json
{
  "title": "连续跑步 30 天",
  "description": "每天至少 3 公里",
  "reward": "买一双跑鞋",
  "deadline": "2026-08-15",
  "witnessUserId": "可选用户 id"
}
```

`userId` 取自 JWT，无需客户端伪造。

### 状态

`active` → `achieved` →（`claim-reward`）`reward_claimed`；或 `abandoned`。

信任分：达成 +5；放弃 -5（见实现）。

---

## 契约 `/api/contracts`（Supervise 域 · 物理表 `supervise_*`；参与方须为真实用户）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/contracts` | 列表 / 创建 |
| GET/PATCH/DELETE | `/api/contracts/:id` | 详情 / 更新 / 删除 |
| PATCH | `/api/contracts/:id/clauses/:clauseId` | 更新条款状态 |

契约状态：`draft` | `active` | `completed` | `breached` | `cancelled`  
条款：`pending` | `fulfilled` | `breached`

履行/违约会影响参与用户信任分与契约计数（见 `contracts` 路由）。

---

## 承诺 `/api/pledges`

标准 CRUD：`GET/POST /api/pledges`，`GET/PATCH/DELETE /api/pledges/:id`。  
归属当前用户（`user_id`）。

---

## 个人资料 `/api/profile`

### `GET /api/profile`

当前用户完整资料。

### `PATCH /api/profile`

可更新：`email`、`phone`、`bio`、`avatar`（**不可**改登录用户名 `name`）。  
邮箱唯一；空字符串视为清空。

### `GET /api/profile/stats`

聚合统计。

---

## 通知 `/api/notifications`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notifications` | 列表 |
| GET | `/api/notifications/unread-count` | `{ count }` |
| PATCH | `/api/notifications/:id/read` | 单条已读 |
| PATCH | `/api/notifications/read-all` | 全部已读 |

---

## AI `/api/ai`

### `POST /api/ai/parse`

需鉴权。Body：`{ "text": "自然语言描述", "mode?": "goal"|"contract" }`  
返回结构化字段供创建页填表。无 `OPENAI_API_KEY` 时走本地规则解析。

---

## 反馈 `/api/feedback`

### `POST /api/feedback`

可匿名（有 token 则记 `user_id`）。Body：`{ "message", "contact?" }`（`message` 5–2000 字）。  
限流：约 8 次/分钟。  
**201** → `{ "id", "message" }`

### `GET /api/feedback`

值班读取。Header：`X-Feedback-Admin-Key: <FEEDBACK_ADMIN_KEY>`（或 `?key=`）。  
Query：`limit`（默认 50，最大 200）、`since`（ISO / `YYYY-MM-DD`，可选，仅返回该时间之后的反馈）。  
**200** → `{ "items": [{ "id", "userId", "userName?", "contact", "message", "createdAt" }], "count" }`  
未配置密钥 → **503**。

整理脚本：`./scripts/feedback-digest.sh` → `docs/roadmap/feedback/digests/*-pm-brief.md`

---

## 事件埋点 `/api/events`

### `POST /api/events`

Body：`{ "event": "register"|"create_goal"|… , "payload?" }`  
用于注册、建目标、达成、兑奖、提交反馈等计数；具体事件名见前端 `apps/web/src/lib/analytics.ts`。

---

## 前端调用约定

- `apps/web/src/lib/api.ts`：`apiFetch`、`setToken` / `clearToken`  
- `apps/web/src/lib/api-client.ts`：按资源封装的方法  

联调示例：

```bash
# 注册
curl -s -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"测试用户","password":"password123","confirmPassword":"password123"}'

# 带 token 拉目标
curl -s http://localhost:4000/api/goals -H "Authorization: Bearer $TOKEN"
```
