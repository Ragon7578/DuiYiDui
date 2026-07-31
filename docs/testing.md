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
| 认证 | `apps/api/src/test/auth.test.ts` | 健康检查（含 db）、注册/登录、邀请码策略、忘记/重置密码、JWT、用户列表 |
| 我的 | `apps/api/src/test/goals.test.ts` | 创建校验、进度达成、兑奖、待兑现列表、放弃、隔离、见证人（含用户名邀请/拒绝） |
| 他人 | `apps/api/src/test/contracts.test.ts` | 真实用户校验、成员可见性、履约/违约结算与幂等、编辑删除 |
| 解锁 | `apps/api/src/test/role-unlock.test.ts` | 达成 3 个自身计划解锁「他人」、未解锁禁创建、重复解锁幂等 |
| 资料通知 | `apps/api/src/test/profile-notifications.test.ts` | 资料更新、统计、截止提醒、通知已读、反馈校验 |
| AI | `apps/api/src/test/ai.test.ts` | 规则解析目标文本、空输入拒绝 |
| DB 运维 | `apps/api/src/test/db-admin.test.ts` | 管理员密钥鉴权、health/stats |
| 角色 IA | `apps/web/src/lib/roles.test.ts` | `?set=` 解析、「我的 / 他人」路由文案、解锁剩余数 |

## 用例库（与主要功能对齐）

### A. 账号（P0 / P1）

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| A1 | 合法用户名+密码注册 | 201 + token + trustScore=50 | 自动 |
| A2 | 用户名过短 / 密码过短 | 400 | 自动 |
| A3 | 重复用户名 | 409 | 自动 |
| A4 | 正确/错误密码登录 | 200 / 401 | 自动 |
| A5 | 无 token 访问业务接口 | 401 | 自动（me） |
| A6 | 忘记密码（已绑邮箱） | 返回 resetUrl（试验环境） | 自动 |
| A7 | 重置密码后可新密码登录 | 旧密码 401，新密码 200 | 自动 |
| A8 | 注册邀请码策略 | 默认不要求；开启后无码 403 / 有码 201 | 自动 |
| A9 | 健康检查含 DB | `db.ok` / integrity | 自动 |

### B. 我的（Self / `/goals`，P0）

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| B1 | 缺 reward 创建 | 400 | 自动 |
| B2 | 创建承诺 | active、progress=0 | 自动 |
| B3 | progress→100 | status=achieved，主人信任分 +5 | 自动 |
| B4 | 兑奖 | reward_claimed；二次兑奖 400 | 自动 |
| B5 | 放弃 | abandoned，信任分 -5 | 自动 |
| B6 | 用户 A 读 B 的承诺 | 404 / 列表为空 | 自动 |
| B7 | 邀请真实见证人 | pending + 通知；重复邀请 409 | 自动 |
| B8 | 见证人确认后主人达成 | 见证人 +3 与成就通知 | 自动 |
| B9 | 列表暴露待兑现 | achieved + rewardClaimed=false | 自动 |
| B10 | 达成通知 | goal_achieved + reward_ready | 自动 |
| B11 | 按用户名创建时邀请见证人 | 见证列表含对方；可拒绝且不加分 | 自动 |
| B12 | `/create?set=self` 与旧 `goal` | 打开自我承诺表单 | 手测 + roles 自动 |

### C. 他人（Supervise / `/contracts`，P0 解锁 + P1 约定）

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| C0 | 未解锁创建约定 | 403 `SUPERVISE_LOCKED` | 自动 |
| C0b | 达成 3 个自身计划后解锁 | `superviseUnlocked=true`；可创建 | 自动 |
| C1 | 无对方 / 仅自己 / 无条款 | 400 | 自动 |
| C2 | 用 id 或用户名指定真实用户 | 双方进 parties | 自动 |
| C3 | 非参与方访问详情 | 404 | 自动 |
| C4 | 部分条款履约 | 约定仍 active | 自动 |
| C5 | 全部履约 | completed，各方 +10，仅一次 | 自动 |
| C6 | 任一违约 | breached，各方 -15 | 自动 |
| C7 | 更新标题 / 删除 | 200 / 204，删除后 404 | 自动 |
| C8 | `/create?set=others` 兼容旧值 | 打开约定表单 | 手测 + roles 自动 |

### D. 通知与资料（P1）

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| D1 | 见证邀请通知 | 仅见证人列表可见 | 自动 |
| D2 | 标记已读 / 全部已读 | unread-count→0 | 自动 |
| D3 | 资料补邮箱手机 | 登录名不变；校验格式 / 重复邮箱 | 自动 |
| D4 | `/profile/stats` | 含 goals/contracts 计数 | 自动 |
| D5 | 截止日前 3 天提醒 | 至多生成一次 | 自动 |
| D6 | 反馈过短 | 400 | 自动 |

### E. 辅助能力

| ID | 场景 | 期望 | 方式 |
|----|------|------|------|
| E1 | AI 解析目标文本 | 返回 goals[].reward | 自动 |
| E2 | DB 运维接口鉴权 | 无密钥 503；错钥 401；正钥 200 | 自动 |

### F. 发版最低门槛（DoD）

上线或合并影响业务的 PR 前：

1. `npm test` 全绿  
2. `npm run build` 通过  
3. 手测：**注册 → 创建我的（带奖励）→ 进度 100 → 兑奖** 一遍  
4. 若改了约定/选人/解锁：再手测 **解锁他人 → 创建约定 → 履约/违约**  
5. 若改了导航/创建选角：核对「我的 / 他人」文案与 `?set=` 兼容  

## 如何加用例

1. **API 行为**：在 `apps/api/src/test/` 用 `supertest` + `helpers.ts` 增补；命名对齐场景。  
2. **纯函数 / 角色解析**：放 `apps/web/src/**/*.test.ts`。  
3. **同步本文件用例表**：新能力先写进表，再标「自动」或「手测」。  
4. 勿依赖开发库数据；一律临时 `DB_PATH`。

## 已知实现注意

- 约定条款结算：终态（completed / breached）只加减信任分一次（见 `syncAgreementStatusFromClauses`）。  
- 见证人须用已注册用户的 `witnessUserId` 邀请（展示名见 `witnessName` 只读字段）。  
- 限流在测试环境关闭；生产仍生效。  
- 浏览器 E2E（Playwright 等）尚未接入；上表「手测」项可后续用 E2E 替换。
