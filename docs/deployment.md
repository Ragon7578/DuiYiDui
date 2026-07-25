# 部署与运维

## 一、本地开发

完整步骤见 [development.md](development.md)。

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 启动全部服务

```bash
# 终端 1 — 后端
cd apps/api
npm install && npm run seed && npm run dev    # :4000

# 终端 2 — 前端
cd apps/web
npm install && npm run dev                    # :3000
```

### 构建

```bash
# 前端
cd apps/web
npm run build && npm run start

# 后端
cd apps/api
npm run build && npm run start
```

### 代码检查

```bash
cd apps/web && npm run lint
```

---

## 二、部署方案

### 方案 A：Vercel + Railway（推荐）

| 服务 | 平台 | 说明 |
|------|------|------|
| 前端 | Vercel | Next.js 零配置部署 |
| 后端 | Railway / Render | Node.js + SQLite 持久卷 |

**前端部署（Vercel）**：

```bash
npm i -g vercel
cd apps/web
vercel
```

- 根目录设为 `apps/web`
- 环境变量：`NEXT_PUBLIC_API_URL=https://your-api.railway.app`

**后端部署（Railway）**：

```bash
cd apps/api
# Railway 自动检测 package.json，启动命令：npm run build && npm run start
```

- 环境变量：`PORT=4000`
- 挂载持久卷到 `data/` 目录以保留 SQLite 数据库

### 方案 B：Docker Compose

```yaml
# docker-compose.yml（项目根目录）
services:
  backend:
    build: ./apps/api
    ports:
      - "4000:4000"
    volumes:
      - backend-data:/app/data
    environment:
      - PORT=4000

  frontend:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:4000
    depends_on:
      - backend

volumes:
  backend-data:
```

**后端 Dockerfile**：

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start"]
```

**前端 Dockerfile**：

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
```

```bash
docker compose up -d
```

### 方案 C：静态导出（仅前端）

如果后端完全独立部署，前端可导出为静态文件：

```bash
# next.config.ts 中设置 output: 'export'
cd apps/web
npm run build
# 输出在 out/
```

部署到 Nginx、S3、Cloudflare Pages 等。

---

## 三、环境变量

### 前端

| 变量 | 说明 | 必填 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | 联调后必填 |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | 认证功能后必填 |
| `NEXTAUTH_URL` | 应用 URL | 认证功能后必填 |

### 后端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `4000` | API 监听端口 |
| `DATABASE_URL` | 内置 SQLite 路径 | 生产可换 PostgreSQL |

---

## 四、CI/CD

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
```

---

## 五、运维检查清单

### 日常维护

- [ ] 依赖更新（`npm outdated` + 定期升级）
- [ ] 构建监控（CI 是否绿色）
- [ ] 依赖漏洞扫描（`npm audit`）
- [ ] SQLite 数据库备份（`data/contract-spirit.db`）

### 上线前

- [ ] 环境变量配置完成
- [ ] 前后端生产构建验证通过
- [ ] HTTPS 已配置
- [ ] CORS 限制为生产域名
- [ ] 404/错误页面自定义
- [ ] SEO 元信息完善
- [ ] 数据库持久卷已挂载

---

## 六、监控（规划中）

| 工具 | 用途 |
|------|------|
| Vercel Analytics | 页面访问、性能 |
| Sentry | 前后端错误追踪 |
| Uptime Robot | 服务可用性监控 |
| `/api/health` | 后端健康检查端点 |
