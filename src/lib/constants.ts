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

// ─── Tipo de Modalidade ──────────────────────────────────

export const MODALITY_TYPES = [
  { value: "COMBATE", label: "Combate" },
  { value: "MEDICAO", label: "Medição" },
  { value: "PONTUACAO", label: "Pontuação" },
] as const

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
