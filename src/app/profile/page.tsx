import { Card } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { mockProfile } from "@/lib/mock-data"

export default function ProfilePage() {
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
        <StatsCard label="总契约" value={mockProfile.totalContracts} />
        <StatsCard label="已履行" value={mockProfile.fulfilledContracts} />
        <StatsCard label="违约" value={mockProfile.breachedContracts} />
      </section>

      <Card>
        <h2 className="mb-3 font-semibold">信任评价</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span>履约率</span>
              <span className="font-medium">
                {mockProfile.totalContracts > 0
                  ? Math.round((mockProfile.fulfilledContracts / mockProfile.totalContracts) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-green-500 transition-all"
                style={{
                  width: `${
                    mockProfile.totalContracts > 0
                      ? (mockProfile.fulfilledContracts / mockProfile.totalContracts) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>违约率</span>
              <span className="font-medium">
                {mockProfile.totalContracts > 0
                  ? Math.round((mockProfile.breachedContracts / mockProfile.totalContracts) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-red-500 transition-all"
                style={{
                  width: `${
                    mockProfile.totalContracts > 0
                      ? (mockProfile.breachedContracts / mockProfile.totalContracts) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
