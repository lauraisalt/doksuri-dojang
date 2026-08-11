import { getSettings } from "@/lib/db-actions"
import { SettingsClientForm } from "./settings-client-form"

export const revalidate = 0

export default async function ConfiguracoesPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Configurações do Dojang
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Parâmetros gerais do Instituto Dok Su Ri e dados padrão do sistema.
        </p>
      </div>

      <SettingsClientForm initialSettings={settings} />
    </div>
  )
}
