# 契约精神 · 工程文档

> 本目录为**项目工程说明**（开发、架构、API、数据、设计规范）。  
> 与代码同仓维护，以当前实现为准。

口号：对自己守信，才能对他人守信。

## 快速开始

```bash
# 在仓库根目录 contract-spirit/
npm install
npm run seed
npm run dev
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| API | http://localhost:4000 |
| 健康检查 | http://localhost:4000/api/health |

注册：**用户名 + 密码**（邮箱可登录后在「我的」绑定）。  
详细步骤见 [development.md](development.md)。

## 仓库结构

```
contract-spirit/
├── apps/
│   ├── web/              # Next.js 前端  :3000  (@contract-spirit/web)
│   └── api/              # Express+SQLite :4000 (@contract-spirit/api)
├── services/java/        # Spring Boot 脚手架（规划扩展）
├── docs/                 # 本目录
├── package.json          # npm workspaces
└── README.md
```

## 根目录脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动 API + Web |
| `npm run dev:api` | 仅 API |
| `npm run dev:web` | 仅前端 |
| `npm run seed` | 初始化 / 重置演示数据 |
| `npm run build` | 先后构建 API、Web |
| `npm run lint` | 前端 lint |

## 文档索引

| 文档 | 说明 |
|------|------|
| [development.md](development.md) | **本地开发** — 环境、目录、环境变量、调试 |
| [architecture.md](architecture.md) | **技术架构** — 数据流、分层、认证 |
| [api.md](api.md) | **REST API** — 端点、鉴权、错误码 |
| [backend.md](backend.md) | **后端说明** — Express 模块、安全、Java 规划 |
| [data-model.md](data-model.md) | **数据模型** — 表结构、信任分规则 |
| [features.md](features.md) | **功能规格** — 页面与业务行为 |
| [design.md](design.md) | **UI/UX** — 色板、字体、交互 |
| [deployment.md](deployment.md) | **部署** — 环境变量与上线注意 |
| [roadmap-launch.md](roadmap-launch.md) | **三端上线执行计划与时间表**（初审） |
| [contributing.md](contributing.md) | **贡献指南** |

## 当前能力（摘要）

- Monorepo：`apps/web` + `apps/api`，JWT + bcrypt 认证  
- 目标 / 奖励兑现 / 见证人；契约与条款；轻量承诺  
- 通知；创建页语音 + AI 意图解析（可选 OpenAI）  
- 个人资料可补邮箱 / 手机；忘记密码（试验环境返回重置链接）  
- Java `core-service` 健康检查脚手架  

## 远程仓库

- Gitee：https://gitee.com/ragon6749/say-and-done  
- GitHub：https://github.com/Ragon7578/SayAndDone  
