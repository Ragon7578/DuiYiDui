import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockPledges } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"

export default function PledgesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的承诺</h1>
      <div className="space-y-3">
        {mockPledges.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.description}</p>
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span>承诺人: {p.maker}</span>
                  {p.deadline && <span>截止: {formatDate(p.deadline)}</span>}
                  <span>创建于 {formatDate(p.createdAt)}</span>
                </div>
              </div>
              <Badge status={p.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
