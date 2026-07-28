# 上线反馈运营

> **负责人：** 反馈运营 Agent（本仓 Cursor `feedback-ops`）  
> **收件人：** 总负责人（兑一兑主 Agent，裁剪为 Sprint Must）  
> **产品：** 兑一兑 · 初版 Web 反馈上线后启用

## 职责

1. **征集**：确保 `/feedback` 可用；配合邀请用户主动收集意见  
2. **整理**：每周导出站内反馈，粗分主题，写成总负责人任务简报  
3. **交接**：把简报交给总负责人；不擅自改范围（盈利/App 仍后置）

## 节奏

| 时机 | 动作 |
|------|------|
| 每日（上线后） | 扫一眼新反馈条数；P0（主闭环阻断）当天标出 |
| **每周五** | 跑 digest → 产出 `digests/YYYY-MM-DD-pm-brief.md` → 发给总负责人 |
| Sprint 计划会 | 总负责人从简报勾选 Must；未勾选写清「暂不处理」 |

## 操作命令

```bash
# API 需配置 FEEDBACK_OPS_KEY；请求头 X-Feedback-Ops-Key
export FEEDBACK_OPS_KEY='与服务器一致的密钥'
export API_URL='https://api.example.com'   # 本地默认 http://localhost:4000

./scripts/feedback-digest.sh
# 或只要某一时间后：
SINCE=2026-07-28 ./scripts/feedback-digest.sh
```

产物：

- `docs/roadmap/feedback/digests/YYYY-MM-DD-raw.json`
- `docs/roadmap/feedback/digests/YYYY-MM-DD-pm-brief.md` ← **发给总负责人**

## 主题优先级（裁任务用）

| 级 | 主题 | 说明 |
|----|------|------|
| P0 | 主闭环 | 注册/登录、建承诺、进度、达成、兑奖 |
| P1 | 见证/监督 | 邀请、确认、监督约定可达 |
| P1 | 理解成本 | 空态、文案、「我的/监督」是否看懂 |
| P2 | 体验及其他 | 性能、样式、非主路径 |

## 不做

- 不把终极版功能（盈利、重社交）因零星反馈拉进初版 Must  
- 不替代总负责人做排期最终决定（重大事项由总负责人征得用户同意）  
- 不在未脱敏前对外公开原始反馈全文
