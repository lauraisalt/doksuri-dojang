import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export const metadata: Metadata = {
  title: "Dok Su Ri — Dojang",
  description: "Sistema de Gestão para Dojang de Hapkido - Instituto Dok Su Ri",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="flex h-screen overflow-hidden antialiased bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100 dark:bg-[#090d16] transition-colors duration-200">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-[#090d16] transition-colors duration-200">{children}</main>
        </div>
      </body>
    </html>
  )
}
