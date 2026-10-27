"use server"

import { prisma } from "./prisma"
import { revalidatePath } from "next/cache"
import { BELT_RANKS } from "./constants"
import { calculateAge } from "./utils"

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: "default" } })
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: "default",
        academyName: "Instituto Dok Su Ri - Unidade 3",
        defaultMonthlyFee: 150.0,
        defaultGympassValue: 8.5,
        defaultDueDay: 10,
      },
    })
  }
  return settings
}

export async function updateSettings(data: {
  academyName: string
  logoUrl?: string
  primaryColor?: string
  defaultMonthlyFee: number
  defaultGympassValue: number
  defaultDueDay: number
}) {
  const updated = await prisma.settings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  })
  revalidatePath("/")
  return updated
}

export async function deleteDojangLogo() {
  const updated = await prisma.settings.update({
    where: { id: "default" },
    data: { logoUrl: "" },
  })
  revalidatePath("/")
  return updated
}

export async function resetSettings() {
  const updated = await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      academyName: "Instituto Dok Su Ri - Unidade 3",
      logoUrl: "",
      primaryColor: "rose",
      defaultMonthlyFee: 150.0,
      defaultGympassValue: 8.5,
      defaultDueDay: 10,
    },
    create: {
      id: "default",
      academyName: "Instituto Dok Su Ri - Unidade 3",
      logoUrl: "",
      primaryColor: "rose",
      defaultMonthlyFee: 150.0,
      defaultGympassValue: 8.5,
      defaultDueDay: 10,
    },
  })
  revalidatePath("/")
  return updated
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    lockedStudents,
    gympassStudents,
    monthlyStudents,
    monthlyPayments,
    gympassCheckins,
    schedules,
    recentGraduations,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: "ATIVO" } }),
    prisma.student.count({ where: { status: "INATIVO" } }),
    prisma.student.count({ where: { status: "TRANCADO" } }),
    prisma.student.count({ where: { status: "ATIVO", paymentType: "GYMPASS" } }),
    prisma.student.count({ where: { status: "ATIVO", paymentType: "MENSALIDADE" } }),
    prisma.payment.findMany({
      where: { month: currentMonth, year: currentYear },
    }),
    prisma.gympassCheckin.findMany({
      where: {
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
    }),
    prisma.schedule.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
    }),
    prisma.graduationHistory.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        student: { select: { id: true, name: true, beltRank: true } },
      },
    }),
  ])

  // Paid vs Pending
  const paidPayments = monthlyPayments.filter((p: { status: string }) => p.status === "PAGO")
  const pendingPayments = monthlyPayments.filter((p: { status: string }) => p.status === "PENDENTE")
  const overduePayments = monthlyPayments.filter((p: { status: string }) => p.status === "ATRASADO")

  const monthlyRevenue = paidPayments.reduce((acc: number, p: { amount: number }) => acc + p.amount, 0)
  const pendingRevenue = [...pendingPayments, ...overduePayments].reduce((acc: number, p: { amount: number }) => acc + p.amount, 0)

  // Gympass revenue
  const gympassTotalCheckins = gympassCheckins.length
  const gympassRevenue = gympassCheckins.reduce((acc: number, c: { value: number }) => acc + c.value, 0)

  // Birthday students in current month
  const allStudents = await prisma.student.findMany({
    where: { status: "ATIVO" },
    select: { id: true, name: true, birthDate: true, beltRank: true, phone: true },
  })

  const birthdayStudents = allStudents.filter((s: { birthDate: Date | null }) => {
    if (!s.birthDate) return false
    const bMonth = new Date(s.birthDate).getMonth() + 1
    return bMonth === currentMonth
  })

  // Attendance rate this month
  const totalAttendances = await prisma.attendance.count({
    where: {
      date: {
        gte: new Date(currentYear, currentMonth - 1, 1),
      },
    },
  })
  const presentCount = await prisma.attendance.count({
    where: {
      date: {
        gte: new Date(currentYear, currentMonth - 1, 1),
      },
      present: true,
    },
  })
  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 100

  // Distribution by belt
  const beltsCount: Record<string, number> = {}
  allStudents.forEach((s: { beltRank: string }) => {
    beltsCount[s.beltRank] = (beltsCount[s.beltRank] || 0) + 1
  })

  return {
    totalStudents,
    activeStudents,
    inactiveStudents,
    lockedStudents,
    gympassStudents,
    monthlyStudents,
    monthlyRevenue,
    pendingRevenue,
    paidCount: paidPayments.length,
    pendingCount: pendingPayments.length + overduePayments.length,
    gympassTotalCheckins,
    gympassRevenue,
    birthdayStudents,
    attendanceRate,
    beltsCount,
    schedules,
    recentGraduations,
  }
}

// ─── Students CRUD ──────────────────────────────────────────────────────────

export async function getStudents(query?: string, status?: string, beltRank?: string, paymentType?: string) {
  const where: any = {}

  if (status && status !== "ALL") {
    where.status = status
  }
  if (beltRank && beltRank !== "ALL") {
    where.beltRank = beltRank
  }
  if (paymentType && paymentType !== "ALL") {
    where.paymentType = paymentType
  }
  if (query && query.trim()) {
    const q = query.trim()
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { guardianName: { contains: q } },
    ]
  }

  return prisma.student.findMany({
    where,
    include: {
      schedules: {
        include: { schedule: true },
      },
      payments: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
      checkins: {
        take: 10,
        orderBy: { date: "desc" },
      },
      graduations: {
        orderBy: { date: "desc" },
      },
      participations: {
        include: {
          category: {
            include: {
              modality: {
                include: { event: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })
}

export async function getStudentById(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      schedules: {
        include: { schedule: true },
      },
      payments: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
      checkins: {
        orderBy: { date: "desc" },
      },
      attendances: {
        take: 30,
        orderBy: { date: "desc" },
        include: { schedule: true },
      },
      graduations: {
        orderBy: { date: "desc" },
      },
      participations: {
        include: {
          category: {
            include: {
              modality: {
                include: { event: true },
              },
            },
          },
        },
      },
    },
  })
}

export async function createStudent(data: {
  name: string
  gender: string
  birthDate?: Date | null
  phone?: string
  email?: string
  beltSize?: string
  guardianName?: string
  guardianPhone?: string
  fatherName?: string
  motherName?: string
  hasPhysicalLimitation?: boolean
  physicalLimitationDesc?: string
  hasDisease?: boolean
  diseaseDesc?: string
  hasAllergies?: boolean
  allergiesDesc?: string
  usesMedication?: boolean
  medicationDesc?: string
  medicalNotes?: string
  beltRank: string
  weight?: number
  height?: number
  paymentType: string
  monthlyFee?: number
  dueDay?: number
  gympassCheckinValue?: number
  notes?: string
  scheduleIds?: string[]
}) {
  const { scheduleIds, ...studentFields } = data

  const student = await prisma.student.create({
    data: studentFields,
  })

  if (scheduleIds && scheduleIds.length > 0) {
    await prisma.studentSchedule.createMany({
      data: scheduleIds.map((scheduleId) => ({
        studentId: student.id,
        scheduleId,
      })),
    })
  }

  revalidatePath("/alunos")
  revalidatePath("/horarios")
  revalidatePath("/")
  return student
}

export async function updateStudent(
  id: string,
  data: Partial<Parameters<typeof createStudent>[0]>
) {
  const { scheduleIds, ...studentFields } = data

  const student = await prisma.student.update({
    where: { id },
    data: studentFields,
  })

  if (scheduleIds !== undefined) {
    await prisma.studentSchedule.deleteMany({ where: { studentId: id } })
    if (scheduleIds.length > 0) {
      await prisma.studentSchedule.createMany({
        data: scheduleIds.map((scheduleId) => ({
          studentId: id,
          scheduleId,
        })),
      })
    }
  }

  revalidatePath(`/alunos/${id}`)
  revalidatePath("/alunos")
  revalidatePath("/horarios")
  revalidatePath("/")
  return student
}

export async function deleteStudent(id: string) {
  await prisma.student.delete({ where: { id } })
  revalidatePath("/alunos")
  revalidatePath("/horarios")
  revalidatePath("/")
}

// ─── Graduation History ──────────────────────────────────────────────────────

export async function addGraduation(data: {
  studentId: string
  fromBelt: string
  toBelt: string
  date: Date
  location?: string
  notes?: string
}) {
  const grad = await prisma.graduationHistory.create({
    data: {
      studentId: data.studentId,
      fromBelt: data.fromBelt,
      toBelt: data.toBelt,
      date: data.date,
      location: data.location || "",
      notes: data.notes || "",
    },
  })
  await prisma.student.update({
    where: { id: data.studentId },
    data: { beltRank: data.toBelt, lastGraduation: data.date },
  })
  revalidatePath(`/alunos/${data.studentId}`)
  revalidatePath("/alunos")
  return grad
}

// ─── Schedules ───────────────────────────────────────────────────────────────

export async function getSchedules() {
  return prisma.schedule.findMany({
    include: {
      students: {
        include: { student: true },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
  })
}

export async function createSchedule(data: {
  dayOfWeek: string
  time: string
  maxCapacity?: number
  description?: string
}) {
  const schedule = await prisma.schedule.create({ data })
  revalidatePath("/horarios")
  return schedule
}

export async function updateSchedule(
  id: string,
  data: {
    dayOfWeek: string
    time: string
    maxCapacity?: number
    description?: string
  }
) {
  const updated = await prisma.schedule.update({
    where: { id },
    data,
  })
  revalidatePath("/horarios")
  return updated
}

export async function enrollStudentInSchedule(studentId: string, scheduleId: string) {
  const result = await prisma.studentSchedule.upsert({
    where: {
      studentId_scheduleId: { studentId, scheduleId },
    },
    create: { studentId, scheduleId },
    update: {},
  })
  revalidatePath("/horarios")
  revalidatePath("/alunos")
  return result
}

export async function unenrollStudentFromSchedule(studentId: string, scheduleId: string) {
  const result = await prisma.studentSchedule.deleteMany({
    where: { studentId, scheduleId },
  })
  revalidatePath("/horarios")
  revalidatePath("/alunos")
  return result
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export async function getAttendanceByDateAndSchedule(date: Date, scheduleId: string) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const scheduleWithStudents = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      students: {
        include: { student: true },
      },
    },
  })

  const existingAttendances = await prisma.attendance.findMany({
    where: {
      scheduleId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  return {
    schedule: scheduleWithStudents,
    attendances: existingAttendances,
  }
}

export async function saveAttendance(
  scheduleId: string,
  date: Date,
  records: { studentId: string; present: boolean }[]
) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  for (const record of records) {
    await prisma.attendance.upsert({
      where: {
        studentId_scheduleId_date: {
          studentId: record.studentId,
          scheduleId,
          date: startOfDay,
        },
      },
      update: { present: record.present },
      create: {
        studentId: record.studentId,
        scheduleId,
        date: startOfDay,
        present: record.present,
      },
    })
  }

  revalidatePath("/frequencia")
  revalidatePath("/")
}

// ─── Financial & Payments ───────────────────────────────────────────────────

export async function getPayments(month: number, year: number) {
  return prisma.payment.findMany({
    where: { month, year },
    include: { student: true },
    orderBy: { student: { name: "asc" } },
  })
}

export async function togglePaymentStatus(id: string, newStatus: string) {
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status: newStatus,
      paidAt: newStatus === "PAGO" ? new Date() : null,
    },
  })
  revalidatePath("/financeiro")
  revalidatePath("/")
  return payment
}

export async function getGympassCheckins(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  return prisma.gympassCheckin.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: { student: true },
    orderBy: { date: "desc" },
  })
}

export async function addGympassCheckin(studentId: string, date: Date, value: number) {
  const checkin = await prisma.gympassCheckin.create({
    data: { studentId, date, value },
  })
  revalidatePath("/financeiro")
  revalidatePath("/")
  return checkin
}

// ─── Events & Championships ──────────────────────────────────────────────────

export async function getEvents() {
  return prisma.event.findMany({
    include: {
      modalities: {
        include: {
          categories: {
            include: {
              participants: {
                include: { student: true },
              },
              matches: true,
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  })
}

export async function createEvent(data: {
  name: string
  date: Date
  location?: string
  organization?: string
  registrationFee?: number
  notes?: string
}) {
  const event = await prisma.event.create({ data })
  revalidatePath("/campeonatos")
  return event
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } })
  revalidatePath("/campeonatos")
}

export async function deleteSchedule(id: string) {
  await prisma.schedule.delete({ where: { id } })
  revalidatePath("/horarios")
  revalidatePath("/alunos")
  revalidatePath("/")
}

export async function createModality(data: { eventId: string; name: string; type: string }) {
  const modality = await prisma.modality.create({ data })
  revalidatePath("/campeonatos")
  return modality
}

export async function deleteModality(id: string) {
  await prisma.modality.delete({ where: { id } })
  revalidatePath("/campeonatos")
}

export async function createCategory(data: {
  modalityId: string
  name: string
  beltRange?: string
  gender?: string
  minAge?: number
  maxAge?: number
}) {
  const category = await prisma.category.create({ data })
  revalidatePath("/campeonatos")
  return category
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } })
  revalidatePath("/campeonatos")
}

export async function registerStudentInCategory(data: {
  categoryId: string
  studentId: string
  paidRegistration?: boolean
  amountPaid?: number
  notes?: string
}) {
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
    select: { weight: true },
  })

  const initialWeight = student?.weight && student.weight > 0 ? student.weight : null

  const participant = await prisma.eventParticipant.upsert({
    where: {
      categoryId_studentId: {
        categoryId: data.categoryId,
        studentId: data.studentId,
      },
    },
    update: {
      paidRegistration: data.paidRegistration ?? true,
      amountPaid: data.amountPaid ?? 0,
      notes: data.notes ?? "",
      weight: initialWeight ?? undefined,
    },
    create: {
      categoryId: data.categoryId,
      studentId: data.studentId,
      paidRegistration: data.paidRegistration ?? true,
      amountPaid: data.amountPaid ?? 0,
      weight: initialWeight,
      notes: data.notes ?? "",
    },
    include: {
      student: true,
      category: true,
    },
  })
  revalidatePath("/campeonatos")
  return participant
}

export async function saveManualBrackets(
  categoryId: string,
  matches: {
    round: number
    position: number
    athlete1Id?: string | null
    athlete2Id?: string | null
    isBye?: boolean
    winnerId?: string | null
  }[]
) {
  await prisma.bracketMatch.deleteMany({ where: { categoryId } })

  if (matches.length > 0) {
    await prisma.bracketMatch.createMany({
      data: matches.map((m) => ({
        categoryId,
        round: m.round,
        position: m.position,
        athlete1Id: m.athlete1Id || null,
        athlete2Id: m.athlete2Id || null,
        isBye: m.isBye ?? (!m.athlete2Id),
        winnerId: m.winnerId || (!m.athlete2Id && m.athlete1Id ? m.athlete1Id : null),
      })),
    })
  }

  revalidatePath("/campeonatos")
}

export async function removeStudentFromCategory(categoryId: string, studentId: string) {
  await prisma.eventParticipant.delete({
    where: {
      categoryId_studentId: {
        categoryId,
        studentId,
      },
    },
  })
  revalidatePath("/campeonatos")
}

export async function updateEvent(
  id: string,
  data: {
    name?: string
    status?: string
    date?: Date
    location?: string
    organization?: string
    registrationFee?: number
    notes?: string
  }
) {
  const updated = await prisma.event.update({
    where: { id },
    data,
  })
  revalidatePath("/campeonatos")
  return updated
}

export async function updateParticipant(
  id: string,
  data: {
    paidRegistration?: boolean
    amountPaid?: number
    weight?: number | null
    medal?: string | null
    placement?: number | null
    metric?: number | null
    score?: number | null
    notes?: string
  }
) {
  const updated = await prisma.eventParticipant.update({
    where: { id },
    data,
  })
  revalidatePath("/campeonatos")
  return updated
}

export async function generateChaveBrackets(data: {
  categoryId: string
  criterion?: "PESO" | "ALTURA" | "IDADE" | "COMBINADO"
  maxPerChave?: number
}) {
  const { categoryId, criterion = "PESO", maxPerChave = 3 } = data

  await prisma.bracketMatch.deleteMany({ where: { categoryId } })

  const rawParticipants = await prisma.eventParticipant.findMany({
    where: { categoryId },
    include: { student: true },
  })

  if (rawParticipants.length === 0) return

  const getBeltOrder = (rank: string) => {
    const b = BELT_RANKS.find((r) => r.value === rank)
    return b ? b.order : 0
  }

  // Sort participants by chosen criterion
  const participants = [...rawParticipants].sort((a, b) => {
    const weightA = a.weight && a.weight > 0 ? a.weight : a.student.weight || 0
    const weightB = b.weight && b.weight > 0 ? b.weight : b.student.weight || 0

    let heightA = a.student.height || 0
    let heightB = b.student.height || 0
    if (heightA > 0 && heightA < 3) heightA *= 100
    if (heightB > 0 && heightB < 3) heightB *= 100

    const ageA = calculateAge(a.student.birthDate)
    const ageB = calculateAge(b.student.birthDate)

    const beltA = getBeltOrder(a.student.beltRank)
    const beltB = getBeltOrder(b.student.beltRank)

    if (criterion === "PESO") {
      if (weightA !== weightB) return weightA - weightB
      if (ageA !== ageB) return ageA - ageB
      return beltA - beltB
    }

    if (criterion === "ALTURA") {
      if (heightA !== heightB) return heightA - heightB
      if (weightA !== weightB) return weightA - weightB
      return beltA - beltB
    }

    if (criterion === "IDADE") {
      if (ageA !== ageB) return ageA - ageB
      if (weightA !== weightB) return weightA - weightB
      return beltA - beltB
    }

    // COMBINADO: Composite score
    const scoreA = beltA * 1000 + weightA * 10 + heightA * 0.1 + ageA * 5
    const scoreB = beltB * 1000 + weightB * 10 + heightB * 0.1 + ageB * 5
    return scoreA - scoreB
  })

  // Group into chaves of at most maxPerChave (default 3)
  const maxLimit = Math.max(2, maxPerChave)
  const numChaves = Math.max(1, Math.ceil(participants.length / maxLimit))

  // Distribute athletes into chaves evenly
  const chaves: (typeof participants)[] = Array.from({ length: numChaves }, () => [])

  let athleteIndex = 0
  for (let c = 0; c < numChaves; c++) {
    const remainingAthletes = participants.length - athleteIndex
    const remainingChaves = numChaves - c
    const chunkSize = Math.min(maxLimit, Math.ceil(remainingAthletes / remainingChaves))
    chaves[c] = participants.slice(athleteIndex, athleteIndex + chunkSize)
    athleteIndex += chunkSize
  }

  // Generate matches and assign participants
  for (let c = 0; c < chaves.length; c++) {
    const chaveNum = c + 1
    const chaveAthletes = chaves[c]
    const chaveName = `Chave ${chaveNum}`

    // Update participants' notes to indicate their chave and reset placements
    for (const p of chaveAthletes) {
      await prisma.eventParticipant.update({
        where: { id: p.id },
        data: {
          notes: chaveName,
          placement: null,
          medal: null,
        },
      })
    }

    const athleteIds = chaveAthletes.map((a) => a.studentId)
    const chaveNotes = JSON.stringify({
      chaveNumber: chaveNum,
      chaveName,
      athleteIds,
      maxAthletes: maxLimit,
      criterion,
      placements: {},
    })

    if (chaveAthletes.length === 1) {
      await prisma.bracketMatch.create({
        data: {
          categoryId,
          round: chaveNum,
          position: 1,
          athlete1Id: chaveAthletes[0].studentId,
          athlete2Id: null,
          isBye: true,
          winnerId: chaveAthletes[0].studentId,
          notes: chaveNotes,
        },
      })
    } else if (chaveAthletes.length === 2) {
      await prisma.bracketMatch.create({
        data: {
          categoryId,
          round: chaveNum,
          position: 1,
          athlete1Id: chaveAthletes[0].studentId,
          athlete2Id: chaveAthletes[1].studentId,
          isBye: false,
          winnerId: null,
          notes: chaveNotes,
        },
      })
    } else {
      let pos = 1
      for (let i = 0; i < chaveAthletes.length; i++) {
        for (let j = i + 1; j < chaveAthletes.length; j++) {
          await prisma.bracketMatch.create({
            data: {
              categoryId,
              round: chaveNum,
              position: pos++,
              athlete1Id: chaveAthletes[i].studentId,
              athlete2Id: chaveAthletes[j].studentId,
              isBye: false,
              winnerId: null,
              notes: chaveNotes,
            },
          })
        }
      }
    }
  }

  revalidatePath("/campeonatos")
}

export async function saveManualChaves(data: {
  categoryId: string
  chaves: Array<{
    chaveNumber: number
    chaveName?: string
    athleteIds: string[]
    placements?: {
      firstId?: string | null
      secondId?: string | null
      thirdId?: string | null
      fourthId?: string | null
    }
  }>
}) {
  const { categoryId, chaves } = data

  await prisma.bracketMatch.deleteMany({ where: { categoryId } })

  for (const ch of chaves) {
    const chaveNum = ch.chaveNumber
    const chaveName = ch.chaveName || `Chave ${chaveNum}`
    const athleteIds = (ch.athleteIds || []).filter(Boolean)

    // Update participants' chave in DB
    for (const stId of athleteIds) {
      await prisma.eventParticipant.updateMany({
        where: { categoryId, studentId: stId },
        data: { notes: chaveName },
      })
    }

    // Update placements and medals if provided
    if (ch.placements) {
      for (const stId of athleteIds) {
        await prisma.eventParticipant.updateMany({
          where: { categoryId, studentId: stId },
          data: { placement: null, medal: null },
        })
      }

      if (ch.placements.firstId) {
        await prisma.eventParticipant.updateMany({
          where: { categoryId, studentId: ch.placements.firstId },
          data: { placement: 1, medal: "OURO" },
        })
      }
      if (ch.placements.secondId) {
        await prisma.eventParticipant.updateMany({
          where: { categoryId, studentId: ch.placements.secondId },
          data: { placement: 2, medal: "PRATA" },
        })
      }
      if (ch.placements.thirdId) {
        await prisma.eventParticipant.updateMany({
          where: { categoryId, studentId: ch.placements.thirdId },
          data: { placement: 3, medal: "BRONZE" },
        })
      }
      if (ch.placements.fourthId) {
        await prisma.eventParticipant.updateMany({
          where: { categoryId, studentId: ch.placements.fourthId },
          data: { placement: 4, medal: null },
        })
      }
    }

    const chaveNotes = JSON.stringify({
      chaveNumber: chaveNum,
      chaveName,
      athleteIds,
      placements: ch.placements || {},
    })

    if (athleteIds.length === 0) continue

    if (athleteIds.length === 1) {
      await prisma.bracketMatch.create({
        data: {
          categoryId,
          round: chaveNum,
          position: 1,
          athlete1Id: athleteIds[0],
          athlete2Id: null,
          isBye: true,
          winnerId: athleteIds[0],
          notes: chaveNotes,
        },
      })
    } else if (athleteIds.length === 2) {
      await prisma.bracketMatch.create({
        data: {
          categoryId,
          round: chaveNum,
          position: 1,
          athlete1Id: athleteIds[0],
          athlete2Id: athleteIds[1],
          isBye: false,
          winnerId: null,
          notes: chaveNotes,
        },
      })
    } else {
      let pos = 1
      for (let i = 0; i < athleteIds.length; i++) {
        for (let j = i + 1; j < athleteIds.length; j++) {
          await prisma.bracketMatch.create({
            data: {
              categoryId,
              round: chaveNum,
              position: pos++,
              athlete1Id: athleteIds[i],
              athlete2Id: athleteIds[j],
              isBye: false,
              winnerId: null,
              notes: chaveNotes,
            },
          })
        }
      }
    }
  }

  revalidatePath("/campeonatos")
}

export async function setChavePlacements(data: {
  categoryId: string
  chaveNumber: number
  placements: {
    firstId?: string | null
    secondId?: string | null
    thirdId?: string | null
    fourthId?: string | null
  }
}) {
  const { categoryId, chaveNumber, placements } = data

  const matches = await prisma.bracketMatch.findMany({
    where: { categoryId, round: chaveNumber },
  })

  const athleteIdsSet = new Set<string>()
  for (const m of matches) {
    if (m.athlete1Id) athleteIdsSet.add(m.athlete1Id)
    if (m.athlete2Id) athleteIdsSet.add(m.athlete2Id)
    try {
      if (m.notes && m.notes.startsWith("{")) {
        const p = JSON.parse(m.notes)
        if (p.athleteIds) p.athleteIds.forEach((id: string) => athleteIdsSet.add(id))
      }
    } catch {}
  }

  // Clear existing placement/medal for athletes of this chave
  for (const id of athleteIdsSet) {
    await prisma.eventParticipant.updateMany({
      where: { categoryId, studentId: id },
      data: { placement: null, medal: null },
    })
  }

  // Assign new placements
  if (placements.firstId) {
    await prisma.eventParticipant.updateMany({
      where: { categoryId, studentId: placements.firstId },
      data: { placement: 1, medal: "OURO" },
    })
  }
  if (placements.secondId) {
    await prisma.eventParticipant.updateMany({
      where: { categoryId, studentId: placements.secondId },
      data: { placement: 2, medal: "PRATA" },
    })
  }
  if (placements.thirdId) {
    await prisma.eventParticipant.updateMany({
      where: { categoryId, studentId: placements.thirdId },
      data: { placement: 3, medal: "BRONZE" },
    })
  }
  if (placements.fourthId) {
    await prisma.eventParticipant.updateMany({
      where: { categoryId, studentId: placements.fourthId },
      data: { placement: 4, medal: null },
    })
  }

  // Update matches notes with placements
  for (const m of matches) {
    let currentData: any = {}
    try {
      if (m.notes && m.notes.startsWith("{")) currentData = JSON.parse(m.notes)
    } catch {}
    currentData.placements = placements
    await prisma.bracketMatch.update({
      where: { id: m.id },
      data: { notes: JSON.stringify(currentData) },
    })
  }

  revalidatePath("/campeonatos")
}

export async function generateBrackets(categoryId: string) {
  return generateChaveBrackets({ categoryId, criterion: "PESO", maxPerChave: 3 })
}

export async function swapBracketAthletes(
  matchId: string,
  athlete1Id: string | null,
  athlete2Id: string | null
) {
  const updated = await prisma.bracketMatch.update({
    where: { id: matchId },
    data: {
      athlete1Id,
      athlete2Id,
      winnerId: null, // Reset winner when athletes are changed
    },
  })
  revalidatePath("/campeonatos")
  return updated
}

export async function updateBracketMatch(
  matchId: string,
  winnerId: string,
  score?: string
) {
  const updated = await prisma.bracketMatch.update({
    where: { id: matchId },
    data: { winnerId, score: score || "" },
  })
  revalidatePath("/campeonatos")
  return updated
}

export async function autoRankMeasurementCategory(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { modality: true },
  })

  if (!category) return
  const isTimeType = category.modality.type === "TEMPO"

  const allParticipants = await prisma.eventParticipant.findMany({
    where: { categoryId },
  })

  const validParticipants = allParticipants.filter(
    (p) => (p.metric !== null && p.metric !== undefined) || (p.score !== null && p.score !== undefined)
  )

  if (validParticipants.length === 0) return { count: 0 }

  // Sort: Ascending for time, Descending for height, distance, score
  validParticipants.sort((a, b) => {
    const valA = a.metric ?? a.score ?? 0
    const valB = b.metric ?? b.score ?? 0
    return isTimeType ? valA - valB : valB - valA
  })

  let currentRank = 1
  for (let i = 0; i < validParticipants.length; i++) {
    const p = validParticipants[i]
    const prev = i > 0 ? validParticipants[i - 1] : null

    const valP = p.metric ?? p.score ?? 0
    const valPrev = prev ? (prev.metric ?? prev.score ?? 0) : null

    // Check tie
    if (prev && valPrev === valP) {
      // Same rank as prev
    } else if (i > 0) {
      currentRank = i + 1
    }

    let medal: string | null = null
    if (currentRank === 1) medal = "OURO"
    else if (currentRank === 2) medal = "PRATA"
    else if (currentRank === 3) medal = "BRONZE"

    await prisma.eventParticipant.update({
      where: { id: p.id },
      data: {
        placement: currentRank,
        medal,
      },
    })
  }

  revalidatePath("/campeonatos")
}

// ─── Ações em Massa para Alunos (Graduação em Conjunto / Troca de Faixa) ───

export async function bulkUpdateBelt(studentIds: string[], newBelt: string) {
  if (!studentIds || studentIds.length === 0) return { count: 0 }
  await prisma.student.updateMany({
    where: { id: { in: studentIds } },
    data: { beltRank: newBelt },
  })
  revalidatePath("/alunos")
  revalidatePath("/")
  return { count: studentIds.length }
}

export async function bulkGraduateStudents(
  studentIds: string[],
  toBelt: string,
  date: Date,
  location: string = "",
  notes: string = ""
) {
  if (!studentIds || studentIds.length === 0) return { count: 0 }

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, beltRank: true, name: true },
  })

  for (const st of students) {
    await prisma.graduationHistory.create({
      data: {
        studentId: st.id,
        fromBelt: st.beltRank,
        toBelt,
        date: new Date(date),
        location: location || "Dojang Principal",
        notes: notes || `Graduação em conjunto - ${new Date(date).toLocaleDateString("pt-BR")}`,
      },
    })
  }

  await prisma.student.updateMany({
    where: { id: { in: studentIds } },
    data: { beltRank: toBelt },
  })

  revalidatePath("/alunos")
  revalidatePath("/")
  return { count: students.length }
}
