import { Card } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Badge } from "@/components/ui/badge"
import { mockProfile, mockGoals } from "@/lib/mock-data"

export default function ProfilePage() {
  const achievedRate = mockProfile.totalGoals > 0
    ? Math.round((mockProfile.achievedGoals / mockProfile.totalGoals) * 100)
    : 0
  const abandonRate = mockProfile.totalGoals > 0
    ? Math.round((mockProfile.abandonedGoals / mockProfile.totalGoals) * 100)
    : 0

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-3xl font-bold text-white">
          {mockProfile.name[0]}
        </div>
        <h1 className="mt-4 text-2xl font-bold">{mockProfile.name}</h1>
        <p className="mt-1 text-gray-500">{mockProfile.bio}</p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <StatsCard label="信任分" value={mockProfile.trustScore} description="满分 100" />
        <StatsCard label="总目标" value={mockProfile.totalGoals} />
        <StatsCard label="已达成" value={mockProfile.achievedGoals} />
        <StatsCard label="已放弃" value={mockProfile.abandonedGoals} />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <StatsCard label="总契约" value={mockProfile.totalContracts} />
        <StatsCard label="已履行" value={mockProfile.fulfilledContracts} />
      </section>

      <Card>
        <h2 className="mb-4 font-semibold">信任评价</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span>目标达成率</span>
              <span className="font-medium">{achievedRate}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-green-500" style={{ width: `${achievedRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>目标放弃率</span>
              <span className="font-medium">{abandonRate}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-red-500" style={{ width: `${abandonRate}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">目标记录</h2>
        <div className="space-y-3">
          {mockGoals.map((g) => (
            <div key={g.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">{g.title}</p>
                {g.reward && <p className="text-xs text-amber-600">🎁 {g.reward}{g.rewardClaimed ? " ✅" : ""}</p>}
              </div>
              <Badge status={g.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
