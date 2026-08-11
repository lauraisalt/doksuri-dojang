"use client"

import { useState } from "react"
import { togglePaymentStatus, addGympassCheckin } from "@/lib/db-actions"
import { DollarSign, TrendingUp, CheckCircle2, Clock, AlertCircle, Plus, Calendar, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  initialPayments: any[]
  initialCheckins: any[]
  students: any[]
  month: number
  year: number
}

export function FinancialClientView({
  initialPayments,
  initialCheckins,
  students,
  month,
  year,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"mensalidades" | "gympass">("mensalidades")
  const [payments, setPayments] = useState(initialPayments)
  const [checkins, setCheckins] = useState(initialCheckins)
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Gympass Add Modal
  const [isGympassOpen, setIsGympassOpen] = useState(false)
  const [gympassStudentId, setGympassStudentId] = useState("")
  const [gympassDate, setGympassDate] = useState(new Date().toISOString().split("T")[0])
  const [gympassValue, setGympassValue] = useState(8.5)

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === "ALL") return true
    return p.status === statusFilter
  })

  // Toggle Payment Status
  const handleTogglePayment = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PAGO" ? "PENDENTE" : "PAGO"
    try {
      await togglePaymentStatus(id, nextStatus)
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
      )
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Gympass Checkin Submit
  const handleGympassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gympassStudentId) {
      alert("Selecione um aluno.")
      return
    }

    try {
      await addGympassCheckin(gympassStudentId, new Date(gympassDate), Number(gympassValue))
      setIsGympassOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao registrar check-in Gympass.")
    }
  }

  // Calculate totals
  const totalPaidRevenue = payments
    .filter((p) => p.status === "PAGO")
    .reduce((acc, p) => acc + p.amount, 0)

  const totalPendingRevenue = payments
    .filter((p) => p.status === "PENDENTE" || p.status === "ATRASADO")
    .reduce((acc, p) => acc + p.amount, 0)

  const gympassTotalRevenue = checkins.reduce((acc, c) => acc + c.value, 0)

  const gympassStudents = students.filter((s) => s.paymentType === "GYMPASS")

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md">
          <span className="text-xs font-bold uppercase text-slate-400">
            Mensalidades Recebidas ({month}/{year})
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(totalPaidRevenue)}
          </div>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md">
          <span className="text-xs font-bold uppercase text-slate-400">
            Mensalidades Pendentes / Atrasadas
          </span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {formatCurrency(totalPendingRevenue)}
          </div>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md">
          <span className="text-xs font-bold uppercase text-slate-400">
            Repasse Gympass no Mês
          </span>
          <div className="text-2xl font-black text-blue-400 mt-1">
            {formatCurrency(gympassTotalRevenue)} ({checkins.length} check-ins)
          </div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("mensalidades")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "mensalidades"
                ? "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mensalidades ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab("gympass")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "gympass"
                ? "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Gympass Check-ins ({checkins.length})
          </button>
        </div>

        {activeTab === "gympass" && (
          <button
            onClick={() => setIsGympassOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/25"
          >
            <Plus className="w-4 h-4" /> Registrar Check-in Gympass
          </button>
        )}
      </div>

      {/* Tab 1: Mensalidades */}
      {activeTab === "mensalidades" && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
          <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-white">
              Cobranças de Mensalidade
            </span>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 border border-slate-700/60 rounded-xl text-white focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PAGO">Pagas</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="ATRASADO">Atrasadas</option>
            </select>
          </div>

          <div className="divide-y divide-slate-800/80">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-sm text-white">
                      {p.student.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      Vencimento: Dia {p.student.dueDay} • Valor: {formatCurrency(p.amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        p.status === "PAGO"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          : p.status === "ATRASADO"
                          ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {p.status}
                    </span>

                    <button
                      onClick={() => handleTogglePayment(p.id, p.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        p.status === "PAGO"
                          ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                      }`}
                    >
                      {p.status === "PAGO" ? "Desfazer Pago" : "Dar Baixa (Pago)"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma mensalidade encontrada com o filtro selecionado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Gympass */}
      {activeTab === "gympass" && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
          <div className="p-4 bg-slate-800/40 border-b border-slate-800">
            <span className="font-bold text-sm text-white">
              Histórico de Check-ins Gympass
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {checkins.length > 0 ? (
              checkins.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-xs">
                      GP
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white">
                        {c.student.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(c.date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  <span className="font-extrabold text-sm text-white">
                    +{formatCurrency(c.value)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum check-in registrado neste mês.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gympass Modal */}
      {isGympassOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" /> Registrar Check-in Gympass
            </h3>

            <form onSubmit={handleGympassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Selecione o Aluno Gympass</label>
                <select
                  required
                  value={gympassStudentId}
                  onChange={(e) => setGympassStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 font-semibold text-white focus:outline-none"
                >
                  <option value="">-- Selecione o Aluno --</option>
                  {gympassStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Data do Check-in</label>
                <input
                  type="date"
                  required
                  value={gympassDate}
                  onChange={(e) => setGympassDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Valor do Repasse (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={gympassValue}
                  onChange={(e) => setGympassValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGympassOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-md shadow-rose-600/25"
                >
                  Salvar Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
