import Link from "next/link"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockContracts } from "@/lib/mock-data"
import { formatDate, getStatusLabel } from "@/lib/utils"
import type { PageProps } from "@/lib/types"

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params
  const contract = mockContracts.find((c) => c.id === id)

  if (!contract) notFound()

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
              </div>
              <Badge status={clause.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
