import { ContractCard } from "@/components/contract/contract-card"
import { mockContracts } from "@/lib/mock-data"

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的契约</h1>
        <a
          href="/create"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
        >
          创建契约
        </a>
      </div>
      <div className="space-y-4">
        {mockContracts.map((c) => (
          <ContractCard key={c.id} contract={c} />
        ))}
      </div>
    </div>
  )
}
