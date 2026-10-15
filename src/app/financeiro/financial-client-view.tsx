"use client"

import { useState } from "react"
import { togglePaymentStatus, addGympassCheckin } from "@/lib/db-actions"
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  MessageCircle,
  ExternalLink,
  Phone,
  AlertTriangle,
  X,
  Send,
  ShieldAlert,
  Info,
} from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<"mensalidades" | "inadimplentes" | "gympass">("mensalidades")
  const [payments, setPayments] = useState(initialPayments)
  const [checkins, setCheckins] = useState(initialCheckins)
  const [statusFilter, setStatusFilter] = useState("ALL")

  // WhatsApp Billing Modal State
  const [whatsappModalData, setWhatsappModalData] = useState<{
    student: any
    recipientName: string
    recipientPhone: string
    isMinor: boolean
    monthsList: string
    totalAmount: number
    messageText: string
  } | null>(null)

  // Gympass Add Modal
  const [isGympassOpen, setIsGympassOpen] = useState(false)
  const [gympassStudentId, setGympassStudentId] = useState("")
  const [gympassDate, setGympassDate] = useState(new Date().toISOString().split("T")[0])
  const [gympassValue, setGympassValue] = useState(8.5)

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const calculateAge = (birthDateStr: string | Date) => {
    if (!birthDateStr) return 0
    const birth = new Date(birthDateStr)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const monthDiff = now.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Toggle Payment Status
  const handleTogglePayment = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PAGO" ? "PENDENTE" : "PAGO"
    const now = new Date()
    try {
      await togglePaymentStatus(id, nextStatus)
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: nextStatus, paidAt: nextStatus === "PAGO" ? now : null } : p))
      )
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  // Explicit Confirm Payment (Record exact date and time)
  const handleConfirmPayment = async (id: string) => {
    const now = new Date()
    try {
      await togglePaymentStatus(id, "PAGO")
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "PAGO", paidAt: now } : p))
      )
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao confirmar pagamento.")
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

  // Open WhatsApp Billing Modal
  const handleOpenWhatsAppModal = (student: any, overdueList: any[]) => {
    const age = calculateAge(student.birthDate)
    const isMinor = age > 0 && age < 18

    // Minor: send to guardianPhone
    // Adult: send to student's phone
    const phone = isMinor ? (student.guardianPhone || student.phone || "") : (student.phone || student.guardianPhone || "")
    const recipient = isMinor
      ? (student.guardianName ? `${student.guardianName} (Resp. por ${student.name})` : `Responsável por ${student.name}`)
      : student.name

    const monthsText = overdueList.map((p) => `${String(p.month).padStart(2, "0")}/${p.year}`).join(", ")
    const total = overdueList.reduce((acc, p) => acc + (p.amount || 0), 0)

    const defaultMsg = `Olá, ${recipient}! Tudo bem?\n\nAqui é do Instituto Dok Su Ri de Hapkido.\nIdentificamos em nosso sistema mensalidade(s) em aberto referente(s) a: ${monthsText}, no valor total de ${formatCurrency(total)}.\n\nPara acertar via PIX ou caso já tenha efetuado o pagamento, por gentileza nos envie o comprovante por aqui.\n\nEstamos à disposição para qualquer dúvida. Bom treino!`

    setWhatsappModalData({
      student,
      recipientName: recipient,
      recipientPhone: phone,
      isMinor,
      monthsList: monthsText,
      totalAmount: total,
      messageText: defaultMsg,
    })
  }

  // Dispatch WhatsApp Web / App
  const handleSendWhatsApp = () => {
    if (!whatsappModalData) return
    const cleanedPhone = whatsappModalData.recipientPhone.replace(/\D/g, "")

    if (!cleanedPhone) {
      alert("Nenhum número de telefone válido cadastrado para este contato.")
      return
    }

    const fullPhone = cleanedPhone.length === 10 || cleanedPhone.length === 11 ? `55${cleanedPhone}` : cleanedPhone
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(whatsappModalData.messageText)}`
    window.open(url, "_blank")
    setWhatsappModalData(null)
  }

  // Calculate totals for current month
  const totalPaidRevenue = payments
    .filter((p) => p.status === "PAGO")
    .reduce((acc, p) => acc + p.amount, 0)

  const totalPendingRevenue = payments
    .filter((p) => p.status === "PENDENTE" || p.status === "ATRASADO")
    .reduce((acc, p) => acc + p.amount, 0)

  const gympassTotalRevenue = checkins.reduce((acc, c) => acc + c.value, 0)

  // Inadimplentes calculation across all students
  const now = new Date()
  const currentMonthNum = now.getMonth() + 1
  const currentYearNum = now.getFullYear()

  const overdueStudents = students
    .filter((st) => st.paymentType === "MENSALIDADE")
    .map((st) => {
      const studentPayments = st.payments || []
      const dueDay = st.dueDay || 10
      const isDueDayPassed = now.getDate() > dueDay

      const pendingList = studentPayments.filter((p: any) => {
        if (p.status === "PAGO") return false
        if (p.status === "ATRASADO") return true
        if (p.year < currentYearNum) return true
        if (p.year === currentYearNum && p.month < currentMonthNum) return true
        if (p.year === currentYearNum && p.month === currentMonthNum && isDueDayPassed) return true
        return false
      })

      const totalOverdue = pendingList.reduce((acc: number, p: any) => acc + (p.amount || 0), 0)

      return {
        student: st,
        pendingList,
        totalOverdue,
      }
    })
    .filter((item) => item.pendingList.length > 0)
    .sort((a, b) => b.totalOverdue - a.totalOverdue)

  const totalAllOverdue = overdueStudents.reduce((acc, item) => acc + item.totalOverdue, 0)

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === "ALL") return true
    return p.status === statusFilter
  })

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md transition-colors">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            Mensalidades Recebidas ({month}/{year})
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalPaidRevenue)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md transition-colors">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            Mensalidades Pendentes ({month}/{year})
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalPendingRevenue)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md transition-colors">
          <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            Repasse Gympass no Mês
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(gympassTotalRevenue)} ({checkins.length} check-ins)
          </div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("mensalidades")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "mensalidades"
                ? "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Mensalidades do Mês ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab("inadimplentes")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "inadimplentes"
                ? "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Inadimplentes ({overdueStudents.length})
          </button>

          <button
            onClick={() => setActiveTab("gympass")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "gympass"
                ? "bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/25"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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

      {/* Tab 1: Mensalidades do Mês */}
      {activeTab === "mensalidades" && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-md backdrop-blur-md transition-colors">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Cobranças de Mensalidade — Referência {String(month).padStart(2, "0")}/{year}
            </span>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PAGO">Pagas</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="ATRASADO">Atrasadas</option>
            </select>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const isPaid = p.status === "PAGO"
                const st = p.student
                const age = calculateAge(st.birthDate)
                const isMinor = age > 0 && age < 18

                return (
                  <div
                    key={p.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{p.student.name}</span>
                        {isMinor && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Menor ({age} anos)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center flex-wrap gap-2">
                        <span>Vencimento: Dia {p.student.dueDay} • Valor: <strong>{formatCurrency(p.amount)}</strong></span>
                        {p.paidAt && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            • Pago em {new Date(p.paidAt).toLocaleDateString("pt-BR")} às {new Date(p.paidAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {isMinor && st.guardianPhone && (
                          <span>• Contato Resp: {st.guardianPhone}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                          p.status === "PAGO"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : p.status === "ATRASADO"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {p.status}
                      </span>

                      {!isPaid && (
                        <button
                          onClick={() => handleOpenWhatsAppModal(p.student, [p])}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                          title="Cobrar via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Cobrar
                        </button>
                      )}

                      <button
                        onClick={() => handleTogglePayment(p.id, p.status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isPaid
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                        }`}
                        title={isPaid ? "Desfazer pagamento" : "Confirmar pagamento e registrar data/hora atual"}
                      >
                        {isPaid ? (
                          "Desfazer Pago"
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Pagamento
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma mensalidade encontrada com o filtro selecionado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Inadimplentes & Cobrança WhatsApp (Requirement Section 3) */}
      {activeTab === "inadimplentes" && (
        <div className="space-y-4">
          {/* Overdue Students List (Duplicate banner removed per user instruction) */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-md backdrop-blur-md">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Relação de Alunos Inadimplentes ({overdueStudents.length})
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Clique em &quot;Confirmar Pagamento&quot; para dar baixa imediata com data e hora.
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {overdueStudents.length > 0 ? (
                overdueStudents.map(({ student: st, pendingList, totalOverdue }) => {
                  const age = calculateAge(st.birthDate)
                  const isMinor = age > 0 && age < 18
                  const contactPhone = isMinor ? (st.guardianPhone || st.phone || "Sem telefone") : (st.phone || "Sem telefone")

                  return (
                    <div
                      key={st.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {st.name}
                          </span>
                          {isMinor ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Menor ({age} anos) — Cobrança p/ Resp.
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Maior ({age} anos)
                            </span>
                          )}
                        </div>

                        {/* Guardian details for minors */}
                        {isMinor && st.guardianName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Responsável: <strong>{st.guardianName}</strong> • Telefone: <strong>{st.guardianPhone || "Não informado"}</strong>
                          </div>
                        )}

                        {/* List of pending months */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-bold text-rose-500">Meses Pendentes:</span>
                          {pendingList.map((p: any) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5"
                            >
                              <span>{String(p.month).padStart(2, "0")}/{p.year} ({formatCurrency(p.amount)})</span>
                              <button
                                onClick={() => handleConfirmPayment(p.id)}
                                title="Confirmar pagamento deste mês (grava data e hora)"
                                className="text-emerald-600 dark:text-emerald-400 hover:scale-125 transition-transform font-black"
                              >
                                ✓
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                        <div className="text-right mr-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Valor Total Devido</span>
                          <span className="text-base font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(totalOverdue)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleConfirmPayment(pendingList[0].id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
                          title="Confirmar pagamento e registrar data/hora atual"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Confirmar Pagamento
                        </button>

                        <button
                          onClick={() => handleOpenWhatsAppModal(st, pendingList)}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-2 border border-emerald-500/30 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" /> Cobrar via WhatsApp
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    Parabéns! Nenhum aluno com mensalidade em atraso no momento.
                  </p>
                  <p className="text-xs text-slate-500">
                    Todas as cobranças dos alunos do Dojang estão em dia.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Gympass */}
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
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      GP
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white">
                        {c.student.name}
                      </div>
                      <div suppressHydrationWarning className="text-xs text-slate-400">
                        {new Date(c.date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  <span className="font-bold text-sm text-emerald-400">
                    +{formatCurrency(c.value)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum check-in registrado para este mês.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Billing Message Confirmation */}
      {whatsappModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                Cobrança via WhatsApp
              </h3>
              <button onClick={() => setWhatsappModalData(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  Destinatário: {whatsappModalData.recipientName}
                </span>
                {whatsappModalData.isMinor && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                    Responsável pelo Menor
                  </span>
                )}
              </div>
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Telefone de Contato: <strong>{whatsappModalData.recipientPhone || "Não informado"}</strong></span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 pt-0.5">
                Meses em atraso: <strong>{whatsappModalData.monthsList}</strong> • Total: <strong className="text-rose-500">{formatCurrency(whatsappModalData.totalAmount)}</strong>
              </div>
            </div>

            {/* Message Preview / Edit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mensagem a ser enviada:
              </label>
              <textarea
                rows={6}
                value={whatsappModalData.messageText}
                onChange={(e) =>
                  setWhatsappModalData({ ...whatsappModalData, messageText: e.target.value })
                }
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Integration notice */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Modo de Integração:</strong> A mensagem será aberta diretamente no WhatsApp Web / App oficial. O envio por API automática (Z-API / Evolution) está preparado e pode ser configurado em Configurações.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWhatsappModalData(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" /> Abrir no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Gympass Check-in */}
      {isGympassOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-rose-500" /> Registrar Check-in Gympass
            </h3>

            <form onSubmit={handleGympassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Aluno Gympass</label>
                <select
                  value={gympassStudentId}
                  onChange={(e) => setGympassStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold"
                >
                  <option value="">Selecione o aluno...</option>
                  {students
                    .filter((s) => s.paymentType === "GYMPASS")
                    .map((s) => (
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGympassOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white"
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
