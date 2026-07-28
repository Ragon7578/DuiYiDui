# 测试与回归

> 目标：每次改代码 / 上线前，用自动化回归守住核心能力，避免「我的 / 他人」闭环被无意破坏。

## 怎么跑

```bash
# 仓库根目录
npm install
npm test           # API 集成测试 + Web 角色单测
npm run test:api   # 仅 API
npm run test:web   # 仅 Web（roles）
```

API 测试使用临时 SQLite（`DB_PATH`），不触碰本地 `apps/api/data/*.db`。  
`NODE_ENV=test` 时关闭内存限流，避免注册用例互相踩 429。

## 自动化覆盖（当前）

| 套件 | 文件 | 覆盖点 |
|------|------|--------|
| 认证 | `apps/api/src/test/auth.test.ts` | 健康检查、注册/登录校验、JWT、用户列表 |
| 我的 | `apps/api/src/test/goals.test.ts` | 创建校验、进度达成、兑奖、放弃、隔离、见证人 |
| 他人 | `apps/api/src/test/contracts.test.ts` | 真实用户校验、成员可见性、履约/违约结算与幂等 |
| 资料通知 | `apps/api/src/test/profile-notifications.test.ts` | 资料更新、统计、通知已读、反馈 |
| 角色 IA | `apps/web/src/lib/roles.test.ts` | `?set=` 解析与「我的 / 他人」路由文案 |

## 用例库（上线前核对）

下列用例与产品规格对齐；已有自动化的标 **自动**，其余为发版前手测清单。

### A. 账号

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| A1 | 合法用户名+密码注册 | 201 + token + trustScore=50 | 自动 |
| A2 | 用户名过短 / 密码过短 | 400 | 自动 |
| A3 | 重复用户名 | 409 | 自动 |
| A4 | 正确/错误密码登录 | 200 / 401 | 自动 |
| A5 | 无 token 访问业务接口 | 401 | 自动（me） |
| A6 | 忘记密码（已绑邮箱） | 返回重置链接（试验环境） | 手测 |
| A7 | 重置密码后可新密码登录 | 旧 token/密码失效，新密码可用 | 手测 |

### B. 我的（Self / `/goals`）

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| B1 | 缺 reward 创建 | 400 | 自动 |
| B2 | 创建承诺 | active、progress=0、totalGoals+1 | 自动 |
| B3 | progress→100 | status=achieved，主人信任分 +5 | 自动 |
| B4 | 兑奖 | reward_claimed；二次兑奖 400 | 自动 |
| B5 | 放弃 | abandoned，信任分 -5 | 自动 |
| B6 | 用户 A 读 B 的承诺 | 404 / 列表为空 | 自动 |
| B7 | 邀请真实见证人 | pending + 通知；重复邀请 409 | 自动 |
| B8 | 见证人确认后主人达成 | 见证人 +3 与成就通知 | 自动 |
| B9 | 首页「待兑现」可一点兑奖 | UI 可达 | 手测 |
| B10 | `/create?set=self` 与旧 `goal` | 打开自我承诺表单 | 手测 + roles 自动 |

### C. 他人（Supervise / `/contracts`）

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| C1 | 无对方 / 仅自己 / 无条款 | 400 | 自动 |
| C2 | 用 id 或用户名指定真实用户 | 双方进 parties | 自动 |
| C3 | 非参与方访问详情 | 404 | 自动 |
| C4 | 部分条款履约 | 约定仍 active | 自动 |
| C5 | 全部履约 | completed，各方 +10，仅一次 | 自动 |
| C6 | 任一违约 | breached，各方 -15 | 自动 |
| C7 | `/create?set=others` 与旧 supervise/contract | 打开约定表单；选人排除自己 | 手测 + roles 自动 |
| C8 | 导航文案「我的 / 他人」 | 登录后可见；路由仍为 /goals /contracts | 手测 |

### D. 通知与资料

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| D1 | 见证邀请通知 | 仅见证人列表可见 | 自动 |
| D2 | 标记已读 / 全部已读 | unread-count→0 | 自动 |
| D3 | 资料补邮箱手机 | 登录名不变；校验格式 | 自动 |
| D4 | `/profile/stats` | 含 goals/contracts 计数 | 自动 |
| D5 | 截止日前 3 天提醒 | 至多生成一次 | 手测 |

### E. 发版最低门槛（DoD）

上线或合并影响业务的 PR 前：

1. `npm test` 全绿  
2. `npm run build` 通过  
3. 手测：**注册 → 创建我的（带奖励）→ 进度 100 → 兑奖** 一遍  
4. 若改了约定/选人：再手测 **创建他人约定 → 履约一条 / 违约一条**  
5. 若改了导航/创建选角：核对「我的 / 他人」文案与 `?set=` 兼容  

## 如何加用例

1. **API 行为**：在 `apps/api/src/test/` 用 `supertest` + `helpers.ts` 增补；命名对齐场景。  
2. **纯函数 / 角色解析**：放 `apps/web/src/**/*.test.ts`。  
3. **同步本文件用例表**：新能力先写进表，再标「自动」或「手测」。  
4. 勿依赖开发库数据；一律临时 `DB_PATH`。

## 已知实现注意

- 约定条款结算：终态（completed / breached）只加减信任分一次（见 `syncAgreementStatusFromClauses`）。  
- 限流在测试环境关闭；生产仍生效。  
- 浏览器 E2E（Playwright 等）尚未接入；上表「手测」项优先补自动化时可从此开刀。
