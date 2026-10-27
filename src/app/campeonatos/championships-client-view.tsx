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
  generateChaveBrackets,
  saveManualChaves,
  setChavePlacements,
  swapBracketAthletes,
  updateBracketMatch,
  saveManualBrackets,
  autoRankMeasurementCategory,
} from "@/lib/db-actions"
import { calculateAge } from "@/lib/utils"
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

  // Chave Bracket Building State
  const [isManualBracketMode, setIsManualBracketMode] = useState(false)
  const [bracketCriterion, setBracketCriterion] = useState<"PESO" | "ALTURA" | "IDADE" | "COMBINADO">("PESO")
  const [maxStudentsPerChave, setMaxStudentsPerChave] = useState<number>(3)
  const [manualChaves, setManualChaves] = useState<
    Array<{
      chaveNumber: number
      chaveName: string
      athleteIds: string[]
      placements?: {
        firstId?: string | null
        secondId?: string | null
        thirdId?: string | null
      }
    }>
  >([])
  const [podiumDrafts, setPodiumDrafts] = useState<
    Record<number, { firstId?: string | null; secondId?: string | null; thirdId?: string | null }>
  >({})

  // Event Accordion State (Torneio finalizado fechado por padrão)
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({})

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

  // Category Creation (Sem digitação manual de nome, apenas faixa e gênero)
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModalityIdForCategory) return
    setIsSubmitting(true)
    try {
      const beltLabel = categoryBeltRange === "TODAS" ? "Todas as Faixas" : (getBeltInfo(categoryBeltRange)?.label || categoryBeltRange)
      const genderLabel = categoryGender === "MISTO" ? "Misto" : categoryGender === "MASCULINO" ? "Masculino" : "Feminino"
      const generatedName = `${beltLabel} - ${genderLabel}`

      await createCategory({
        modalityId: activeModalityIdForCategory,
        name: generatedName,
        beltRange: categoryBeltRange,
        gender: categoryGender,
        minAge: Number(categoryMinAge) || 0,
        maxAge: Number(categoryMaxAge) || 99,
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

  // Helper: Extract Chaves from Category matches and participants
  const getChavesForCategory = (cat: any) => {
    if (!cat) return []
    const participants = cat.participants || []
    const matches = cat.matches || []

    if (matches.length === 0) return []

    // Group matches by round (which represents chaveNumber)
    const chavesMap = new Map<
      number,
      {
        chaveNumber: number
        chaveName: string
        athleteIds: Set<string>
        matches: any[]
        placements: {
          firstId?: string | null
          secondId?: string | null
          thirdId?: string | null
          fourthId?: string | null
        }
      }
    >()

    for (const m of matches) {
      const chNum = m.round || 1
      if (!chavesMap.has(chNum)) {
        let chaveName = `Chave ${chNum}`
        const athleteIds = new Set<string>()
        let placements: any = {}
        try {
          if (m.notes && m.notes.startsWith("{")) {
            const parsed = JSON.parse(m.notes)
            if (parsed.chaveName) chaveName = parsed.chaveName
            if (parsed.athleteIds) parsed.athleteIds.forEach((id: string) => athleteIds.add(id))
            if (parsed.placements) placements = parsed.placements
          }
        } catch {}

        chavesMap.set(chNum, {
          chaveNumber: chNum,
          chaveName,
          athleteIds,
          matches: [],
          placements,
        })
      }

      const chaveObj = chavesMap.get(chNum)!
      chaveObj.matches.push(m)
      if (m.athlete1Id) chaveObj.athleteIds.add(m.athlete1Id)
      if (m.athlete2Id) chaveObj.athleteIds.add(m.athlete2Id)
    }

    return Array.from(chavesMap.values()).map((ch) => {
      const athleteIdsList = Array.from(ch.athleteIds)
      const chaveParticipants = participants.filter((p: any) => athleteIdsList.includes(p.studentId))

      const p1 =
        ch.placements?.firstId ||
        chaveParticipants.find((p: any) => p.placement === 1 || p.medal === "OURO")?.studentId ||
        null
      const p2 =
        ch.placements?.secondId ||
        chaveParticipants.find((p: any) => p.placement === 2 || p.medal === "PRATA")?.studentId ||
        null
      const p3 =
        ch.placements?.thirdId ||
        chaveParticipants.find((p: any) => p.placement === 3 || p.medal === "BRONZE")?.studentId ||
        null

      return {
        ...ch,
        athleteIds: athleteIdsList,
        athletes: chaveParticipants.map((p: any) => p.student).filter(Boolean),
        participants: chaveParticipants,
        placements: { firstId: p1, secondId: p2, thirdId: p3 },
      }
    })
  }

  // Helper: Compute approximate medal count for tournament based on Chaves
  const computeEventMedals = (event: any) => {
    let totalGold = 0
    let totalSilver = 0
    let totalBronze = 0
    let totalChaves = 0

    for (const mod of event.modalities || []) {
      for (const cat of mod.categories || []) {
        const participants = cat.participants || []
        if (participants.length === 0) continue

        const matches = cat.matches || []
        if (matches.length > 0) {
          const chavesMap = new Map<number, Set<string>>()
          for (const m of matches) {
            const chNum = m.round || 1
            if (!chavesMap.has(chNum)) chavesMap.set(chNum, new Set<string>())
            if (m.athlete1Id) chavesMap.get(chNum)!.add(m.athlete1Id)
            if (m.athlete2Id) chavesMap.get(chNum)!.add(m.athlete2Id)
            try {
              if (m.notes && m.notes.startsWith("{")) {
                const parsed = JSON.parse(m.notes)
                if (parsed.athleteIds) parsed.athleteIds.forEach((id: string) => chavesMap.get(chNum)!.add(id))
              }
            } catch {}
          }

          totalChaves += chavesMap.size
          chavesMap.forEach((athletesSet) => {
            const count = athletesSet.size
            if (count >= 1) totalGold += 1
            if (count >= 2) totalSilver += 1
            if (count >= 3) totalBronze += 1
            if (count >= 4) totalBronze += count - 2
          })
        } else {
          // Estimate with max 3 per chave
          const estChaves = Math.max(1, Math.ceil(participants.length / 3))
          totalChaves += estChaves
          let rem = participants.length
          for (let i = 0; i < estChaves; i++) {
            const size = Math.min(3, Math.ceil(rem / (estChaves - i)))
            rem -= size
            if (size >= 1) totalGold += 1
            if (size >= 2) totalSilver += 1
            if (size >= 3) totalBronze += 1
          }
        }
      }
    }

    return {
      chaves: totalChaves,
      gold: totalGold,
      silver: totalSilver,
      bronze: totalBronze,
      total: totalGold + totalSilver + totalBronze,
    }
  }

  // Event Accordion Helpers (Encerrado permanece fechado por padrão)
  const isEventExpanded = (event: any) => {
    if (expandedEvents[event.id] !== undefined) {
      return expandedEvents[event.id]
    }
    return event.status !== "FINALIZADO"
  }

  const toggleEventExpanded = (eventId: string) => {
    const ev = events.find((e: any) => e.id === eventId)
    const current = isEventExpanded(ev || { id: eventId, status: "" })
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !current,
    }))
  }

  // Open Brackets Modal
  const handleOpenBracketsModal = (cat: any) => {
    setActiveCategoryForBrackets(cat)
    setIsManualBracketMode(false)
    setBracketCriterion("PESO")
    setMaxStudentsPerChave(3)

    const existingChaves = getChavesForCategory(cat)
    if (existingChaves.length > 0) {
      setManualChaves(
        existingChaves.map((ch) => ({
          chaveNumber: ch.chaveNumber,
          chaveName: ch.chaveName,
          athleteIds: ch.athleteIds,
          placements: ch.placements,
        }))
      )
    } else {
      setManualChaves([
        {
          chaveNumber: 1,
          chaveName: "Chave 1",
          athleteIds: [],
          placements: {},
        },
      ])
    }
  }

  // Generate Automatic Chaves (com critério peso/altura/idade e max alunos por chave)
  const handleGenerateChaves = async () => {
    if (!activeCategoryForBrackets) return
    setIsSubmitting(true)
    try {
      await generateChaveBrackets({
        categoryId: activeCategoryForBrackets.id,
        criterion: bracketCriterion,
        maxPerChave: maxStudentsPerChave,
      })
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao gerar chaves.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateBrackets = async (categoryId: string) => {
    return handleGenerateChaves()
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

  // Manual Mode handlers
  const handleAddManualChave = () => {
    const nextNum = manualChaves.length + 1
    setManualChaves([
      ...manualChaves,
      {
        chaveNumber: nextNum,
        chaveName: `Chave ${nextNum}`,
        athleteIds: [],
        placements: {},
      },
    ])
  }

  const handleRemoveManualChave = (chaveNum: number) => {
    const filtered = manualChaves.filter((c) => c.chaveNumber !== chaveNum)
    setManualChaves(
      filtered.map((c, idx) => ({
        ...c,
        chaveNumber: idx + 1,
        chaveName: `Chave ${idx + 1}`,
      }))
    )
  }

  const handleAssignAthleteToChave = (studentId: string, targetChaveNum: number | null) => {
    setManualChaves((prev) =>
      prev.map((c) => {
        const without = c.athleteIds.filter((id) => id !== studentId)
        if (c.chaveNumber === targetChaveNum) {
          return { ...c, athleteIds: [...without, studentId] }
        }
        return { ...c, athleteIds: without }
      })
    )
  }

  const handleSaveManualChaves = async () => {
    if (!activeCategoryForBrackets) return
    setIsSubmitting(true)
    try {
      await saveManualChaves({
        categoryId: activeCategoryForBrackets.id,
        chaves: manualChaves,
      })
      setIsManualBracketMode(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar chaves manuais.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveChavePodium = async (
    chaveNumber: number,
    placements: { firstId?: string | null; secondId?: string | null; thirdId?: string | null }
  ) => {
    if (!activeCategoryForBrackets) return
    setIsSubmitting(true)
    try {
      await setChavePlacements({
        categoryId: activeCategoryForBrackets.id,
        chaveNumber,
        placements,
      })
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar pódio da chave.")
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
            const isFinished = event.status === "FINALIZADO"
            const expanded = isEventExpanded(event)
            const medals = computeEventMedals(event)

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-md backdrop-blur-md transition-all space-y-4"
              >
                {/* Event Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Trophy className="w-6 h-6 text-rose-500 shrink-0" />
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {event.name}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusObj.color}`}>
                        {statusObj.label}
                      </span>
                      {isFinished && !expanded && (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          Torneio Encerrado (Fechado)
                        </span>
                      )}
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

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Expand/Collapse Toggle Button (Requirement 5) */}
                    <button
                      onClick={() => toggleEventExpanded(event.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border ${
                        expanded
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                          : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100"
                      }`}
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Recolher
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> Expandir Detalhes
                        </>
                      )}
                    </button>

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

                {/* Approximate Medal Count based on Chaves (Requirement 4) */}
                <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        Previsão de Medalhas do Torneio:
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5">
                        ({medals.chaves} chave{medals.chaves !== 1 ? "s" : ""} calculada{medals.chaves !== 1 ? "s" : ""})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-bold flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      🥇 {medals.gold} Ouro
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                      🥈 {medals.silver} Prata
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-orange-700/15 text-orange-800 dark:text-orange-300 border border-orange-700/30 flex items-center gap-1">
                      🥉 {medals.bronze} Bronze
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center gap-1 shadow-xs">
                      🏆 Total: {medals.total} Medalhas
                    </span>
                  </div>
                </div>

                {/* Modalities & Categories inside Event (Requirement 5: Expandable) */}
                {expanded ? (
                  <div className="space-y-4 pt-1">
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
              ) : (
                <div
                  onClick={() => toggleEventExpanded(event.id)}
                  className="p-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                  <span>
                    {isFinished ? "Torneio encerrado mantido fechado para melhor visualização." : "Torneio recolhido."} Clique para expandir detalhes.
                  </span>
                </div>
              )}
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
              {/* Category Name auto-generated based on Belt Range and Gender */}
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                  Nome Gerado Automaticamente
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-rose-500" />
                  {categoryBeltRange === "TODAS" ? "Todas as Faixas" : (getBeltInfo(categoryBeltRange)?.label || categoryBeltRange)} — {categoryGender === "MISTO" ? "Misto" : categoryGender === "MASCULINO" ? "Masculino" : "Feminino"}
                </div>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full sm:flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs"
                      >
                        <option value="">-- Selecionar Aluno ({availableStudents.length} disponíveis) --</option>
                        {availableStudents.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — Faixa {getBeltInfo(s.beltRank).label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRegisterStudent(selectedStudentId)}
                        disabled={!selectedStudentId || isSubmitting}
                        className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-all"
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

      {/* Modal 6: Visualização & Montagem de Chaves (Disputa interna na chave de 1º, 2º, 3º lugares) */}
      {activeCategoryForBrackets && (() => {
        const categoryParticipants = activeCategoryForBrackets.participants || []
        const chavesList = getChavesForCategory(activeCategoryForBrackets)

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl p-6 shadow-2xl max-h-[92vh] flex flex-col space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Swords className="w-5 h-5 text-rose-500" />
                    Chaves de Disputa — {activeCategoryForBrackets.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {categoryParticipants.length} atleta(s) inscritos • Cada chave tem no máximo {maxStudentsPerChave} alunos e disputa 1º, 2º e 3º lugares
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsManualBracketMode(!isManualBracketMode)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition-all ${
                      isManualBracketMode
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {isManualBracketMode ? "Ver Chaves / Lutas" : "Montagem Manual"}
                  </button>

                  <button
                    onClick={() => setActiveCategoryForBrackets(null)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Automatic Generation Bar */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Montar com base em:
                    </label>
                    <select
                      value={bracketCriterion}
                      onChange={(e: any) => setBracketCriterion(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-xs"
                    >
                      <option value="PESO">⚖️ Peso (Mais próximos)</option>
                      <option value="ALTURA">📏 Altura (Mais próximas)</option>
                      <option value="IDADE">🎂 Idade (Mais próximas)</option>
                      <option value="COMBINADO">✨ Combinado (Peso + Altura + Idade)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Máx alunos por chave:
                    </label>
                    <select
                      value={maxStudentsPerChave}
                      onChange={(e) => setMaxStudentsPerChave(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-xs"
                    >
                      <option value={2}>2 alunos por chave</option>
                      <option value={3}>3 alunos por chave (Padrão)</option>
                      <option value={4}>4 alunos por chave</option>
                      <option value={5}>5 alunos por chave</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateChaves}
                  disabled={isSubmitting || categoryParticipants.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm text-xs transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isSubmitting ? "Gerando..." : "Gerar Chaves Automáticas"}
                </button>
              </div>

              {/* Explanatory Rule Pill */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  <strong>Regra do Dojang:</strong> A disputa de 1º, 2º e 3º lugares ocorre exclusivamente entre os alunos da mesma chave (não há cruzamento de uma chave contra outra).
                </span>
              </div>

              {/* Modal Body: Manual Mode vs Visual / Fight Mode */}
              <div className="overflow-y-auto space-y-4 flex-1 pr-1">
                {isManualBracketMode ? (
                  /* Manual Mode: Build & move athletes between chaves */
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <Edit2 className="w-4 h-4" /> Modo Manual: Defina as chaves e distribua os atletas
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAddManualChave}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Nova Chave
                        </button>
                        <button
                          onClick={handleSaveManualChaves}
                          disabled={isSubmitting}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> {isSubmitting ? "Salvando..." : "Salvar Chaves Manuais"}
                        </button>
                      </div>
                    </div>

                    {/* Manual Chaves Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {manualChaves.map((chave) => {
                        const assignedIds = new Set(chave.athleteIds)
                        const assignedStudents = chave.athleteIds
                          .map((id) => categoryParticipants.find((p: any) => p.studentId === id)?.student)
                          .filter(Boolean)

                        const availableForThisChave = categoryParticipants
                          .filter((p: any) => !assignedIds.has(p.studentId))
                          .map((p: any) => p.student)
                          .filter(Boolean)

                        return (
                          <div
                            key={chave.chaveNumber}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {chave.chaveName || `Chave ${chave.chaveNumber}`}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  assignedStudents.length > maxStudentsPerChave
                                    ? "bg-rose-500/15 text-rose-600"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                }`}>
                                  {assignedStudents.length} / {maxStudentsPerChave} alunos
                                </span>
                              </div>

                              <button
                                onClick={() => handleRemoveManualChave(chave.chaveNumber)}
                                className="text-slate-400 hover:text-rose-500 p-1"
                                title="Excluir Chave"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Add Athlete Dropdown */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                                Adicionar Atleta nesta chave:
                              </label>
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAssignAthleteToChave(e.target.value, chave.chaveNumber)
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                              >
                                <option value="">-- Selecione para adicionar --</option>
                                {availableForThisChave.map((st: any) => {
                                  const age = calculateAge(st.birthDate)
                                  return (
                                    <option key={st.id} value={st.id}>
                                      {st.name} ({getBeltInfo(st.beltRank).label} • {st.weight ? `${st.weight}kg` : "Sem peso"} {age > 0 ? `• ${age}a` : ""})
                                    </option>
                                  )
                                })}
                              </select>
                            </div>

                            {/* Assigned Athletes List */}
                            <div className="space-y-1.5 pt-1">
                              {assignedStudents.length > 0 ? (
                                assignedStudents.map((st: any, idx: number) => {
                                  const belt = getBeltInfo(st.beltRank)
                                  const age = calculateAge(st.birthDate)
                                  return (
                                    <div
                                      key={st.id}
                                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-bold text-slate-400 text-[10px]">#{idx + 1}</span>
                                        <span
                                          className="w-2.5 h-2.5 rounded-full shrink-0"
                                          style={{ backgroundColor: belt.color }}
                                        />
                                        <span className="font-bold text-slate-900 dark:text-white truncate">
                                          {st.name}
                                        </span>
                                        <span className="text-slate-400 text-[10px] shrink-0">
                                          ({st.weight ? `${st.weight}kg` : "s/peso"} • {st.height ? `${st.height}m` : "s/alt"} {age > 0 ? `• ${age}a` : ""})
                                        </span>
                                      </div>

                                      <button
                                        onClick={() => handleAssignAthleteToChave(st.id, null)}
                                        className="text-slate-400 hover:text-rose-500 p-1 shrink-0"
                                        title="Remover desta chave"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )
                                })
                              ) : (
                                <p className="text-slate-400 py-3 text-center text-[11px] border border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl">
                                  Nenhum atleta nesta chave ainda. Selecione acima para adicionar.
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : chavesList.length > 0 ? (
                  /* Visual & Fight Mode: Show Each Chave independently */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {chavesList.map((chave) => {
                      const athletes = chave.athletes || []
                      const chaveMatches = chave.matches || []
                      const podium = podiumDrafts[chave.chaveNumber] || chave.placements || {}

                      return (
                        <div
                          key={chave.chaveNumber}
                          className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 space-y-4 text-xs shadow-sm"
                        >
                          {/* Chave Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-sm">
                                #{chave.chaveNumber}
                              </span>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {chave.chaveName}
                                </h4>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {athletes.length} atleta(s) disputando 1º, 2º e 3º lugares
                                </span>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                              Disputa Interna
                            </span>
                          </div>

                          {/* Athletes in this Chave */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">
                              Atletas da Chave:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {athletes.map((st: any) => {
                                const belt = getBeltInfo(st.beltRank)
                                const age = calculateAge(st.birthDate)
                                const participant = chave.participants.find((p: any) => p.studentId === st.id)
                                const placement = participant?.placement

                                return (
                                  <div
                                    key={st.id}
                                    className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: belt.color }}
                                      />
                                      {placement && (
                                        <span className="text-[10px] font-black">
                                          {placement === 1 ? "🥇 1º" : placement === 2 ? "🥈 2º" : placement === 3 ? "🥉 3º" : `#${placement}`}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-bold text-slate-900 dark:text-white truncate" title={st.name}>
                                      {st.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {st.weight ? `${st.weight}kg` : "s/peso"} {age > 0 ? `• ${age}a` : ""}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Round-Robin Matches within this Chave */}
                          {chaveMatches.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                              <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">
                                Confrontos da Chave ({chaveMatches.length}):
                              </span>
                              <div className="space-y-2">
                                {chaveMatches.map((match: any, mIdx: number) => {
                                  const ath1 = athletes.find((a: any) => a.id === match.athlete1Id)
                                  const ath2 = athletes.find((a: any) => a.id === match.athlete2Id)

                                  return (
                                    <div
                                      key={match.id}
                                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                                    >
                                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                        <span>Luta #{mIdx + 1}</span>
                                        {match.winnerId && (
                                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Venceu: {athletes.find((a: any) => a.id === match.winnerId)?.name}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between gap-2">
                                        {/* Fighter 1 */}
                                        <button
                                          onClick={() => ath1 && handleSelectWinner(match.id, ath1.id)}
                                          className={`flex-1 p-2 rounded-xl border text-left font-bold transition-all ${
                                            match.winnerId === ath1?.id
                                              ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs"
                                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-400"
                                          }`}
                                        >
                                          <div className="text-[10px] text-rose-500 uppercase font-black">Canto Vermelho</div>
                                          <div className="truncate text-xs">{ath1 ? ath1.name : "W.O / Isento"}</div>
                                        </button>

                                        <span className="font-black text-[10px] text-slate-400 uppercase shrink-0">VS</span>

                                        {/* Fighter 2 */}
                                        <button
                                          onClick={() => ath2 && handleSelectWinner(match.id, ath2.id)}
                                          className={`flex-1 p-2 rounded-xl border text-left font-bold transition-all ${
                                            match.winnerId === ath2?.id
                                              ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                                          }`}
                                        >
                                          <div className="text-[10px] text-blue-500 uppercase font-black">Canto Azul</div>
                                          <div className="truncate text-xs">{ath2 ? ath2.name : "W.O / Isento"}</div>
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Podium Definition for this Chave */}
                          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">
                                🏆 Pódio da Chave #{chave.chaveNumber} (Medalhas):
                              </span>
                              <button
                                onClick={() => handleSaveChavePodium(chave.chaveNumber, podium)}
                                disabled={isSubmitting}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" /> Salvar Pódio
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {/* 1st Place */}
                              <div>
                                <label className="text-[11px] font-bold text-amber-500 block mb-0.5">
                                  🥇 1º Lugar (Ouro):
                                </label>
                                <select
                                  value={podium.firstId || ""}
                                  onChange={(e) => {
                                    const val = e.target.value || null
                                    setPodiumDrafts((prev) => ({
                                      ...prev,
                                      [chave.chaveNumber]: { ...podium, firstId: val },
                                    }))
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-xs"
                                >
                                  <option value="">-- Não Definido --</option>
                                  {athletes.map((a: any) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 2nd Place */}
                              <div>
                                <label className="text-[11px] font-bold text-slate-400 block mb-0.5">
                                  🥈 2º Lugar (Prata):
                                </label>
                                <select
                                  value={podium.secondId || ""}
                                  onChange={(e) => {
                                    const val = e.target.value || null
                                    setPodiumDrafts((prev) => ({
                                      ...prev,
                                      [chave.chaveNumber]: { ...podium, secondId: val },
                                    }))
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-xs"
                                >
                                  <option value="">-- Não Definido --</option>
                                  {athletes.map((a: any) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 3rd Place */}
                              <div>
                                <label className="text-[11px] font-bold text-amber-700 block mb-0.5">
                                  🥉 3º Lugar (Bronze):
                                </label>
                                <select
                                  value={podium.thirdId || ""}
                                  onChange={(e) => {
                                    const val = e.target.value || null
                                    setPodiumDrafts((prev) => ({
                                      ...prev,
                                      [chave.chaveNumber]: { ...podium, thirdId: val },
                                    }))
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white text-xs"
                                >
                                  <option value="">-- Não Definido --</option>
                                  {athletes.map((a: any) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
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
                      Selecione o critério desejado acima (Peso, Altura ou Idade) e clique em <strong>&quot;Gerar Chaves Automáticas&quot;</strong>, ou clique em <strong>&quot;Montagem Manual&quot;</strong> para criar as chaves e distribuir os alunos manualmente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
