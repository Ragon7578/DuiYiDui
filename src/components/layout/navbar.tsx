"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "首页" },
  { href: "/contracts", label: "契约" },
  { href: "/pledges", label: "承诺" },
  { href: "/create", label: "创建" },
  { href: "/profile", label: "我的" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          契约精神
        </Link>
        <nav className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "font-medium text-black"
                  : "text-gray-500 transition hover:text-black"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
