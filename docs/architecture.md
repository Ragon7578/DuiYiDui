# 技术架构说明

## 一、整体架构

### 系统分层

```
┌──────────────────────────────────────────────────┐
│                    用户层                         │
│           浏览器 (Chrome / Safari / Edge)          │
└────────────────────┬─────────────────────────────┘
                     │ HTTP
┌────────────────────▼─────────────────────────────┐
│                  前端层                            │
│       Next.js 16 (App Router + React 19)          │
│                                                    │
│   ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │ 页面层    │ │ 组件层    │ │ 工具/数据层       │  │
│   │ app/     │ │components│ │ lib/             │  │
│   └──────────┘ └──────────┘ └──────────────────┘  │
└────────────────────┬─────────────────────────────┘
                     │ API 请求（后续）
┌────────────────────▼─────────────────────────────┐
│                  后端层                            │
│         Express 4 + TypeScript (:4000)            │
│   /api/goals  /api/contracts  /api/pledges        │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│                  数据层                            │
│         SQLite (node:sqlite)                       │
└──────────────────────────────────────────────────┘
```

### 当前架构（开发阶段）

```
用户 → Next.js (:3000) → mock-data.ts（内存数据，待替换）
后端 API (:4000) → SQLite（已实现，待联调）
```

### 目标架构

```
用户 → Next.js (:3000) → Express API (:4000) → SQLite
```

---

## 二、前端技术细节

### 2.1 路由设计

使用 Next.js App Router，基于文件系统的路由：

```
src/app/
├── page.tsx              /                          (静态生成)
├── goals/
│   └── page.tsx          /goals                     (静态生成)
├── contracts/
│   ├── page.tsx          /contracts                 (静态生成)
│   └── [id]/
│       └── page.tsx      /contracts/:id             (动态服务端渲染)
├── create/
│   └── page.tsx          /create                    (客户端组件)
├── pledges/
│   └── page.tsx          /pledges                   (静态生成)
└── profile/
    └── page.tsx          /profile                   (静态生成)
```

**渲染策略**：
- 静态页面（`○`）：首页、契约列表、承诺列表、个人主页 — 构建时预渲染
- 动态页面（`ƒ`）：契约详情 — 每次请求时服务端渲染（后续接入真实数据后）

### 2.2 组件设计模式

#### 分层架构

```
页面组件 (app/)          ← 负责数据获取、页面布局、状态管理
    │
业务组件 (components/contract/)  ← 负责特定业务的展示逻辑
    │
通用 UI (components/ui/) ← 纯展示组件，无业务依赖
    │
布局组件 (components/layout/) ← 导航、页脚等全局布局
```

#### 组件规范

| 原则 | 说明 |
|------|------|
| 单一职责 | 每个组件只做一件事 |
| Props 接口 | 所有 Props 显式定义 TypeScript 接口 |
| 无副作用 | UI 组件不发起请求、不操作 localStorage |
| 命名 | PascalCase，文件名与组件名一致 |

### 2.3 客户端 vs 服务端组件

| 组件 | 类型 | 原因 |
|------|------|------|
| `layout.tsx` | Server | 纯布局，无交互 |
| `page.tsx`（首页/列表） | Server | 静态数据，SSG |
| `page.tsx`（详情） | Server | 后续 SSR 获取数据 |
| `create/page.tsx` | Client | 表单交互，useState |
| `navbar.tsx` | Client | usePathname 获取当前路由 |
| `contract-card.tsx` | Server | 纯展示 |
| `badge.tsx` | Server | 纯展示 |
| `card.tsx` | Server | 纯展示 |
| `stats-card.tsx` | Server | 纯展示 |

### 2.4 类型系统

核心类型集中在 `src/lib/types.ts`：

```typescript
// 契约
Contract { id, title, description, parties, clauses, status, createdAt, updatedAt, signedAt }

// 参与方
Party { id, name, role: "promisor" | "promisee" | "both", signedAt }

// 条款
Clause { id, content, status: "pending" | "fulfilled" | "breached", dueDate }

// 承诺
Pledge { id, title, description, maker, deadline, status, createdAt }

// 用户
UserProfile { id, name, trustScore, totalContracts, fulfilledContracts, breachedContracts, bio }
```

### 2.5 工具函数

`src/lib/utils.ts`：

| 函数 | 说明 |
|------|------|
| `formatDate()` | 日期格式化（zh-CN 本地化） |
| `getStatusColor()` | 状态 → Tailwind 颜色类 |
| `getStatusLabel()` | 状态 → 中文标签 |

### 2.6 样式方案

- **框架**：Tailwind CSS v4
- **配置**：零配置（`@import "tailwindcss"`），v4 自动检测使用到的类
- **命名**：原子化，直接在 JSX 中使用 utility class
- **响应式**：使用 `lg:grid-cols-2`、`lg:grid-cols-4` 等断点
- **主题**：当前使用默认主题，后续可自定义

### 2.7 当前限制与未来改进

| 方面 | 当前 | 未来 |
|------|------|------|
| 数据 | 前端 mock 数据 + 后端 SQLite API | 前后端联调 |
| 状态管理 | 无（仅组件内 useState） | React Context / Zustand |
| 认证 | 无（硬编码用户 u1） | NextAuth.js / JWT |
| 表单 | 基础受控组件 | React Hook Form + Zod |
| 测试 | 无 | Vitest + Testing Library |
| 错误处理 | 基本 404 | 全局 ErrorBoundary |
| 加载状态 | 无 | loading.tsx + Suspense |

---

## 三、后端技术细节

后端已实现 Express REST API，详见 [backend.md](backend.md) 和 [api.md](api.md)。

### 3.1 路由结构

```
/api/health              GET     健康检查
/api/goals               GET     目标列表
/api/goals/:id           GET     目标详情
/api/goals               POST    创建目标
/api/goals/:id           PATCH   更新目标
/api/goals/:id           DELETE  删除目标
/api/contracts           GET     契约列表
/api/contracts/:id       GET     契约详情
/api/contracts           POST    创建契约
/api/contracts/:id       PATCH   更新契约
/api/contracts/:id/clauses/:clauseId  PATCH  更新条款
/api/pledges             GET/POST/PATCH/DELETE  承诺 CRUD
/api/profile             GET/PATCH  用户资料
/api/profile/stats       GET     聚合统计
```

### 3.2 信任分联动

后端在以下事件时自动更新用户信任分：

| 事件 | 变化 |
|------|------|
| 目标达成 | +5 |
| 目标放弃 | -5 |
| 契约完成 | +10 |
| 契约违约 | -15 |
