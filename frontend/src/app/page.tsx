import Link from "next/link";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconStethoscope({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "500+", label: "Pacientes registrados" },
  { value: "80+",  label: "Médicos especializados" },
  { value: "15+",  label: "Especialidades médicas" },
  { value: "99%",  label: "Satisfacción de usuarios" },
];

const ROLES = [
  {
    icon: <IconUser className="h-7 w-7" />,
    color: "bg-sky-500",
    ring: "ring-sky-100",
    title: "Para Pacientes",
    desc: "Agenda citas con los mejores médicos, consulta tu historial médico y recibe recordatorios automáticos desde cualquier dispositivo.",
    items: ["Agendar y cancelar citas", "Historial médico completo", "Notificaciones por correo"],
  },
  {
    icon: <IconStethoscope className="h-7 w-7" />,
    color: "bg-emerald-500",
    ring: "ring-emerald-100",
    title: "Para Médicos",
    desc: "Gestiona tu agenda, atiende consultas y registra tratamientos con una interfaz diseñada para el trabajo clínico eficiente.",
    items: ["Calendario de citas diarias", "Registro de tratamientos", "Configuración de disponibilidad"],
  },
  {
    icon: <IconShield className="h-7 w-7" />,
    color: "bg-indigo-500",
    ring: "ring-indigo-100",
    title: "Para Administradores",
    desc: "Supervisa la plataforma, aprueba cuentas médicas y mantiene la calidad del servicio con herramientas de control total.",
    items: ["Aprobación de usuarios", "Gestión centralizada", "Control de la plataforma"],
  },
];

const STEPS = [
  {
    num: "01",
    title: "Crea tu cuenta",
    desc: "Regístrate en minutos completando tu perfil personal. El proceso es rápido, seguro y completamente gratuito.",
  },
  {
    num: "02",
    title: "Elige tu médico",
    desc: "Explora nuestro catálogo de especialistas, filtra por especialidad y encuentra al profesional ideal para ti.",
  },
  {
    num: "03",
    title: "Confirma tu cita",
    desc: "Selecciona el horario que más te convenga y recibe confirmación inmediata. Así de fácil.",
  },
];

const SPECIALTIES = [
  { name: "Cardiología",     emoji: "🫀" },
  { name: "Pediatría",       emoji: "👶" },
  { name: "Dermatología",    emoji: "🔬" },
  { name: "Neurología",      emoji: "🧠" },
  { name: "Oftalmología",    emoji: "👁️" },
  { name: "Ortopedia",       emoji: "🦴" },
  { name: "Ginecología",     emoji: "🌸" },
  { name: "Psiquiatría",     emoji: "🧘" },
  { name: "Odontología",     emoji: "🦷" },
  { name: "Nutrición",       emoji: "🥗" },
  { name: "Traumatología",   emoji: "💪" },
  { name: "Medicina General",emoji: "🩺" },
];

const TESTIMONIALS = [
  {
    name: "Pablo Xar",
    role: "Paciente",
    text: "Nunca había sido tan fácil encontrar un especialista. Agendar la cita me tomó menos de 2 minutos.",
    stars: 5,
  },
  {
    name: "Dr. Farruko Pop",
    role: "Cardiólogo",
    text: "La plataforma me permite organizar mi agenda de forma clara. Mis pacientes llegan puntuales y preparados.",
    stars: 5,
  },
  {
    name: "Reginaldo Cucul",
    role: "Paciente",
    text: "Excelente servicio. El historial médico en línea me ha salvado en más de una emergencia.",
    stars: 5,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="-mx-6 -mt-10">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-sky-900">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-3xl" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-28 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left — copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5">
                <IconHeart className="h-4 w-4 text-sky-400" />
                <span className="text-sm font-medium text-sky-300">Plataforma médica de confianza</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white lg:text-6xl">
                  Tu salud,{" "}
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                    nuestra prioridad
                  </span>
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-slate-300">
                  Conectamos pacientes con los mejores especialistas médicos. Agenda, gestiona y controla tus citas desde un solo lugar, de forma rápida y segura.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/registro/paciente"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 hover:shadow-sky-400/30"
                >
                  <IconCalendar className="h-5 w-5" />
                  Comenzar ahora — es gratis
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Iniciar sesión
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["#06b6d4","#10b981","#6366f1","#f59e0b"].map((c, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: c }}
                    >
                      {["MG","CR","AP","JL"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <IconStar key={i} className="h-3.5 w-3.5 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">+500 pacientes satisfechos</p>
                </div>
              </div>
            </div>

            {/* Right — visual card */}
            <div className="relative hidden lg:flex lg:justify-end">
              <div className="relative w-80">
                {/* Main card */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center">
                        <IconCalendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Próxima cita</p>
                        <p className="text-sm font-semibold text-white">Hoy, 10:30 AM</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      Confirmada
                    </span>
                  </div>
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white">
                        CM
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Dr. Carlos Méndez</p>
                        <p className="text-xs text-slate-400">Cardiólogo · Clínica Central</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-xl bg-white/5 p-2 text-center">
                        <p className="text-xs text-slate-400">Fecha</p>
                        <p className="text-sm font-semibold text-white">23 Mar</p>
                      </div>
                      <div className="flex-1 rounded-xl bg-white/5 p-2 text-center">
                        <p className="text-xs text-slate-400">Hora</p>
                        <p className="text-sm font-semibold text-white">10:30</p>
                      </div>
                      <div className="flex-1 rounded-xl bg-white/5 p-2 text-center">
                        <p className="text-xs text-slate-400">Duración</p>
                        <p className="text-sm font-semibold text-white">30 min</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-emerald-500/90 px-4 py-3 shadow-xl backdrop-blur-sm">
                  <p className="text-xs font-semibold text-white">✓ Cita confirmada</p>
                  <p className="text-xs text-emerald-200">Recordatorio enviado</p>
                </div>

                {/* Floating stats */}
                <div className="absolute -right-4 -bottom-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-sm">
                  <p className="text-2xl font-extrabold text-white">80+</p>
                  <p className="text-xs text-slate-400">Especialistas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 gap-4 border-t border-white/10 pt-10 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ROLES / SERVICIOS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              Todo en un solo lugar
            </span>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
              Una plataforma para todos
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              SaludPlus está diseñado para cada actor del sistema de salud, con herramientas específicas para cada rol.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className={`group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm ring-4 ${role.ring} transition hover:-translate-y-1 hover:shadow-xl`}
              >
                {/* Icon */}
                <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${role.color} text-white shadow-lg`}>
                  {role.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{role.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-500">{role.desc}</p>
                <ul className="space-y-2">
                  {role.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <IconCheck className="h-3 w-3 text-emerald-600" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CÓMO FUNCIONA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              Simple y rápido
            </span>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
              ¿Cómo funciona?
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              En solo tres pasos tendrás tu cita médica agendada con el especialista que necesitas.
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute top-16 left-1/4 right-1/4 hidden h-0.5 bg-gradient-to-r from-sky-200 via-sky-400 to-sky-200 md:block" />

            {STEPS.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className={`relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
                  i === 1
                    ? "bg-sky-600 text-white shadow-sky-200"
                    : "bg-white text-sky-600 border-2 border-sky-200"
                }`}>
                  <span className="text-2xl font-extrabold">{step.num}</span>
                  {i === 1 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white font-bold">
                      ★
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/registro/paciente"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
            >
              <IconCalendar className="h-5 w-5" />
              Agendar mi primera cita
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ESPECIALIDADES
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              Amplia cobertura
            </span>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
              Especialidades médicas
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Contamos con médicos especializados en las principales áreas de la medicina, listos para atenderte.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SPECIALTIES.map((spec) => (
              <div
                key={spec.name}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50 hover:shadow-sm"
              >
                <span className="text-2xl">{spec.emoji}</span>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-sky-700">
                  {spec.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TESTIMONIOS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              Lo que dicen de nosotros
            </span>
            <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
              Miles de pacientes confían en SaludPlus
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm"
              >
                <div className="mb-4 flex gap-0.5">
                  {[...Array(t.stars)].map((_, i) => (
                    <IconStar key={i} className="h-4 w-4 text-amber-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-600 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BENEFICIOS RÁPIDOS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <IconClock className="h-6 w-6 text-sky-600" />,
                bg: "bg-sky-50",
                title: "Disponibilidad 24/7",
                desc: "Agenda citas en cualquier momento del día, sin llamadas ni esperas innecesarias.",
              },
              {
                icon: <IconShield className="h-6 w-6 text-emerald-600" />,
                bg: "bg-emerald-50",
                title: "100% seguro y privado",
                desc: "Tu información médica está protegida con los más altos estándares de seguridad.",
              },
              {
                icon: <IconHeart className="h-6 w-6 text-rose-500" />,
                bg: "bg-rose-50",
                title: "Médicos certificados",
                desc: "Todos nuestros especialistas son verificados y aprobados por nuestro equipo administrativo.",
              },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${b.bg}`}>
                  {b.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{b.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-900 py-28">
        {/* Decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5">
            <IconHeart className="h-4 w-4 text-sky-400" />
            <span className="text-sm font-medium text-sky-300">Comienza hoy sin costo</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white lg:text-5xl">
            ¿Listo para cuidar tu salud?
          </h2>
          <p className="mt-5 text-lg text-slate-300">
            Únete a miles de pacientes que ya gestionan sus citas médicas de forma inteligente con SaludPlus.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/registro/paciente"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
            >
              <IconCalendar className="h-5 w-5" />
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Iniciar sesión
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Sin tarjeta de crédito · Sin compromisos · Cancela cuando quieras
          </p>
        </div>
      </section>

    </div>
  );
}
