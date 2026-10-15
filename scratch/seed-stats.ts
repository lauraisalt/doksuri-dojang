import { prisma } from "../src/lib/prisma"

async function seedStudentStats() {
  const students = await prisma.student.findMany()
  console.log(`Encontrados ${students.length} alunos no banco de dados.`)

  const sampleWeights = [62.5, 65.0, 68.5, 71.0, 74.5, 77.0, 80.5, 83.0, 86.5, 89.0]
  const sampleHeights = [1.65, 1.68, 1.72, 1.75, 1.78, 1.80, 1.83, 1.86, 1.88]

  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    const weight = sampleWeights[i % sampleWeights.length]
    const height = sampleHeights[i % sampleHeights.length]

    await prisma.student.update({
      where: { id: student.id },
      data: { weight, height },
    })

    console.log(`✔ Aluno ${student.name}: Peso = ${weight} kg, Altura = ${height} m`)
  }

  // Atualiza também inscrições existentes em eventos
  const participants = await prisma.eventParticipant.findMany({ include: { student: true } })
  for (const p of participants) {
    const w = p.weight || p.student.weight || 70.0
    await prisma.eventParticipant.update({
      where: { id: p.id },
      data: { weight: w },
    })
  }

  console.log("🔥 Todos os alunos foram atualizados com peso e altura de teste com sucesso!")
}

seedStudentStats()
  .catch(console.error)
  .finally(() => process.exit(0))
