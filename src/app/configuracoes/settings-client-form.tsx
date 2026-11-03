"use client"

import { useState, useEffect } from "react"
import { updateSettings, deleteDojangLogo, resetSettings } from "@/lib/db-actions"
import { Save, Shield, Database, Upload, Trash2, AlertTriangle, RefreshCw, Palette, Check, Download, FileSpreadsheet, HardDrive, CheckCircle2 } from "lucide-react"

interface SettingsData {
  academyName?: string
  logoUrl?: string
  primaryColor?: string
  defaultMonthlyFee?: number
  defaultGympassValue?: number
  defaultDueDay?: number
}

interface Props {
  initialSettings: SettingsData | null
}

const COLOR_OPTIONS = [
  { id: "rose", name: "Rosa / Vermelho Dok Su Ri", bg: "bg-rose-600", text: "text-rose-600", ring: "ring-rose-500" },
  { id: "blue", name: "Azul Hapkido", bg: "bg-blue-600", text: "text-blue-600", ring: "ring-blue-500" },
  { id: "emerald", name: "Verde Esmeralda", bg: "bg-emerald-600", text: "text-emerald-600", ring: "ring-emerald-500" },
  { id: "violet", name: "Roxo Real", bg: "bg-violet-600", text: "text-violet-600", ring: "ring-violet-500" },
  { id: "amber", name: "Laranja Âmbar", bg: "bg-amber-600", text: "text-amber-600", ring: "ring-amber-500" },
  { id: "slate", name: "Grafite Minimalista", bg: "bg-slate-700", text: "text-slate-700", ring: "ring-slate-500" },
]

export function SettingsClientForm({ initialSettings }: Props) {
  const [formData, setFormData] = useState({
    academyName: initialSettings?.academyName || "Instituto Dok Su Ri - Unidade 3",
    logoUrl: initialSettings?.logoUrl || "",
    primaryColor: initialSettings?.primaryColor || "rose",
    defaultMonthlyFee: initialSettings?.defaultMonthlyFee || 150,
    defaultGympassValue: initialSettings?.defaultGympassValue || 8.5,
    defaultDueDay: initialSettings?.defaultDueDay || 10,
  })

  // Apply theme color dynamically to document when color changes
  useEffect(() => {
    if (formData.primaryColor) {
      document.documentElement.setAttribute("data-theme-color", formData.primaryColor)
      localStorage.setItem("dojang_primary_color", formData.primaryColor)
    }
  }, [formData.primaryColor])

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)

  const handleCreateLocalBackup = async () => {
    setIsCreatingBackup(true)
    setBackupMessage(null)
    try {
      const res = await fetch("/api/backup", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setBackupMessage(`Backup gerado com sucesso: ${data.filename} (${data.totalBackups} armazenados)`)
      } else {
        alert(data.error || "Erro ao gerar backup local.")
      }
    } catch (err: any) {
      alert("Erro na requisição de backup: " + err.message)
    } finally {
      setIsCreatingBackup(false)
    }
  }

  // Handle local image file upload (converts file to Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem selecionada deve ter no máximo 2MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = async () => {
    if (confirm("Tem certeza que deseja apagar a foto/logotipo do Dojang?")) {
      setIsSaving(true)
      try {
        await deleteDojangLogo()
        setFormData((prev) => ({ ...prev, logoUrl: "" }))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } catch (err) {
        console.error(err)
        alert("Erro ao remover a foto.")
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleResetSettings = async () => {
    setIsResetting(true)
    try {
      const reseted = await resetSettings()
      setFormData({
        academyName: reseted.academyName,
        logoUrl: reseted.logoUrl,
        primaryColor: reseted.primaryColor || "rose",
        defaultMonthlyFee: reseted.defaultMonthlyFee,
        defaultGympassValue: reseted.defaultGympassValue,
        defaultDueDay: reseted.defaultDueDay,
      })
      setShowConfirmReset(false)
      alert("Configurações do Dojang restauradas com sucesso!")
    } catch (err) {
      console.error(err)
      alert("Erro ao redefinir configurações.")
    } finally {
      setIsResetting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await updateSettings({
        ...formData,
        defaultMonthlyFee: Number(formData.defaultMonthlyFee),
        defaultGympassValue: Number(formData.defaultGympassValue),
        defaultDueDay: Number(formData.defaultDueDay),
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar configurações.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-lg dark:backdrop-blur-md transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Identidade do Dojang & Configurações
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Altere o nome, logo/foto do Dojang e valores padrão do sistema.
              </p>
            </div>
          </div>

          {/* Dojang Photo & Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Dojang Logo Preview & Action */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center space-y-3">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-rose-500/30 flex items-center justify-center shadow-md">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo do Dojang"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-10 h-10 text-rose-500" />
                )}
              </div>

              <div>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                  Foto / Emblema do Dojang
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  PNG, JPG ou WebP (Máx 2MB)
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
                <label className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5" /> Escolher Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Apagar Foto do Dojang"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Apagar Foto
                  </button>
                )}
              </div>
            </div>

            {/* Dojang Name & Image URL input */}
            <div className="md:col-span-2 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Academia / Dojang *
                </label>
                <input
                  type="text"
                  required
                  value={formData.academyName}
                  onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                  placeholder="Ex: Instituto Dok Su Ri Hapkido - Unidade 3"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL da Imagem / Foto (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo-dojang.png"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white text-xs focus:border-rose-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ou faça o upload do arquivo diretamente usando o botão ao lado.
                </p>
              </div>

              {/* Primary Color Selector */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-slate-500" /> Cor Temática dos Botões & Destaques
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = formData.primaryColor === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryColor: c.id })}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? `bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 ${c.ring}`
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full ${c.bg} shrink-0 flex items-center justify-center text-white shadow-xs`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="truncate text-slate-800 dark:text-slate-200">{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Default Financial Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mensalidade Padrão (R$)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.defaultMonthlyFee}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultMonthlyFee: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Repasse Gympass (R$)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.defaultGympassValue}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultGympassValue: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dia Vencimento Padrão
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={formData.defaultDueDay}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultDueDay: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Save Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-500" /> Banco SQLite Ativo: dev.db
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/25"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Salvando..." : saveSuccess ? "✓ Salvo com Sucesso!" : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Data Export Section */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Central de Backup & Exportação de Dados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Baixe cópias de segurança do banco SQLite, arquivos completos em JSON ou planilhas CSV por página.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateLocalBackup}
            disabled={isCreatingBackup}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
          >
            <Database className="w-4 h-4" />
            {isCreatingBackup ? "Gerando Backup..." : "Criar Backup no Servidor"}
          </button>
        </div>

        {backupMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{backupMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* SQLite DB */}
          <a
            href="/api/backup?type=db"
            download
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-500" /> Banco SQLite (.db)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Arquivo bruto `dev.db` com 100% dos dados para restauração rápida.
              </p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0 mt-0.5" />
          </a>

          {/* JSON Full */}
          <a
            href="/api/backup?type=json"
            download
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-500" /> Dados Completos (.json)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Exportação de todas as tabelas e relacionamentos em JSON legível.
              </p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 mt-0.5" />
          </a>

          {/* CSV Alunos */}
          <a
            href="/api/backup?type=csv&resource=alunos"
            download
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-rose-500" /> Alunos Cadastrados (.csv)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Planilha com dados cadastrais, graduações, planos e contatos.
              </p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-rose-500 shrink-0 mt-0.5" />
          </a>

          {/* CSV Pagamentos */}
          <a
            href="/api/backup?type=csv&resource=pagamentos"
            download
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Financeiro & Mensalidades (.csv)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Planilha com histórico de pagamentos, vencimentos e status.
              </p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0 mt-0.5" />
          </a>

          {/* CSV Torneios */}
          <a
            href="/api/backup?type=csv&resource=torneios"
            download
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-violet-500" /> Torneios & Chaves (.csv)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Planilha com resultados, chaves, pódios e medalhas disputadas.
              </p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-500 shrink-0 mt-0.5" />
          </a>

          {/* CSV Frequência */}
          <a
            href="/api/backup?type=csv&resource=frequencia"
            download
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group flex items-start justify-between"
          >
            <div className="space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-teal-500" /> Frequências & Presenças (.csv)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Histórico de presenças, faltas e check-ins nas aulas.
              </p>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-500 shrink-0 mt-0.5" />
          </a>
        </div>

        {/* Routine notice */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Rotina de Backup Automático no Servidor:
          </span>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            O sistema inclui o script <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono">scripts/backup-db.js</code> pronto para execução periódica. Para programar um backup diário automático às 23:00 no Linux/Mac, basta adicionar ao crontab:
          </p>
          <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] select-all overflow-x-auto">
            0 23 * * * node {typeof window !== "undefined" ? "scripts/backup-db.js" : "scripts/backup-db.js"}
          </div>
        </div>
      </div>

      {/* Danger Zone / Reset Card */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Opções de Apagar & Restauração
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ações para apagar dados ou redefinir os parâmetros padrão da academia.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-rose-500/20"
          >
            <RefreshCw className="w-4 h-4" /> Redefinir para o Padrão
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirmar Restauração?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta ação irá restaurar o nome padrão &quot;Instituto Dok Su Ri&quot;, remover a foto/logo personalizada do Dojang e redefinir os valores padrão de mensalidade e vencimento.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetSettings}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500"
              >
                {isResetting ? "Redefinindo..." : "Sim, Restaurar Padrão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
