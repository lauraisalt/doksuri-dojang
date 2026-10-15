"use client"

import { useState, useEffect } from "react"
import {
  MODALITY_TYPES,
  getModalityMetricLabel,
  getBeltInfo,
  BELT_RANKS,
  isBeltAtLeast,
} from "@/lib/constants"
import {
  Trophy,
  Plus,
  Users,
  Calendar,
  MapPin,
  Medal,
  Trash2,
  Edit2,
  X,
  Swords,
  Scale,
  Sparkles,
  Check,
  CheckCircle2,
  UserPlus,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Ruler,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react"
import {
  createEvent,
  updateEvent,
  deleteEvent,
  createModality,
  deleteModality,
  createCategory,
  deleteCategory,
  registerStudentInCategory,
  removeStudentFromCategory,
  updateParticipant,
  generateBrackets,
  swapBracketAthletes,
  updateBracketMatch,
  saveManualBrackets,
  autoRankMeasurementCategory,
} from "@/lib/db-actions"
import { useRouter } from "next/navigation"

interface Props {
  initialEvents: any[]
  students: any[]
}

const EVENT_STATUSES = [
  { value: "PLANEJAMENTO", label: "Planejamento", color: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700" },
  { value: "INSCRICOES", label: "Inscrições Abertas", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { value: "EM_ANDAMENTO", label: "Em Andamento", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  { value: "FINALIZADO", label: "Finalizado", color: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700" },
]

export function ChampionshipsClientView({ initialEvents, students = [] }: Props) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)

  // Sync state with props on server revalidation
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)

  const [activeEventIdForModality, setActiveEventIdForModality] = useState<string | null>(null)
  const [activeModalityIdForCategory, setActiveModalityIdForCategory] = useState<string | null>(null)
  const [activeCategoryForStudent, setActiveCategoryForStudent] = useState<any | null>(null)
  const [activeCategoryForBrackets, setActiveCategoryForBrackets] = useState<any | null>(null)
  const [activeParticipantForWeighIn, setActiveParticipantForWeighIn] = useState<any | null>(null)

  // Registration Confirmation Banner (Requirement 4.2)
  const [enrollmentConfirmation, setEnrollmentConfirmation] = useState<{
    studentName: string
    categoryName: string
  } | null>(null)

  // Manual Bracket Building State (Requirement 4.3)
  const [isManualBracketMode, setIsManualBracketMode] = useState(false)
  const [manualMatches, setManualMatches] = useState<
    {
      id: string
      round: number
      position: number
      athlete1Id: string | null
      athlete2Id: string | null
      winnerId: string | null
    }[]
  >([])

  // Event Form State
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0])
  const [eventLocation, setEventLocation] = useState("")
  const [eventOrganization, setEventOrganization] = useState("Federação Paulista de Hapkido")
  const [eventRegistrationFee, setEventRegistrationFee] = useState(80)
  const [eventStatus, setEventStatus] = useState("INSCRICOES")

  // Modality Form State
  const [modalityName, setModalityName] = useState("")
  const [modalityType, setModalityType] = useState("COMBATE")

  // Category Form State
  const [categoryName, setCategoryName] = useState("")
  const [categoryBeltRange, setCategoryBeltRange] = useState("TODAS")
  const [categoryGender, setCategoryGender] = useState("MISTO")
  const [categoryMinAge, setCategoryMinAge] = useState(0)
  const [categoryMaxAge, setCategoryMaxAge] = useState(99)

  // Register Student State
  const [selectedStudentId, setSelectedStudentId] = useState("")

  // Weigh-in & Medals Form State
  const [weighInWeight, setWeighInWeight] = useState<string | number>("")
  const [weighInPaid, setWeighInPaid] = useState(true)
  const [weighInMedal, setWeighInMedal] = useState("")
  const [weighInMetric, setWeighInMetric] = useState<string | number>("")
  const [weighInScore, setWeighInScore] = useState<string | number>("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Open Edit Event Modal
  const handleOpenEditEvent = (event: any) => {
    setEditingEvent(event)
    setEventName(event.name)
    setEventDate(new Date(event.date).toISOString().split("T")[0])
    setEventLocation(event.location || "")
    setEventOrganization(event.organization || "")
    setEventRegistrationFee(event.registrationFee || 0)
    setEventStatus(event.status || "INSCRICOES")
    setIsEventModalOpen(true)
  }

  // Save Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventName || !eventDate) return
    setIsSubmitting(true)

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          name: eventName,
          date: new Date(eventDate),
          location: eventLocation,
          organization: eventOrganization,
          registrationFee: Number(eventRegistrationFee),
          status: eventStatus,
        })
      } else {
        await createEvent({
          name: eventName,
          date: new Date(eventDate),
          location: eventLocation,
          organization: eventOrganization,
          registrationFee: Number(eventRegistrationFee),
        })
      }
      setIsEventModalOpen(false)
      setEditingEvent(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar campeonato.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modality Creation (Requirement 4.1: Chute em altura cria categoria automaticamente)
  const handleCreateModality = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeEventIdForModality || !modalityName) return
    setIsSubmitting(true)
    try {
      const createdMod = await createModality({
        eventId: activeEventIdForModality,
        name: modalityName,
        type: modalityType,
      })

      // If Chute em Altura: do not ask for additional category, create the single default category automatically
      if (modalityType === "CHUTE_ALTURA") {
        await createCategory({
          modalityId: createdMod.id,
          name: "Geral — Chute em Altura",
          beltRange: "TODAS",
          gender: "MISTO",
        })
      }

      setActiveEventIdForModality(null)
      setModalityName("")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao criar modalidade.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModalityIdForCategory || !categoryName) return
    setIsSubmitting(true)
    try {
      await createCategory({
        modalityId: activeModalityIdForCategory,
        name: categoryName,
        beltRange: categoryBeltRange,
        gender: categoryGender,
        minAge: Number(categoryMinAge),
        maxAge: Number(categoryMaxAge),
      })
      setActiveModalityIdForCategory(null)
      setCategoryName("")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao criar categoria.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Student Registration with Clear Visual Confirmation (Requirement 4.2)
  const handleRegisterStudent = async (studentIdToRegister: string) => {
    if (!activeCategoryForStudent || !studentIdToRegister) return
    setIsSubmitting(true)
    try {
      const res = await registerStudentInCategory({
        categoryId: activeCategoryForStudent.id,
        studentId: studentIdToRegister,
        paidRegistration: true,
        amountPaid: 80,
      })

      const studentObj = students.find((s) => s.id === studentIdToRegister)
      const stName = studentObj ? studentObj.name : "Aluno"
      const catName = activeCategoryForStudent.name

      // Visual confirmation banner
      setEnrollmentConfirmation({
        studentName: stName,
        categoryName: catName,
      })

      // Update local state instantly so participant appears immediately and avoids double enrollment
      if (studentObj) {
        const newParticipant = {
          id: res?.id || `temp-${Date.now()}`,
          categoryId: activeCategoryForStudent.id,
          studentId: studentIdToRegister,
          student: studentObj,
          paidRegistration: true,
          amountPaid: 80,
          weight: null,
          medal: null,
        }

        // Update activeCategoryForStudent modal state
        setActiveCategoryForStudent((prev: any) => ({
          ...prev,
          participants: [...(prev.participants || []), newParticipant],
        }))

        // Update main events tree
        setEvents((prevEvents) =>
          prevEvents.map((ev) => ({
            ...ev,
            modalities: ev.modalities.map((mod: any) => ({
              ...mod,
              categories: mod.categories.map((cat: any) => {
                if (cat.id === activeCategoryForStudent.id) {
                  return {
                    ...cat,
                    participants: [...(cat.participants || []), newParticipant],
                  }
                }
                return cat
              }),
            })),
          }))
        )
      }

      setSelectedStudentId("")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao inscrever aluno.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveStudent = async (categoryId: string, studentId: string) => {
    if (confirm("Deseja remover este atleta da categoria?")) {
      try {
        await removeStudentFromCategory(categoryId, studentId)
        setEvents((prevEvents) =>
          prevEvents.map((ev) => ({
            ...ev,
            modalities: ev.modalities.map((mod: any) => ({
              ...mod,
              categories: mod.categories.map((cat: any) => {
                if (cat.id === categoryId) {
                  return {
                    ...cat,
                    participants: (cat.participants || []).filter((p: any) => p.studentId !== studentId),
                  }
                }
                return cat
              }),
            })),
          }))
        )
        if (activeCategoryForStudent?.id === categoryId) {
          setActiveCategoryForStudent((prev: any) => ({
            ...prev,
            participants: (prev.participants || []).filter((p: any) => p.studentId !== studentId),
          }))
        }
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao remover atleta.")
      }
    }
  }

  const parseDecimal = (val: any): number | null => {
    if (val === "" || val === null || val === undefined) return null
    if (typeof val === "number") return isNaN(val) ? null : val
    const cleaned = String(val).replace(",", ".").trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  // Open Weigh-in & Result Modal
  const handleOpenWeighIn = (participant: any) => {
    setActiveParticipantForWeighIn(participant)
    setWeighInWeight(participant.weight ?? "")
    setWeighInPaid(participant.paidRegistration ?? true)
    setWeighInMedal(participant.medal ?? "")
    setWeighInMetric(participant.metric ?? "")
    setWeighInScore(participant.score ?? "")
  }

  const handleSaveWeighIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeParticipantForWeighIn) return
    setIsSubmitting(true)
    try {
      await updateParticipant(activeParticipantForWeighIn.id, {
        paidRegistration: weighInPaid,
        weight: parseDecimal(weighInWeight),
        medal: weighInMedal || null,
        metric: parseDecimal(weighInMetric),
        score: parseDecimal(weighInScore),
      })
      setActiveParticipantForWeighIn(null)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar pesagem/resultado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate Brackets automatically
  const handleGenerateBrackets = async (categoryId: string) => {
    try {
      await generateBrackets(categoryId)
      setIsManualBracketMode(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar chave de lutas.")
    }
  }

  // Open Brackets Modal
  const handleOpenBracketsModal = (cat: any) => {
    setActiveCategoryForBrackets(cat)
    setIsManualBracketMode(false)
    // Pre-populate manual matches with existing matches if available
    const existingMatches = (cat.matches || []).map((m: any) => ({
      id: m.id,
      round: m.round,
      position: m.position,
      athlete1Id: m.athlete1Id,
      athlete2Id: m.athlete2Id,
      winnerId: m.winnerId,
    }))
    setManualMatches(existingMatches)
  }

  // Swap Bracket Athletes manually
  const handleSwapAthletes = async (matchId: string, athlete1Id: string | null, athlete2Id: string | null) => {
    try {
      await swapBracketAthletes(matchId, athlete1Id, athlete2Id)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao alterar atletas na chave.")
    }
  }

  // Select match winner
  const handleSelectWinner = async (matchId: string, winnerId: string) => {
    try {
      await updateBracketMatch(matchId, winnerId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao definir vencedor.")
    }
  }

  // Add a new confrontation slot in Manual Bracket Mode (Requirement 4.3)
  const handleAddManualMatchSlot = () => {
    const newMatch = {
      id: `manual-${Date.now()}-${Math.random()}`,
      round: 1,
      position: manualMatches.length + 1,
      athlete1Id: null,
      athlete2Id: null,
      winnerId: null,
    }
    setManualMatches([...manualMatches, newMatch])
  }

  // Save Manual Brackets (Requirement 4.3)
  const handleSaveManualBrackets = async () => {
    if (!activeCategoryForBrackets) return
    setIsSubmitting(true)
    try {
      await saveManualBrackets(
        activeCategoryForBrackets.id,
        manualMatches.map((m, idx) => ({
          round: 1,
          position: idx + 1,
          athlete1Id: m.athlete1Id,
          athlete2Id: m.athlete2Id,
          isBye: !m.athlete2Id,
          winnerId: m.winnerId,
        }))
      )
      setIsManualBracketMode(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar chave manual.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto Rank Measurement / Salto em Distância / Chute em Altura
  const handleAutoRankMeasurement = async (categoryId: string) => {
    try {
      const res = await autoRankMeasurementCategory(categoryId)
      if (res && res.count === 0) {
        alert("Nenhum atleta nesta categoria possui marca/altura lançada ainda. Abra o ícone ⚖️ ao lado do atleta para lançar a altura primeiro!")
        return
      }
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao calcular classificação por medição.")
    }
  }

  const handleDeleteEvent = async (id: string, name: string) => {
    if (confirm(`Deseja apagar o campeonato "${name}"?`)) {
      try {
        await deleteEvent(id)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao remover campeonato.")
      }
    }
  }

  const handleDeleteModality = async (id: string, name: string) => {
    if (confirm(`Deseja apagar a modalidade "${name}" e suas categorias?`)) {
      try {
        await deleteModality(id)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao remover modalidade.")
      }
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Deseja apagar a categoria "${name}" e todas as suas inscrições?`)) {
      try {
        await deleteCategory(id)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao remover categoria.")
      }
    }
  }

  // Keep activeCategoryForBrackets in sync with events updates
  useEffect(() => {
    if (activeCategoryForBrackets) {
      for (const ev of events) {
        for (const mod of ev.modalities || []) {
          for (const cat of mod.categories || []) {
            if (cat.id === activeCategoryForBrackets.id) {
              setActiveCategoryForBrackets(cat)
              return
            }
          }
        }
      }
    }
  }, [events])

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingEvent(null)
            setEventName("")
            setEventDate(new Date().toISOString().split("T")[0])
            setEventLocation("")
            setIsEventModalOpen(true)
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/25"
        >
          <Plus className="w-4 h-4" /> Novo Campeonato
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {events.length > 0 ? (
          events.map((event: any) => {
            const statusObj = EVENT_STATUSES.find((s) => s.value === event.status) || EVENT_STATUSES[1]

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-md backdrop-blur-md transition-colors space-y-6"
              >
                {/* Event Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-6 h-6 text-rose-500 shrink-0" />
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {event.name}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusObj.color}`}>
                        {statusObj.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <span suppressHydrationWarning className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        {new Date(event.date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {event.location || "Local a definir"}
                      </span>
                      {event.registrationFee > 0 && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Inscrição: R$ {event.registrationFee.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveEventIdForModality(event.id)
                        setModalityName("Luta / Combate")
                        setModalityType("COMBATE")
                      }}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-rose-500/20 transition-all"
                    >
                      <Plus className="w-4 h-4 text-rose-500" /> Adicionar Modalidade
                    </button>

                    <button
                      onClick={() => handleOpenEditEvent(event)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar Campeonato"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(event.id, event.name)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Excluir Campeonato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Modalities & Categories inside Event */}
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-500" /> Modalidades & Categorias
                  </h3>

                  {event.modalities && event.modalities.length > 0 ? (
                    <div className="space-y-4">
                      {event.modalities.map((mod: any) => {
                        const isChuteAltura = mod.type === "CHUTE_ALTURA"

                        return (
                          <div
                            key={mod.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4"
                          >
                            {/* Modality Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {mod.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {mod.type}
                                </span>
                                {isChuteAltura && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    Modalidade Única
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Only show Add Category if NOT Chute em Altura (Requirement 4.1) */}
                                {!isChuteAltura && (
                                  <button
                                    onClick={() => {
                                      setActiveModalityIdForCategory(mod.id)
                                      setCategoryName("")
                                      setCategoryBeltRange("TODAS")
                                      setCategoryGender("MISTO")
                                    }}
                                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-xs font-bold rounded-lg flex items-center gap-1 text-slate-700 dark:text-slate-300 transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-rose-500" /> Adicionar Categoria
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteModality(mod.id, mod.name)}
                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Apagar Modalidade"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Categories under this Modality */}
                            <div className="grid grid-cols-1 gap-3">
                              {mod.categories && mod.categories.length > 0 ? (
                                mod.categories.map((cat: any) => (
                                  <div
                                    key={cat.id}
                                    className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-3"
                                  >
                                    {/* Category Top Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                                            {cat.name}
                                          </span>
                                          {!isChuteAltura && (
                                            <button
                                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                              className="text-slate-400 hover:text-rose-500 p-0.5"
                                              title="Apagar Categoria"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                          <span>Faixa: <strong>{cat.beltRange || "Todas"}</strong></span>
                                          <span>•</span>
                                          <span>Gênero: <strong>{cat.gender || "Misto"}</strong></span>
                                        </div>
                                      </div>

                                      {/* Action Buttons: Chaves, Rank, Inscrever (Preserved per Requirement 4.3) */}
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleOpenBracketsModal(cat)}
                                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                          title="Visualizar e Gerenciar Chaves de Luta"
                                        >
                                          <Swords className="w-3.5 h-3.5" /> Chaves
                                        </button>

                                        {mod.type !== "COMBATE" && (
                                          <button
                                            onClick={() => handleAutoRankMeasurement(cat.id)}
                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                            title="Gerar Classificação & Pódio Oficial"
                                          >
                                            <Ruler className="w-3.5 h-3.5" /> Rank / Pódio
                                          </button>
                                        )}

                                        <button
                                          onClick={() => {
                                            setActiveCategoryForStudent(cat)
                                            setEnrollmentConfirmation(null)
                                          }}
                                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                        >
                                          <UserPlus className="w-3.5 h-3.5" /> Inscrever
                                        </button>
                                      </div>
                                    </div>

                                    {/* Participants List */}
                                    <div className="pt-2">
                                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase flex items-center justify-between">
                                        <span>Atletas Inscritos ({cat.participants ? cat.participants.length : 0}):</span>
                                        <span className="text-[10px] text-slate-400">Peso / Marca / Salto</span>
                                      </div>

                                      {cat.participants && cat.participants.length > 0 ? (
                                        <div className="space-y-1.5">
                                          {cat.participants.map((p: any) => {
                                            const belt = getBeltInfo(p.student.beltRank)
                                            return (
                                              <div
                                                key={p.id}
                                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-800"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <span
                                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                                                    style={{ backgroundColor: belt.color }}
                                                    title={belt.label}
                                                  />
                                                  <div>
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                      {p.student.name}
                                                    </span>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                                                      {(p.weight || p.student?.weight) ? (
                                                        <span>Peso: <strong>{p.weight || p.student?.weight}kg</strong></span>
                                                      ) : (
                                                        <span>Sem peso</span>
                                                      )}
                                                      {p.student?.height && (
                                                        <span>• Altura: <strong>{p.student.height < 3 ? `${p.student.height}m` : `${p.student.height}cm`}</strong></span>
                                                      )}
                                                      {p.metric !== null && p.metric !== undefined && (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                          • {mod.type === "CHUTE_ALTURA" || mod.type === "SALTO_ALTURA" ? "Altura" : mod.type === "TEMPO" ? "Tempo" : "Marca"}: {p.metric}m
                                                        </span>
                                                      )}
                                                      {p.score !== null && p.score !== undefined && (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                          • Nota: {p.score} pts
                                                        </span>
                                                      )}
                                                      <span>•</span>
                                                      <span className={p.paidRegistration ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-500 font-semibold"}>
                                                        {p.paidRegistration ? "Pago" : "Pendente"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                  {p.placement && (
                                                    <span className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                                      #{p.placement}
                                                    </span>
                                                  )}

                                                  {p.medal && (
                                                    <span className="font-bold text-sm">
                                                      {p.medal === "OURO" && "🥇"}
                                                      {p.medal === "PRATA" && "🥈"}
                                                      {p.medal === "BRONZE" && "🥉"}
                                                    </span>
                                                  )}
                                                  <button
                                                    onClick={() => handleOpenWeighIn({ ...p, modalityType: mod.type })}
                                                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                    title="Pesagem / Métrica / Medalha"
                                                  >
                                                    <Scale className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleRemoveStudent(cat.id, p.student.id)}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                                    title="Remover Atleta"
                                                  >
                                                    <X className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                          Nenhum atleta inscrito nesta categoria ainda. Clique no botão &quot;Inscrever&quot; acima.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 py-4 text-center">
                                  Nenhuma categoria criada nesta modalidade.
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      Nenhuma modalidade cadastrada ainda neste campeonato.
                    </p>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <Trophy className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">
              Nenhum campeonato cadastrado ainda
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Clique em &quot;Novo Campeonato&quot; para cadastrar um evento oficial.
            </p>
          </div>
        )}
      </div>

      {/* Modal 1: Create / Edit Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-rose-500" />
                {editingEvent ? "Editar Campeonato" : "Cadastrar Campeonato"}
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nome do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ex: 13º Campeonato Paulista de Hapkido"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Status do Campeonato
                </label>
                <select
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  {EVENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Taxa Inscrição (R$)
                  </label>
                  <input
                    type="number"
                    value={eventRegistrationFee}
                    onChange={(e) => setEventRegistrationFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Local / Ginásio
                </label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Ex: Ginásio Ibirapuera, SP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white shadow-md shadow-rose-600/20"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Campeonato"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Modality (Requirement 4.1: Combate, Chute em Altura, Salto em Altura/Distância, Armas Sang Dchalgon/Espada Coreana, Apresentação Ensaiada) */}
      {activeEventIdForModality && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-500" /> Adicionar Modalidade
              </h3>
              <button onClick={() => setActiveEventIdForModality(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModality} className="space-y-4 text-xs">
              {/* Presets Rápidos com opções exigidas */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  ⚡ Escolha uma Modalidade Oficial:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Luta / Combate")
                      setModalityType("COMBATE")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "COMBATE"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>🥊</span> Luta / Combate
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Chute em Altura")
                      setModalityType("CHUTE_ALTURA")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "CHUTE_ALTURA"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>🦶</span> Chute em Altura (Única)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Salto em Altura")
                      setModalityType("SALTO_ALTURA")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "SALTO_ALTURA"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>⬆️</span> Salto em Altura
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Salto em Distância")
                      setModalityType("SALTO_DISTANCIA")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "SALTO_DISTANCIA"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>🏃</span> Salto em Distância
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Armas — Sang Dchalgon")
                      setModalityType("ARMAS_SANG_DCHALGON")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "ARMAS_SANG_DCHALGON"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>🥢</span> Sang Dchalgon (Nunchaku)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Armas — Espada Coreana")
                      setModalityType("ARMAS_ESPADA_COREANA")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "ARMAS_ESPADA_COREANA"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>⚔️</span> Espada Coreana (Geomdo)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Apresentação Ensaiada")
                      setModalityType("APRESENTACAO_ENSAIADA")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "APRESENTACAO_ENSAIADA"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>🎭</span> Apresentação Ensaiada
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalityName("Formas / Hyung")
                      setModalityType("PONTUACAO")
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all ${
                      modalityType === "PONTUACAO"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>🥋</span> Formas / Hyung (0-10)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nome da Modalidade *
                </label>
                <input
                  type="text"
                  required
                  value={modalityName}
                  onChange={(e) => setModalityName(e.target.value)}
                  placeholder="Ex: Salto em Altura, Chute em Altura, Luta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              {/* Dynamic Metric Info Card */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span>📐</span> Métrica Definida: {getModalityMetricLabel(modalityType).name}
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  {modalityType === "COMBATE"
                    ? "Montagem de chave de lutas por peso/faixa e lançamento de placar e vencedor."
                    : modalityType === "CHUTE_ALTURA"
                    ? "Modalidade única. Categoria geral criada automaticamente sem necessidade de subcategorias adicionais."
                    : `Lançamento direto dos resultados dos atletas em ${getModalityMetricLabel(modalityType).unit || "pontos"} com ranking automático.`}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEventIdForModality(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white"
                >
                  {isSubmitting ? "Salvando..." : "Criar Modalidade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Category */}
      {activeModalityIdForCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" /> Adicionar Categoria
              </h3>
              <button onClick={() => setActiveModalityIdForCategory(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Faixas Coloridas, Adulto até 75kg, Juvenil"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Faixa Requerida
                  </label>
                  <select
                    value={categoryBeltRange}
                    onChange={(e) => setCategoryBeltRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="TODAS">Todas as Faixas</option>
                    {BELT_RANKS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Gênero
                  </label>
                  <select
                    value={categoryGender}
                    onChange={(e) => setCategoryGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="MISTO">Misto</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalityIdForCategory(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Inscrever Aluno na Categoria com Confirmação Visual Clara (Requirement 4.2) */}
      {activeCategoryForStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-rose-500" /> Inscrever Aluno na Categoria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Categoria: <strong>{activeCategoryForStudent.name}</strong>
                </p>
              </div>
              <button onClick={() => setActiveCategoryForStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Success Confirmation Banner (Requirement 4.2) */}
            {enrollmentConfirmation && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    Inscrição realizada! <strong>{enrollmentConfirmation.studentName}</strong> foi inscrito(a) com sucesso na categoria <strong>{enrollmentConfirmation.categoryName}</strong>.
                  </span>
                </div>
                <button
                  onClick={() => setEnrollmentConfirmation(null)}
                  className="text-emerald-500 hover:text-emerald-700 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Enrollment Form */}
            {(() => {
              const enrolledIds = (activeCategoryForStudent.participants || []).map((p: any) => p.studentId || p.student?.id)
              const availableStudents = students.filter((s: any) => !enrolledIds.includes(s.id))

              return (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Selecione o Aluno do Dojang:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="">-- Selecionar Aluno --</option>
                        {availableStudents.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — Faixa {getBeltInfo(s.beltRank).label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRegisterStudent(selectedStudentId)}
                        disabled={!selectedStudentId || isSubmitting}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shrink-0 flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-4 h-4" /> Confirmar Inscrição
                      </button>
                    </div>
                  </div>

                  {/* List of currently enrolled in this category */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="font-bold text-[11px] uppercase text-slate-500">
                      Atletas Já Inscritos nesta Categoria ({enrolledIds.length}):
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {activeCategoryForStudent.participants && activeCategoryForStudent.participants.length > 0 ? (
                        activeCategoryForStudent.participants.map((p: any) => {
                          const belt = getBeltInfo(p.student?.beltRank)
                          return (
                            <div
                              key={p.id || p.studentId}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: belt.color }}
                                />
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {p.student?.name}
                                </span>
                                <span className="text-slate-400 text-[10px]">({belt.label})</span>
                              </div>

                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Inscrito
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-slate-400 py-2 text-center text-xs">
                          Nenhum aluno inscrito ainda.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal 5: Weigh-in & Result */}
      {activeParticipantForWeighIn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-rose-500" /> Pesagem & Resultado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeParticipantForWeighIn.student.name}
                </p>
              </div>
              <button onClick={() => setActiveParticipantForWeighIn(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeighIn} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Peso Aferido (kg)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weighInWeight}
                    onChange={(e) => setWeighInWeight(e.target.value)}
                    placeholder="Ex: 75.5"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Marca / Altura / Nota
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weighInMetric}
                    onChange={(e) => setWeighInMetric(e.target.value)}
                    placeholder="Ex: 2.15"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Medalha Conquistada
                </label>
                <select
                  value={weighInMedal}
                  onChange={(e) => setWeighInMedal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">Sem Medalha</option>
                  <option value="OURO">🥇 Medalha de Ouro (1º Lugar)</option>
                  <option value="PRATA">🥈 Medalha de Prata (2º Lugar)</option>
                  <option value="BRONZE">🥉 Medalha de Bronze (3º Lugar)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveParticipantForWeighIn(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 text-white"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Resultado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Visualização & Montagem Manual de Chaves (Requirement 4.3: Direto na estrutura, sem lista duplicada) */}
      {activeCategoryForBrackets && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Swords className="w-5 h-5 text-rose-500" />
                  Estrutura de Chaves — {activeCategoryForBrackets.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeCategoryForBrackets.participants?.length || 0} atleta(s) inscritos na categoria
                </p>
              </div>

              {/* Action Buttons: Auto vs Manual */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateBrackets(activeCategoryForBrackets.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  title="Gerar automaticamente ordenado por peso e faixa"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Gerar Automática (Peso)
                </button>

                <button
                  onClick={() => {
                    setIsManualBracketMode(!isManualBracketMode)
                    if (!isManualBracketMode && manualMatches.length === 0) {
                      handleAddManualMatchSlot()
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition-all ${
                    isManualBracketMode
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isManualBracketMode ? "Sair da Edição Manual" : "Montagem Manual"}
                </button>

                <button onClick={() => setActiveCategoryForBrackets(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bracket Structure Container (Direct view of matches, NO duplicate general list per Requirement 4.3) */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Manual Mode Toolbar */}
              {isManualBracketMode && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4" /> Modo de Montagem Manual Ativo: Distribua os atletas nos confrontos abaixo
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddManualMatchSlot}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Confronto
                    </button>
                    <button
                      onClick={handleSaveManualBrackets}
                      disabled={isSubmitting}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> {isSubmitting ? "Salvando..." : "Salvar Chave Manual"}
                    </button>
                  </div>
                </div>
              )}

              {/* Matches Grid (Direct bracket display with distributed athletes) */}
              {isManualBracketMode ? (
                /* Manual Matches Editor */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {manualMatches.map((m, idx) => {
                    const athletes = (activeCategoryForBrackets.participants || []).map((p: any) => p.student)

                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2 font-bold text-slate-700 dark:text-slate-300">
                          <span>Confronto #{idx + 1} (Fase Eliminatória)</span>
                          <button
                            onClick={() => setManualMatches(manualMatches.filter((item) => item.id !== m.id))}
                            className="text-slate-400 hover:text-red-500"
                            title="Remover este confronto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Athlete 1 */}
                        <div>
                          <label className="text-[11px] font-bold text-rose-500 block mb-1">
                            Atleta 1 (Canto Vermelho):
                          </label>
                          <select
                            value={m.athlete1Id || ""}
                            onChange={(e) => {
                              const val = e.target.value || null
                              setManualMatches(
                                manualMatches.map((item) => (item.id === m.id ? { ...item, athlete1Id: val } : item))
                              )
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                          >
                            <option value="">-- Selecione o Atleta 1 --</option>
                            {athletes.map((a: any) => (
                              <option key={a.id} value={a.id}>
                                {a.name} (Faixa {getBeltInfo(a.beltRank).label} • {a.weight ? `${a.weight}kg` : "Sem peso"})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="text-center font-black text-[10px] text-slate-400 uppercase">VS</div>

                        {/* Athlete 2 */}
                        <div>
                          <label className="text-[11px] font-bold text-blue-500 block mb-1">
                            Atleta 2 (Canto Azul):
                          </label>
                          <select
                            value={m.athlete2Id || ""}
                            onChange={(e) => {
                              const val = e.target.value || null
                              setManualMatches(
                                manualMatches.map((item) => (item.id === m.id ? { ...item, athlete2Id: val } : item))
                              )
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                          >
                            <option value="">-- W.O / Atleta Isento --</option>
                            {athletes.map((a: any) => (
                              <option key={a.id} value={a.id}>
                                {a.name} (Faixa {getBeltInfo(a.beltRank).label} • {a.weight ? `${a.weight}kg` : "Sem peso"})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : activeCategoryForBrackets.matches && activeCategoryForBrackets.matches.length > 0 ? (
                /* Generated / Saved Matches Display */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCategoryForBrackets.matches.map((match: any, index: number) => {
                    const categoryAthletes = (activeCategoryForBrackets.participants || []).map((p: any) => p.student)

                    return (
                      <div
                        key={match.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs"
                      >
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                          <span>Confronto #{index + 1}</span>
                          {match.winnerId && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Luta Finalizada
                            </span>
                          )}
                        </div>

                        {/* Athlete 1 Selector & Winner Button */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-rose-500">Atleta 1 (Canto Vermelho)</label>
                          <div className="flex items-center gap-2">
                            <select
                              value={match.athlete1Id || ""}
                              onChange={(e) =>
                                handleSwapAthletes(match.id, e.target.value || null, match.athlete2Id)
                              }
                              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                            >
                              <option value="">-- W.O / Isento --</option>
                              {categoryAthletes.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({getBeltInfo(s.beltRank).label} • {s.weight ? `${s.weight}kg` : ""})
                                </option>
                              ))}
                            </select>

                            {match.athlete1Id && (
                              <button
                                onClick={() => handleSelectWinner(match.id, match.athlete1Id)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                  match.winnerId === match.athlete1Id
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white"
                                }`}
                              >
                                {match.winnerId === match.athlete1Id ? "🏆 Vencedor" : "Venceu"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-center font-black text-[10px] text-slate-400 uppercase py-0.5">
                          VS
                        </div>

                        {/* Athlete 2 Selector & Winner Button */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-blue-500">Atleta 2 (Canto Azul)</label>
                          <div className="flex items-center gap-2">
                            <select
                              value={match.athlete2Id || ""}
                              onChange={(e) =>
                                handleSwapAthletes(match.id, match.athlete1Id, e.target.value || null)
                              }
                              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                            >
                              <option value="">-- W.O / Isento --</option>
                              {categoryAthletes.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({getBeltInfo(s.beltRank).label} • {s.weight ? `${s.weight}kg` : ""})
                                </option>
                              ))}
                            </select>

                            {match.athlete2Id && (
                              <button
                                onClick={() => handleSelectWinner(match.id, match.athlete2Id)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                  match.winnerId === match.athlete2Id
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white"
                                }`}
                              >
                                {match.winnerId === match.athlete2Id ? "🏆 Vencedor" : "Venceu"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Swords className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    Nenhuma chave montada ainda para esta categoria.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Clique em <strong>&quot;Gerar Automática (Peso)&quot;</strong> para criar os confrontos balanceados por peso e faixa, ou clique em <strong>&quot;Montagem Manual&quot;</strong> para definir os duelos manualmente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
