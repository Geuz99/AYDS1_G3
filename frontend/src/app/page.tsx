export default function Home() {
  return (
    <section className="space-y-10">
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 p-8 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wider text-sky-100">SaludPlus</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">
          Plataforma de gestion de citas medicas para pacientes, medicos y administradores
        </h1>
        <p className="mt-4 max-w-2xl text-sky-50">
          Esta landing confirma que Next.js + App Router + Tailwind estan funcionando y deja una base lista para construir Login,
          Registro y Dashboards.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Modulo de autenticacion</h2>
          <p className="mt-2 text-sm text-slate-600">Pantallas iniciales para iniciar sesion con JWT y registrar nuevos usuarios.</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Registro de perfiles</h2>
          <p className="mt-2 text-sm text-slate-600">Formularios para paciente y medico con validaciones y mensajes de error claros.</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dashboards por rol</h2>
          <p className="mt-2 text-sm text-slate-600">Vistas diferenciadas para paciente, medico y admin conectadas al backend Django.</p>
        </article>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
        Siguiente sugerencia tecnica: crear paginas en src/app/(auth)/login y src/app/(auth)/registro, luego un grupo
        src/app/(dashboard)/ para los paneles por rol.
      </div>
    </section>
  );
}
