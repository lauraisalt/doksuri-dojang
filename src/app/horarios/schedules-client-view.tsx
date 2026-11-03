"use client"

import { useState, useEffect } from "react"
import { DAYS_OF_WEEK, getBeltInfo } from "@/lib/constants"
import {
  Clock,
  Users,
  Plus,
  Calendar,
  Trash2,
  X,
  Edit2,
  UserCheck,
  UserPlus,
  UserMinus,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  enrollStudentInSchedule,
  unenrollStudentFromSchedule,
} from "@/lib/db-actions"
import { useRouter } from "next/navigation"

interface Props {
  initialSchedules: any[]
  students?: any[]
}

export function SchedulesClientView({ initialSchedules, students = [] }: Props) {
  const router = useRouter()
  const [schedules, setSchedules] = useState(initialSchedules)

  useEffect(() => {
    setSchedules(initialSchedules)
  }, [initialSchedules])

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)
  const [detailSchedule, setDetailSchedule] = useState<any>(null)

  // Form Fields
  const [dayOfWeek, setDayOfWeek] = useState("SEGUNDA")
  const [time, setTime] = useState("19:00")
  const [description, setDescription] = useState("")
  const [maxCapacity, setMaxCapacity] = useState(30)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Enrollment in detail modal
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState("")
  const [isEnrolling, setIsEnrolling] = useState(false)

  // Open creation modal
  const handleOpenCreate = (defaultDay = "SEGUNDA") => {
    setEditingSchedule(null)
    setDayOfWeek(defaultDay)
    setTime("19:00")
    setDescription("")
    setMaxCapacity(30)
    setIsFormOpen(true)
  }

  // Open edit modal
  const handleOpenEdit = (sched: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingSchedule(sched)
    setDayOfWeek(sched.dayOfWeek)
    setTime(sched.time)
    setDescription(sched.description || "")
    setMaxCapacity(sched.maxCapacity || 30)
    setIsFormOpen(true)
  }

  // Submit form (create or edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate 24h format HH:mm
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(time.trim())) {
      alert("Por favor, informe o horário no padrão de 24 horas (HH:mm), por exemplo: 19:00 ou 08:30.")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, {
          dayOfWeek,
          time: time.trim(),
          description: description.trim(),
          maxCapacity: Number(maxCapacity),
        })
      } else {
        await createSchedule({
          dayOfWeek,
          time: time.trim(),
          description: description.trim(),
          maxCapacity: Number(maxCapacity),
        })
      }
      setIsFormOpen(false)
      setEditingSchedule(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar horário. Verifique se já não existe outro horário idêntico cadastrado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete schedule
  const handleDelete = async (id: string, label: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (confirm(`Deseja realmente remover o horário de ${label}?`)) {
      try {
        await deleteSchedule(id)
        if (detailSchedule?.id === id) setDetailSchedule(null)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao excluir horário.")
      }
    }
  }

  // Enroll student
  const handleEnrollStudent = async () => {
    if (!detailSchedule || !selectedStudentToEnroll) return
    setIsEnrolling(true)
    try {
      await enrollStudentInSchedule(selectedStudentToEnroll, detailSchedule.id)
      setSelectedStudentToEnroll("")
      router.refresh()
      // Optimistically update detail schedule view
      const enrolledStudent = students.find((s) => s.id === selectedStudentToEnroll)
      if (enrolledStudent) {
        setDetailSchedule((prev: any) => ({
          ...prev,
          students: [...(prev.students || []), { student: enrolledStudent, scheduleId: prev.id, studentId: enrolledStudent.id }],
        }))
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao matricular aluno no horário.")
    } finally {
      setIsEnrolling(false)
    }
  }

  // Unenroll student
  const handleUnenrollStudent = async (studentId: string, studentName: string) => {
    if (!detailSchedule) return
    if (confirm(`Deseja desmatricular ${studentName} desta turma?`)) {
      try {
        await unenrollStudentFromSchedule(studentId, detailSchedule.id)
        router.refresh()
        setDetailSchedule((prev: any) => ({
          ...prev,
          students: (prev.students || []).filter((s: any) => s.studentId !== studentId && s.student?.id !== studentId),
        }))
      } catch (err) {
        console.error(err)
        alert("Erro ao desmatricular aluno.")
      }
    }
  }

  // Keep detail schedule in sync when initialSchedules update
  useEffect(() => {
    if (detailSchedule) {
      const updated = initialSchedules.find((s) => s.id === detailSchedule.id)
      if (updated) setDetailSchedule(updated)
    }
  }, [initialSchedules])

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-4 h-4 text-rose-500" />
          <span>
            Horários sincronizados com <strong>Horário de Brasília (UTC-3)</strong> • Formato 24 Horas
          </span>
        </div>
        <button
          onClick={() => handleOpenCreate()}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/25"
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
              className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs dark:shadow-lg flex flex-col justify-between space-y-4 transition-colors"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" /> {day.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {daySchedules.length} {daySchedules.length === 1 ? "aula" : "aulas"}
                  </span>
                  <button
                    onClick={() => handleOpenCreate(day.value)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title={`Adicionar aula na ${day.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Schedules in this Day */}
              <div className="space-y-3 flex-1">
                {daySchedules.length > 0 ? (
                  daySchedules.map((sched: any) => {
                    const count = sched.students ? sched.students.length : 0
                    const capacity = sched.maxCapacity || 30
                    const pct = Math.min(100, Math.round((count / capacity) * 100))

                    return (
                      <div
                        key={sched.id}
                        onClick={() => setDetailSchedule(sched)}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 space-y-2.5 relative group cursor-pointer transition-all shadow-2xs hover:shadow-md"
                      >
                        {/* Time & Action buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-rose-500" /> {sched.time}
                            </span>
                            {sched.description && (
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[130px]" title={sched.description}>
                                {sched.description}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleOpenEdit(sched, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Editar Horário"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(sched.id, `${day.label} às ${sched.time}`, e)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Excluir Horário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Capacity Info (Showing ONLY the quantity of enrolled students, NO names directly on card) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" /> Alunos Matriculados:
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {count} / {capacity}
                            </span>
                          </div>

                          {/* Progress Bar */}
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
                        </div>

                        {/* View Details Link */}
                        <div className="pt-1 flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-400 font-semibold group-hover:underline">
                          <span>Ver alunos & detalhamento</span>
                          <span>➔</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    Nenhum horário cadastrado para este dia.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal 1: Create / Edit Schedule */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                {editingSchedule ? "Editar Horário da Aula" : "Nova Turma / Horário"}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Dia da Semana *
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-rose-500"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Horário (Formato 24h: HH:mm) *
                </label>
                <input
                  type="text"
                  required
                  pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="19:00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold tracking-wider focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Padrão Horário de Brasília (UTC-3), ex: 08:00, 19:00, 20:30.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Descrição da Aula
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Turma Infantil, Treino Geral, Sparring & Luta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Capacidade Máxima de Alunos *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
                >
                  {isSubmitting ? "Salvando..." : editingSchedule ? "Atualizar Horário" : "Salvar Horário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Schedule Details & Enrolled Students Management */}
      {detailSchedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-rose-500" />
                    {DAYS_OF_WEEK.find((d) => d.value === detailSchedule.dayOfWeek)?.label} às {detailSchedule.time}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    UTC-3
                  </span>
                </div>
                {detailSchedule.description && (
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-400" /> {detailSchedule.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(detailSchedule)
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 border border-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => setDetailSchedule(null)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block font-semibold">Total de Alunos Matriculados:</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {detailSchedule.students ? detailSchedule.students.length : 0} alunos
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Capacidade da Turma:</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {detailSchedule.maxCapacity || 30} vagas
                  </span>
                </div>
              </div>

              {/* Add Student to Schedule Section */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                <h4 className="font-bold text-xs uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Matricular Aluno neste Horário
                </h4>

                {(() => {
                  const enrolledIds = (detailSchedule.students || []).map((s: any) => s.studentId || s.student?.id)
                  const availableStudents = students.filter((s: any) => !enrolledIds.includes(s.id) && s.status === "ATIVO")

                  return (
                    <div className="flex gap-2">
                      <select
                        value={selectedStudentToEnroll}
                        onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-rose-500"
                      >
                        <option value="">-- Selecione um aluno para matricular --</option>
                        {availableStudents.map((st: any) => (
                          <option key={st.id} value={st.id}>
                            {st.name} — Faixa {getBeltInfo(st.beltRank).label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={handleEnrollStudent}
                        disabled={!selectedStudentToEnroll || isEnrolling}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                      >
                        <UserPlus className="w-4 h-4" /> {isEnrolling ? "Matriculando..." : "Matricular"}
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* Enrolled Students Table / List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-500" /> Alunos Matriculados nesta Turma (
                    {detailSchedule.students ? detailSchedule.students.length : 0})
                  </h4>
                </div>

                {detailSchedule.students && detailSchedule.students.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {detailSchedule.students.map((item: any) => {
                      const st = item.student
                      if (!st) return null
                      const belt = getBeltInfo(st.beltRank)

                      return (
                        <div
                          key={item.id || st.id}
                          className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                              style={{ backgroundColor: belt.color }}
                              title={`Faixa ${belt.label}`}
                            />
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {st.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span>Faixa {belt.label}</span>
                                <span>•</span>
                                <span>{st.phone || st.guardianPhone || "Sem contato"}</span>
                                <span>•</span>
                                <span className={st.status === "ATIVO" ? "text-emerald-500" : "text-amber-500"}>
                                  {st.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUnenrollStudent(st.id, st.name)}
                            className="px-2.5 py-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Desmatricular deste horário"
                          >
                            <UserMinus className="w-3.5 h-3.5" /> Desmatricular
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    Nenhum aluno matriculado nesta turma ainda. Utilize o seletor acima para matricular.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
