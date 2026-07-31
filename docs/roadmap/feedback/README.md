# 上线反馈运营

> **负责人：** 反馈运营 Agent（本仓 Cursor `feedback-ops`）  
> **收件人：** 总负责人（兑一兑主 Agent，裁剪为 Sprint Must）  
> **产品：** 兑一兑 · 初版 Web  
> **窗口状态：** **第 1 波开放中**（2026-08-01 → 2026-08-14）  
> **推广与征集计划：** [promotion-plan.md](./promotion-plan.md)

## 职责

1. **征集**：按 [promotion-plan.md](./promotion-plan.md) 邀约；确保 `/feedback` 与首页反馈窗可用  
2. **整理**：每周导出站内反馈，粗分主题，写成总负责人任务简报  
3. **交接**：把简报交给总负责人；不擅自改范围（盈利/App 仍后置）

## 节奏

| 时机 | 动作 |
|------|------|
| 开窗 D0 | 发出 A 类邀请；确认首页条 / `/feedback` |
| 每日 | 扫新反馈；P0 当天标出 |
| D2 / D7 | 触达未反馈者；半程补邀 |
| **每周五** | 跑 digest → `digests/YYYY-MM-DD-pm-brief.md` → 总负责人 |
| 关窗 D14 | 复盘指标；决定续波或收窄 |

## 操作命令

```bash
export FEEDBACK_OPS_KEY='与服务器一致的密钥'
export API_URL='https://api.example.com'   # 本地默认 http://localhost:4000

./scripts/feedback-digest.sh
SINCE=2026-08-01 ./scripts/feedback-digest.sh
```

产物：

- `docs/roadmap/feedback/digests/YYYY-MM-DD-raw.json`
- `docs/roadmap/feedback/digests/YYYY-MM-DD-pm-brief.md` ← **发给总负责人**

邀约跟踪模板：[invite-list.template.md](./invite-list.template.md)（含真实联系方式的副本勿提交）。

## 主题优先级（裁任务用）

| 级 | 主题 | 说明 |
|----|------|------|
| P0 | 主闭环 | 注册/登录、建承诺、进度、达成、兑奖 |
| P1 | 见证/监督 | 邀请、确认、他人约定可达 |
| P1 | 理解成本 | 空态、文案、「我的/他人」是否看懂 |
| P2 | 体验及其他 | 性能、样式、非主路径 |

## 关窗

改 `apps/web/src/lib/feedback-window.ts` 中 `FEEDBACK_WINDOW.open = false`，并更新本页「窗口状态」。

## 不做

- 不把终极版功能（盈利、重社交）因零星反馈拉进初版 Must  
- 不替代总负责人做排期最终决定（重大事项由总负责人征得用户同意）  
- 不在未脱敏前对外公开原始反馈全文
