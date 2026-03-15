export default function PatientDashboardPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Dashboard Paciente</h2>
      <p className="mt-2 text-sm text-slate-600">
        Placeholder para proximas citas, historial y acciones del paciente.
      </p>
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        Ruta activa: /dashboard/patient
      </div>
    </div>
  );
}
