import type { Contract, Pledge, UserProfile } from "./types"

export const mockProfile: UserProfile = {
  id: "u1",
  name: "张三",
  trustScore: 92,
  totalContracts: 24,
  fulfilledContracts: 20,
  breachedContracts: 1,
  bio: "相信契约精神，守信如金。",
}

export const mockContracts: Contract[] = [
  {
    id: "c1",
    title: "合作协议",
    description: "双方合作开发一个开源项目，明确分工与权益分配。",
    parties: [
      { id: "u1", name: "张三", role: "promisor", signedAt: "2026-06-01" },
      { id: "u2", name: "李四", role: "promisee", signedAt: "2026-06-01" },
    ],
    clauses: [
      { id: "cl1", content: "张三负责前端开发，需在2026年8月前完成", status: "pending", dueDate: "2026-08-01" },
      { id: "cl2", content: "李四负责后端开发，需在2026年8月前完成", status: "fulfilled", dueDate: "2026-08-01" },
      { id: "cl3", content: "双方共同拥有项目知识产权", status: "fulfilled" },
    ],
    status: "active",
    createdAt: "2026-06-01",
    updatedAt: "2026-06-15",
  },
  {
    id: "c2",
    title: "租房合同",
    description: "房屋租赁协议，租期一年。",
    parties: [
      { id: "u1", name: "张三", role: "promisee" },
      { id: "u3", name: "王五", role: "promisor", signedAt: "2026-03-01" },
    ],
    clauses: [
      { id: "cl4", content: "月租金3000元，每月5日前支付", status: "fulfilled" },
      { id: "cl5", content: "租户需爱护房屋设施", status: "fulfilled" },
    ],
    status: "completed",
    createdAt: "2026-03-01",
    updatedAt: "2026-06-01",
    signedAt: "2026-03-01",
  },
  {
    id: "c3",
    title: "借款协议",
    description: "朋友间借款，约定还款日期与方式。",
    parties: [
      { id: "u1", name: "张三", role: "promisor", signedAt: "2026-05-15" },
      { id: "u4", name: "赵六", role: "promisee", signedAt: "2026-05-15" },
    ],
    clauses: [
      { id: "cl6", content: "借款金额5000元", status: "fulfilled" },
      { id: "cl7", content: "2026年6月15日前归还", status: "breached", dueDate: "2026-06-15" },
    ],
    status: "breached",
    createdAt: "2026-05-15",
    updatedAt: "2026-06-20",
    signedAt: "2026-05-15",
  },
]

export const mockPledges: Pledge[] = [
  {
    id: "p1",
    title: "每天跑步5公里",
    description: "坚持30天每天跑步，保持健康。",
    maker: "张三",
    deadline: "2026-07-30",
    status: "active",
    createdAt: "2026-07-01",
  },
  {
    id: "p2",
    title: "读完《契约论》",
    description: "一个月内读完并写读书笔记。",
    maker: "张三",
    deadline: "2026-07-15",
    status: "fulfilled",
    createdAt: "2026-06-15",
  },
]
