# 契约精神 · 项目工程文档

> 本目录与**代码**放在一起：开发、架构、API、数据模型等。  
> 对外项目说明：**[契约精神.md](契约精神.md)**（与工作区 `project/docs/` 同源；PPT 暂缓）

口号：对自己守信，才能对他人守信。

## 快速开始

```bash
# 在 contract-spirit/ 根目录
npm install && npm run seed && npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) — 注册用户名账号后登录。  
详细步骤见 [development.md](development.md)。

## 项目结构

```
contract-spirit/
├── apps/
│   ├── web/           # Next.js 前端 (:3000)
│   └── api/           # Express + SQLite 后端 (:4000)
├── services/
│   └── java/          # Spring Boot 微服务 (:8081)
├── docs/              # 本目录：工程 / 产品规格文档
└── package.json
```

## 文档索引（代码侧）

| 文档 | 说明 |
|------|------|
| [features.md](features.md) | 功能规格 — 目标、奖励、契约、信任分 |
| [architecture.md](architecture.md) | 技术架构 |
| [design.md](design.md) | UI/UX 设计规范 |
| [data-model.md](data-model.md) | 数据模型与 Schema |
| [development.md](development.md) | 本地开发指南 |
| [api.md](api.md) | REST API 参考 |
| [backend.md](backend.md) | 后端架构说明 |
| [deployment.md](deployment.md) | 部署运维 |
| [contributing.md](contributing.md) | 贡献指南 |

## 对外说明

| 文档 | 说明 |
|------|------|
| [契约精神.md](契约精神.md) | 项目说明整合文档（愿景、功能、操作、现状） |

> PPT 暂缓，待说明文档定稿后再补。

## 路线图

- [x] 目标设定与追踪
- [x] 奖励绑定机制
- [x] 承诺记录与状态管理
- [x] 信任评分看板
- [x] 后端 REST API（Express + SQLite）
- [x] 前后端联调
- [x] 用户认证（JWT 登录/注册）
- [x] 奖励兑现流程
- [x] 通知与提醒
- [x] 社交监督（好友见证）
- [x] Java 微服务后端（core-service 脚手架）
