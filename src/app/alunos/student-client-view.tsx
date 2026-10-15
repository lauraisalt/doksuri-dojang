"use client"

import { useState, useEffect } from "react"
import {
  BELT_RANKS,
  STUDENT_STATUS,
  PAYMENT_TYPES,
  getBeltInfo,
  BELT_SIZES,
  getBeltSizeLabel,
  DAYS_OF_WEEK,
} from "@/lib/constants"
import {
  Search,
  Plus,
  Filter,
  User,
  Phone,
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
  MapPin,
  ShieldAlert,
  CreditCard,
  MessageCircle,
} from "lucide-react"
import {
  createStudent,
  updateStudent,
  deleteStudent,
  addGraduation,
  togglePaymentStatus,
} from "@/lib/db-actions"
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
  const [students, setStudents] = useState(initialStudents)

  useEffect(() => {
    setStudents(initialStudents)
  }, [initialStudents])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [beltFilter, setBeltFilter] = useState("ALL")
  const [paymentFilter, setPaymentFilter] = useState("ALL")

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(initialAction === "new")
  const [activeStudent, setActiveStudent] = useState<any>(
    students.find((s) => s.id === selectedStudentId) || null
  )

  // Keep activeStudent in sync with students updates
  useEffect(() => {
    if (activeStudent) {
      const updated = students.find((s) => s.id === activeStudent.id)
      if (updated) setActiveStudent(updated)
    }
  }, [students])

  // Form State (Email removed per requirements)
  const [formData, setFormData] = useState({
    name: "",
    gender: "MASCULINO",
    birthDate: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
    fatherName: "",
    beltSize: "TAMANHO_3",
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
    weight: "" as number | "",
    height: "" as number | "",
    paymentType: "MENSALIDADE",
    monthlyFee: 150,
    dueDay: 10,
    gympassCheckinValue: 8.5,
    scheduleIds: [] as string[],
  })

  // Graduation Form State (includes location per requirements)
  const [isGraduationOpen, setIsGraduationOpen] = useState(false)
  const [gradData, setGradData] = useState({
    toBelt: "AMARELA",
    date: new Date().toISOString().split("T")[0],
    location: "Dojang Central",
    notes: "",
  })

  // Calculate age automatically from birthDate
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

  const currentAge = calculateAge(formData.birthDate)
  const isMinor = currentAge > 0 && currentAge < 18

  // Filter students locally
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase().trim()
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.guardianPhone && s.guardianPhone.includes(q)) ||
      (s.guardianName && s.guardianName.toLowerCase().includes(q))

    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter
    const matchesBelt = beltFilter === "ALL" || s.beltRank === beltFilter
    const matchesPayment = paymentFilter === "ALL" || s.paymentType === paymentFilter

    return matchesQuery && matchesStatus && matchesBelt && matchesPayment
  })

  const [isEditing, setIsEditing] = useState(false)

  // Submit Student Form (Create or Edit)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.birthDate) {
      alert("Por favor preencha o Nome Completo e a Data de Nascimento.")
      return
    }

    const age = calculateAge(formData.birthDate)

    // Validation rules:
    // Minor: guardianPhone is mandatory. Student phone is NOT required.
    // Adult: student phone is mandatory.
    if (age < 18) {
      if (!formData.guardianPhone.trim()) {
        alert("Para alunos menores de 18 anos, é obrigatório informar o Telefone do Responsável Legal.")
        return
      }
      if (!formData.guardianName.trim()) {
        alert("Para alunos menores de 18 anos, é obrigatório informar o Nome do Responsável Legal.")
        return
      }
    } else {
      if (!formData.phone.trim()) {
        alert("Para alunos maiores de 18 anos, é obrigatório informar o Telefone / WhatsApp do aluno.")
        return
      }
    }

    try {
      const payload = {
        name: formData.name.trim(),
        gender: formData.gender,
        birthDate: new Date(formData.birthDate),
        phone: formData.phone.trim(),
        guardianName: formData.guardianName.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        fatherName: formData.fatherName.trim(),
        beltSize: formData.beltSize,
        hasPhysicalLimitation: formData.hasPhysicalLimitation,
        physicalLimitationDesc: formData.physicalLimitationDesc.trim(),
        hasDisease: formData.hasDisease,
        diseaseDesc: formData.diseaseDesc.trim(),
        hasAllergies: formData.hasAllergies,
        allergiesDesc: formData.allergiesDesc.trim(),
        usesMedication: formData.usesMedication,
        medicationDesc: formData.medicationDesc.trim(),
        medicalNotes: formData.medicalNotes.trim(),
        beltRank: formData.beltRank,
        weight: formData.weight !== "" ? Number(formData.weight) : 0,
        height: formData.height !== "" ? Number(formData.height) : 0,
        paymentType: formData.paymentType,
        monthlyFee: Number(formData.monthlyFee),
        dueDay: Number(formData.dueDay),
        gympassCheckinValue: Number(formData.gympassCheckinValue),
        scheduleIds: formData.scheduleIds,
      }

      if (isEditing && activeStudent) {
        await updateStudent(activeStudent.id, payload)
      } else {
        await createStudent(payload)
      }
      setIsCreateOpen(false)
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert(isEditing ? "Erro ao atualizar aluno." : "Erro ao criar aluno.")
    }
  }

  // Handle Belt Graduation Submit
  const handleGraduationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStudent) return

    try {
      await addGraduation({
        studentId: activeStudent.id,
        fromBelt: activeStudent.beltRank,
        toBelt: gradData.toBelt,
        date: new Date(gradData.date),
        location: gradData.location.trim(),
        notes: gradData.notes.trim(),
      })
      setIsGraduationOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao registrar graduação.")
    }
  }

  // Handle Toggle Payment inside Student Profile (Record exact date and time)
  const handleTogglePaymentInsideProfile = async (paymentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PAGO" ? "PENDENTE" : "PAGO"
    const now = new Date()
    try {
      await togglePaymentStatus(paymentId, nextStatus)
      setActiveStudent((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          payments: (prev.payments || []).map((p: any) =>
            p.id === paymentId
              ? { ...p, status: nextStatus, paidAt: nextStatus === "PAGO" ? now : null }
              : p
          ),
        }
      })
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao alterar situação do pagamento.")
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

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-md backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, telefone..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            {STUDENT_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Belt Filter */}
          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
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
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todas as Modalidades</option>
            <option value="MENSALIDADE">Mensalidade</option>
            <option value="GYMPASS">Gympass</option>
          </select>

          {/* Create Button */}
          <button
            onClick={() => {
              setIsEditing(false)
              setFormData({
                name: "",
                gender: "MASCULINO",
                birthDate: "",
                phone: "",
                guardianName: "",
                guardianPhone: "",
                fatherName: "",
                beltSize: "TAMANHO_3",
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
                weight: "",
                height: "",
                paymentType: "MENSALIDADE",
                monthlyFee: 150,
                dueDay: 10,
                gympassCheckinValue: 8.5,
                scheduleIds: [],
              })
              setIsCreateOpen(true)
            }}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/25 ml-auto"
          >
            <Plus className="w-4 h-4" /> Novo Aluno
          </button>
        </div>
      </div>

      {/* Student List View */}
      {filteredStudents.length > 0 ? (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-md backdrop-blur-md transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Graduação & Faixa</th>
                  <th className="py-3.5 px-4">Contato Telefônico</th>
                  <th className="py-3.5 px-4">Modalidade</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm">
                {filteredStudents.map((student) => {
                  const belt = getBeltInfo(student.beltRank)
                  const age = calculateAge(student.birthDate)
                  const isStMinor = age > 0 && age < 18
                  const phoneDisplay = isStMinor
                    ? student.guardianPhone ? `Resp: ${student.guardianPhone}` : student.phone || "Sem contato"
                    : student.phone || "Sem telefone"

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setActiveStudent(student)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                              {student.name}
                            </div>
                            <div suppressHydrationWarning className="text-xs text-slate-500 dark:text-slate-400">
                              {age} anos {isStMinor && "• Menor"} • Matrícula em{" "}
                              {new Date(student.enrollmentDate).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-xs inline-block"
                            style={{
                              backgroundColor: belt.color,
                              color: belt.textColor,
                            }}
                          >
                            {belt.label}
                          </span>
                          {student.beltSize && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {getBeltSizeLabel(student.beltSize)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <div className="font-medium text-slate-900 dark:text-slate-200">
                          {phoneDisplay}
                        </div>
                        {isStMinor && student.guardianName && (
                          <div className="text-[11px] text-slate-400">
                            Resp: {student.guardianName}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            student.paymentType === "GYMPASS"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {student.paymentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            student.status === "ATIVO"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : student.status === "TRANCADO"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
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
                          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <p className="text-sm font-semibold">Nenhum aluno encontrado com os filtros selecionados.</p>
        </div>
      )}

      {/* Modal: Consolidated Student Profile View */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
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
                  <p suppressHydrationWarning className="text-xs text-slate-400 mt-0.5">
                    Idade: {calculateAge(activeStudent.birthDate)} anos • Matrícula:{" "}
                    {new Date(activeStudent.enrollmentDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const s = activeStudent
                    setFormData({
                      name: s.name || "",
                      gender: s.gender || "MASCULINO",
                      birthDate: s.birthDate ? new Date(s.birthDate).toISOString().split("T")[0] : "",
                      phone: s.phone || "",
                      guardianName: s.guardianName || "",
                      guardianPhone: s.guardianPhone || "",
                      fatherName: s.fatherName || "",
                      beltSize: s.beltSize || "TAMANHO_3",
                      hasPhysicalLimitation: s.hasPhysicalLimitation || false,
                      physicalLimitationDesc: s.physicalLimitationDesc || "",
                      hasDisease: s.hasDisease || false,
                      diseaseDesc: s.diseaseDesc || "",
                      hasAllergies: s.hasAllergies || false,
                      allergiesDesc: s.allergiesDesc || "",
                      usesMedication: s.usesMedication || false,
                      medicationDesc: s.medicationDesc || "",
                      medicalNotes: s.medicalNotes || "",
                      beltRank: s.beltRank || "BRANCA",
                      weight: s.weight && s.weight > 0 ? s.weight : "",
                      height: s.height && s.height > 0 ? s.height : "",
                      paymentType: s.paymentType || "MENSALIDADE",
                      monthlyFee: s.monthlyFee || 150,
                      dueDay: s.dueDay || 10,
                      gympassCheckinValue: s.gympassCheckinValue || 8.5,
                      scheduleIds: s.schedules ? s.schedules.map((sc: any) => sc.scheduleId) : [],
                    })
                    setIsEditing(true)
                    setIsCreateOpen(true)
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 border border-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Aluno
                </button>
                <button
                  onClick={() => setIsGraduationOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" /> + Registrar Graduação
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
              {/* Section 1: Personal Data & Contacts (Email removed, Belt Size & Father added) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">
                    Dados Pessoais & Contato
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <strong>Gênero:</strong> {activeStudent.gender}
                    </div>
                    <div>
                      <strong>Telefone do Aluno:</strong> {activeStudent.phone || "Não informado"}
                    </div>
                    <div>
                      <strong>Tamanho da Faixa:</strong> {getBeltSizeLabel(activeStudent.beltSize)}
                    </div>
                    {activeStudent.fatherName && (
                      <div>
                        <strong>Nome do Pai:</strong> {activeStudent.fatherName}
                      </div>
                    )}
                    <div>
                      <strong>Peso Cadastrado:</strong> {activeStudent.weight ? `${activeStudent.weight} kg` : "Não informado"}
                    </div>
                    <div>
                      <strong>Altura Cadastrada:</strong> {activeStudent.height ? `${activeStudent.height} m` : "Não informada"}
                    </div>
                    <div>
                      <strong>Tipo Pagamento:</strong> {activeStudent.paymentType} • Dia de Vencimento: {activeStudent.dueDay}
                    </div>
                  </div>
                </div>

                {/* Guardian Data for minors (Unified Legal Guardian) */}
                {calculateAge(activeStudent.birthDate) < 18 ? (
                  <div>
                    <h4 className="font-bold text-xs uppercase text-rose-500 mb-2">
                      Responsável Legal (Aluno Menor de Idade)
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong>Responsável Legal:</strong> {activeStudent.guardianName || "Não cadastrado"}
                      </div>
                      <div>
                        <strong>Telefone do Responsável:</strong> {activeStudent.guardianPhone || "Não cadastrado"}
                      </div>
                      <p className="text-[11px] text-slate-400 pt-1">
                        * Contato prioritário para recados, avisos e cobranças financeiras.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center">
                    <span className="text-xs text-slate-400">Aluno maior de 18 anos. Contato direto realizado pelo telefone cadastrado do aluno.</span>
                  </div>
                )}
              </div>

              {/* Section 2: Horários Matriculados (Requirement 2.3) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-500" /> Horários e Turmas Matriculadas
                </h4>

                {activeStudent.schedules && activeStudent.schedules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {activeStudent.schedules.map((item: any) => {
                      const sc = item.schedule
                      if (!sc) return null
                      const dayLabel = DAYS_OF_WEEK.find((d) => d.value === sc.dayOfWeek)?.label || sc.dayOfWeek

                      return (
                        <div
                          key={item.id || sc.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between shadow-2xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                                {sc.time}
                              </span>
                              <span>{dayLabel}</span>
                            </div>
                            {sc.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {sc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">
                    O aluno não está matriculado em nenhuma turma de aula específica no momento.
                  </p>
                )}
              </div>

              {/* Section 3: Histórico Financeiro Completo (Requirement 2.4) */}
              {(() => {
                const now = new Date()
                const currentMonth = now.getMonth() + 1
                const currentYear = now.getFullYear()
                const payments = activeStudent.payments || []

                // Current month fee verification
                const currentPayment = payments.find(
                  (p: any) => p.month === currentMonth && p.year === currentYear
                )
                const isCurrentPaid = currentPayment?.status === "PAGO"
                const dueDay = activeStudent.dueDay || 10
                const isDueDayPassed = now.getDate() > dueDay

                // Overdue payments calculation: status === ATRASADO or (PENDENTE with due date passed)
                const overduePayments = payments.filter((p: any) => {
                  if (p.status === "PAGO") return false
                  if (p.status === "ATRASADO") return true
                  if (p.year < currentYear) return true
                  if (p.year === currentYear && p.month < currentMonth) return true
                  if (p.year === currentYear && p.month === currentMonth && isDueDayPassed) return true
                  return false
                })

                const totalOverdue = overduePayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0)

                return (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Histórico Financeiro & Mensalidades
                      </h4>

                      {/* Current Month Badge */}
                      <div>
                        {isCurrentPaid ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mensalidade Atual ({currentMonth}/{currentYear}): PAGA
                          </span>
                        ) : isDueDayPassed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Mensalidade Atual ({currentMonth}/{currentYear}): ATRASADA (Venceu dia {dueDay})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Mensalidade Atual ({currentMonth}/{currentYear}): PENDENTE (Vence dia {dueDay})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Overdue Total Banner */}
                    {totalOverdue > 0 && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            Atenção: Existem <strong>{overduePayments.length} mensalidade(s) em atraso</strong> para este aluno.
                          </span>
                        </span>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                          Total em Aberto: {formatCurrency(totalOverdue)}
                        </span>
                      </div>
                    )}

                    {/* Payments Table */}
                    {payments.length > 0 ? (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                            <tr>
                              <th className="p-2.5">Mês de Referência</th>
                              <th className="p-2.5">Valor Devido</th>
                              <th className="p-2.5">Vencimento</th>
                              <th className="p-2.5">Data de Pagamento</th>
                              <th className="p-2.5">Situação</th>
                              <th className="p-2.5 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {payments.map((p: any) => {
                              const isPaid = p.status === "PAGO"
                              const isLate = !isPaid && (p.year < currentYear || (p.year === currentYear && p.month <= currentMonth && isDueDayPassed))
                              const displayStatus = isPaid ? "PAGO" : isLate ? "ATRASADO" : "PENDENTE"

                              return (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                    {String(p.month).padStart(2, "0")}/{p.year}
                                  </td>
                                  <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">
                                    {formatCurrency(p.amount)}
                                  </td>
                                  <td className="p-2.5 text-slate-500">
                                    Dia {dueDay}
                                  </td>
                                  <td className="p-2.5 text-slate-600 dark:text-slate-300 font-medium">
                                    {p.paidAt
                                      ? `${new Date(p.paidAt).toLocaleDateString("pt-BR")} às ${new Date(p.paidAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                                      : "—"}
                                  </td>
                                  <td className="p-2.5">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                        displayStatus === "PAGO"
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                          : displayStatus === "ATRASADO"
                                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                      }`}
                                    >
                                      {displayStatus}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <button
                                      onClick={() => handleTogglePaymentInsideProfile(p.id, p.status)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
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
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        Nenhum registro de mensalidade cadastrado para este aluno ainda.
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Section 4: Graduation History (Requirement 2.2) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase text-slate-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-rose-500" /> Histórico Cronológico de Graduações
                  </h4>
                  <button
                    onClick={() => setIsGraduationOpen(true)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Graduação
                  </button>
                </div>

                {activeStudent.graduations && activeStudent.graduations.length > 0 ? (
                  <div className="space-y-2">
                    {activeStudent.graduations.map((g: any) => {
                      const belt = getBeltInfo(g.toBelt)
                      return (
                        <div
                          key={g.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-800 gap-2 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                                style={{ backgroundColor: belt.color }}
                              />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {getBeltInfo(g.fromBelt).label} ➔ <strong className="text-rose-600 dark:text-rose-400">{belt.label}</strong>
                              </span>
                            </div>

                            {g.location && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" /> Local: {g.location}
                              </div>
                            )}

                            {g.notes && (
                              <p className="text-slate-400 text-[11px] italic">
                                &quot;{g.notes}&quot;
                              </p>
                            )}
                          </div>

                          <span suppressHydrationWarning className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] self-start sm:self-center">
                            {new Date(g.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Nenhuma graduação registrada ainda. Clique em &quot;Adicionar Graduação&quot; para registrar.
                  </p>
                )}
              </div>

              {/* Section 5: Ficha Médica */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Ficha Médica & Restrições
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
            </div>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Student Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" />
                {isEditing ? "Editar Aluno" : "Cadastrar Novo Aluno"}
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
                  1. Dados Pessoais & Contato
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
                      placeholder="Nome do aluno"
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

                  {/* Student Phone: required for adults, optional for minors */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {isMinor ? "Telefone do Aluno (Opcional para menor)" : "Telefone / WhatsApp do Aluno *"}
                    </label>
                    <input
                      type="text"
                      required={!isMinor}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Optional Father Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Pai (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder="Nome do pai (opcional)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gênero
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                      <option value="NEUTRO">Neutro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Peso Cadastrado (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value === "" ? "" : Number(e.target.value) })
                      }
                      placeholder="Ex: 75.0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Guardian Block if Minor */}
                {isMinor && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                      Aluno menor de idade ({currentAge} anos) — Dados do Responsável Legal
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nome do Responsável Legal *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nome do pai, mãe ou tutor"
                          value={formData.guardianName}
                          onChange={(e) =>
                            setFormData({ ...formData, guardianName: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Telefone do Responsável Legal (Obrigatório) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="(11) 99999-9999"
                          value={formData.guardianPhone}
                          onChange={(e) =>
                            setFormData({ ...formData, guardianPhone: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ficha Médica Detalhada */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  2. Ficha Médica & Restrições
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Limitação Física */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900 dark:text-white">
                      <input
                        type="checkbox"
                        checked={formData.hasPhysicalLimitation}
                        onChange={(e) =>
                          setFormData({ ...formData, hasPhysicalLimitation: e.target.checked })
                        }
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Possui Limitação Física?</span>
                    </label>
                    {formData.hasPhysicalLimitation && (
                      <input
                        type="text"
                        placeholder="Descreva as limitações..."
                        value={formData.physicalLimitationDesc}
                        onChange={(e) =>
                          setFormData({ ...formData, physicalLimitationDesc: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    )}
                  </div>

                  {/* Doença */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900 dark:text-white">
                      <input
                        type="checkbox"
                        checked={formData.hasDisease}
                        onChange={(e) => setFormData({ ...formData, hasDisease: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Possui Doença Crônica?</span>
                    </label>
                    {formData.hasDisease && (
                      <input
                        type="text"
                        placeholder="Descreva as doenças..."
                        value={formData.diseaseDesc}
                        onChange={(e) => setFormData({ ...formData, diseaseDesc: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    )}
                  </div>

                  {/* Alergias */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900 dark:text-white">
                      <input
                        type="checkbox"
                        checked={formData.hasAllergies}
                        onChange={(e) =>
                          setFormData({ ...formData, hasAllergies: e.target.checked })
                        }
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Possui Alergias?</span>
                    </label>
                    {formData.hasAllergies && (
                      <input
                        type="text"
                        placeholder="Descreva as alergias..."
                        value={formData.allergiesDesc}
                        onChange={(e) =>
                          setFormData({ ...formData, allergiesDesc: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    )}
                  </div>

                  {/* Medicamento Contínuo */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900 dark:text-white">
                      <input
                        type="checkbox"
                        checked={formData.usesMedication}
                        onChange={(e) =>
                          setFormData({ ...formData, usesMedication: e.target.checked })
                        }
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Usa Medicamento Contínuo?</span>
                    </label>
                    {formData.usesMedication && (
                      <input
                        type="text"
                        placeholder="Descreva os medicamentos..."
                        value={formData.medicationDesc}
                        onChange={(e) =>
                          setFormData({ ...formData, medicationDesc: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Academia & Faixa */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  3. Dados da Academia & Graduação
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

                  {/* Belt Size Selector (Requirement 1 & 2) */}
                  <div>
                    <label className="block text-xs font-semibold mb-1">Tamanho da Faixa</label>
                    <select
                      value={formData.beltSize}
                      onChange={(e) => setFormData({ ...formData, beltSize: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    >
                      {BELT_SIZES.map((bs) => (
                        <option key={bs.value} value={bs.value}>
                          {bs.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Tipo de Pagamento</label>
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

              {/* Schedule Selection */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  4. Turmas & Horários de Treino
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  {schedules.map((sc) => {
                    const isChecked = formData.scheduleIds.includes(sc.id)
                    const dayLabel = DAYS_OF_WEEK.find((d) => d.value === sc.dayOfWeek)?.label || sc.dayOfWeek

                    return (
                      <label
                        key={sc.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, scheduleIds: [...formData.scheduleIds, sc.id] })
                            } else {
                              setFormData({
                                ...formData,
                                scheduleIds: formData.scheduleIds.filter((id) => id !== sc.id),
                              })
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>
                          <strong>{dayLabel}</strong> às {sc.time} {sc.description && `(${sc.description})`}
                        </span>
                      </label>
                    )
                  })}
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
                  {isEditing ? "Atualizar Aluno" : "Salvar Aluno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Belt Graduation (Requirement 2.2: Faixa, Data, Local e Observações) */}
      {isGraduationOpen && activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-500" /> Registrar Graduação de Faixa
              </h3>
              <button onClick={() => setIsGraduationOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aluno: <strong>{activeStudent.name}</strong> • Faixa Atual: <strong>{getBeltInfo(activeStudent.beltRank).label}</strong>
            </p>

            <form onSubmit={handleGraduationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Faixa Obtida *
                </label>
                <select
                  value={gradData.toBelt}
                  onChange={(e) => setGradData({ ...gradData, toBelt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                >
                  {BELT_RANKS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Data da Graduação / Exame *
                </label>
                <input
                  type="date"
                  required
                  value={gradData.date}
                  onChange={(e) => setGradData({ ...gradData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Local onde ocorreu a Graduação *
                </label>
                <input
                  type="text"
                  required
                  value={gradData.location}
                  onChange={(e) => setGradData({ ...gradData, location: e.target.value })}
                  placeholder="Ex: Dojang Central - Instituto Dok Su Ri, Ginásio Ibirapuera..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Observações do Exame
                </label>
                <textarea
                  rows={2}
                  value={gradData.notes}
                  onChange={(e) => setGradData({ ...gradData, notes: e.target.value })}
                  placeholder="Banca examinadora, mestre avaliador, pontuação..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGraduationOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
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
