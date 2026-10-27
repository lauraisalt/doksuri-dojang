import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "json"
  const resource = searchParams.get("resource") || "all"
  const today = new Date().toISOString().split("T")[0]

  try {
    // 1. Raw SQLite DB Download
    if (type === "db") {
      const dbPath = path.join(process.cwd(), "dev.db")
      if (!fs.existsSync(dbPath)) {
        return NextResponse.json({ error: "Banco de dados dev.db não encontrado." }, { status: 404 })
      }
      const buffer = fs.readFileSync(dbPath)
      return new Response(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="dojang-backup-${today}.db"`,
          "Content-Type": "application/x-sqlite3",
        },
      })
    }

    // 2. Full JSON Backup
    if (type === "json") {
      const [students, payments, events, attendances, schedules, graduations, settings] = await Promise.all([
        prisma.student.findMany(),
        prisma.payment.findMany(),
        prisma.event.findMany({
          include: {
            modalities: {
              include: {
                categories: {
                  include: {
                    participants: true,
                    matches: true,
                  },
                },
              },
            },
          },
        }),
        prisma.attendance.findMany(),
        prisma.schedule.findMany(),
        prisma.graduationHistory.findMany(),
        prisma.settings.findFirst(),
      ])

      const fullData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        stats: {
          totalStudents: students.length,
          totalPayments: payments.length,
          totalEvents: events.length,
          totalAttendances: attendances.length,
        },
        data: {
          students,
          payments,
          events,
          attendances,
          schedules,
          graduations,
          settings,
        },
      }

      return new Response(JSON.stringify(fullData, null, 2), {
        headers: {
          "Content-Disposition": `attachment; filename="dojang-completo-${today}.json"`,
          "Content-Type": "application/json; charset=utf-8",
        },
      })
    }

    // 3. CSV Exports
    if (type === "csv") {
      if (resource === "alunos") {
        const students = await prisma.student.findMany({ orderBy: { name: "asc" } })
        let csv = "ID;Nome;Faixa;Status;Tipo Pagamento;Mensalidade;Checkin Gympass;Telefone;Responsável;Telefone Resp;Data Matrícula\n"
        for (const s of students) {
          const row = [
            s.id,
            `"${s.name.replace(/"/g, '""')}"`,
            s.beltRank,
            s.status,
            s.paymentType,
            s.monthlyFee,
            s.gympassCheckinValue,
            s.phone || "",
            `"${(s.guardianName || "").replace(/"/g, '""')}"`,
            s.guardianPhone || "",
            new Date(s.enrollmentDate).toISOString().split("T")[0],
          ]
          csv += row.join(";") + "\n"
        }
        return new Response("\uFEFF" + csv, {
          headers: {
            "Content-Disposition": `attachment; filename="alunos-${today}.csv"`,
            "Content-Type": "text/csv; charset=utf-8",
          },
        })
      }

      if (resource === "pagamentos") {
        const payments = await prisma.payment.findMany({
          include: { student: { select: { name: true } } },
          orderBy: { dueDate: "desc" },
        })
        let csv = "ID;Aluno;Valor;Status;Tipo;Vencimento;Pagamento;Observações\n"
        for (const p of payments) {
          const row = [
            p.id,
            `"${(p.student?.name || "").replace(/"/g, '""')}"`,
            p.amount,
            p.status,
            p.paymentMethod || "",
            new Date(p.dueDate).toISOString().split("T")[0],
            p.paidDate ? new Date(p.paidDate).toISOString().split("T")[0] : "",
            `"${(p.notes || "").replace(/"/g, '""')}"`,
          ]
          csv += row.join(";") + "\n"
        }
        return new Response("\uFEFF" + csv, {
          headers: {
            "Content-Disposition": `attachment; filename="pagamentos-${today}.csv"`,
            "Content-Type": "text/csv; charset=utf-8",
          },
        })
      }

      if (resource === "torneios") {
        const participants = await prisma.eventParticipant.findMany({
          include: {
            student: { select: { name: true, beltRank: true } },
            category: {
              include: {
                modality: {
                  include: {
                    event: { select: { name: true, date: true } },
                  },
                },
              },
            },
          },
        })
        let csv = "Torneio;Data Torneio;Modalidade;Categoria;Atleta;Faixa;Colocação;Medalha;Chave\n"
        for (const p of participants) {
          const row = [
            `"${(p.category?.modality?.event?.name || "").replace(/"/g, '""')}"`,
            p.category?.modality?.event?.date ? new Date(p.category.modality.event.date).toISOString().split("T")[0] : "",
            `"${(p.category?.modality?.name || "").replace(/"/g, '""')}"`,
            `"${(p.category?.name || "").replace(/"/g, '""')}"`,
            `"${(p.student?.name || "").replace(/"/g, '""')}"`,
            p.student?.beltRank || "",
            p.placement ? `${p.placement}º` : "-",
            p.medal || "-",
            `"${(p.notes || "").replace(/"/g, '""')}"`,
          ]
          csv += row.join(";") + "\n"
        }
        return new Response("\uFEFF" + csv, {
          headers: {
            "Content-Disposition": `attachment; filename="torneios-chaves-${today}.csv"`,
            "Content-Type": "text/csv; charset=utf-8",
          },
        })
      }

      if (resource === "frequencia") {
        const attendances = await prisma.attendance.findMany({
          include: { student: { select: { name: true } } },
          orderBy: { date: "desc" },
          take: 5000,
        })
        let csv = "ID;Aluno;Data;Status;Modalidade;Horário\n"
        for (const a of attendances) {
          const row = [
            a.id,
            `"${(a.student?.name || "").replace(/"/g, '""')}"`,
            new Date(a.date).toISOString().split("T")[0],
            a.status,
            `"${(a.modality || "").replace(/"/g, '""')}"`,
            `"${(a.timeSlot || "").replace(/"/g, '""')}"`,
          ]
          csv += row.join(";") + "\n"
        }
        return new Response("\uFEFF" + csv, {
          headers: {
            "Content-Disposition": `attachment; filename="frequencias-${today}.csv"`,
            "Content-Type": "text/csv; charset=utf-8",
          },
        })
      }
    }

    return NextResponse.json({ error: "Parâmetros de backup/export inválidos." }, { status: 400 })
  } catch (error: any) {
    console.error("Backup/Export API error:", error)
    return NextResponse.json({ error: error?.message || "Erro ao processar backup." }, { status: 500 })
  }
}

// POST: Routine automated backup on local disk
export async function POST() {
  try {
    const dbPath = path.join(process.cwd(), "dev.db")
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "dev.db não encontrado." }, { status: 404 })
    }

    const backupDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const backupFileName = `backup-${timestamp}.db`
    const backupFilePath = path.join(backupDir, backupFileName)

    fs.copyFileSync(dbPath, backupFilePath)

    // Optional: Keep only last 30 backups
    const files = fs.readdirSync(backupDir).filter((f) => f.startsWith("backup-") && f.endsWith(".db"))
    if (files.length > 30) {
      files.sort().reverse()
      for (const oldFile of files.slice(30)) {
        try {
          fs.unlinkSync(path.join(backupDir, oldFile))
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: "Backup criado com sucesso na pasta /backups",
      filename: backupFileName,
      timestamp: now.toISOString(),
      totalBackups: Math.min(files.length, 30),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Falha ao gerar backup." }, { status: 500 })
  }
}
