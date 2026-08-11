import { prisma } from "../src/lib/prisma"

async function main() {
  console.log("Seeding database...")

  // Clean existing data
  await prisma.auditLog.deleteMany()
  await prisma.bracketMatch.deleteMany()
  await prisma.eventParticipant.deleteMany()
  await prisma.category.deleteMany()
  await prisma.modality.deleteMany()
  await prisma.event.deleteMany()
  await prisma.graduationHistory.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.gympassCheckin.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.studentSchedule.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.student.deleteMany()
  await prisma.settings.deleteMany()

  // 1. Settings
  await prisma.settings.create({
    data: {
      id: "default",
      academyName: "Instituto Dok Su Ri - Unidade 3",
      defaultMonthlyFee: 150.0,
      defaultGympassValue: 8.5,
      defaultDueDay: 10,
    },
  })

  // 2. Schedules
  const schedule1 = await prisma.schedule.create({
    data: { dayOfWeek: "SEGUNDA", time: "19:00", maxCapacity: 30 },
  })
  const schedule2 = await prisma.schedule.create({
    data: { dayOfWeek: "SEGUNDA", time: "20:00", maxCapacity: 25 },
  })
  const schedule3 = await prisma.schedule.create({
    data: { dayOfWeek: "TERCA", time: "19:00", maxCapacity: 30 },
  })
  const schedule4 = await prisma.schedule.create({
    data: { dayOfWeek: "TERCA", time: "20:00", maxCapacity: 25 },
  })
  const schedule5 = await prisma.schedule.create({
    data: { dayOfWeek: "QUARTA", time: "19:00", maxCapacity: 30 },
  })
  const schedule6 = await prisma.schedule.create({
    data: { dayOfWeek: "QUARTA", time: "20:00", maxCapacity: 25 },
  })
  const schedule7 = await prisma.schedule.create({
    data: { dayOfWeek: "QUINTA", time: "19:00", maxCapacity: 30 },
  })
  const schedule8 = await prisma.schedule.create({
    data: { dayOfWeek: "QUINTA", time: "20:00", maxCapacity: 25 },
  })
  const schedule9 = await prisma.schedule.create({
    data: { dayOfWeek: "SEXTA", time: "19:00", maxCapacity: 30 },
  })
  const schedule10 = await prisma.schedule.create({
    data: { dayOfWeek: "SABADO", time: "10:00", maxCapacity: 35 },
  })

  // 3. Students
  const studentsData = [
    {
      name: "Gabriel Santos Silva",
      gender: "MASCULINO",
      birthDate: new Date("2008-05-14"),
      phone: "(11) 98765-4321",
      email: "gabriel.silva@email.com",
      guardianName: "Carlos Alberto Silva",
      guardianPhone: "(11) 97654-3210",
      fatherName: "Carlos Alberto Silva",
      motherName: "Mariana Santos Silva",
      beltRank: "VERDE",
      status: "ATIVO",
      paymentType: "MENSALIDADE",
      monthlyFee: 150.0,
      dueDay: 10,
      hasPhysicalLimitation: false,
      hasDisease: false,
      hasAllergies: true,
      allergiesDesc: "Poeira e picada de abelha",
      usesMedication: false,
      medicalNotes: "Apto para todas as atividades físicas.",
    },
    {
      name: "Beatriz Oliveira Costa",
      gender: "FEMININO",
      birthDate: new Date("1998-11-20"),
      phone: "(11) 91234-5678",
      email: "beatriz.costa@email.com",
      beltRank: "PRETA_1DAN",
      status: "ATIVO",
      paymentType: "GYMPASS",
      monthlyFee: 0,
      gympassCheckinValue: 8.5,
      hasPhysicalLimitation: false,
      hasDisease: false,
      hasAllergies: false,
      usesMedication: false,
      medicalNotes: "Atleta de competição de combate.",
    },
    {
      name: "Lucas Fernandez Mendes",
      gender: "MASCULINO",
      birthDate: new Date("2012-03-08"),
      phone: "(11) 99887-7665",
      email: "lucas.mendes@email.com",
      guardianName: "Patricia Fernandez Mendes",
      guardianPhone: "(11) 98877-6655",
      fatherName: "Roberto Mendes",
      motherName: "Patricia Fernandez Mendes",
      beltRank: "AMARELA",
      status: "ATIVO",
      paymentType: "MENSALIDADE",
      monthlyFee: 150.0,
      dueDay: 15,
      hasPhysicalLimitation: false,
      hasDisease: true,
      diseaseDesc: "Asma leve",
      usesMedication: true,
      medicationDesc: "Bombinha de salbutamol se necessário",
      medicalNotes: "Monitorar após treinos cardiovasculares intensos.",
    },
    {
      name: "Juliana Rodrigues Alves",
      gender: "FEMININO",
      birthDate: new Date("1992-07-25"),
      phone: "(11) 94433-2211",
      email: "juliana.alves@email.com",
      beltRank: "VERMELHA",
      status: "ATIVO",
      paymentType: "MENSALIDADE",
      monthlyFee: 150.0,
      dueDay: 5,
      hasPhysicalLimitation: false,
      hasDisease: false,
      hasAllergies: false,
      usesMedication: false,
    },
    {
      name: "Matheus Vinicius Lima",
      gender: "MASCULINO",
      birthDate: new Date("2001-09-02"),
      phone: "(11) 95566-7788",
      email: "matheus.lima@email.com",
      beltRank: "PRETA_2DAN",
      status: "ATIVO",
      paymentType: "GYMPASS",
      monthlyFee: 0,
      gympassCheckinValue: 8.5,
      hasPhysicalLimitation: true,
      physicalLimitationDesc: "Cirurgia de menisco no joelho esquerdo em 2022",
      hasDisease: false,
      hasAllergies: false,
      usesMedication: false,
      medicalNotes: "Evitar torções excessivas de joelho.",
    },
    {
      name: "Sofia Martins Ferreira",
      gender: "FEMININO",
      birthDate: new Date("2010-01-15"),
      phone: "(11) 92211-4433",
      email: "sofia.ferreira@email.com",
      guardianName: "Fernanda Martins",
      guardianPhone: "(11) 93322-1144",
      beltRank: "AZUL",
      status: "TRANCADO",
      paymentType: "MENSALIDADE",
      monthlyFee: 150.0,
      dueDay: 10,
      hasPhysicalLimitation: false,
    },
    {
      name: "Thiago Rocha Camargo",
      gender: "MASCULINO",
      birthDate: new Date("1985-04-12"),
      phone: "(11) 97788-9900",
      email: "thiago.camargo@email.com",
      beltRank: "MARROM",
      status: "ATIVO",
      paymentType: "MENSALIDADE",
      monthlyFee: 150.0,
      dueDay: 10,
      hasPhysicalLimitation: false,
    },
    {
      name: "Camila Nogueira Ribeiro",
      gender: "FEMININO",
      birthDate: new Date("2004-12-30"),
      phone: "(11) 96655-4433",
      email: "camila.ribeiro@email.com",
      beltRank: "LARANJA",
      status: "INATIVO",
      paymentType: "MENSALIDADE",
      monthlyFee: 150.0,
      dueDay: 10,
    },
  ]

  const createdStudents = []
  for (const s of studentsData) {
    const student = await prisma.student.create({ data: s })
    createdStudents.push(student)
  }

  // Link schedules
  await prisma.studentSchedule.createMany({
    data: [
      { studentId: createdStudents[0].id, scheduleId: schedule1.id },
      { studentId: createdStudents[0].id, scheduleId: schedule5.id },
      { studentId: createdStudents[1].id, scheduleId: schedule2.id },
      { studentId: createdStudents[1].id, scheduleId: schedule6.id },
      { studentId: createdStudents[2].id, scheduleId: schedule3.id },
      { studentId: createdStudents[2].id, scheduleId: schedule7.id },
      { studentId: createdStudents[3].id, scheduleId: schedule1.id },
      { studentId: createdStudents[3].id, scheduleId: schedule5.id },
      { studentId: createdStudents[4].id, scheduleId: schedule2.id },
      { studentId: createdStudents[4].id, scheduleId: schedule6.id },
      { studentId: createdStudents[6].id, scheduleId: schedule10.id },
    ],
  })

  // 4. Payments
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-12

  await prisma.payment.createMany({
    data: [
      // Current month payments
      {
        studentId: createdStudents[0].id,
        month: currentMonth,
        year: currentYear,
        amount: 150.0,
        dueDate: new Date(`${currentYear}-${String(currentMonth).padStart(2, "0")}-10`),
        paidAt: new Date(),
        status: "PAGO",
      },
      {
        studentId: createdStudents[2].id,
        month: currentMonth,
        year: currentYear,
        amount: 150.0,
        dueDate: new Date(`${currentYear}-${String(currentMonth).padStart(2, "0")}-15`),
        status: "PENDENTE",
      },
      {
        studentId: createdStudents[3].id,
        month: currentMonth,
        year: currentYear,
        amount: 150.0,
        dueDate: new Date(`${currentYear}-${String(currentMonth).padStart(2, "0")}-05`),
        status: "ATRASADO",
      },
      {
        studentId: createdStudents[6].id,
        month: currentMonth,
        year: currentYear,
        amount: 150.0,
        dueDate: new Date(`${currentYear}-${String(currentMonth).padStart(2, "0")}-10`),
        paidAt: new Date(),
        status: "PAGO",
      },
    ],
  })

  // 5. Gympass Checkins
  await prisma.gympassCheckin.createMany({
    data: [
      { studentId: createdStudents[1].id, date: new Date(), value: 8.5 },
      { studentId: createdStudents[1].id, date: new Date(Date.now() - 86400000 * 2), value: 8.5 },
      { studentId: createdStudents[1].id, date: new Date(Date.now() - 86400000 * 4), value: 8.5 },
      { studentId: createdStudents[4].id, date: new Date(), value: 8.5 },
      { studentId: createdStudents[4].id, date: new Date(Date.now() - 86400000 * 1), value: 8.5 },
      { studentId: createdStudents[4].id, date: new Date(Date.now() - 86400000 * 3), value: 8.5 },
      { studentId: createdStudents[4].id, date: new Date(Date.now() - 86400000 * 5), value: 8.5 },
    ],
  })

  // 6. Graduation History
  await prisma.graduationHistory.createMany({
    data: [
      {
        studentId: createdStudents[0].id,
        fromBelt: "LARANJA",
        toBelt: "VERDE",
        date: new Date("2024-06-15"),
        notes: "Aprovado com excelente pontuação em técnicas de rolamento.",
      },
      {
        studentId: createdStudents[1].id,
        fromBelt: "MARROM",
        toBelt: "PRETA_1DAN",
        date: new Date("2023-12-10"),
        notes: "Exame nacional de Faixa Preta aprovado pelo Grão Mestre.",
      },
      {
        studentId: createdStudents[3].id,
        fromBelt: "AZUL",
        toBelt: "VERMELHA",
        date: new Date("2024-05-20"),
        notes: "Exímia execução de torções e chave de articulação.",
      },
    ],
  })

  // 7. Event & Championship
  const event = await prisma.event.create({
    data: {
      name: "12º Campeonato Paulista de Hapkido Dok Su Ri",
      date: new Date("2026-09-15"),
      location: "Ginásio Ibirapuera, São Paulo - SP",
      organization: "Federação Paulista de Hapkido",
      registrationFee: 80.0,
      status: "INSCRICOES",
      notes: "Campeonato oficial válido para o ranking estadual.",
    },
  })

  const modCombate = await prisma.modality.create({
    data: {
      eventId: event.id,
      name: "Combate Kyorugi",
      type: "COMBATE",
    },
  })

  const catAdultoMasculino = await prisma.category.create({
    data: {
      modalityId: modCombate.id,
      name: "Adulto Masculino - Faixa Preta",
      beltRange: "PRETA",
      gender: "MASCULINO",
      minAge: 18,
      maxAge: 40,
    },
  })

  await prisma.eventParticipant.createMany({
    data: [
      {
        categoryId: catAdultoMasculino.id,
        studentId: createdStudents[4].id, // Matheus
        paidRegistration: true,
        amountPaid: 80.0,
        paymentDate: new Date(),
        medal: "OURO",
        placement: 1,
      },
      {
        categoryId: catAdultoMasculino.id,
        studentId: createdStudents[0].id, // Gabriel
        paidRegistration: true,
        amountPaid: 80.0,
        paymentDate: new Date(),
        medal: "PRATA",
        placement: 2,
      },
    ],
  })

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
