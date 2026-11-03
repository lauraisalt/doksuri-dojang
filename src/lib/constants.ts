// ─── Faixas de Hapkido ───────────────────────────────────

export const BELT_RANKS = [
  { value: "BRANCA", label: "Branca", color: "#FFFFFF", textColor: "#000000", order: 0 },
  { value: "AMARELA", label: "Amarela", color: "#FFD700", textColor: "#000000", order: 1 },
  { value: "AMARELA_PONTA_1", label: "Amarela Ponta 1", color: "#FFD700", textColor: "#000000", order: 2 },
  { value: "AMARELA_PONTA_2", label: "Amarela Ponta 2", color: "#FFD700", textColor: "#000000", order: 3 },
  { value: "AZUL", label: "Azul", color: "#1E90FF", textColor: "#FFFFFF", order: 4 },
  { value: "AZUL_PONTA_1", label: "Azul Ponta 1", color: "#1E90FF", textColor: "#FFFFFF", order: 5 },
  { value: "AZUL_PONTA_2", label: "Azul Ponta 2", color: "#1E90FF", textColor: "#FFFFFF", order: 6 },
  { value: "VERMELHA", label: "Vermelha", color: "#DC2626", textColor: "#FFFFFF", order: 7 },
  { value: "VERMELHA_PONTA_1", label: "Vermelha Ponta 1", color: "#DC2626", textColor: "#FFFFFF", order: 8 },
  { value: "VERMELHA_PONTA_2", label: "Vermelha Ponta 2", color: "#DC2626", textColor: "#FFFFFF", order: 9 },
  { value: "PRETA_1DAN", label: "Preta 1º Dan", color: "#000000", textColor: "#FFFFFF", order: 10 },
  { value: "PRETA_2DAN", label: "Preta 2º Dan", color: "#000000", textColor: "#FFFFFF", order: 11 },
  { value: "PRETA_3DAN", label: "Preta 3º Dan", color: "#000000", textColor: "#FFFFFF", order: 12 },
  { value: "PRETA_4DAN", label: "Preta 4º Dan", color: "#000000", textColor: "#FFFFFF", order: 13 },
  { value: "PRETA_5DAN", label: "Preta 5º Dan", color: "#000000", textColor: "#FFFFFF", order: 14 },
  { value: "PRETA_6DAN", label: "Preta 6º Dan", color: "#000000", textColor: "#FFFFFF", order: 15 },
  { value: "PRETA_7DAN", label: "Preta 7º Dan", color: "#000000", textColor: "#FFFFFF", order: 16 },
  { value: "PRETA_8DAN", label: "Preta 8º Dan", color: "#000000", textColor: "#FFFFFF", order: 17 },
  { value: "PRETA_9DAN", label: "Preta 9º Dan", color: "#000000", textColor: "#FFFFFF", order: 18 },
  { value: "PRETA_10DAN", label: "Preta 10º Dan", color: "#000000", textColor: "#FFFFFF", order: 19 },
] as const

export type BeltRank = typeof BELT_RANKS[number]["value"]

export function getBeltInfo(rank: string) {
  return BELT_RANKS.find(b => b.value === rank) || BELT_RANKS[0]
}

export function isBeltAtLeast(studentBelt: string, requiredBelt: string): boolean {
  if (!requiredBelt || requiredBelt === "TODAS" || requiredBelt === "ALL") return true
  const minBeltKey = requiredBelt.split("-")[0].trim()
  const reqInfo = BELT_RANKS.find(b => b.value === minBeltKey || b.value === requiredBelt) || getBeltInfo(requiredBelt)
  const studentInfo = getBeltInfo(studentBelt)
  return studentInfo.order >= reqInfo.order
}

// ─── Status do Aluno ─────────────────────────────────────

export const STUDENT_STATUS = [
  { value: "ATIVO", label: "Ativo", color: "emerald" },
  { value: "INATIVO", label: "Inativo", color: "zinc" },
  { value: "TRANCADO", label: "Trancado", color: "amber" },
] as const

export type StudentStatus = typeof STUDENT_STATUS[number]["value"]

// ─── Tipo de Pagamento ───────────────────────────────────

export const PAYMENT_TYPES = [
  { value: "MENSALIDADE", label: "Mensalidade" },
  { value: "GYMPASS", label: "Gympass" },
] as const

export type PaymentType = typeof PAYMENT_TYPES[number]["value"]

// ─── Status do Pagamento ─────────────────────────────────

export const PAYMENT_STATUS = [
  { value: "PAGO", label: "Pago", color: "emerald" },
  { value: "PENDENTE", label: "Pendente", color: "amber" },
  { value: "ATRASADO", label: "Atrasado", color: "rose" },
] as const

export type PaymentStatus = typeof PAYMENT_STATUS[number]["value"]

// ─── Gênero ──────────────────────────────────────────────

export const GENDERS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
  { value: "NEUTRO", label: "Neutro" },
] as const

// ─── Dias da Semana ──────────────────────────────────────

export const DAYS_OF_WEEK = [
  { value: "SEGUNDA", label: "Segunda-feira", short: "Seg" },
  { value: "TERCA", label: "Terça-feira", short: "Ter" },
  { value: "QUARTA", label: "Quarta-feira", short: "Qua" },
  { value: "QUINTA", label: "Quinta-feira", short: "Qui" },
  { value: "SEXTA", label: "Sexta-feira", short: "Sex" },
  { value: "SABADO", label: "Sábado", short: "Sáb" },
] as const

export type DayOfWeek = typeof DAYS_OF_WEEK[number]["value"]

export function getDayLabel(day: string): string {
  return DAYS_OF_WEEK.find(d => d.value === day)?.label || day
}

export function getDayShort(day: string): string {
  return DAYS_OF_WEEK.find(d => d.value === day)?.short || day
}

// ─── Tamanhos de Faixa ───────────────────────────────────

export const BELT_SIZES = [
  { value: "TAMANHO_1", label: "Tamanho 1 (2,20m — Infantil)", short: "T1 (2.20m)" },
  { value: "TAMANHO_2", label: "Tamanho 2 (2,40m — Juvenil / P)", short: "T2 (2.40m)" },
  { value: "TAMANHO_3", label: "Tamanho 3 (2,60m — Adulto / M)", short: "T3 (2.60m)" },
  { value: "TAMANHO_4", label: "Tamanho 4 (2,80m — Adulto / G)", short: "T4 (2.80m)" },
  { value: "TAMANHO_5", label: "Tamanho 5 (3,00m — Adulto / GG)", short: "T5 (3.00m)" },
  { value: "TAMANHO_6", label: "Tamanho 6 (3,20m — Extra Grande)", short: "T6 (3.20m)" },
] as const

export function getBeltSizeLabel(size?: string): string {
  if (!size) return "Não informado"
  const found = BELT_SIZES.find((s) => s.value === size || s.label === size)
  return found ? found.label : size
}

// ─── Tipo de Modalidade ──────────────────────────────────

export const MODALITY_TYPES = [
  { value: "COMBATE", label: "🥊 Luta / Combate (Chave de Lutas)", unit: "pts", desc: "Chave eliminatória de lutas com pontuação e vencedor" },
  { value: "CHUTE_ALTURA", label: "🦶 Chute em Altura (Medição única em Metros - m)", unit: "m", desc: "Medição de altura máxima do chute (ex: 2.15 m)" },
  { value: "SALTO_ALTURA", label: "⬆️ Salto em Altura (Medição em Metros - m)", unit: "m", desc: "Medição de altura do salto (ex: 1.80 m)" },
  { value: "SALTO_DISTANCIA", label: "🏃 Salto em Distância (Medição em Metros - m)", unit: "m", desc: "Medição de distância do salto (ex: 2.45 m)" },
  { value: "ARMAS_SANG_DCHALGON", label: "🥢 Armas — Sang Dchalgon (Nunchaku - Notas)", unit: "pts", desc: "Avaliação técnica de manejo de Sang Dchalgon (0 a 10 pts)" },
  { value: "ARMAS_ESPADA_COREANA", label: "⚔️ Armas — Espada Coreana (Geomdo - Notas)", unit: "pts", desc: "Avaliação técnica com espada coreana (0 a 10 pts)" },
  { value: "APRESENTACAO_ENSAIADA", label: "🎭 Apresentação Ensaiada (Defesa Pessoal - Notas)", unit: "pts", desc: "Demonstração e apresentação coreografada (0 a 10 pts)" },
  { value: "PONTUACAO", label: "🥋 Formas / Hyung / Poomsae (Notas de 0 a 10)", unit: "pts", desc: "Avaliação técnica por pontuação (ex: 9.75 pts)" },
  { value: "TEMPO", label: "⏱️ Tempo / Cronômetro (Segundos - s)", unit: "s", desc: "Cronometragem de velocidade (ex: 12.30 s)" },
] as const

export function getModalityMetricLabel(type?: string): { name: string; unit: string; placeholder: string; isTime?: boolean; isCombate?: boolean } {
  switch (type) {
    case "CHUTE_ALTURA":
      return { name: "Altura do Chute (Metros)", unit: "m", placeholder: "Ex: 2.15 (em metros)", isTime: false }
    case "SALTO_ALTURA":
      return { name: "Altura do Salto (Metros)", unit: "m", placeholder: "Ex: 1.80 (em metros)", isTime: false }
    case "SALTO_DISTANCIA":
      return { name: "Distância do Salto (Metros)", unit: "m", placeholder: "Ex: 2.45 (em metros)", isTime: false }
    case "ARMAS_SANG_DCHALGON":
      return { name: "Nota Sang Dchalgon (0 a 10)", unit: "pts", placeholder: "Ex: 9.8 (nota)", isTime: false }
    case "ARMAS_ESPADA_COREANA":
      return { name: "Nota Espada Coreana (0 a 10)", unit: "pts", placeholder: "Ex: 9.6 (nota)", isTime: false }
    case "APRESENTACAO_ENSAIADA":
      return { name: "Nota Apresentação Ensaiada (0 a 10)", unit: "pts", placeholder: "Ex: 9.9 (nota)", isTime: false }
    case "MEDICAO_ALTURA":
      return { name: "Altura Atingida (Metros)", unit: "m", placeholder: "Ex: 2.10 (em metros)", isTime: false }
    case "MEDICAO_DISTANCIA":
    case "MEDICAO":
      return { name: "Distância / Marca (Metros)", unit: "m", placeholder: "Ex: 2.45 (em metros)", isTime: false }
    case "PONTUACAO":
      return { name: "Nota / Pontuação (0 a 10)", unit: "pts", placeholder: "Ex: 9.75 (nota)", isTime: false }
    case "TEMPO":
      return { name: "Tempo Registrado (Segundos)", unit: "s", placeholder: "Ex: 14.50 (em segundos)", isTime: true }
    case "COMBATE":
      return { name: "Pontos de Luta / Placar", unit: "pts", placeholder: "Ex: 12", isCombate: true }
    default:
      return { name: "Métrica / Resultado", unit: "m", placeholder: "Ex: 2.50" }
  }
}

export function computeSmartPairings(participants: any[]) {
  if (!participants || participants.length < 2) return []

  const getBeltOrder = (rank: string) => {
    const b = BELT_RANKS.find((r) => r.value === rank)
    return b ? b.order : 0
  }

  // Sort by composite key for closest belt, weight, height
  const sorted = [...participants].sort((a, b) => {
    const wA = a.weight && a.weight > 0 ? a.weight : a.student?.weight || 0
    const wB = b.weight && b.weight > 0 ? b.weight : b.student?.weight || 0
    const bA = getBeltOrder(a.student?.beltRank || "")
    const bB = getBeltOrder(b.student?.beltRank || "")
    let hA = a.student?.height || 0
    let hB = b.student?.height || 0
    if (hA > 0 && hA < 3) hA *= 100
    if (hB > 0 && hB < 3) hB *= 100

    const scoreA = bA * 1000 + wA * 10 + hA * 0.1
    const scoreB = bB * 1000 + wB * 10 + hB * 0.1
    return scoreA - scoreB
  })

  const pairings: any[] = []
  for (let i = 0; i < sorted.length; i += 2) {
    const a1 = sorted[i]
    const a2 = sorted[i + 1]

    if (!a2) {
      pairings.push({
        athlete1: a1,
        athlete2: null,
        info: "Atleta Isento / W.O (avança automaticamente)",
        badge: "W.O",
      })
    } else {
      const w1 = a1.weight && a1.weight > 0 ? a1.weight : a1.student?.weight || 0
      const w2 = a2.weight && a2.weight > 0 ? a2.weight : a2.student?.weight || 0
      const diffW = Math.abs(w1 - w2).toFixed(1)

      let h1 = a1.student?.height || 0
      let h2 = a2.student?.height || 0
      if (h1 > 0 && h1 < 3) h1 *= 100
      if (h2 > 0 && h2 < 3) h2 *= 100
      const diffH = h1 > 0 && h2 > 0 ? `${Math.abs(h1 - h2).toFixed(0)}cm` : "N/I"

      const b1 = getBeltInfo(a1.student?.beltRank).label
      const b2 = getBeltInfo(a2.student?.beltRank).label
      const isSameBelt = a1.student?.beltRank === a2.student?.beltRank

      pairings.push({
        athlete1: a1,
        athlete2: a2,
        info: `${isSameBelt ? `Faixa ${b1}` : `${b1} vs ${b2}`} • Dif: ${diffW}kg / ${diffH}`,
        badge: Number(diffW) <= 3 && Math.abs(h1 - h2) <= 10 ? "⭐⭐⭐⭐⭐ Equilíbrio Ideal" : "⭐⭐⭐⭐ Bom Equilíbrio",
      })
    }
  }

  return pairings
}

// ─── Medalhas ────────────────────────────────────────────

export const MEDALS = [
  { value: "OURO", label: "Ouro", emoji: "🥇", color: "#FFD700" },
  { value: "PRATA", label: "Prata", emoji: "🥈", color: "#C0C0C0" },
  { value: "BRONZE", label: "Bronze", emoji: "🥉", color: "#CD7F32" },
] as const

// ─── Status do Evento ────────────────────────────────────

export const EVENT_STATUS = [
  { value: "PLANEJAMENTO", label: "Planejamento", color: "zinc" },
  { value: "INSCRICOES", label: "Inscrições Abertas", color: "blue" },
  { value: "EM_ANDAMENTO", label: "Em Andamento", color: "amber" },
  { value: "FINALIZADO", label: "Finalizado", color: "emerald" },
] as const

// ─── Navegação ───────────────────────────────────────────

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
  },
  {
    title: "Alunos",
    href: "/alunos",
    icon: "Users",
  },
  {
    title: "Horários",
    href: "/horarios",
    icon: "Clock",
  },
  {
    title: "Frequência",
    href: "/frequencia",
    icon: "CalendarCheck",
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: "DollarSign",
    children: [
      { title: "Resumo", href: "/financeiro" },
      { title: "Mensalidades", href: "/financeiro/mensalidades" },
      { title: "Gympass", href: "/financeiro/gympass" },
      { title: "Relatórios", href: "/financeiro/relatorios" },
    ],
  },
  {
    title: "Campeonatos",
    href: "/campeonatos",
    icon: "Trophy",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: "Settings",
  },
] as const
