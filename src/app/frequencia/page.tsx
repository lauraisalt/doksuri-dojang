import { getSchedules } from "@/lib/db-actions"
import { AttendanceClientView } from "./attendance-client-view"

export const revalidate = 0

export default async function FrequenciaPage() {
  const schedules = await getSchedules()

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Chamada & Controle de Frequência
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Registre a presença dos alunos nas turmas em tempo real.
        </p>
      </div>

      <AttendanceClientView schedules={schedules} />
    </div>
  )
}
