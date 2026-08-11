import { getSchedules } from "@/lib/db-actions"
import { DAYS_OF_WEEK } from "@/lib/constants"
import { Clock, Users, Plus, Calendar } from "lucide-react"

export const revalidate = 0

export default async function HorariosPage() {
  const schedules = await getSchedules()

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Grade de Horários de Treino
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organização das turmas, horários e capacidade por dia da semana no Dojang.
          </p>
        </div>
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS_OF_WEEK.map((day) => {
          const daySchedules = schedules.filter((s) => s.dayOfWeek === day.value)

          return (
            <div
              key={day.value}
              className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm dark:shadow-lg flex flex-col justify-between space-y-4 dark:backdrop-blur-md transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" /> {day.label}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {daySchedules.length} turmas
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {daySchedules.length > 0 ? (
                  daySchedules.map((sched) => {
                    const count = sched.students.length
                    const pct = Math.min(100, Math.round((count / sched.maxCapacity) * 100))

                    return (
                      <div
                        key={sched.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-rose-500" /> {sched.time}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {count} / {sched.maxCapacity} alunos
                          </span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 90
                                ? "bg-rose-500 shadow-xs shadow-rose-500/50"
                                : pct >= 60
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Enrolled Students Avatars */}
                        {count > 0 && (
                          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {sched.students.slice(0, 3).map((s) => s.student.name.split(" ")[0]).join(", ")}
                              {count > 3 && ` +${count - 3} mais`}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                    Nenhum horário cadastrado para este dia.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
