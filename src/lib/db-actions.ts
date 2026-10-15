"use server"

import { prisma } from "./prisma"
import { revalidatePath } from "next/cache"
import { BELT_RANKS } from "./constants"

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

  const birthdayStudents = allStudents.filter((s: { birthDate: Date }) => {
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
  birthDate: Date
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

export async function generateBrackets(categoryId: string) {
  await prisma.bracketMatch.deleteMany({ where: { categoryId } })

  const rawParticipants = await prisma.eventParticipant.findMany({
    where: { categoryId },
    include: { student: true },
  })

  if (rawParticipants.length < 2) return

  const getBeltOrder = (rank: string) => {
    const b = BELT_RANKS.find((r) => r.value === rank)
    return b ? b.order : 0
  }

  // Sort participants by multi-criteria composite score (Belt Rank, Weight, and Height) for optimal bracket balance
  const participants = [...rawParticipants].sort((a, b) => {
    const weightA = a.weight && a.weight > 0 ? a.weight : a.student.weight || 0
    const weightB = b.weight && b.weight > 0 ? b.weight : b.student.weight || 0
    const beltA = getBeltOrder(a.student.beltRank)
    const beltB = getBeltOrder(b.student.beltRank)

    let heightA = a.student.height || 0
    let heightB = b.student.height || 0
    if (heightA > 0 && heightA < 3) heightA *= 100
    if (heightB > 0 && heightB < 3) heightB *= 100

    const scoreA = beltA * 1000 + weightA * 10 + heightA * 0.1
    const scoreB = beltB * 1000 + weightB * 10 + heightB * 0.1
    return scoreA - scoreB
  })

  if (participants.length < 2) return

  const matchPromises = []
  for (let i = 0; i < participants.length; i += 2) {
    const athlete1 = participants[i]
    const athlete2 = participants[i + 1]

    matchPromises.push(
      prisma.bracketMatch.create({
        data: {
          categoryId,
          round: 1,
          position: Math.floor(i / 2) + 1,
          athlete1Id: athlete1 ? athlete1.studentId : null,
          athlete2Id: athlete2 ? athlete2.studentId : null,
          isBye: !athlete2,
          winnerId: null,
        },
      })
    )
  }

  await Promise.all(matchPromises)
  revalidatePath("/campeonatos")
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




