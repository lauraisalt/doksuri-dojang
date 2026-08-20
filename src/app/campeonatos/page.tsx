import { getEvents, getStudents } from "@/lib/db-actions"
import { ChampionshipsClientView } from "./championships-client-view"

export const revalidate = 0

export default async function CampeonatosPage() {
  const [events, students] = await Promise.all([getEvents(), getStudents()])

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

      <ChampionshipsClientView initialEvents={events} students={students} />
    </div>
  )
}

