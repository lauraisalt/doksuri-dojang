"use client"

import { useState } from "react"
import { updateSettings } from "@/lib/db-actions"
import { Settings, Save, Shield, Database } from "lucide-react"

interface Props {
  initialSettings: any
}

export function SettingsClientForm({ initialSettings }: Props) {
  const [formData, setFormData] = useState({
    academyName: initialSettings.academyName || "Instituto Dok Su Ri - Unidade 3",
    defaultMonthlyFee: initialSettings.defaultMonthlyFee || 150,
    defaultGympassValue: initialSettings.defaultGympassValue || 8.5,
    defaultDueDay: initialSettings.defaultDueDay || 10,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

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
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-lg dark:backdrop-blur-md transition-colors">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Identidade do Dojang
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nome de exibição nos relatórios e recibos
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Academia / Unidade *
            </label>
            <input
              type="text"
              required
              value={formData.academyName}
              onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                Repasse Gympass Padrão (R$)
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
                Dia de Vencimento Padrão
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

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Database className="w-4 h-4" /> Banco SQLite: Local dev.db
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/25"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Salvando..." : saveSuccess ? "✓ Salvo!" : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  )
}
