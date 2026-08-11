"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  DollarSign,
  Trophy,
  Settings,
  ChevronRight,
  Shield,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Alunos", href: "/alunos", icon: Users },
  { title: "Horários", href: "/horarios", icon: Clock },
  { title: "Frequência", href: "/frequencia", icon: CalendarCheck },
  { title: "Financeiro", href: "/financeiro", icon: DollarSign },
  { title: "Campeonatos", href: "/campeonatos", icon: Trophy },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white shadow-lg shadow-rose-600/25 shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
              Dok Su Ri
            </h1>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">
              Hapkido Dojang
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-500/20 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
              }`}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                }`}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}

              {isActive && (
                <div className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-rose-600 dark:bg-rose-500 shadow-xs shadow-rose-600/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Info / Collapse Toggle */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
        {!collapsed && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50 mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unidade 3 — Dok Su Ri
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Sistema Interno Ativo
            </p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          aria-label="Alternar menu"
        >
          <ChevronRight
            className={`w-5 h-5 transition-transform duration-300 ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>
    </aside>
  )
}
