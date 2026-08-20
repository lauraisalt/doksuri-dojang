"use client"

import { useState, useEffect } from "react"
import { getAttendanceByDateAndSchedule, saveAttendance } from "@/lib/db-actions"
import { getBeltInfo } from "@/lib/constants"
import { Calendar, Clock, CheckCircle2, XCircle, Users, Award, Save } from "lucide-react"

interface Props {
  schedules: any[]
}

export function AttendanceClientView({ schedules }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id || "")
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [presenceState, setPresenceState] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Load attendance data when date or schedule changes
  useEffect(() => {
    if (!selectedScheduleId || !selectedDate) return

    async function loadData() {
      const data = await getAttendanceByDateAndSchedule(
        new Date(selectedDate),
        selectedScheduleId
      )
      setAttendanceData(data)

      // Initialize presence states
      const stateMap: Record<string, boolean> = {}
      data.schedule?.students.forEach((s: any) => {
        const existing = data.attendances.find((a: any) => a.studentId === s.student.id)
        stateMap[s.student.id] = existing ? existing.present : true // default present
      })
      setPresenceState(stateMap)
    }

    loadData()
  }, [selectedDate, selectedScheduleId])

  const togglePresence = (studentId: string) => {
    setPresenceState((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }))
  }

  const handleSave = async () => {
    if (!selectedScheduleId) return
    setIsSaving(true)
    setSavedSuccess(false)

    try {
      const records = Object.entries(presenceState).map(([studentId, present]) => ({
        studentId,
        present,
      }))
      await saveAttendance(selectedScheduleId, new Date(selectedDate), records)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar chamada.")
    } finally {
      setIsSaving(false)
    }
  }

  const enrolledStudents = attendanceData?.schedule?.students || []
  const totalCount = enrolledStudents.length
  const presentCount = Object.values(presenceState).filter(Boolean).length
  const absentCount = totalCount - presentCount
  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Pickers Bar */}
      <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Schedule Picker */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" />
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.dayOfWeek} às {s.time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || totalCount === 0}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/25"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Salvando..." : savedSuccess ? "✓ Salvo com Sucesso!" : "Salvar Chamada"}
        </button>
      </div>

      {/* Class Attendance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md transition-colors">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Matriculados na Turma</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCount} alunos
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md transition-colors">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Presentes</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {presentCount} ({pct}%)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md transition-colors">
          <span className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase">Ausentes</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{absentCount}</div>
        </div>
      </div>

      {/* Roll Call Table */}
      {enrolledStudents.length > 0 ? (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-md backdrop-blur-md transition-colors">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Lista de Presença — {attendanceData?.schedule?.dayOfWeek} ({attendanceData?.schedule?.time})
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {enrolledStudents.map((item: any) => {
              const student = item.student
              const belt = getBeltInfo(student.beltRank)
              const isPresent = presenceState[student.id] ?? true

              return (
                <div
                  key={student.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                      style={{ backgroundColor: belt.color }}
                      title={belt.label}
                    />
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {belt.label} • {student.paymentType}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePresence(student.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isPresent
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Presente
                    </button>

                    <button
                      onClick={() => togglePresence(student.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        !isPresent
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <XCircle className="w-4 h-4" /> Falta
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-lg backdrop-blur-md">
          <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">
            Nenhum aluno matriculado nesta turma
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Matricule alunos nos horários através da tela de Alunos ou Horários.
          </p>
        </div>
      )}
    </div>
  )
}
