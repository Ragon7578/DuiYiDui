# 部署与运维

## 一、本地开发

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 启动

```bash
# 进入前端目录
cd code/frontend

# 安装依赖
npm install

# 启动开发服务器（默认 :3000）
npm run dev
```

### 构建

```bash
npm run build       # 生产构建
npm run start       # 启动生产服务器
```

### 代码检查

```bash
npm run lint        # ESLint
```

---

## 二、部署方案

### 方案 A：Vercel（推荐）

适合 Next.js 项目，零配置部署。

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署（在 code/frontend 目录下）
vercel
```

**注意事项**：
- 根目录设为 `code/frontend`
- 框架自动识别为 Next.js
- 环境变量在 Vercel Dashboard 中配置

### 方案 B：Docker

```dockerfile
# code/frontend/Dockerfile
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
docker build -t contract-spirit ./code/frontend
docker run -p 3000:3000 contract-spirit
```

### 方案 C：静态导出

如果后端完全独立，前端可导出为静态文件：

```bash
# next.config.ts 中设置 output: 'export'
npm run build
# 输出在 code/frontend/out/
```

部署到 Nginx、S3、Cloudflare Pages 等。

---

## 三、环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | 否（当前未使用） |
| `DATABASE_URL` | 数据库连接串 | 否（当前未使用） |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | 否（当前未使用） |

---

## 四、CI/CD（规划中）

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: code/frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## 五、运维检查清单

### 日常维护

- [ ] 依赖更新（`npm outdated` + 定期升级）
- [ ] 构建监控（CI 是否绿色）
- [ ] 依赖漏洞扫描（`npm audit`）

### 上线前

- [ ] 环境变量配置完成
- [ ] 生产构建验证通过
- [ ] HTTPS 已配置
- [ ] 404/错误页面自定义
- [ ] SEO 元信息完善
- [ ] 分析工具接入（如 Vercel Analytics）

---

## 六、监控（规划中）

| 工具 | 用途 |
|------|------|
| Vercel Analytics | 页面访问、性能 |
| Sentry | 前端错误追踪 |
| Uptime Robot | 服务可用性监控 |
