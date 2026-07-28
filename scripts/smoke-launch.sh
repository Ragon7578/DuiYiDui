#!/usr/bin/env bash
# 上线前本地 API 冒烟（对照 fast-launch §0.1 主闭环）
set -euo pipefail
API="${API_URL:-http://localhost:4000}"

python3 - "$API" <<'PY'
import json, sys, uuid, urllib.request
API = sys.argv[1]

def req(method, path, token=None, body=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=20) as res:
        raw = res.read().decode()
        return json.loads(raw) if raw else None

print("health", req("GET", "/api/health")["status"])
tok = req("POST", "/api/auth/login", body={"username": "张三", "password": "password123"})["token"]
goal = req("POST", "/api/goals", tok, {"title": "冒烟承诺", "reward": "咖啡", "description": "smoke"})
upd = req("PATCH", f"/api/goals/{goal['id']}", tok, {"progress": 100})
assert upd["status"] == "achieved"
claimed = req("POST", f"/api/goals/{goal['id']}/claim-reward", tok)
assert claimed.get("rewardClaimed")
users = req("GET", "/api/auth/users", tok)
lisi = next(u for u in users if u["name"] == "李四")
ctr = req("POST", "/api/contracts", tok, {
    "title": "冒烟监督",
    "parties": [{"id": lisi["id"], "role": "promisee"}],
    "clauses": [{"content": "完成"}],
})
done = req("PATCH", f"/api/contracts/{ctr['id']}/clauses/{ctr['clauses'][0]['id']}", tok, {"status": "fulfilled"})
assert done["status"] == "completed"
fb = req("POST", "/api/feedback", tok, {"message": "冒烟脚本反馈内容足够长"})
assert "id" in fb
print("SMOKE_PASS")
PY
