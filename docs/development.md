# 本地开发指南

## 一、环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 18 | 前端 + API |
| npm | ≥ 9 | workspaces |
| Java 17 + Maven | 可选 | `services/java` |

推荐 [nvm](https://github.com/nvm-sh/nvm) 管理 Node 版本。

## 二、克隆与启动

```bash
git clone https://gitee.com/ragon6749/say-and-done.git
# 或 https://github.com/Ragon7578/SayAndDone.git
cd say-and-done   # 或本地目录名 contract-spirit

npm install
npm run seed
npm run dev
```

- 前端：http://localhost:3000  
- API：http://localhost:4000  

分别启动：

```bash
npm run dev:api
npm run dev:web
```

## 三、目录结构（开发关注点）

```
apps/
├── api/
│   ├── data/                 # SQLite 文件（gitignore）
│   ├── src/
│   │   ├── index.ts          # 监听端口入口
│   │   ├── app.ts            # Express 应用（可供测试挂载）
│   │   ├── middleware/auth.ts
│   │   ├── db/schema.ts      # 建表 + 迁移
│   │   ├── db/seed.ts
│   │   ├── routes/           # auth goals contracts pledges profile notifications ai
│   │   ├── services/         # notifications, self-commitments, supervise-agreements…
│   │   ├── test/             # API 集成回归（Vitest + supertest）
│   │   └── types.ts
│   └── package.json
└── web/
    ├── src/
    │   ├── app/              # App Router 页面
    │   ├── components/
    │   └── lib/
    │       ├── api.ts          # fetch + token
    │       ├── api-client.ts   # 业务 API
    │       ├── auth-context.tsx
    │       └── types.ts
    └── package.json
```

## 四、环境变量

### API（`apps/api`）

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `4000` | 监听端口 |
| `JWT_SECRET` | 开发默认字符串 | **生产必须改** |
| `APP_URL` | `http://localhost:3000` | 密码重置链接前缀 |
| `OPENAI_API_KEY` | 空 | 可选；有则增强 `/api/ai/parse` |
| `OPENAI_MODEL` | `gpt-4o-mini` | 可选模型名 |

### Web（`apps/web`）

| 变量 | 默认 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API 基址 |

可复制 `apps/web/.env.local.example` 为 `.env.local`。

## 五、认证与联调要点

1. 注册 / 登录返回 `{ token, user }`  
2. 前端把 token 存 `localStorage` 键名 `cs_token`  
3. 除 `POST /api/auth/register|login|forgot-password|reset-password` 与 `GET /api/health` 外，业务接口需要：

```http
Authorization: Bearer <token>
```

4. `npm run seed` 会清空并写入演示用户（用户名如 `张三`，密码见 seed 输出 / 文档约定，一般为 `password123`），用于见证等联调。

## 六、常用命令

```bash
npm run seed              # 重置 SQLite 演示数据
npm run build             # 构建 api + web
npm run lint              # 前端 ESLint
npm test                  # API 回归 + Web 角色单测（见 docs/testing.md）
npm run test:api          # 仅 API
npm run test:web          # 仅 Web

# 仅 API
npm run seed -w @contract-spirit/api
npm run build -w @contract-spirit/api
```

数据库文件：`apps/api/data/contract-spirit.db`（勿提交）。测试使用临时库，不写该文件。

## 七、前端页面一览

| 路由 | 说明 |
|------|------|
| `/` | 首页仪表盘 |
| `/goals` | 目标列表 |
| `/contracts`、`/contracts/[id]` | 契约 |
| `/pledges` | 轻量承诺（页面存在，主导航未挂） |
| `/create` | 创建目标 / 契约（语音 + AI 填表） |
| `/profile` | 个人资料与统计 |
| `/notifications` | 通知 |
| `/login` `/register` | 登录注册 |
| `/forgot-password` `/reset-password` | 找回 / 重置密码 |

受保护页通过 `AuthGuard` + `AuthProvider` 控制。

## 八、Java 服务（可选）

```bash
cd services/java
mvn -pl core-service -am spring-boot:run
# 默认 :8081 健康检查
```

当前为脚手架，业务仍以 Node API 为准。

## 九、FAQ

**跨域？**  
开发期 API 已开 CORS；生产应限制来源。

**改端口？**  
API 用 `PORT`；Web 用 Next 默认 3000，并同步改 `NEXT_PUBLIC_API_URL` 与 `APP_URL`。

**忘记密码在本地怎么测？**  
先在「我的」绑定邮箱 → 忘记密码 → 试验环境响应里带 `resetUrl`（并打服务端日志）。

**seed 后登录不了？**  
确认用的是 seed 用户名（`name` 字段），不是邮箱；密码以 seed 脚本为准。
