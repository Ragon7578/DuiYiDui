"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchUnreadCount } from "@/lib/api-client"

import { ROLES } from "@/lib/roles"
import { useAuth } from "@/lib/auth-context"

/** 顶层按角色：我的(Self) / 他人(Others)；路由暂仍用 goals/contracts */
const mainLinks = [
  { href: "/", label: "首页" },
  { href: ROLES.self.route, label: ROLES.self.navLabel },
  { href: ROLES.others.route, label: ROLES.others.navLabel },
  { href: "/create", label: "创建" },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnread(0)
      return
    }
    fetchUnreadCount()
      .then((r) => setUnread(r.count))
      .catch(() => {})
  }, [user, pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-display text-2xl font-black tracking-tight text-ink">
            兑一兑
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-seal sm:inline">
            DuiYiDui
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-3">
          {mainLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href))
            // 未登录时主导航仅保留首页，业务页进头像菜单引导登录
            if (!user && link.href !== "/") return null
            const lockedOthers =
              link.href === ROLES.others.route && user && !user.superviseUnlocked
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
                {lockedOthers && (
                  <span className="ml-0.5 text-[10px] font-semibold text-muted" title="需先解锁">
                    锁
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-1 -bottom-0.5 h-0.5 bg-seal" />
                )}
              </Link>
            )
          })}

          {!loading && <UserAvatarMenu unread={unread} />}
        </nav>
      </div>
    </header>
  )
}

function UserAvatarMenu({ unread }: { unread: number }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  function handleLogout() {
    setOpen(false)
    logout()
    router.push("/")
  }

  const initial = user?.name?.[0] || ""

  return (
    <div className="relative ml-1" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-seal"
        title={user ? user.name : "登录 / 注册"}
      >
        {user ? (
          initial
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" strokeLinecap="round" />
          </svg>
        )}
        {user && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-seal px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded border border-line bg-white py-1"
        >
          {user ? (
            <>
              <div className="border-b border-line px-3 py-3">
                <p className="font-display text-base font-bold text-ink">{user.name}</p>
                <p className="mt-0.5 text-xs text-muted">信任分 {user.trustScore}</p>
              </div>
              <MenuLink href="/profile" onClick={() => setOpen(false)}>
                我的信息
              </MenuLink>
              <MenuLink href="/notifications" onClick={() => setOpen(false)}>
                <span className="flex w-full items-center justify-between gap-2">
                  通知
                  {unread > 0 && (
                    <span className="rounded bg-seal px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </span>
              </MenuLink>
              <MenuLink href="/feedback" onClick={() => setOpen(false)}>
                意见反馈
              </MenuLink>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="block w-full px-3 py-2.5 text-left text-sm text-seal transition hover:bg-seal-soft"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <div className="border-b border-line px-3 py-3">
                <p className="font-display text-base font-bold text-ink">欢迎来到兑一兑</p>
                <p className="mt-0.5 text-xs text-muted">做到了，兑一兑</p>
              </div>
              <MenuLink href="/login" onClick={() => setOpen(false)}>
                登录
              </MenuLink>
              <MenuLink href="/register" onClick={() => setOpen(false)}>
                注册
              </MenuLink>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-3 py-2.5 text-sm text-ink transition hover:bg-paper-deep"
    >
      {children}
    </Link>
  )
}
