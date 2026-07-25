# 契约精神

> 对自己守信，才能对他人守信。

## 背景

你一定听过这些话：

- "如果我瘦到 60 公斤，我就奖励自己一个包包"
- "这个项目做完我就去旅行"
- "今年我一定要读完 20 本书"

**然后呢？**

大多数这样的承诺，最后不了了之。

不是因为做不到，而是因为没有记录、没有追踪、没有人监督。承诺说出口的瞬间很轻松，但兑现的时候却没人记得。

**契约精神** 就是为此而生。

---

## 这是什么？

一个以 **目标达成** 和 **自我奖励** 为核心的承诺管理工具。

你设定一个目标，约定达成后的奖励，然后追踪进度。做到了，奖励就是你的；做不到，承诺就是空的。

### 核心理念

- **对自己诚实** — 记录每一个承诺，不留模糊空间
- **用奖励激励履约** — 目标达成后的奖励是最好的动力
- **让违约有代价** — 承诺被记录，赖不掉
- **信任可视化** — 你的履约记录就是你的信用档案

## 快速开始

```bash
cd code/frontend
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 构建 | Turbopack |

## 项目结构

```
contract-spirit/
├── docs/           # 项目文档
└── code/           # 代码
    ├── frontend/   # 前端应用
    └── backend/    # 后端服务（待开发）
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [vision.md](vision.md) | 产品愿景 — 为什么做、设计理念、目标 |
| [features.md](features.md) | 功能说明 — 目标管理、奖励系统、契约追踪 |
| [architecture.md](architecture.md) | 技术架构 — 前端分层、组件设计、类型系统 |
| [design.md](design.md) | UI/UX 设计 — 色彩系统、页面布局、交互规范 |
| [data-model.md](data-model.md) | 数据模型 — 目标、奖励、契约等核心数据定义 |
| [business.md](business.md) | 商业模式 — 用户群、盈利模式、市场策略 |
| [competitors.md](competitors.md) | 竞品分析 |
| [deployment.md](deployment.md) | 部署运维 |
| [contributing.md](contributing.md) | 贡献指南 |

## 路线图

- [x] 目标设定与追踪
- [x] 奖励绑定机制
- [x] 承诺记录与状态管理
- [x] 信任评分看板
- [ ] 用户认证
- [ ] 奖励兑现流程
- [ ] 通知与提醒
- [ ] 后端 API 与数据持久化
- [ ] 社交监督（好友见证）
