import GestionCitasPaciente from "@/components/GestionCitasPaciente";
import Link from "next/link";

export default function GestionCitasPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between border-b pb-4">
          <h1 className="text-3xl font-bold text-slate-800">Mis Citas Médicas</h1>
          <Link
            href="/dashboard/paciente"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <span aria-hidden>←</span>
            Regresar
          </Link>
        </div>
        {/* Aquí inyectamos tu componente principal */}
        <GestionCitasPaciente />
      </div>
    </main>
  );
}