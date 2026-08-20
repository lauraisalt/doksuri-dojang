"use client"

import { useState, useEffect } from "react"
import {
  Trophy,
  Calendar,
  MapPin,
  Shield,
  Plus,
  Trash2,
  X,
  UserPlus,
  Sparkles,
  Check,
  Edit2,
  Scale,
  Swords,
  Award,
  Ruler,
  RefreshCw,
  ArrowRightLeft,
} from "lucide-react"
import {
  createEvent,
  updateEvent,
  deleteEvent,
  createModality,
  createCategory,
  registerStudentInCategory,
  removeStudentFromCategory,
  updateParticipant,
  generateBrackets,
  swapBracketAthletes,
  updateBracketMatch,
  autoRankMeasurementCategory,
} from "@/lib/db-actions"
import { BELT_RANKS, getBeltInfo } from "@/lib/constants"
import { useRouter } from "next/navigation"

interface Props {
  initialEvents: any[]
  students?: any[]
}

const EVENT_STATUSES = [
  { value: "PLANEJAMENTO", label: "Planejamento", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { value: "INSCRICOES", label: "Inscrições Abertas", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
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
  const [activeCategoryForMeasurement, setActiveCategoryForMeasurement] = useState<any | null>(null)

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
  const [weighInWeight, setWeighInWeight] = useState<number | "">("")
  const [weighInPaid, setWeighInPaid] = useState(true)
  const [weighInMedal, setWeighInMedal] = useState("")
  const [weighInMetric, setWeighInMetric] = useState<number | "">("")
  const [weighInScore, setWeighInScore] = useState<number | "">("")

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

  // Modality Creation
  const handleCreateModality = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeEventIdForModality || !modalityName) return
    setIsSubmitting(true)
    try {
      await createModality({
        eventId: activeEventIdForModality,
        name: modalityName,
        type: modalityType,
      })
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

  // Student Registration (INSTANT REFLECTION)
  const handleRegisterStudent = async (studentIdToRegister: string) => {
    if (!activeCategoryForStudent || !studentIdToRegister) return
    setIsSubmitting(true)
    try {
      await registerStudentInCategory({
        categoryId: activeCategoryForStudent.id,
        studentId: studentIdToRegister,
        paidRegistration: true,
        amountPaid: 80,
      })

      // Update local state instantly so participant appears immediately
      const studentObj = students.find((s) => s.id === studentIdToRegister)
      if (studentObj) {
        const newParticipant = {
          id: `temp-${Date.now()}`,
          categoryId: activeCategoryForStudent.id,
          studentId: studentIdToRegister,
          student: studentObj,
          paidRegistration: true,
          amountPaid: 80,
          weight: null,
          medal: null,
        }
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
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao remover atleta.")
      }
    }
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
        weight: weighInWeight !== "" ? Number(weighInWeight) : undefined,
        medal: weighInMedal || undefined,
        metric: weighInMetric !== "" ? Number(weighInMetric) : undefined,
        score: weighInScore !== "" ? Number(weighInScore) : undefined,
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

  // Generate Brackets sorted by weight/belt
  const handleGenerateBrackets = async (categoryId: string) => {
    try {
      await generateBrackets(categoryId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar chave de lutas.")
    }
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

  const handleSelectWinner = async (matchId: string, winnerId: string) => {
    try {
      await updateBracketMatch(matchId, winnerId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao definir vencedor.")
    }
  }

  // Auto Rank Measurement / Salto em Distância
  const handleAutoRankMeasurement = async (categoryId: string) => {
    try {
      await autoRankMeasurementCategory(categoryId)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao calcular classificação por medição.")
    }
  }

  const handleDeleteEvent = async (id: string, name: string) => {
    if (confirm(`Deseja remover o campeonato "${name}"?`)) {
      try {
        await deleteEvent(id)
        router.refresh()
      } catch (err) {
        console.error(err)
        alert("Erro ao remover campeonato.")
      }
    }
  }

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
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-lg space-y-6 transition-colors"
              >
                {/* Event Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusObj.color}`}>
                        {statusObj.label}
                      </span>
                      <button
                        onClick={() => handleOpenEditEvent(event)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Editar Evento / Status"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id, event.name)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Excluir Campeonato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {event.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
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

                  <button
                    onClick={() => setActiveEventIdForModality(event.id)}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <Plus className="w-4 h-4 text-rose-500" /> Adicionar Modalidade
                  </button>
                </div>

                {/* Modalities Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-500" /> Modalidades & Categorias
                  </h3>

                  {event.modalities && event.modalities.length > 0 ? (
                    event.modalities.map((mod: any) => (
                      <div
                        key={mod.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                            {mod.name} <span className="text-slate-400 text-[10px]">({mod.type})</span>
                          </div>
                          <button
                            onClick={() => setActiveModalityIdForCategory(mod.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Categoria
                          </button>
                        </div>

                        {/* Categories Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {mod.categories && mod.categories.length > 0 ? (
                            mod.categories.map((cat: any) => (
                              <div
                                key={cat.id}
                                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                                      {cat.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                      <span>Faixa: <strong>{cat.beltRange || "Todas"}</strong></span>
                                      <span>•</span>
                                      <span>Gênero: <strong>{cat.gender || "Misto"}</strong></span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {mod.type === "COMBATE" && (
                                      <button
                                        onClick={() => setActiveCategoryForBrackets(cat)}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                        title="Chaves de Combate Mata-Mata"
                                      >
                                        <Swords className="w-3.5 h-3.5" /> Chaves
                                      </button>
                                    )}

                                    {mod.type === "MEDICAO" && (
                                      <button
                                        onClick={() => handleAutoRankMeasurement(cat.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                        title="Calcular Pódio do Salto/Medição (Empates inclusos)"
                                      >
                                        <Ruler className="w-3.5 h-3.5" /> Rank Salto
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setActiveCategoryForStudent(cat)}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" /> Inscrever
                                    </button>
                                  </div>
                                </div>

                                {/* Participants List */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase flex items-center justify-between">
                                    <span>Atletas Inscritos ({cat.participants ? cat.participants.length : 0}):</span>
                                    <span className="text-[10px] text-slate-400">Peso / Salto</span>
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
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                  {(p.weight || p.student?.weight) ? (
                                                    <span>Peso: {p.weight || p.student?.weight} kg</span>
                                                  ) : (
                                                    <span>Sem peso</span>
                                                  )}
                                                  {p.metric !== null && p.metric !== undefined && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                      • Salto: {p.metric}m
                                                    </span>
                                                  )}
                                                  <span>•</span>
                                                  <span className={p.paidRegistration ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}>
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
                                                onClick={() => handleOpenWeighIn(p)}
                                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                title="Pesagem / Salto / Medalha"
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
                                    <div className="text-[11px] text-slate-400 italic">
                                      Nenhum atleta inscrito nesta categoria.
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 py-2">
                              Nenhuma categoria criada nesta modalidade.
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-3">
                      Nenhuma modalidade cadastrada ainda neste campeonato.
                    </p>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <Trophy className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Nenhum campeonato cadastrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Clique em "Novo Campeonato" para cadastrar um evento oficial.
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

      {/* Modal 2: Create Modality */}
      {activeEventIdForModality && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-500" /> Adicionar Modalidade
              </h3>
              <button onClick={() => setActiveEventIdForModality(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModality} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nome da Modalidade *
                </label>
                <input
                  type="text"
                  required
                  value={modalityName}
                  onChange={(e) => setModalityName(e.target.value)}
                  placeholder="Ex: Combate Kyorugi, Salto em Distância, Formas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Tipo de Modalidade
                </label>
                <select
                  value={modalityType}
                  onChange={(e) => setModalityType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="COMBATE">Combate (Chave Luta)</option>
                  <option value="MEDICAO">Medição (Salto em Distância / Altura)</option>
                  <option value="PONTUACAO">Pontuação (Notas de Apresentação)</option>
                </select>
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
                  placeholder="Ex: Salto em Distância Adulto ou Luta Faixa Preta"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
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
                  {isSubmitting ? "Salvando..." : "Criar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Register Student with Smart Belt Suggestions */}
      {activeCategoryForStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-rose-500" /> Inscrever Aluno na Categoria
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeCategoryForStudent.name}
                </p>
              </div>
              <button onClick={() => setActiveCategoryForStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Belt Suggestions Section */}
            {(() => {
              const enrolledIds = (activeCategoryForStudent.participants || []).map((p: any) => p.studentId)

              const suggestedStudents = students.filter((s: any) => {
                if (enrolledIds.includes(s.id)) return false
                if (activeCategoryForStudent.beltRange && activeCategoryForStudent.beltRange !== "TODAS") {
                  return s.beltRank === activeCategoryForStudent.beltRange
                }
                return true
              })

              return (
                <div className="space-y-4 text-xs">
                  {/* Smart Suggestions Box */}
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4" /> Sugestões por Faixa ({activeCategoryForStudent.beltRange || "Todas"})
                    </div>
                    {suggestedStudents.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {suggestedStudents.map((s: any) => {
                          const belt = getBeltInfo(s.beltRank)
                          return (
                            <div
                              key={s.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600"
                                  style={{ backgroundColor: belt.color }}
                                />
                                <div>
                                  <span className="font-semibold text-slate-900 dark:text-white">
                                    {s.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 ml-1.5">
                                    ({belt.label})
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRegisterStudent(s.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3 h-3" /> Inscrever
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Nenhum aluno com a faixa exata disponível no momento.
                      </p>
                    )}
                  </div>

                  {/* Manual Selector */}
                  <div className="pt-2">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Ou Selecione Qualquer Aluno do Dojang:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="">-- Selecionar Aluno --</option>
                        {students
                          .filter((s: any) => !enrolledIds.includes(s.id))
                          .map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} — Faixa {getBeltInfo(s.beltRank).label}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => handleRegisterStudent(selectedStudentId)}
                        disabled={!selectedStudentId || isSubmitting}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shrink-0"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal 5: Weigh-in, Metric (Salto em Distância) & Medals */}
      {activeParticipantForWeighIn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-rose-500" /> Pesagem / Salto / Medalha
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
                    type="number"
                    step="0.1"
                    value={weighInWeight}
                    onChange={(e) => setWeighInWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="75.5"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Métrica Salto (metros)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={weighInMetric}
                    onChange={(e) => setWeighInMetric(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ex: 2.45"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Taxa Inscrição
                  </label>
                  <select
                    value={weighInPaid ? "PAGO" : "PENDENTE"}
                    onChange={(e) => setWeighInPaid(e.target.value === "PAGO")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="PAGO">Pago (Ok)</option>
                    <option value="PENDENTE">Pendente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Medalha Manual / Pódio
                  </label>
                  <select
                    value={weighInMedal}
                    onChange={(e) => setWeighInMedal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">-- Nenhuma --</option>
                    <option value="OURO">🥇 Ouro (1º Lugar)</option>
                    <option value="PRATA">🥈 Prata (2º Lugar)</option>
                    <option value="BRONZE">🥉 Bronze (3º Lugar / Empate)</option>
                  </select>
                </div>
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
                  {isSubmitting ? "Salvando..." : "Salvar Dados"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Interactive Brackets with Manual Match Athlete Swap */}
      {activeCategoryForBrackets && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Swords className="w-5 h-5 text-indigo-500" /> Chaves de Combate (Brackets)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeCategoryForBrackets.name} — Paridade por Peso e Faixa
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateBrackets(activeCategoryForBrackets.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Gerar Chaves (por Peso)
                </button>
                <button onClick={() => setActiveCategoryForBrackets(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Brackets Content */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {activeCategoryForBrackets.matches && activeCategoryForBrackets.matches.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Rodada 1 (Eliminatórias):</span>
                    <span className="text-[11px] text-slate-400">
                      Você pode trocar os lutadores manualmente nos seletores abaixo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCategoryForBrackets.matches.map((match: any, index: number) => {
                      const categoryAthletes = (activeCategoryForBrackets.participants || []).map((p: any) => p.student)

                      return (
                        <div
                          key={match.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs"
                        >
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                            <span>Luta #{index + 1}</span>
                            {match.winnerId && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Finalizada
                              </span>
                            )}
                          </div>

                          {/* Athlete 1 Selector & Winner Button */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Atleta 1 (Canto Vermelho)</label>
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
                                    {s.name} ({getBeltInfo(s.beltRank).label})
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
                            <label className="text-[11px] font-semibold text-slate-500">Atleta 2 (Canto Azul)</label>
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
                                    {s.name} ({getBeltInfo(s.beltRank).label})
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
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhuma chave gerada ainda. Clique no botão <strong>"Gerar Chaves (por Peso)"</strong> acima para montar os confrontos automaticamente agrupados por peso e faixa.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
