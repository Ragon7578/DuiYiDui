import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <div>
        <h1 className="font-display text-3xl font-black">用户协议</h1>
        <p className="mt-2 text-sm text-muted">初版草案 · 使用本服务即表示你理解以下说明</p>
      </div>
      <Card className="space-y-4 text-sm leading-relaxed text-ink/90">
        <p>
          「兑一兑」是自我承诺与轻量约定的记录工具，帮助你把「说到做到」写清楚并兑现奖励。
        </p>
        <h2 className="font-display text-lg font-bold">不是法律合同</h2>
        <p className="text-muted">
          本产品中的目标、契约、见证人<strong>不具有</strong>电子签章或司法意义上的合同效力，不能替代律师、公证或正式协议。重要事项请走正规法律途径。
        </p>
        <h2 className="font-display text-lg font-bold">初版与反馈</h2>
        <p className="text-muted">
          当前为初版，功能以基本能力为主，可能存在不完善之处。我们鼓励你通过「意见反馈」告诉我们使用体验。初版不提供付费会员或盈利功能。
        </p>
        <h2 className="font-display text-lg font-bold">你的责任</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>妥善保管账号与密码</li>
          <li>不利用本服务骚扰他人或发布违法内容</li>
          <li>对自己填写的承诺与奖励负责</li>
        </ul>
        <h2 className="font-display text-lg font-bold">服务变更</h2>
        <p className="text-muted">
          我们可能调整功能、暂停维护或迁移数据存储方式，并尽量提前告知。正式运营主体确定后将更新本协议。
        </p>
      </Card>
      <p className="text-sm text-muted">
        <Link href="/" className="font-semibold text-seal hover:underline">
          返回首页
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:underline">
          隐私政策
        </Link>
      </p>
    </div>
  )
}
