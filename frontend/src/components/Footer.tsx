import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">SaludPlus</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Conectamos pacientes con los mejores especialistas médicos de forma simple y segura.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Plataforma</p>
            <ul className="space-y-2">
              {[
                { label: "Iniciar sesión", href: "/login" },
                { label: "Registrarse", href: "/registro/paciente" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 transition hover:text-sky-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contacto</p>
            <p className="text-sm text-slate-500">contacto@saludplus.gt</p>
            <p className="text-sm text-slate-500">+502 2234-5678</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} SaludPlus. Todos los derechos reservados.</p>
          <p>Hecho con ♥ para la salud de Guatemala</p>
        </div>
      </div>
    </footer>
  );
}
