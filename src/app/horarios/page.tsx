import { getSchedules } from "@/lib/db-actions"
import { SchedulesClientView } from "./schedules-client-view"

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

      <SchedulesClientView initialSchedules={schedules} />
    </div>
  )
}

