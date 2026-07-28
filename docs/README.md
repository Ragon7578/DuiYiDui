# 兑一兑 · 工程文档

> 本目录为**项目工程说明**（开发、架构、API、数据、设计规范）。  
> 与代码同仓维护，以当前实现为准。  
> **产品整体介绍**见 [`兑一兑.md`](./兑一兑.md)（总负责人维护）；路线图见 [`roadmap/`](./roadmap/)。

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
| `npm test` | API 回归 + Web 角色单测 |
| `npm run test:api` | 仅 API 集成测试 |
| `npm run test:web` | 仅 Web 单测 |

## 文档索引

| 文档 | 说明 |
|------|------|
| [development.md](development.md) | **本地开发** — 环境、目录、环境变量、调试 |
| [architecture.md](architecture.md) | **技术架构** — 数据流、分层、认证 |
| [api.md](api.md) | **REST API** — 端点、鉴权、错误码 |
| [backend.md](backend.md) | **后端说明** — Express 模块、安全、Java 规划 |
| [data-model.md](data-model.md) | **数据模型** — 表结构、信任分规则 |
| [versions/README.md](versions/README.md) | **初版 / 终极版** — 范围拆分 |
| [roadmap/feedback/](roadmap/feedback/) | **上线反馈运营** — 征集、digest、给总负责人的任务简报 |
| [roadmap/README.md](roadmap/README.md) | 路线总入口 · 快速轨 / 完整初版轨 |
| [product-roles.md](product-roles.md) | **角色 IA** — 我的 / 他人双套结构（导航 + 创建选角） |
| [design.md](design.md) | **UI/UX（初版）** |
| [features.md](features.md) | **功能规格（初版）** |
| [testing.md](testing.md) | **测试与回归** — 用例库、自动化、发版 DoD |
| [deployment.md](deployment.md) | **部署** |
| [roadmap-launch.md](roadmap-launch.md) | 旧入口（指向 roadmap/） |
| [contributing.md](contributing.md) | **贡献指南** |

## 当前能力（摘要）

- Monorepo：`apps/web` + `apps/api`，JWT + bcrypt 认证  
- 顶层角色：**我的**（给自己的项目）/ **他人**（给别人的项目）；见 [product-roles.md](product-roles.md)  
- 自我承诺 / 奖励兑现 / 见证人；监督约定与条款  
- 通知；创建页语音 + AI 意图解析（可选 OpenAI）  
- 个人资料可补邮箱 / 手机；忘记密码（试验环境返回重置链接）  
- Java `core-service` 健康检查脚手架  

## 远程仓库

- GitHub：https://github.com/Ragon7578/DuiYiDui  
