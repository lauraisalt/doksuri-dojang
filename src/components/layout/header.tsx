"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Moon, Sun, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function Header() {
  const router = RouterHook()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const savedTheme = localStorage.getItem("dojang_theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else {
      document.documentElement.classList.add("dark")
      setTheme("dark")
      localStorage.setItem("dojang_theme", "dark")
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("dojang_theme", nextTheme)
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Handle instant search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const todayDateStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Search Bar Container */}
      <div className="relative flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Busca instantânea (Aluno, faixa, telefone, responsável...)"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:border-rose-500 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>

        {/* Live Search Dropdown */}
        {searchTerm.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Buscando...</div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSearchTerm("")
                      router.push(`/alunos?id=${student.id}`)
                    }}
                    className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{student.phone || "Sem telefone"}</span>
                        <span>•</span>
                        <span>{student.paymentType}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {student.beltRank}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhum aluno encontrado para "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <span className="hidden md:inline-block text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
          {todayDateStr}
        </span>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Tema atual: ${theme === "dark" ? "Escuro" : "Claro"}. Clique para alternar.`}
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Quick Add Student Button */}
        <Link
          href="/alunos?action=new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-white font-medium text-sm hover:from-rose-500 hover:to-red-400 transition-all shadow-md shadow-rose-600/25"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Aluno</span>
        </Link>
      </div>
    </header>
  )
}

function RouterHook() {
  return useRouter()
}
