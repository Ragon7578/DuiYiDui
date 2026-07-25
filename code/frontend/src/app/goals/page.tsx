import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockGoals } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的目标</h1>
      </div>
      <div className="space-y-4">
        {mockGoals.map((g) => (
          <Card key={g.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{g.title}</h3>
                  <Badge status={g.status} />
                </div>
                {g.description && (
                  <p className="mt-1 text-sm text-gray-500">{g.description}</p>
                )}
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
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                  {g.reward && (
                    <span className="text-amber-600">🎁 奖励: {g.reward}{g.rewardClaimed ? " ✅ 已兑现" : g.status === "achieved" ? " ⏳ 待兑现" : ""}</span>
                  )}
                  {g.deadline && <span>截止: {formatDate(g.deadline)}</span>}
                  <span>创建于 {formatDate(g.createdAt)}</span>
                  {g.achievedAt && <span>达成于 {formatDate(g.achievedAt)}</span>}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
