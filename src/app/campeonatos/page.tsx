import { getEvents } from "@/lib/db-actions"
import { Trophy, Calendar, MapPin, Award, Plus, Shield } from "lucide-react"

export const revalidate = 0

export default async function CampeonatosPage() {
  const events = await getEvents()

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Campeonatos & Torneios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organização de eventos de Hapkido, categorias, inscrições e chaves de combate.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm dark:shadow-lg space-y-6 dark:backdrop-blur-md transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 inline-block mb-2">
                  {event.status}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {event.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    {new Date(event.date).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {event.location || "Local a definir"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modalities & Categories */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-500" /> Modalidades & Categorias
              </h3>

              {event.modalities.map((mod) => (
                <div
                  key={mod.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3"
                >
                  <div className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {mod.name} ({mod.type})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mod.categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white">
                            {cat.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cat.participants.length} atletas inscritos
                          </div>
                        </div>

                        {/* Medalists */}
                        <div className="flex items-center gap-1">
                          {cat.participants.map((p) => {
                            if (p.medal === "OURO") return <span key={p.id} title={`${p.student.name} (Ouro)`}>🥇</span>
                            if (p.medal === "PRATA") return <span key={p.id} title={`${p.student.name} (Prata)`}>🥈</span>
                            if (p.medal === "BRONZE") return <span key={p.id} title={`${p.student.name} (Bronze)`}>🥉</span>
                            return null
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
