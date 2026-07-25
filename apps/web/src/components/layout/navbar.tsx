"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchUnreadCount } from "@/lib/api-client"

const links = [
  { href: "/", label: "首页" },
  { href: "/goals", label: "目标" },
  { href: "/contracts", label: "契约" },
  { href: "/create", label: "创建" },
  { href: "/notifications", label: "通知" },
  { href: "/profile", label: "我的" },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchUnreadCount()
      .then((r) => setUnread(r.count))
      .catch(() => {})
  }, [user, pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl font-black tracking-tight text-ink">
            契约精神
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-seal sm:inline">
            Say & Done
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          {user &&
            links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-2 py-1 text-sm transition ${
                    active
                      ? "font-semibold text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-1 -bottom-0.5 h-0.5 bg-seal" />
                  )}
                  {link.href === "/notifications" && unread > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-seal px-1 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              )
            })}
          {user ? (
            <button
              onClick={logout}
              className="ml-2 text-sm text-muted transition hover:text-seal"
            >
              退出
            </button>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link href="/login" className="text-sm text-muted hover:text-ink">
                登录
              </Link>
              <Link
                href="/register"
                className="btn-primary px-3 py-1.5 text-sm"
              >
                注册
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
