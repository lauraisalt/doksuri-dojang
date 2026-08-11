import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""

  if (!q.trim()) {
    return NextResponse.json([])
  }

  const students = await prisma.student.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { guardianName: { contains: q } },
        { email: { contains: q } },
      ],
    },
    take: 8,
    select: {
      id: true,
      name: true,
      beltRank: true,
      phone: true,
      paymentType: true,
      status: true,
    },
  })

  return NextResponse.json(students)
}
