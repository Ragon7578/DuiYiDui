# 契约精神

> 对自己守信，才能对他人守信。

目标达成与自我奖励的承诺管理工具（SayAndDone）。

## 结构

```
contract-spirit/
├── apps/
│   ├── web/              # Next.js 前端 (:3000)
│   └── api/              # Express + SQLite (:4000)
├── services/java/        # Spring Boot 脚手架
├── docs/                 # 工程文档
└── package.json          # npm workspaces
```

## 快速开始

```bash
npm install
npm run seed
npm run dev
```

| 服务 | URL |
|------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |

注册用户名账号后使用（密码 bcrypt；邮箱可登录后绑定）。

```bash
npm run dev:api    # 仅后端
npm run dev:web    # 仅前端
```

## 文档

完整工程说明见 **[docs/README.md](docs/README.md)**：

- [开发指南](docs/development.md)
- [架构](docs/architecture.md)
- [API](docs/api.md)
- [数据模型](docs/data-model.md)
- [功能规格](docs/features.md)
- [设计规范](docs/design.md)

## 远程

- https://gitee.com/ragon6749/say-and-done  
- https://github.com/Ragon7578/SayAndDone  
