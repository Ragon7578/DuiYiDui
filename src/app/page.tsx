import Link from "next/link"
import { StatsCard } from "@/components/ui/stats-card"
import { ContractCard } from "@/components/contract/contract-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, getStatusLabel } from "@/lib/utils"
import { mockProfile, mockContracts, mockPledges } from "@/lib/mock-data"

export default function Home() {
  const activeContracts = mockContracts.filter((c) => c.status === "active")
  const activePledges = mockPledges.filter((p) => p.status === "active")

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">你好，{mockProfile.name}</h1>
        <p className="mt-1 text-gray-500">{mockProfile.bio}</p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="信任分" value={mockProfile.trustScore} description="满分 100" />
        <StatsCard label="总契约" value={mockProfile.totalContracts} />
        <StatsCard label="已履行" value={mockProfile.fulfilledContracts} />
        <StatsCard label="违约" value={mockProfile.breachedContracts} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">进行中的契约</h2>
          <Link href="/contracts" className="text-sm text-blue-600 hover:underline">查看全部</Link>
        </div>
        <div className="space-y-4">
          {activeContracts.map((c) => (
            <ContractCard key={c.id} contract={c} />
          ))}
          {activeContracts.length === 0 && (
            <p className="text-sm text-gray-400">暂无进行中的契约</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近的承诺</h2>
          <Link href="/pledges" className="text-sm text-blue-600 hover:underline">查看全部</Link>
        </div>
        <div className="space-y-3">
          {activePledges.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{p.description}</p>
                  {p.deadline && (
                    <p className="mt-1 text-xs text-gray-400">截止: {formatDate(p.deadline)}</p>
                  )}
                </div>
                <Badge status={p.status} />
              </div>
            </Card>
          ))}
          {activePledges.length === 0 && (
            <p className="text-sm text-gray-400">暂无活跃承诺</p>
          )}
        </div>
      </section>
    </div>
  )
}
