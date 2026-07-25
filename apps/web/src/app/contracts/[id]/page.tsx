"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/layout/auth-guard"
import { fetchContract, updateClause } from "@/lib/api-client"
import { formatDate, getStatusLabel } from "@/lib/utils"
import type { Contract } from "@/lib/types"

export default function ContractDetailPage() {
  return (
    <AuthGuard>
      <ContractDetailContent />
    </AuthGuard>
  )
}

function ContractDetailContent() {
  const params = useParams()
  const id = params.id as string
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchContract(id)
      .then(setContract)
      .catch(() => setError("契约不存在"))
      .finally(() => setLoading(false))
  }, [id])

  async function handleClauseStatus(clauseId: string, status: string) {
    const updated = await updateClause(id, clauseId, status)
    setContract(updated)
  }

  if (loading) return <p className="text-gray-400">加载中...</p>
  if (error || !contract) return <p className="text-red-500">{error || "未找到"}</p>

  return (
    <div className="space-y-6">
      <Link href="/contracts" className="text-sm text-blue-600 hover:underline">&larr; 返回契约列表</Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          <p className="mt-1 text-gray-500">{contract.description}</p>
        </div>
        <Badge status={contract.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">参与方</h2>
          <div className="space-y-3">
            {contract.parties.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {p.role === "promisor" ? "承诺方" : p.role === "promisee" ? "接受方" : "双方"}
                  </p>
                </div>
                {p.signedAt ? (
                  <span className="text-xs text-green-600">已签署 {formatDate(p.signedAt)}</span>
                ) : (
                  <span className="text-xs text-gray-400">待签署</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">基本信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">创建时间</span>
              <span>{formatDate(contract.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">更新时间</span>
              <span>{formatDate(contract.updatedAt)}</span>
            </div>
            {contract.signedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">签署时间</span>
                <span>{formatDate(contract.signedAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">状态</span>
              <span>{getStatusLabel(contract.status)}</span>
            </div>
            {contract.reward && (
              <div className="flex justify-between">
                <span className="text-gray-500">奖励</span>
                <span className="text-amber-600">{contract.reward}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">条款 ({contract.clauses.length})</h2>
        <div className="space-y-3">
          {contract.clauses.map((clause, i) => (
            <div key={clause.id} className="flex items-start justify-between border-b pb-3 last:border-0">
              <div className="flex-1">
                <p className="text-sm">
                  <span className="mr-2 font-medium text-gray-400">{i + 1}.</span>
                  {clause.content}
                </p>
                {clause.dueDate && (
                  <p className="mt-1 text-xs text-gray-400">期限: {formatDate(clause.dueDate)}</p>
                )}
                {contract.status === "active" && clause.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleClauseStatus(clause.id, "fulfilled")}
                      className="rounded border px-2 py-0.5 text-xs text-green-600 hover:bg-green-50"
                    >
                      已履行
                    </button>
                    <button
                      onClick={() => handleClauseStatus(clause.id, "breached")}
                      className="rounded border px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      违约
                    </button>
                  </div>
                )}
              </div>
              <Badge status={clause.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
