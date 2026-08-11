import { getPayments, getGympassCheckins, getStudents } from "@/lib/db-actions"
import { FinancialClientView } from "./financial-client-view"

export const revalidate = 0

export default async function FinanceiroPage() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [payments, checkins, students] = await Promise.all([
    getPayments(currentMonth, currentYear),
    getGympassCheckins(currentMonth, currentYear),
    getStudents(),
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Gestão Financeira & Gympass
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Controle mensalidades dos alunos e acompanhe o repasse de check-ins Gympass.
        </p>
      </div>

      <FinancialClientView
        initialPayments={payments}
        initialCheckins={checkins}
        students={students}
        month={currentMonth}
        year={currentYear}
      />
    </div>
  )
}
