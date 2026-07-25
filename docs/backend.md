# 后端说明

## 一、定位

当前主后端为 **Node.js Express + TypeScript + SQLite**（`apps/api`）。  
`services/java` 为 Spring Boot **脚手架**，不承接主业务流量。

## 二、模块结构

```
apps/api/src/
├── index.ts                 # 入口、CORS、路由
├── middleware/auth.ts       # JWT 签发与校验
├── db/
│   ├── schema.ts            # 建表 + 列迁移
│   └── seed.ts              # 演示数据
├── routes/
│   ├── auth.ts
│   ├── goals.ts
│   ├── contracts.ts
│   ├── pledges.ts
│   ├── profile.ts
│   ├── notifications.ts
│   └── ai.ts
├── services/
│   ├── notifications.ts     # 截止提醒等
│   └── intent-parser.ts     # NL → 表单（可选 OpenAI）
└── types.ts
```

## 三、安全（当前实现）

| 项 | 现状 |
|----|------|
| 密码 | bcrypt 哈希存储，不明文 |
| 会话 | JWT，默认 7 天；`JWT_SECRET` 可配 |
| 接口 | 业务路由 `requireAuth` |
| 注册 | 用户名唯一；资料邮箱唯一（若绑定） |
| 重置密码 | 一次性 token + 过期时间；试验环境返回链接而非发信 |
| CORS | 开发放开；生产应收紧 |

**生产必做：** 更换强随机 `JWT_SECRET`；不要提交 `.env` / 数据库文件。

## 四、数据与持久化

- 引擎：Node 内置 `node:sqlite`（`DatabaseSync`）  
- 路径：`apps/api/data/contract-spirit.db`  
- 启动时 `initSchema` + `migrateSchema`（增量加列，如 `phone`、重置 token）  

表：`users`、`goals`、`contracts`、`parties`、`clauses`、`pledges`、`notifications`、`goal_witnesses`。  
详见 [data-model.md](data-model.md)。

## 五、业务副作用（摘要）

- 目标达成 / 放弃 → 更新用户计数与 `trust_score`  
- `claim-reward` → 状态进入 `reward_claimed`  
- 契约完成 / 违约 → 计数与信任分  
- 见证人邀请 / 确认 → `goal_witnesses` + 可能通知  
- 截止临近 → `services/notifications` 写入通知  

## 六、AI 解析

`POST /api/ai/parse` → `intent-parser`：

1. 本地规则解析（默认可用）  
2. 若设置 `OPENAI_API_KEY`，可调用模型增强  

不依赖外部 Key 也能跑通创建页智能填写的基础路径。

## 七、环境变量

| 变量 | 用途 |
|------|------|
| `PORT` | 默认 4000 |
| `JWT_SECRET` | JWT 密钥 |
| `APP_URL` | 重置链接域名（指向前端） |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | 可选 AI |

## 八、Java 微服务（规划）

```
services/java/
├── pom.xml                 # 父工程
├── common/
├── core-service/           # 健康检查等（:8081）
├── ai-service/             # 占位
└── gateway/                # 占位
```

目标架构（未落地）：网关 + 领域服务；现阶段以 Node API 为唯一业务后端。

## 九、与文档对照

| 旧描述 | 现况 |
|--------|------|
| 无认证 / 硬编码 `u1` | JWT 多用户 |
| mock 前端 | 已联调真实 API |
| NextAuth | 未使用，自建 JWT |
