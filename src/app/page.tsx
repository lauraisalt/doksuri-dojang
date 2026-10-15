import { getDashboardStats } from "@/lib/db-actions"
import { BELT_RANKS, getBeltInfo } from "@/lib/constants"
import {
  Users,
  TrendingUp,
  DollarSign,
  CalendarCheck,
  Award,
  AlertCircle,
  Cake,
  Activity,
  ArrowUpRight,
  Phone,
} from "lucide-react"
import Link from "next/link"

export const revalidate = 0

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-slate-800 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold mb-3 border border-rose-500/30">
              <Activity className="w-3.5 h-3.5" /> Visão Geral do Dojang
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Instituto Dok Su Ri — Hapkido
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Painel de controle em tempo real dos alunos, frequências, receita mensal e convênios Gympass.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/frequencia"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" /> Realizar Chamada
            </Link>
            <Link
              href="/alunos"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-sm transition-all border border-white/10 flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Ver Alunos
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Alunos */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg flex flex-col justify-between dark:backdrop-blur-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Alunos Ativos
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.activeStudents}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {stats.monthlyStudents} Mensalistas
              </span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {stats.gympassStudents} Gympass
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Receita do Mês */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg flex flex-col justify-between dark:backdrop-blur-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Receita no Mês
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(stats.monthlyRevenue + stats.gympassRevenue)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Mensalidades: {formatCurrency(stats.monthlyRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Gympass Checkins */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg flex flex-col justify-between dark:backdrop-blur-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Check-ins Gympass
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/40">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.gympassTotalCheckins}
            </div>
            <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              Repasse estimado: {formatCurrency(stats.gympassRevenue)}
            </div>
          </div>
        </div>

        {/* Card 4: Frequência Média */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg flex flex-col justify-between dark:backdrop-blur-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Frequência Média
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/40">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.attendanceRate}%
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Taxa de presença nas turmas
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Belts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Belts Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:backdrop-blur-md transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Distribuição de Graduações (Faixas)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alunos divididos por graduação atual no Dojang
              </p>
            </div>
            <Award className="w-5 h-5 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
            {BELT_RANKS.map((belt) => {
              const count = stats.beltsCount[belt.value] || 0
              return (
                <div
                  key={belt.value}
                  className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
                      style={{ backgroundColor: belt.color }}
                    />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{count} alunos</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate block">
                      {belt.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alerts & Birthdays */}
        <div className="space-y-6">
          {/* Aniversariantes do Mês */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:backdrop-blur-md transition-colors">
            <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Cake className="w-4 h-4" /> Aniversariantes do Mês
            </div>

            {stats.birthdayStudents.length > 0 ? (
              <div className="space-y-3">
                {stats.birthdayStudents.map((student: { id: string; name: string; birthDate: Date; beltRank: string; phone?: string }) => {
                  const day = new Date(student.birthDate).getDate()
                  const phoneClean = student.phone?.replace(/\D/g, "")
                  const whatsappUrl = phoneClean
                    ? `https://wa.me/55${phoneClean}?text=Parab%C3%A9ns%20${encodeURIComponent(
                        student.name
                      )}!%20Desejamos%20um%20feliz%20anivers%C3%A1rio%20do%20Instituto%20Dok%20Su%20Ri%20Hapkido!%20%F0%9F%A4%98`
                    : null

                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">
                          {student.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Dia {day}</div>
                      </div>

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-500/20"
                        >
                          <Phone className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum aniversariante neste mês.</p>
            )}
          </div>

          {/* Graduações Recentes */}
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:backdrop-blur-md transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-500" /> Graduações Recentes
              </span>
            </div>

            <div className="space-y-3">
              {stats.recentGraduations.map((grad: { id: string; fromBelt: string; toBelt: string; date: Date; student: { name: string } }) => (
                <div
                  key={grad.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">
                      {grad.student.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {grad.fromBelt} ➔ <strong className="text-rose-600 dark:text-rose-400">{grad.toBelt}</strong>
                    </div>
                  </div>
                  <span suppressHydrationWarning className="text-[10px] text-slate-400">
                    {new Date(grad.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
