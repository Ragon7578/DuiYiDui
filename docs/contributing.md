# 贡献指南

## 开发流程

1. Fork / Clone 仓库（Gitee 或 GitHub）  
2. `npm install && npm run seed && npm run dev`  
3. 新建分支开发  
4. 自测前后端（需登录态的接口带 JWT）；跑 `npm test`  
5. 提交前 `npm run lint`（前端）  
6. 开 PR / MR，说明动机与测试方式  

回归用例与发版核对清单见 [testing.md](testing.md)。 

## 代码约定

| 区域 | 位置 |
|------|------|
| 前端页面 | `apps/web/src/app` |
| UI 组件 | `apps/web/src/components` |
| API 封装 | `apps/web/src/lib/api.ts`、`api-client.ts` |
| 后端路由 | `apps/api/src/routes` |
| Schema | `apps/api/src/db/schema.ts`（改表需迁移逻辑） |
| 类型 | 尽量同步 `apps/api` 与 `apps/web` 的 `types` |

- 不要提交 `node_modules`、`.next`、`*.db`、真实 `.env`  
- 生产密钥不要写进仓库；文档只用占位符  

## 添加 API 端点

1. 在对应 `routes/*.ts` 增加处理器，默认 `requireAuth`  
2. 如需公开接口，明确不挂 `requireAuth` 并在 [api.md](api.md) 注明  
3. 在 `api-client.ts` 增加前端方法  
4. 更新 [api.md](api.md) / [data-model.md](data-model.md)（若改表）  

## 提交说明

- 用简短中文或英文说明「为什么」  
- 一例：`fix: 资料页保存后刷新信任分展示`  

## 优先级参考

| 级别 | 方向 |
|------|------|
| P0 | 稳定性、鉴权安全、核心目标闭环 |
| P1 | 通知体验、见证流程、创建页 AI |
| P2 | 承诺页产品化、Java 服务落地、部署硬化 |

已完成（勿再标「待做」）：前后端联调、JWT 注册登录、奖励兑现、通知、见证人、AI parse 基础路径。
