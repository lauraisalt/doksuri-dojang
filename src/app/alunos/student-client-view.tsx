"use client"

import { useState } from "react"
import { BELT_RANKS, STUDENT_STATUS, PAYMENT_TYPES, getBeltInfo } from "@/lib/constants"
import {
  Search,
  Plus,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Award,
  DollarSign,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react"
import { createStudent, deleteStudent, addGraduation } from "@/lib/db-actions"
import { useRouter } from "next/navigation"

interface Props {
  initialStudents: any[]
  schedules: any[]
  selectedStudentId?: string
  initialAction?: string
}

export function StudentClientView({
  initialStudents,
  schedules,
  selectedStudentId,
  initialAction,
}: Props) {
  const router = useRouter()
  const [students] = useState(initialStudents)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [beltFilter, setBeltFilter] = useState("ALL")
  const [paymentFilter, setPaymentFilter] = useState("ALL")
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(initialAction === "new")
  const [activeStudent, setActiveStudent] = useState<any>(
    students.find((s) => s.id === selectedStudentId) || null
  )

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    gender: "MASCULINO",
    birthDate: "",
    phone: "",
    email: "",
    guardianName: "",
    guardianPhone: "",
    fatherName: "",
    motherName: "",
    hasPhysicalLimitation: false,
    physicalLimitationDesc: "",
    hasDisease: false,
    diseaseDesc: "",
    hasAllergies: false,
    allergiesDesc: "",
    usesMedication: false,
    medicationDesc: "",
    medicalNotes: "",
    beltRank: "BRANCA",
    paymentType: "MENSALIDADE",
    monthlyFee: 150,
    dueDay: 10,
    gympassCheckinValue: 8.5,
    scheduleIds: [] as string[],
  })

  // Graduation Form State
  const [isGraduationOpen, setIsGraduationOpen] = useState(false)
  const [gradData, setGradData] = useState({
    toBelt: "AMARELA",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  // Calculate age automatically from birthDate
  const calculateAge = (birthDateStr: string) => {
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

  const currentAge = calculateAge(formData.birthDate)
  const isMinor = currentAge > 0 && currentAge < 18

  // Filter students locally
  const filteredStudents = students.filter((s) => {
    const matchesQuery =
      !searchTerm.trim() ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter
    const matchesBelt = beltFilter === "ALL" || s.beltRank === beltFilter
    const matchesPayment = paymentFilter === "ALL" || s.paymentType === paymentFilter

    return matchesQuery && matchesStatus && matchesBelt && matchesPayment
  })

  // Submit New Student Form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.birthDate) {
      alert("Por favor preencha Nome e Data de Nascimento.")
      return
    }

    try {
      await createStudent({
        ...formData,
        birthDate: new Date(formData.birthDate),
        monthlyFee: Number(formData.monthlyFee),
        dueDay: Number(formData.dueDay),
        gympassCheckinValue: Number(formData.gympassCheckinValue),
      })
      setIsCreateOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao criar aluno.")
    }
  }

  // Handle Belt Graduation
  const handleGraduationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStudent) return

    try {
      await addGraduation({
        studentId: activeStudent.id,
        fromBelt: activeStudent.beltRank,
        toBelt: gradData.toBelt,
        date: new Date(gradData.date),
        notes: gradData.notes,
      })
      setIsGraduationOpen(false)
      setActiveStudent(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao registrar graduação.")
    }
  }

  // Handle Delete Student
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o aluno ${name}? Esta ação não pode ser desfeita.`)) {
      await deleteStudent(id)
      setActiveStudent(null)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, telefone..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800/80 border border-slate-700/60 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
            <option value="TRANCADO">Trancados</option>
          </select>

          {/* Belt Filter */}
          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todas as Faixas</option>
            {BELT_RANKS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todas as Modalidades</option>
            <option value="MENSALIDADE">Mensalidade</option>
            <option value="GYMPASS">Gympass</option>
          </select>

          {/* Create Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/25 ml-auto"
          >
            <Plus className="w-4 h-4" /> Novo Aluno
          </button>
        </div>
      </div>

      {/* Student List View */}
      {filteredStudents.length > 0 ? (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Graduação</th>
                  <th className="py-3.5 px-4">Contato</th>
                  <th className="py-3.5 px-4">Modalidade</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredStudents.map((student) => {
                  const belt = getBeltInfo(student.beltRank)
                  const age = calculateAge(student.birthDate)

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setActiveStudent(student)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-rose-400 transition-colors">
                              {student.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {age} anos • Matrícula em{" "}
                              {new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs inline-block"
                          style={{
                            backgroundColor: belt.color,
                            color: belt.textColor,
                          }}
                        >
                          {belt.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <div>{student.phone || "Sem telefone"}</div>
                        <div className="text-slate-500">{student.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            student.paymentType === "GYMPASS"
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
                              : "bg-blue-500/15 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {student.paymentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            student.status === "ATIVO"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                              : student.status === "TRANCADO"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveStudent(student)
                          }}
                          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-lg backdrop-blur-md">
          <User className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">
            Nenhum aluno encontrado
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tente ajustar seus termos de pesquisa ou filtros.
          </p>
        </div>
      )}

      {/* Modal: Consolidated Student Profile View */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl">
                  {activeStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {activeStudent.name}
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: getBeltInfo(activeStudent.beltRank).color,
                        color: getBeltInfo(activeStudent.beltRank).textColor,
                      }}
                    >
                      {getBeltInfo(activeStudent.beltRank).label}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Idade: {calculateAge(activeStudent.birthDate)} anos • Matrícula:{" "}
                    {new Date(activeStudent.enrollmentDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGraduationOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" /> Promover Faixa
                </button>
                <button
                  onClick={() => handleDelete(activeStudent.id, activeStudent.name)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Excluir Aluno"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
              {/* Personal Data & Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">
                    Dados Pessoais & Contato
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <strong>Gênero:</strong> {activeStudent.gender}
                    </div>
                    <div>
                      <strong>Telefone:</strong> {activeStudent.phone || "Não informado"}
                    </div>
                    <div>
                      <strong>E-mail:</strong> {activeStudent.email || "Não informado"}
                    </div>
                    <div>
                      <strong>Tipo Pagamento:</strong> {activeStudent.paymentType}
                    </div>
                  </div>
                </div>

                {/* Guardian Data for minors */}
                {calculateAge(activeStudent.birthDate) < 18 && (
                  <div>
                    <h4 className="font-bold text-xs uppercase text-rose-500 mb-2">
                      Responsável Legal (Menor)
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div>
                        <strong>Responsável:</strong> {activeStudent.guardianName || "—"}
                      </div>
                      <div>
                        <strong>Telefone Resp.:</strong> {activeStudent.guardianPhone || "—"}
                      </div>
                      <div>
                        <strong>Pai:</strong> {activeStudent.fatherName || "—"}
                      </div>
                      <div>
                        <strong>Mãe:</strong> {activeStudent.motherName || "—"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ficha Médica */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Ficha Médica
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold block text-slate-400">Limitação Física:</span>
                    {activeStudent.hasPhysicalLimitation ? (
                      <span className="text-amber-500 font-bold">
                        {activeStudent.physicalLimitationDesc}
                      </span>
                    ) : (
                      "Nenhuma"
                    )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold block text-slate-400">Doença Crônica:</span>
                    {activeStudent.hasDisease ? (
                      <span className="text-amber-500 font-bold">
                        {activeStudent.diseaseDesc}
                      </span>
                    ) : (
                      "Nenhuma"
                    )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold block text-slate-400">Alergias:</span>
                    {activeStudent.hasAllergies ? (
                      <span className="text-amber-500 font-bold">
                        {activeStudent.allergiesDesc}
                      </span>
                    ) : (
                      "Nenhuma"
                    )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold block text-slate-400">Uso de Medicamentos:</span>
                    {activeStudent.usesMedication ? (
                      <span className="text-amber-500 font-bold">
                        {activeStudent.medicationDesc}
                      </span>
                    ) : (
                      "Nenhum"
                    )}
                  </div>
                </div>
              </div>

              {/* Graduation History */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-rose-500" /> Histórico de Graduações
                </h4>
                {activeStudent.graduations && activeStudent.graduations.length > 0 ? (
                  <div className="space-y-2">
                    {activeStudent.graduations.map((g: any) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-800"
                      >
                        <div>
                          <strong>{g.fromBelt}</strong> ➔{" "}
                          <strong className="text-rose-500">{g.toBelt}</strong>
                          {g.notes && <p className="text-slate-400 text-[11px]">{g.notes}</p>}
                        </div>
                        <span className="text-slate-400">
                          {new Date(g.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Nenhuma graduação registrada ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Student Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" /> Cadastrar Novo Aluno
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  1. Dados Pessoais
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Guardian Block if Minor */}
                {isMinor && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                      Aluno menor de idade ({currentAge} anos) — Dados do Responsável
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Nome do Responsável *"
                        value={formData.guardianName}
                        onChange={(e) =>
                          setFormData({ ...formData, guardianName: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        placeholder="Telefone do Responsável"
                        value={formData.guardianPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, guardianPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ficha Médica */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  2. Ficha Médica
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasPhysicalLimitation}
                      onChange={(e) =>
                        setFormData({ ...formData, hasPhysicalLimitation: e.target.checked })
                      }
                    />
                    <span>Possui Limitação Física?</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasDisease}
                      onChange={(e) => setFormData({ ...formData, hasDisease: e.target.checked })}
                    />
                    <span>Possui Alguma Doença?</span>
                  </label>
                </div>
              </div>

              {/* Academia & Faixa */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  3. Dados da Academia
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Faixa Atual</label>
                    <select
                      value={formData.beltRank}
                      onChange={(e) => setFormData({ ...formData, beltRank: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      {BELT_RANKS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Modalidade Pagamento</label>
                    <select
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      <option value="MENSALIDADE">Mensalidade</option>
                      <option value="GYMPASS">Gympass</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {formData.paymentType === "MENSALIDADE" ? "Valor Mensalidade (R$)" : "Valor Check-in (R$)"}
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyFee}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlyFee: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
                >
                  Salvar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Promote Belt */}
      {isGraduationOpen && activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-rose-500" /> Promover Faixa de {activeStudent.name}
            </h3>

            <form onSubmit={handleGraduationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nova Graduação</label>
                <select
                  value={gradData.toBelt}
                  onChange={(e) => setGradData({ ...gradData, toBelt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  {BELT_RANKS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Data do Exame</label>
                <input
                  type="date"
                  required
                  value={gradData.date}
                  onChange={(e) => setGradData({ ...gradData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Observações do Exame</label>
                <textarea
                  value={gradData.notes}
                  onChange={(e) => setGradData({ ...gradData, notes: e.target.value })}
                  placeholder="Pontuação, banca examinadora, destaques..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGraduationOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white"
                >
                  Confirmar Graduação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
