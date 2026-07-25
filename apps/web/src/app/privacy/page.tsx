import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <div>
        <h1 className="font-display text-3xl font-black">隐私政策</h1>
        <p className="mt-2 text-sm text-muted">初版草案 · 适用于兑一兑 Web 试验/公测</p>
      </div>
      <Card className="space-y-4 text-sm leading-relaxed text-ink/90">
        <p>
          我们重视你的隐私。本产品用于帮助你记录目标、奖励与轻量约定。初版收集的信息尽可能少。
        </p>
        <h2 className="font-display text-lg font-bold">我们可能处理的信息</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>账号：用户名、密码（加密存储）、你自愿填写的邮箱/手机/简介</li>
          <li>业务数据：目标、奖励、进度、契约、见证人、通知</li>
          <li>反馈内容：你主动提交的意见</li>
          <li>使用事件：如注册、创建目标、兑奖等（用于改进产品，非广告画像）</li>
        </ul>
        <h2 className="font-display text-lg font-bold">我们如何使用</h2>
        <p className="text-muted">
          仅用于提供服务、保障账号安全、修复问题与改进初版体验。初版<strong>不售卖</strong>个人数据，不做付费广告追踪。
        </p>
        <h2 className="font-display text-lg font-bold">存储与安全</h2>
        <p className="text-muted">
          数据存储在服务端数据库。生产环境应使用 HTTPS，并妥善保管密钥。请勿在公开场合分享密码重置链接。
        </p>
        <h2 className="font-display text-lg font-bold">联系我们</h2>
        <p className="text-muted">
          隐私相关问题可通过站内「意见反馈」提交。正式运营后将补充运营主体与联系邮箱。
        </p>
      </Card>
      <p className="text-sm text-muted">
        <Link href="/" className="font-semibold text-seal hover:underline">
          返回首页
        </Link>
        {" · "}
        <Link href="/terms" className="hover:underline">
          用户协议
        </Link>
      </p>
    </div>
  )
}
