# 部署说明（初版快速上线）

> 目标：尽快公网 Web 可访问并收反馈。详见 [roadmap/fast-launch.md](./roadmap/fast-launch.md)。

## 一、组成

| 进程 | 说明 |
|------|------|
| `apps/api` | Express + SQLite（可用卷持久化） |
| `apps/web` | Next.js |

## 二、最快路径：Docker Compose

```bash
cp .env.example .env
# 编辑 JWT_SECRET、APP_URL、FRONTEND_ORIGIN、NEXT_PUBLIC_API_URL

docker compose up -d --build
```

- Web: http://localhost:3000  
- API 健康检查: http://localhost:4000/api/health  
- 数据卷: `cs_data` → 容器内 `/data/contract-spirit.db`  

公网时在前面加 HTTPS 反代（Caddy / Nginx / 云负载均衡），并把 `APP_URL` / `FRONTEND_ORIGIN` / `NEXT_PUBLIC_API_URL` 改成公网域名。

首次需要演示数据时（**会清库，生产慎用**）：

```bash
docker compose exec api node --import tsx apps/api/src/db/seed.ts
# 若镜像未带 tsx，可在宿主机：
DB_PATH=... npm run seed -w @contract-spirit/api
```

更稳妥：公网空库直接注册，不必 seed。

## 三、环境变量

### API

| 变量 | 要求 |
|------|------|
| `JWT_SECRET` | **生产必填强随机** |
| `APP_URL` | 前端公网源（重置密码链接） |
| `FRONTEND_ORIGIN` | CORS 允许的前端源 |
| `PORT` | 默认 4000 |
| `DB_PATH` | SQLite 文件路径 |
| `OPENAI_API_KEY` | 可选 |

### Web

| 变量 | 要求 |
|------|------|
| `NEXT_PUBLIC_API_URL` | 浏览器可访问的 API 根 URL（**构建时写入**） |

## 四、不用 Docker 时

```bash
npm install
npm run build
NODE_ENV=production JWT_SECRET=... APP_URL=... FRONTEND_ORIGIN=... \
  npm run start -w @contract-spirit/api
NEXT_PUBLIC_API_URL=https://api.example.com npm run start -w @contract-spirit/web
```

## 五、上线前检查（反馈上线）

- [ ] HTTPS  
- [ ] 更换 `JWT_SECRET`  
- [ ] CORS / `FRONTEND_ORIGIN`  
- [ ] 数据目录持久化与备份意识  
- [ ] `/feedback` 可提交；隐私/用户协议可打开  
- [ ] 注册 → 创建带奖励目标 → 达成 → 兑奖 冒烟通过  
- [ ] `GET /api/health` 正常  

## 六、密码重置

| 阶段 | 行为 |
|------|------|
| 当前 | API 可能返回 `resetUrl` + 服务端日志（试验） |
| 正式 | 接入邮件服务后去掉响应中的明文链接 |

## 七、健康检查

```http
GET /api/health → { "status": "ok", "timestamp": "...", "version": "initial-fast-launch" }
```
