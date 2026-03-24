import GestionCitasPaciente from "@/components/GestionCitasPaciente";

export default function GestionCitasPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 border-b pb-4">
          Mis Citas Médicas
        </h1>
        {/* Aquí inyectamos tu componente principal */}
        <GestionCitasPaciente />
      </div>
    </main>
  );
}