import { getStudents, getSchedules } from "@/lib/db-actions"
import { BELT_RANKS, STUDENT_STATUS, PAYMENT_TYPES } from "@/lib/constants"
import { StudentClientView } from "./student-client-view"

export const revalidate = 0

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; belt?: string; payment?: string; id?: string; action?: string }>
}) {
  const params = await searchParams
  const query = params.q || ""
  const status = params.status || "ALL"
  const beltRank = params.belt || "ALL"
  const paymentType = params.payment || "ALL"

  const [students, schedules] = await Promise.all([
    getStudents(query, status, beltRank, paymentType),
    getSchedules(),
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Alunos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre, pesquise e gerencie fichas médicas, graduações e histórico dos alunos do Dojang.
          </p>
        </div>
      </div>

      <StudentClientView
        initialStudents={students}
        schedules={schedules}
        selectedStudentId={params.id}
        initialAction={params.action}
      />
    </div>
  )
}
