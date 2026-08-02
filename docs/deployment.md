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
# 建议同时填 SUPPORT_EMAIL、FEEDBACK_ADMIN_KEY；公网保持 EXPOSE_RESET_URL=false

docker compose up -d --build
# 若无 compose 插件：docker-compose up -d --build
# 或一键：npm run deploy:staging（自动选择 compose / docker-compose）
```

- Web: http://localhost:3000  
- API 健康检查: http://localhost:4000/api/health  
- 数据卷: `cs_data` → 容器内 `/data/contract-spirit.db`  
- Compose 已带 `healthcheck`；`web` 在 `api` healthy 后再起  

公网推荐：先 Compose 起服务，再在前面挂 HTTPS 反代。示例配置见 **[deploy/Caddyfile](../deploy/Caddyfile)**（把 `app.example.com` / `api.example.com` 换成你的域名，并改 `.env` 中的 `APP_URL` / `FRONTEND_ORIGIN` / `NEXT_PUBLIC_API_URL`）。

**上线日历（2026-08-05）：** [roadmap/launch-2026-08-05.md](./roadmap/launch-2026-08-05.md)。

### 域名 / DNS / HTTPS 清单（F0）

| 步骤 | 说明 |
|------|------|
| 1 | 购买域名，A/AAAA 指到云主机 |
| 2 | 开放 80/443；API/Web 可只绑本机 3000/4000 |
| 3 | 安装 Caddy（或 Nginx + 证书），加载 `deploy/Caddyfile` |
| 4 | `.env` 全部改为 `https://…` 后 **重建 web**（`NEXT_PUBLIC_*` 构建期写入） |
| 5 | `curl https://api…/api/health` 与浏览器打开 Web |

首次需要演示数据时（**会清库，生产慎用**）：

```bash
# 生产 api 镜像无 tsx：在宿主机对卷内文件 seed，或空库直接注册
DB_PATH=... npm run seed -w @contract-spirit/api
```

更稳妥：公网空库直接注册，不必 seed。

冒烟（API 已启动时）：

```bash
API_URL=http://localhost:4000 npm run smoke
# 若开启邀请码: REGISTRATION_INVITE_CODE=你的码 npm run smoke
```

一键 Staging（本机 Compose + 健康检查 + 冒烟）：

```bash
cp .env.example .env && 编辑 JWT_SECRET 等
npm run deploy:staging
```

完整 §0.1 验收见 [roadmap/f3-launch-checklist.md](./roadmap/f3-launch-checklist.md)。

## 三、环境变量

### API

| 变量 | 要求 |
|------|------|
| `JWT_SECRET` | **生产必填强随机** |
| `APP_URL` | 前端公网源（重置密码链接） |
| `FRONTEND_ORIGIN` | CORS 允许的前端源 |
| `PORT` | 默认 4000 |
| `DB_PATH` | SQLite 文件路径 |
| `EXPOSE_RESET_URL` | 生产建议 `false`；本地开发默认可开 |
| `SUPPORT_EMAIL` | 人工重置文案中的值班邮箱 |
| `FEEDBACK_ADMIN_KEY` | 拉取反馈列表的密钥 |
| `REGISTRATION_INVITE_CODE` | 可选；设置后注册须填相同邀请码（邀请制） |
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
  EXPOSE_RESET_URL=false SUPPORT_EMAIL=... FEEDBACK_ADMIN_KEY=... \
  npm run start -w @contract-spirit/api
NEXT_PUBLIC_API_URL=https://api.example.com npm run start -w @contract-spirit/web
```

## 五、上线前检查（反馈上线）

- [ ] HTTPS  
- [ ] 更换 `JWT_SECRET`  
- [ ] CORS / `FRONTEND_ORIGIN`  
- [ ] `EXPOSE_RESET_URL=false`，已设 `SUPPORT_EMAIL`  
- [ ] 数据目录持久化；已跑过备份脚本或平台自动备份  
- [ ] `/feedback` 可提交；`GET /api/feedback` + Admin Key 可列出  
- [ ] 隐私/用户协议可打开  
- [ ] 注册 → 创建带奖励目标 → 达成 → 兑奖 冒烟通过（`npm run smoke`）  
- [ ] `GET /api/health` 正常  

## 六、密码重置（F3 前临时方案）

| 阶段 | 行为 |
|------|------|
| 本地 / `EXPOSE_RESET_URL=true` | 响应可含 `resetUrl`；服务端亦打日志 |
| 公网 Staging / 生产 | **不**返回明文链接；用户联系 `SUPPORT_EMAIL` 或走意见反馈；值班在 API 日志中取 `[password-reset]` 链接协助（30 分钟有效） |
| 正式邮件 | 接入 SMTP/Resend 等后发信，并保持不暴露 `resetUrl` |

值班协助步骤：确认用户身份 → 让用户再点一次「忘记密码」→ 在 API 日志复制链接发给用户 → 或请用户改用已知设备登录后改密。

## 七、反馈值班

```bash
curl -s "$API_URL/api/feedback?limit=50" \
  -H "X-Feedback-Admin-Key: $FEEDBACK_ADMIN_KEY"
```

建议每周五把 Top 问题写入 [roadmap/progress](./roadmap/progress/)。

## 八、SQLite 备份

```bash
bash scripts/backup-sqlite.sh
# 或: DB_PATH=/path/to/contract-spirit.db bash scripts/backup-sqlite.sh
```

备份文件默认落在仓库 `backups/`（已 gitignore）。初版可用卷内 SQLite；流量上来后再迁 Postgres，不挡反馈上线。

## 九、健康检查

```http
GET /api/health → { "status": "ok", "timestamp": "...", "version": "initial-fast-launch" }
```
