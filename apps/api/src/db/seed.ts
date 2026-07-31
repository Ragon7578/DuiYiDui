import bcrypt from "bcryptjs"
import { getDb } from "./schema.js"
import { v4 as uuid } from "uuid"

const db = getDb()
const passwordHash = bcrypt.hashSync("password123", 12)

db.exec("DELETE FROM goal_witnesses")
db.exec("DELETE FROM notifications")
db.exec("DELETE FROM feedback")
db.exec("DELETE FROM analytics_events")
db.exec("DELETE FROM trust_ledger")
db.exec("DELETE FROM clauses")
db.exec("DELETE FROM parties")
db.exec("DELETE FROM contracts")
db.exec("DELETE FROM goals")
db.exec("DELETE FROM pledges")
db.exec("DELETE FROM users")

const insertUser = db.prepare(`
  INSERT INTO users (id, name, email, password_hash, trust_score, total_goals, achieved_goals, abandoned_goals, total_contracts, fulfilled_contracts, breached_contracts, bio)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertUser.run("u1", "张三", null, passwordHash, 78, 4, 1, 1, 3, 1, 1, "说到做到，对自己诚实。")
insertUser.run("u2", "李四", null, passwordHash, 50, 0, 0, 0, 1, 0, 0, "")
insertUser.run("u3", "王五", null, passwordHash, 50, 0, 0, 0, 1, 1, 0, "")
insertUser.run("u4", "赵六", null, passwordHash, 50, 0, 0, 0, 1, 0, 1, "")

const insertGoal = db.prepare(`
  INSERT INTO goals (id, title, description, reward, reward_claimed, deadline, status, progress, created_at, achieved_at, user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertGoal.run("g1", "连续跑步 30 天", "每天至少跑 3 公里，不限配速", "买一双 Nike Air Zoom 跑鞋", 0, "2026-08-15", "active", 60, "2026-07-01", null, "u1")
insertGoal.run("g2", "读完《人类简史》", "一个月内读完并写一篇读书笔记", "奖励自己去一趟云南旅行", 0, "2026-07-30", "active", 40, "2026-07-05", null, "u1")
insertGoal.run("g3", "瘦到 65 公斤", "从 72 公斤减到 65 公斤，控制饮食 + 运动", "买一套新西装", 0, "2026-06-01", "achieved", 100, "2026-03-01", "2026-05-28", "u1")
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
  INSERT INTO pledges (id, title, description, maker, deadline, status, user_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

insertPledge.run("p1", "每天跑步5公里", "坚持30天每天跑步，保持健康。", "张三", "2026-07-30", "active", "u1", "2026-07-01")
insertPledge.run("p2", "读完《契约论》", "一个月内读完并写读书笔记。", "张三", "2026-07-15", "fulfilled", "u1", "2026-06-15")

const insertWitness = db.prepare(`
  INSERT INTO goal_witnesses (id, goal_id, witness_user_id, witness_name, status, invited_at, confirmed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

insertWitness.run(uuid(), "g1", "u2", "李四", "confirmed", "2026-07-01", "2026-07-02")
insertWitness.run(uuid(), "g2", "u3", "王五", "pending", "2026-07-05", null)

const insertNotification = db.prepare(`
  INSERT INTO notifications (id, user_id, type, title, message, related_id, read, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

insertNotification.run(uuid(), "u1", "reward_ready", "奖励待兑现", "目标「瘦到 65 公斤」的奖励可以兑现了。", "g3", 0, "2026-05-28")
insertNotification.run(uuid(), "u1", "goal_deadline", "目标即将到期", "目标「读完《人类简史》」将在 2026-07-30 到期，加油！", "g2", 0, "2026-07-22")
insertNotification.run(uuid(), "u2", "witness_invite", "见证邀请", "你被邀请见证目标「连续跑步 30 天」", "g1", 1, "2026-07-01")

console.log("Seed data inserted successfully")
console.log("Seed users (password: password123): 张三, 李四, 王五, 赵六")
process.exit(0)
