# 后端架构

契约精神项目目前有两套后端方案：**Node.js（已实现）** 和 **Java 微服务（规划中）**。

---

## 一、Node.js 后端（当前主力）

### 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 运行时 | Node.js ≥ 18 | 内置 SQLite 支持 |
| 框架 | Express 4 | 轻量 REST API |
| 语言 | TypeScript | 严格模式 |
| 数据库 | SQLite（node:sqlite） | 文件数据库，零配置 |
| 开发工具 | tsx | 热重载 |

### 架构图

```
┌─────────────────────────────────────────┐
│              Express App                 │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐  │
│  │ /goals  │ │/contracts│ │/pledges │  │
│  └────┬────┘ └────┬─────┘ └────┬────┘  │
│       │           │            │        │
│  ┌────▼───────────▼────────────▼────┐  │
│  │         db/schema.ts              │  │
│  │    getDb() → DatabaseSync         │  │
│  └──────────────┬────────────────────┘  │
└─────────────────┼───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     data/contract-spirit.db (SQLite)     │
│  users | goals | contracts | parties     │
│        | clauses | pledges               │
└─────────────────────────────────────────┘
```

### 模块职责

| 文件 | 职责 |
|------|------|
| `src/index.ts` | 应用入口，中间件配置，路由挂载 |
| `src/types.ts` | 请求/响应类型定义 |
| `src/db/schema.ts` | 数据库连接、建表 DDL |
| `src/db/seed.ts` | 开发用示例数据 |
| `src/routes/goals.ts` | 目标 CRUD + 信任分联动 |
| `src/routes/contracts.ts` | 契约 CRUD + 条款状态机 |
| `src/routes/pledges.ts` | 承诺 CRUD |
| `src/routes/profile.ts` | 用户资料 + 统计聚合 |

### 设计决策

**为什么选 SQLite？**
- 开发阶段零配置，无需安装 PostgreSQL
- Node.js 22+ 内置 `node:sqlite`，无额外依赖
- 数据量小，单机足够
- 生产可迁移至 PostgreSQL（SQL 兼容）

**为什么选 Express 而非 NestJS？**
- 项目规模小，Express 足够
- 减少抽象层，便于理解和调试
- 与前端 TypeScript 类型共享更简单

**信任分联动**
- 业务逻辑内嵌在路由 handler 中
- 状态变更时同步更新 `users` 表的计数器和 `trust_score`
- 后续可抽取为 Service 层

### 数据库表

详见 [data-model.md](data-model.md) 第九节「数据库 Schema」。

---

## 二、Java 微服务后端（规划中）

### 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Java 17 |
| 框架 | Spring Boot 3.4 |
| 微服务 | Spring Cloud 2024.0 |
| AI | Spring AI 1.0 |
| 构建 | Maven |

### 模块结构

```
services/java/
├── pom.xml                 # 父 POM
├── generate.py             # 代码生成脚本
├── common/                 # 共享模块
│   └── pom.xml
├── core-service/           # 核心业务服务
├── ai-service/             # AI 辅助服务
├── gateway/                # API 网关
└── sql/                    # 数据库脚本
```

### 目标架构

```
                    ┌──────────────┐
                    │   Gateway    │  :8080
                    │  (路由/鉴权)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │                         │
    ┌─────────▼─────────┐   ┌──────────▼──────────┐
    │   core-service    │   │    ai-service       │
    │  目标/契约/承诺 CRUD │   │  智能建议/分析       │
    │      :8081        │   │      :8082          │
    └─────────┬─────────┘   └─────────────────────┘
              │
    ┌─────────▼─────────┐
    │    PostgreSQL     │
    └───────────────────┘
```

### 规划中的 AI 功能

| 功能 | 说明 |
|------|------|
| 目标建议 | 根据用户历史，推荐合理的目标和奖励 |
| 契约审查 | AI 辅助检查契约条款的完整性 |
| 进度分析 | 分析目标完成趋势，给出提醒 |
| 信任报告 | 生成用户履约信用分析报告 |

### 当前状态

- Maven 多模块结构已搭建
- `generate.py` 可生成基础 Java 代码骨架
- 业务逻辑尚未实现
- 与 Node.js 后端并行开发，最终择一或共存

### 生成代码

```bash
cd services/java
python3 generate.py
```

---

## 三、后端选型对比

| 维度 | Node.js (Express) | Java (Spring Boot) |
|------|-------------------|---------------------|
| 开发速度 | 快 | 中等 |
| 类型安全 | TypeScript | Java |
| 与前端共享类型 | 容易 | 需 OpenAPI |
| 扩展性 | 单体，够用 | 微服务，可水平扩展 |
| AI 集成 | 需第三方 SDK | Spring AI 原生 |
| 部署复杂度 | 低 | 中等（多服务） |
| 当前进度 | 已实现 API | 脚手架阶段 |

**建议路径**：
1. 短期：Node.js 后端 + 前后端联调，快速验证产品
2. 中期：用户量增长后评估是否迁移至 Java 微服务
3. AI 功能：可在 Node.js 后端先接入 OpenAI SDK，后续迁移至 ai-service

---

## 四、API 版本策略

当前无版本前缀（`/api/goals`）。后续如需 breaking change：

```
/api/v1/goals    # 当前版本
/api/v2/goals    # 未来版本
```

---

## 五、安全规划

| 阶段 | 措施 |
|------|------|
| 当前 | 无认证，硬编码用户 `u1` |
| v0.2 | JWT 认证，用户注册/登录 |
| v0.3 | 角色权限（契约参与方验证） |
| v1.0 | Rate limiting、输入校验、SQL 注入防护 |

---

## 六、监控与日志（规划中）

| 工具 | 用途 |
|------|------|
| morgan | HTTP 请求日志 |
| winston | 结构化日志 |
| pm2 | 进程管理（生产） |
| health check | `/api/health` 端点 |
