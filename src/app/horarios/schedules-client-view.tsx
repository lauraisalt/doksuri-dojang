"use client"

import { useState, useEffect } from "react"
import { DAYS_OF_WEEK } from "@/lib/constants"
import { Clock, Users, Plus, Calendar, Trash2, X } from "lucide-react"
import { createSchedule, deleteSchedule } from "@/lib/db-actions"
import { useRouter } from "next/navigation"

interface Props {
  initialSchedules: any[]
}

export function SchedulesClientView({ initialSchedules }: Props) {
  const router = useRouter()
  const [schedules, setSchedules] = useState(initialSchedules)

  useEffect(() => {
    setSchedules(initialSchedules)
  }, [initialSchedules])
  const [isOpen, setIsOpen] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState("SEGUNDA")
  const [time, setTime] = useState("19:00")
  const [maxCapacity, setMaxCapacity] = useState(30)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createSchedule({ dayOfWeek, time, maxCapacity: Number(maxCapacity) })
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao criar horário.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, label: string) => {
    if (confirm(`Deseja remover a turma de ${label}?`)) {
      try {
        await deleteSchedule(id)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao excluir horário.")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/25"
        >
          <Plus className="w-4 h-4" /> Nova Turma / Horário
        </button>
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS_OF_WEEK.map((day) => {
          const daySchedules = schedules.filter((s: any) => s.dayOfWeek === day.value)

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
                  daySchedules.map((sched: any) => {
                    const count = sched.students ? sched.students.length : 0
                    const pct = Math.min(100, Math.round((count / sched.maxCapacity) * 100))

                    return (
                      <div
                        key={sched.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-rose-500" /> {sched.time}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {count} / {sched.maxCapacity} alunos
                            </span>
                            <button
                              onClick={() => handleDelete(sched.id, `${day.label} às ${sched.time}`)}
                              className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                              title="Excluir Horário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                              {sched.students.slice(0, 3).map((s: any) => s.student.name.split(" ")[0]).join(", ")}
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

      {/* Modal: New Schedule */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" /> Nova Turma / Horário
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Dia da Semana</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Horário (ex: 19:00, 20:30)</label>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="19:00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Capacidade Máxima de Alunos</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white shadow-md shadow-rose-600/20"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Horário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
