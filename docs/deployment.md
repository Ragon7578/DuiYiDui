# 部署说明

> 仓库内**尚无**正式 Dockerfile / GitHub Actions；下文描述与**当前代码匹配**的部署注意，以及可选的后续方案。

## 一、运行时组成

| 进程 | 说明 |
|------|------|
| `apps/api` | Node 服务，持久化 SQLite 目录 |
| `apps/web` | Next.js（`next start` 或托管到 Node/Vercel 等） |

Java 服务可选，不阻挡主路径。

## 二、必须配置的环境变量

### API

| 变量 | 要求 |
|------|------|
| `JWT_SECRET` | **生产强随机，禁止用开发默认值** |
| `APP_URL` | 前端公网源，如 `https://app.example.com`（重置密码链接） |
| `PORT` | 按托管平台 |
| `OPENAI_API_KEY` | 可选 |

### Web

| 变量 | 要求 |
|------|------|
| `NEXT_PUBLIC_API_URL` | 浏览器可访问的 API 根 URL |

**未使用：** NextAuth（`NEXTAUTH_*`）、`DATABASE_URL`（当前非 Postgres）。

## 三、数据持久化

- 默认文件：`apps/api/data/contract-spirit.db`  
- 容器 / 多实例部署时需挂卷或改为集中式数据库（需改代码）  
- 备份：定期拷贝 db 文件（注意 WAL 模式下的 `-wal`/`-shm`）  

## 四、推荐启动顺序

```bash
npm install
# 生产构建
npm run build
# API
NODE_ENV=production JWT_SECRET=... APP_URL=... npm run start -w @contract-spirit/api
# Web（另进程或平台）
NEXT_PUBLIC_API_URL=https://api.example.com npm run start -w @contract-spirit/web
```

首次或空库可执行 `npm run seed`（**会清数据**，生产慎用）。

## 五、安全清单

- [ ] 更换 `JWT_SECRET`  
- [ ] CORS 限制为前端域名（改 `apps/api` 入口配置）  
- [ ] HTTPS  
- [ ] 不要暴露 SQLite 目录  
- [ ] 正式发信前，去掉 forgot-password 响应中的 `resetUrl` 或仅日志  
- [ ] 限流（登录 / 重置密码）— 待增强  

## 六、密码重置（试验 → 正式）

| 阶段 | 行为 |
|------|------|
| 当前 | API 返回 `resetUrl` + `console.log` |
| 正式 | 接入邮件服务，响应仅通用成功文案 |

## 七、后续可选项（未实现）

- Docker Compose（api + web + volume）  
- CI：lint + build  
- 迁 Postgres / 托管 SQLite  
- 反向代理与健康检查探针：`GET /api/health`  

## 八、健康检查

```http
GET /api/health → { "status": "ok", "timestamp": "..." }
```
