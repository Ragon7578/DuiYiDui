# 契约精神

> 对自己守信，才能对他人守信。

目标达成与自我奖励的承诺管理工具。

## 项目结构

```
contract-spirit/
├── apps/
│   ├── web/              # Next.js 前端 (:3000)
│   └── api/              # Express + SQLite 后端 (:4000)
├── services/
│   └── java/             # Spring Boot 微服务 (:8081)
├── docs/                 # 工程文档（开发 / API / 架构）
└── package.json          # Monorepo 根配置
```

工作区对外文档（PPT、使用说明等）在上一级：`../docs/`。

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
npm run seed

# 同时启动前后端
npm run dev
```

或分别启动：

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:3000
```

先注册用户名账号再使用（试验功能，密码 bcrypt 加密，无需邮箱）

## 文档

| 位置 | 内容 |
|------|------|
| [docs/契约精神.md](docs/契约精神.md) | 对外项目说明（整合文档） |
| [docs/](docs/README.md) | 工程文档：开发、API、架构、功能规格 |
