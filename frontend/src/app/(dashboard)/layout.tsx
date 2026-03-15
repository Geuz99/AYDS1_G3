import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Estructura base para paneles por rol.
        </p>
        <nav className="mt-4 flex gap-3 text-sm">
          <Link href="/dashboard" className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200">
            Inicio Dashboard
          </Link>
          <Link href="/dashboard/patient" className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200">
            Paciente
          </Link>
          <Link href="/dashboard/doctor" className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200">
            Medico
          </Link>
          <Link href="/dashboard/admin" className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200">
            Admin
          </Link>
        </nav>
      </header>
      {children}
    </section>
  );
}
