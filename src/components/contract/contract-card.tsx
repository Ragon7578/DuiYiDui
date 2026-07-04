import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { Contract } from "@/lib/types"

export function ContractCard({ contract }: { contract: Contract }) {
  return (
    <Link href={`/contracts/${contract.id}`}>
      <Card className="transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{contract.title}</h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{contract.description}</p>
          </div>
          <Badge status={contract.status} />
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <span>创建于 {formatDate(contract.createdAt)}</span>
          <span>{contract.parties.length} 方</span>
          <span>{contract.clauses.length} 条款</span>
        </div>
      </Card>
    </Link>
  )
}
