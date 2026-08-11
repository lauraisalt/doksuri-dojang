import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInYears, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate: Date | string): number {
  const date = typeof birthDate === "string" ? parseISO(birthDate) : birthDate
  return differenceInYears(new Date(), date)
}

export function isMinor(birthDate: Date | string): boolean {
  return calculateAge(birthDate) < 18
}

export function formatDate(date: Date | string | null | undefined, pattern: string = "dd/MM/yyyy"): string {
  if (!date) return "-"
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function phoneToWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  const withCountry = cleaned.startsWith("55") ? cleaned : `55${cleaned}`
  return `https://wa.me/${withCountry}`
}

export function generateWhatsAppReminder(studentName: string, phone: string, amount: number, month: string): string {
  const message = encodeURIComponent(
    `Olá! 🥋\n\nEste é um lembrete do *Instituto Dok Su Ri - Unidade 3*.\n\nA mensalidade de *${month}* no valor de *${formatCurrency(amount)}* está pendente.\n\nAluno(a): *${studentName}*\n\nQualquer dúvida, entre em contato conosco.\n\nOss! 🙏`
  )
  return `${phoneToWhatsApp(phone)}?text=${message}`
}

export function getMonthName(month: number): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]
  return months[month - 1] || ""
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}
