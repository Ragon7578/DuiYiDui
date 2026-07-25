import Link from "next/link"
import { StatsCard } from "@/components/ui/stats-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockProfile, mockGoals, mockContracts } from "@/lib/mock-data"
import { getStatusLabel, getStatusColor, formatDate } from "@/lib/utils"

export default function Home() {
  const activeGoals = mockGoals.filter((g) => g.status === "active")
  const activeContracts = mockContracts.filter((c) => c.status === "active")

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">你好，{mockProfile.name}</h1>
        <p className="mt-1 text-gray-500">{mockProfile.bio}</p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="信任分" value={mockProfile.trustScore} description="满分 100" />
        <StatsCard label="目标" value={`${mockProfile.achievedGoals}/${mockProfile.totalGoals}`} description="已达成/总数" />
        <StatsCard label="契约" value={`${mockProfile.fulfilledContracts}/${mockProfile.totalContracts}`} description="已履行/总数" />
        <StatsCard label="进行中" value={activeGoals.length + activeContracts.length} description="目标 + 契约" />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">进行中的目标</h2>
          <Link href="/goals" className="text-sm text-blue-600 hover:underline">查看全部</Link>
        </div>
        <div className="space-y-4">
          {activeGoals.map((g) => (
            <Card key={g.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{g.title}</h3>
                    <Badge status={g.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{g.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">进度</span>
                      <span className="font-medium">{g.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-black transition-all"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-amber-600">
                    🎁 奖励: {g.reward}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          {activeGoals.length === 0 && (
            <p className="text-sm text-gray-400">暂无进行中的目标</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">进行中的契约</h2>
          <Link href="/contracts" className="text-sm text-blue-600 hover:underline">查看全部</Link>
        </div>
        <div className="space-y-4">
          {activeContracts.map((c) => (
            <Link key={c.id} href={`/contracts/${c.id}`}>
              <Card className="transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{c.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{c.description}</p>
                  </div>
                  <Badge status={c.status} />
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                  <span>创建于 {formatDate(c.createdAt)}</span>
                  <span>{c.parties.length} 方</span>
                  <span>{c.clauses.length} 条款</span>
                </div>
              </Card>
            </Link>
          ))}
          {activeContracts.length === 0 && (
            <p className="text-sm text-gray-400">暂无进行中的契约</p>
          )}
        </div>
      </section>
    </div>
  )
}
