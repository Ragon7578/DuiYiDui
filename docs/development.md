# 本地开发指南

本文档说明如何在本地启动和调试 **契约精神** 项目的完整开发环境。

---

## 一、环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 18 | 前端 + Node 后端 |
| npm | ≥ 9 | 包管理 |
| Java | ≥ 17（可选） | Java 微服务后端（规划中） |
| Maven | ≥ 3.9（可选） | Java 构建 |

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node.js 版本。

---

## 二、项目结构

```
contract-spirit/
├── apps/
│   ├── web/              # Next.js 前端 (:3000)
│   └── api/              # Express + SQLite 后端 (:4000)
├── services/
│   └── java/             # Spring Boot 微服务 (:8081)
├── docs/                 # 项目文档
└── package.json          # Monorepo 根配置
```

---

## 三、快速启动

### 1. 克隆仓库

```bash
git clone https://github.com/Ragon7578/SayAndDone.git contract-spirit
cd contract-spirit
```

### 2. 安装并启动（推荐）

```bash
npm install
npm run seed      # 初始化 SQLite 数据库
npm run dev       # 同时启动 API (:4000) 和 Web (:3000)
```

或分别启动：

```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

验证后端：

```bash
curl http://localhost:4000/api/health
# {"status":"ok","timestamp":"..."}
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

---

## 四、当前数据流

```
浏览器 → Next.js (:3000) → Express API (:4000) → SQLite
```

登录后所有页面通过 JWT 调用后端 API。试验登录：用户名 + 密码（无需邮箱）。

---

## 五、后端开发

### 目录结构

```
apps/api/
├── src/
│   ├── index.ts           # 入口，路由注册
│   ├── types.ts           # 共享类型定义
│   ├── routes/
│   │   ├── goals.ts       # 目标 CRUD
│   │   ├── contracts.ts   # 契约 CRUD + 条款更新
│   │   ├── pledges.ts     # 承诺 CRUD
│   │   └── profile.ts     # 用户资料 + 统计
│   └── db/
│       ├── schema.ts      # SQLite 建表 + 连接
│       └── seed.ts        # 示例数据
├── data/                  # SQLite 数据库文件（gitignore）
└── package.json
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 热重载开发模式（tsx watch） |
| `npm run build` | 编译 TypeScript → `dist/` |
| `npm run start` | 运行编译后的生产代码 |
| `npm run seed` | 重置数据库并写入示例数据 |

### 数据库

- 引擎：Node.js 内置 `node:sqlite`（无需额外安装）
- 文件路径：`apps/api/data/contract-spirit.db`
- 首次启动或执行 `seed` 时自动建表
- 重置数据：删除 `.db` 文件后重新 `npm run seed`

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `4000` | API 监听端口 |

---

## 六、前端开发

### 目录结构

```
apps/web/
├── src/
│   ├── app/               # App Router 页面
│   │   ├── page.tsx       # 首页 /
│   │   ├── goals/         # 目标 /goals
│   │   ├── contracts/     # 契约 /contracts, /contracts/:id
│   │   ├── pledges/       # 承诺 /pledges
│   │   ├── profile/       # 个人主页 /profile
│   │   └── create/        # 创建 /create
│   ├── components/
│   │   ├── ui/            # 通用 UI 组件
│   │   ├── contract/      # 契约业务组件
│   │   └── layout/        # 布局（Navbar 等）
│   └── lib/
│       ├── types.ts       # 前端类型（与后端对齐）
│       ├── mock-data.ts   # 当前数据源（待替换为 API）
│       └── utils.ts       # 工具函数
└── package.json
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器（Turbopack） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 检查 |

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | 未设置 | 后端 API 地址（联调时使用） |

在 `apps/web/.env.local` 中配置：

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 七、Java 后端（规划中）

`services/java/` 是 Spring Boot 微服务架构的脚手架，目前仅有 Maven 模块结构和代码生成脚本，尚未实现业务逻辑。

| 模块 | 职责 |
|------|------|
| `common` | 共享 DTO、工具类 |
| `core-service` | 核心业务（目标、契约、承诺） |
| `ai-service` | AI 辅助功能（Spring AI） |
| `gateway` | API 网关 |

详见 [backend.md](backend.md)。

---

## 八、开发工作流

### 添加新 API 端点

1. 在 `apps/api/src/types.ts` 添加类型
2. 在 `apps/api/src/routes/` 添加或修改路由
3. 在 `apps/api/src/index.ts` 注册路由（如为新模块）
4. 更新 [api.md](api.md)
5. 在前端 `src/lib/` 添加 API 调用函数（联调阶段）

### 添加新页面

1. 在 `src/app/` 下创建路由目录和 `page.tsx`
2. 如需交互，标注 `"use client"`
3. 复用 `components/ui/` 中的通用组件
4. 更新 [architecture.md](architecture.md) 路由表

### 重置开发数据

```bash
cd apps/api
rm -f data/contract-spirit.db
npm run seed
```

---

## 九、常见问题

### 端口被占用

```bash
# 查看占用 3000 或 4000 端口的进程
lsof -i :3000
lsof -i :4000

# 终止进程
kill -9 <PID>
```

### 前端 build 失败

```bash
cd apps/web
rm -rf .next node_modules
npm install
npm run build
```

### 后端数据库报错

删除数据库文件后重新初始化：

```bash
cd apps/api
rm -f data/contract-spirit.db
npm run seed
```

### CORS 问题

后端已启用 `cors()` 中间件，允许所有来源。生产环境需限制允许的 origin。

---

## 十、下一步开发任务

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | 前后端联调 | ~~前端替换 mock-data，调用 REST API~~ ✅ |
| P0 | 用户认证 | ~~多用户 JWT 登录/注册~~ ✅ |
| P1 | 创建目标/契约表单 | ~~`/create` 页面提交到 API~~ ✅ |
| P1 | 错误处理 | 前端 loading / error 状态 |
| P2 | 单元测试 | Vitest（前端）+ 集成测试（后端） |
| P2 | CI/CD | GitHub Actions 自动构建 |
