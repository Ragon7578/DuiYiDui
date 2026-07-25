# 贡献指南

## 一、开发流程

```
Fork → Clone → 创建分支 → 开发 → 测试 → PR
```

### 1. Fork & Clone

```bash
# Fork 后 clone 你的版本
git clone https://github.com/你的用户名/contract-spirit.git
cd contract-spirit
```

### 2. 创建分支

```bash
git checkout -b feature/你的功能名
# 或
git checkout -b fix/你的修复名
```

### 3. 开发

**前端**（`apps/web/`）：

```bash
cd apps/web
npm install
npm run dev          # http://localhost:3000
npm run build        # 确保 build 通过
npm run lint         # ESLint 检查
```

**后端**（`apps/api/`）：

```bash
cd apps/api
npm install
npm run seed         # 初始化数据库
npm run dev          # http://localhost:4000
npm run build        # 确保编译通过
```

完整开发指南见 [development.md](development.md)。

### 4. 提交 PR

- 描述清晰的变更内容
- 关联相关 Issue（如有）
- 确保 CI 通过

---

## 二、代码规范

### 通用规范

| 规范 | 要求 |
|------|------|
| 语言 | TypeScript（严格模式） |
| 缩进 | 2 空格 |
| 引号 | 双引号 |
| 分号 | 必须 |
| 命名 | camelCase（变量/函数）、PascalCase（组件/类型） |
| 文件命名 | kebab-case（目录），PascalCase（组件文件） |

### TypeScript

```typescript
// 优先使用 interface 而非 type（对象类型）
interface UserProps {
  name: string
  age: number
}

// 导出的函数/组件需显式标注返回类型
export function formatDate(date: string): string { ... }

// 避免 any
// 禁止使用：any
```

### React / Next.js

```typescript
// 组件使用 function 声明
export function MyComponent({ prop }: MyComponentProps) { ... }

// Props 类型导出
export interface MyComponentProps { ... }

// 客户端组件标注 "use client"
"use client"
export function InteractiveComponent() { ... }
```

### CSS

- 使用 Tailwind utility class
- 避免自定义 CSS（特殊情况在 `globals.css` 中处理）
- 颜色使用 Tailwind 语义色板

---

## 三、Git 规范

### 分支命名

| 前缀 | 说明 |
|------|------|
| `feature/` | 新功能 |
| `fix/` | Bug 修复 |
| `refactor/` | 重构 |
| `docs/` | 文档修改 |
| `chore/` | 构建/工具链 |

### 提交信息

```
<类型>(<范围>): <简短描述>

示例:
feat(contract): add contract signing flow
fix(navbar): correct active route highlight
docs(readme): update quick start guide
```

### 类型

- `feat` — 新功能
- `fix` — Bug 修复
- `refactor` — 重构
- `docs` — 文档
- `style` — 样式（不影响逻辑）
- `chore` — 构建/工具链
- `test` — 测试

---

## 四、项目结构规范

### 添加新页面

1. 在 `src/app/` 下创建对应路由目录
2. 创建 `page.tsx`
3. 如需布局，创建 `layout.tsx`

### 添加新组件

```
src/components/
├── ui/           # 通用 UI 组件（Button, Card, Input...）
├── <domain>/     # 业务组件（contract, pledge...）
└── layout/       # 布局组件（Navbar, Sidebar, Footer...）
```

### 添加新工具函数

放在 `src/lib/` 下，按职责拆分文件：
- `types.ts` — 类型定义
- `utils.ts` — 通用函数
- `api.ts` — API 调用封装（待实现）
- `constants.ts` — 常量

### 添加新 API 端点

1. 在 `apps/api/src/types.ts` 添加类型
2. 在 `apps/api/src/routes/` 添加路由
3. 更新 [api.md](api.md)
4. 在前端 `src/lib/api.ts` 添加调用函数

---

## 五、PR 规范

### PR 模板

```markdown
## 变更描述

清楚描述本次 PR 的内容和目的。

## 关联 Issue

Closes #(issue 号)

## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档
- [ ] 其他

## 测试

- [ ] 本地 build 通过
- [ ] 手动测试通过

## 截图（可选）

如果涉及 UI 变更，请附上截图。
```

---

## 六、开发路线

### 当前优先事项

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | 前后端联调 | ~~前端替换 mock-data，调用 REST API~~ ✅ |
| P0 | 用户认证 | ~~JWT 登录/注册~~ ✅ |
| P1 | 创建表单提交 | `/create` 页面提交到 API |
| P1 | 通知系统 | 到期提醒、目标进度 |
| P2 | 移动端适配 | 响应式优化，移动端导航 |
| P2 | 测试覆盖 | 单元测试 + E2E 测试 |
