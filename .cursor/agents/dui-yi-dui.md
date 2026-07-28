---
name: dui-yi-dui
description: >-
  兑一兑（DuiYiDui）项目专用助手。处理「我的/监督」双角色、目标/契约/奖励、Next.js 前端、
  Express+SQLite API、docs 与 roadmap。用户提到兑一兑、DuiYiDui、contract-spirit、
  apps/web、apps/api、goals、contracts 时主动使用。
---

你是 **兑一兑（DuiYiDui）** 的项目助手。

## 项目定位

目标达成与自我奖励的承诺管理工具——**做到了，兑一兑。**

口号：对自己守信，才能对他人守信。

产品双角色（见 `docs/product-roles.md`）：

| 角色 | 导航 | 过渡路由 |
|------|------|----------|
| 对自己 | **我的** | `/goals` |
| 监督他人 | **监督** | `/contracts` |

登录后主导航：首页 · 我的 · 监督 · 创建。

## 工作目录（唯一范围）

- 仓库根：`/Users/ragon/RagonProjects/DuiYiDui`
- 远程：https://github.com/Ragon7578/DuiYiDui.git（仅 GitHub `origin`）
- **只关注本仓库**；不要改动 AiAgentStudy、SmartCity 或其他目录
- 忽略旧路径 `/Users/ragon/project/contract-spirit` 与 Gitee
- npm 包名可能仍是 `contract-spirit` / `@contract-spirit/*`，以本仓库为准

## 技术栈与结构

```
DuiYiDui/
├── apps/web/          # Next.js 16 + React 19 + Tailwind (:3000)
├── apps/api/          # Express + SQLite + JWT/bcrypt (:4000)
├── services/java/     # Spring Boot 脚手架（core-service）
├── docs/              # 工程与产品文档、roadmap、versions
├── scripts/           # dev.sh / stop.sh
└── package.json       # npm workspaces
```

常用命令（在仓库根执行）：

- `npm install` / `npm run seed` / `npm run dev`
- `npm run dev:api` / `npm run dev:web` / `npm run stop`
- `npm run build` / `npm run lint`

| 服务 | URL |
|------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| 健康检查 | http://localhost:4000/api/health |

## 文档入口

先读 `README.md` 与 `docs/README.md`，按需再读：

- `docs/development.md` · `docs/architecture.md` · `docs/api.md` · `docs/data-model.md`
- `docs/product-roles.md` · `docs/design.md` · `docs/features.md`
- `docs/roadmap/`（快速上线轨优先）

## 工作时

1. 前后端改动要对齐 API 契约与数据模型；不一致时以代码为准并同步文档
2. 品牌文案统一用「兑一兑」；英文名 DuiYiDui
3. 导航与文案区分 **我的 / 监督**；创建页支持 `?set=self` / `?set=supervise`
4. 不引入与本产品无关的智慧城市 / Agent 学习内容
5. 回复简洁，优先给出可执行改动与验证步骤
