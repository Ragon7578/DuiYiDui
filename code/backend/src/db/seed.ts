import { getDb } from "./schema.js"
import { v4 as uuid } from "uuid"

const db = getDb()

db.exec("DELETE FROM clauses")
db.exec("DELETE FROM parties")
db.exec("DELETE FROM contracts")
db.exec("DELETE FROM goals")
db.exec("DELETE FROM pledges")
db.exec("DELETE FROM users")

const insertUser = db.prepare(`
  INSERT INTO users (id, name, trust_score, total_goals, achieved_goals, abandoned_goals, total_contracts, fulfilled_contracts, breached_contracts, bio)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertUser.run("u1", "张三", 78, 8, 5, 2, 24, 20, 1, "说到做到，对自己诚实。")
insertUser.run("u2", "李四", 50, 0, 0, 0, 0, 0, 0, "")
insertUser.run("u3", "王五", 50, 0, 0, 0, 0, 0, 0, "")
insertUser.run("u4", "赵六", 50, 0, 0, 0, 0, 0, 0, "")

const insertGoal = db.prepare(`
  INSERT INTO goals (id, title, description, reward, reward_claimed, deadline, status, progress, created_at, achieved_at, user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertGoal.run("g1", "连续跑步 30 天", "每天至少跑 3 公里，不限配速", "买一双 Nike Air Zoom 跑鞋", 0, "2026-08-15", "active", 60, "2026-07-01", null, "u1")
insertGoal.run("g2", "读完《人类简史》", "一个月内读完并写一篇读书笔记", "奖励自己去一趟云南旅行", 0, "2026-07-30", "active", 40, "2026-07-05", null, "u1")
insertGoal.run("g3", "瘦到 65 公斤", "从 72 公斤减到 65 公斤，控制饮食 + 运动", "买一套新西装", 1, "2026-06-01", "achieved", 100, "2026-03-01", "2026-05-28", "u1")
insertGoal.run("g4", "每天背 20 个英语单词", "坚持 60 天，为年底的旅行做准备", "", 0, "2026-04-01", "abandoned", 30, "2026-02-01", null, "u1")

const insertContract = db.prepare(`
  INSERT INTO contracts (id, title, description, status, reward, created_at, updated_at, signed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

insertContract.run("c1", "合作协议", "双方合作开发一个开源项目，明确分工与权益分配。", "active", "项目上线后一起庆祝", "2026-06-01", "2026-06-15", null)
insertContract.run("c2", "租房合同", "房屋租赁协议，租期一年。", "completed", null, "2026-03-01", "2026-06-01", "2026-03-01")
insertContract.run("c3", "借款协议", "朋友间借款，约定还款日期与方式。", "breached", null, "2026-05-15", "2026-06-20", "2026-05-15")

const insertParty = db.prepare(`
  INSERT INTO parties (id, contract_id, name, role, signed_at)
  VALUES (?, ?, ?, ?, ?)
`)

insertParty.run("u1", "c1", "张三", "promisor", "2026-06-01")
insertParty.run("u2", "c1", "李四", "promisee", "2026-06-01")
insertParty.run("u1", "c2", "张三", "promisee", null)
insertParty.run("u3", "c2", "王五", "promisor", "2026-03-01")
insertParty.run("u1", "c3", "张三", "promisor", "2026-05-15")
insertParty.run("u4", "c3", "赵六", "promisee", "2026-05-15")

const insertClause = db.prepare(`
  INSERT INTO clauses (id, contract_id, content, status, due_date)
  VALUES (?, ?, ?, ?, ?)
`)

insertClause.run("cl1", "c1", "张三负责前端开发，需在2026年8月前完成", "pending", "2026-08-01")
insertClause.run("cl2", "c1", "李四负责后端开发，需在2026年8月前完成", "fulfilled", "2026-08-01")
insertClause.run("cl3", "c1", "双方共同拥有项目知识产权", "fulfilled", null)
insertClause.run("cl4", "c2", "月租金3000元，每月5日前支付", "fulfilled", null)
insertClause.run("cl5", "c2", "租户需爱护房屋设施", "fulfilled", null)
insertClause.run("cl6", "c3", "借款金额5000元", "fulfilled", null)
insertClause.run("cl7", "c3", "2026年6月15日前归还", "breached", "2026-06-15")

const insertPledge = db.prepare(`
  INSERT INTO pledges (id, title, description, maker, deadline, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

insertPledge.run("p1", "每天跑步5公里", "坚持30天每天跑步，保持健康。", "张三", "2026-07-30", "active", "2026-07-01")
insertPledge.run("p2", "读完《契约论》", "一个月内读完并写读书笔记。", "张三", "2026-07-15", "fulfilled", "2026-06-15")

console.log("Seed data inserted successfully")
process.exit(0)
