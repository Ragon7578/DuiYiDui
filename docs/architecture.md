# 技术架构

## 一、总览

```
浏览器
  │
  ▼
Next.js App Router (:3000)     # apps/web
  │  Authorization: Bearer JWT
  │  NEXT_PUBLIC_API_URL
  ▼
Express REST API (:4000)       # apps/api
  │  requireAuth（业务路由）
  ▼
SQLite (node:sqlite)           # apps/api/data/*.db
```

可选：`services/java` Spring Boot 脚手架（未承接主业务）。

## 二、当前架构（已实现）

```
用户 → 注册/登录拿 JWT → 前端 AuthProvider 存 cs_token
     → apiFetch 自动带 Bearer → Express 校验 → SQLite
```

| 层 | 技术 |
|----|------|
| 前端 | Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS v4 |
| 状态 / 认证 | React Context（`auth-context`）+ localStorage |
| API 客户端 | `lib/api.ts` + `lib/api-client.ts` |
| 后端 | Express 4 + TypeScript |
| 鉴权 | JWT（7 天）+ bcrypt（注册/改密） |
| 数据库 | SQLite，`PRAGMA foreign_keys=ON`，启动时建表/迁移 |

## 三、前端分层

```
app/                  # 路由页面（Server/Client 组件）
components/
  layout/             # Navbar、AuthGuard
  ui/                 # Card、Badge、FormLabel、StatsCard
  create/             # VoiceInput 等
  contract/
lib/
  api.ts              # 底层 fetch、token、ApiError
  api-client.ts       # 业务方法
  auth-context.tsx    # login/register/logout/refresh
  types.ts
```

### 页面与导航

主导航（登录后）：首页、目标、契约、创建、通知、我的。  
另有登录/注册/忘记密码/重置密码；`/pledges` 有页面未进主导航。

### 数据流

1. 受保护页包在 `AuthGuard` 内  
2. 列表/表单调用 `api-client`  
3. `401` 时清理 token（见 `refresh` / 错误处理路径）  

## 四、后端分层

```
index.ts                 # CORS、JSON、挂载 /api/*
middleware/auth.ts       # signToken / requireAuth / optionalAuth
routes/*                 # 按资源拆分
services/
  notifications.ts       # 截止提醒等
  intent-parser.ts       # 自然语言 → 表单字段（可走 OpenAI）
db/schema.ts             # Schema + migrateSchema
db/seed.ts
```

### 路由挂载（逻辑分组）

| 前缀 | 模块 |
|------|------|
| `/api/health` | 健康检查（公开） |
| `/api/auth` | 注册登录、找回密码、me、用户列表 |
| `/api/goals` | 目标 CRUD、兑奖、见证人 |
| `/api/contracts` | 契约与条款 |
| `/api/pledges` | 轻量承诺 |
| `/api/profile` | 资料与统计 |
| `/api/notifications` | 通知 |
| `/api/ai` | `POST /parse` |

业务路由默认 `requireAuth`。

## 五、认证模型

```
POST /register|login → { token, user }
JWT payload: { userId, username }
密码: bcrypt，注册轮数与 auth 路由一致（当前 12）
```

- 注册仅需用户名 + 密码；`email`/`phone` 可空，登录后 PATCH profile  
- 忘记密码：按已绑定邮箱写 `password_reset_token` / `expires`；试验环境返回 `resetUrl`  

## 六、类型系统（前后端对齐）

核心类型见 `apps/api/src/types.ts` 与 `apps/web/src/lib/types.ts`：

- `UserProfile`（含 `email`、`phone`、信任分与计数）  
- `Goal` / `Contract` / `Pledge` / `Notification` / `GoalWitness`  
- 创建输入类型：`CreateGoalInput` 等  

## 七、信任分（实现约定）

| 事件 | 变化 |
|------|------|
| 目标达成 | +5（封顶 100） |
| 目标放弃 | -5（保底 0） |
| 契约履行相关 | +10 |
| 契约违约相关 | -15 |
| 新用户默认 | 50 |

以 `apps/api` 路由内 SQL 为准。

## 八、已知限制

| 项 | 说明 |
|----|------|
| SQLite 单机 | 适合开发 / 小流量；多实例需换库或共享存储 |
| 重置密码发信 | 试验期不真正发邮件，返回 / 打印链接 |
| AI | 无 Key 时用本地规则解析；有 Key 可增强 |
| Java | 未替代 Node API |
| 承诺页 | `/pledges` 未挂主导航 |
