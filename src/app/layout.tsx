import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

import { getSettings } from "@/lib/db-actions"

export const metadata: Metadata = {
  title: "Dok Su Ri — Dojang",
  description: "Sistema de Gestão para Dojang de Hapkido - Instituto Dok Su Ri",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSettings().catch(() => null)
  const defaultColor = settings?.primaryColor || "rose"

  const themeScript = `
    try {
      var theme = localStorage.getItem('dojang_theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      var color = localStorage.getItem('dojang_primary_color') || '${defaultColor}';
      document.documentElement.setAttribute('data-theme-color', color);
    } catch (e) {}
  `

  return (
    <html lang="pt-BR" data-theme-color={defaultColor} suppressHydrationWarning>
      <body>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-[#090d16] transition-colors duration-200">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#090d16] transition-colors duration-200">{children}</main>
        </div>
      </body>
    </html>
  )
}