"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, isAuthenticated } from "@/lib/auth";
import { api, setTokenProvider } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedicoDetalle {
  nombre: string;
  apellido: string;
  especialidad: string;
  direccion_clinica: string;
}

interface CitaMedica {
  id: number;
  fecha_cita: string;
  hora_cita: string;
  motivo_cita: string;
  estado: "ACTIVA" | "ATENDIDA" | "CANCELADA_PACIENTE" | "CANCELADA_MEDICO";
  tratamiento: string | null;
  medico_detalle: MedicoDetalle | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PacienteDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [citas, setCitas] = useState<CitaMedica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const session = getSession();
    if (session?.role !== "PATIENT") {
      router.replace("/login");
      return;
    }
    setEmail(session.email || "");
    setTokenProvider(() => session.access ?? null);

    api
      .get<CitaMedica[]>("citas/")
      .then((data) => setCitas(data))
      .catch(() => setCitas([]))
      .finally(() => setLoading(false));

    return () => setTokenProvider(null);
  }, [router]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const citasActivas = citas.filter((c) => c.estado === "ACTIVA");
  const citasAtendidas = citas.filter((c) => c.estado === "ATENDIDA");
  const citasCanceladas = citas.filter(
    (c) => c.estado === "CANCELADA_PACIENTE" || c.estado === "CANCELADA_MEDICO"
  );

  // Próxima cita: la activa más cercana en fecha
  const proximaCita = citasActivas
    .slice()
    .sort((a, b) => {
      const da = new Date(`${a.fecha_cita}T${a.hora_cita}`);
      const db = new Date(`${b.fecha_cita}T${b.hora_cita}`);
      return da.getTime() - db.getTime();
    })[0] ?? null;

  // Últimas 3 del historial (no activas)
  const historialReciente = citas
    .filter((c) => c.estado !== "ACTIVA")
    .slice(-3)
    .reverse();

  const today = new Date().toLocaleDateString("es-GT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 capitalize">{today}</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, <span className="text-indigo-600">{email}</span>
          </h1>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/paciente/reservar"
          className="group flex items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-600 p-5 shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-white">Agendar cita</p>
            <p className="text-sm text-indigo-200">Busca un médico y reserva tu turno</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-indigo-300 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/dashboard/paciente/citas"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">Mis citas</p>
            <p className="text-sm text-slate-500">Consulta y gestiona tus turnos</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/dashboard/paciente/perfil"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">Mi perfil</p>
            <p className="text-sm text-slate-500">Ver y editar tus datos</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          {loading ? (
            <div className="mx-auto mb-1 h-8 w-12 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="text-3xl font-bold text-indigo-600">{citasActivas.length}</p>
          )}
          <p className="mt-1 text-xs font-medium text-slate-500">Citas activas</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          {loading ? (
            <div className="mx-auto mb-1 h-8 w-12 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="text-3xl font-bold text-emerald-600">{citasAtendidas.length}</p>
          )}
          <p className="mt-1 text-xs font-medium text-slate-500">Atendidas</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          {loading ? (
            <div className="mx-auto mb-1 h-8 w-12 animate-pulse rounded bg-slate-200" />
          ) : (
            <p className="text-3xl font-bold text-slate-400">{citasCanceladas.length}</p>
          )}
          <p className="mt-1 text-xs font-medium text-slate-500">Canceladas</p>
        </div>
      </div>

      {/* ── Bottom grid: próxima cita + historial reciente ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Próxima cita */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Próxima cita
          </h2>

          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            </div>
          ) : proximaCita ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDate(proximaCita.fecha_cita)} &mdash; {proximaCita.hora_cita.slice(0, 5)} hs
                  </p>
                  <p className="text-xs text-slate-500">{proximaCita.motivo_cita}</p>
                </div>
              </div>

              {proximaCita.medico_detalle && (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 space-y-0.5">
                  <p>
                    <span className="font-medium">Dr. </span>
                    {proximaCita.medico_detalle.nombre} {proximaCita.medico_detalle.apellido}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium">
                    {proximaCita.medico_detalle.especialidad}
                  </p>
                  <p className="text-xs text-slate-500">{proximaCita.medico_detalle.direccion_clinica}</p>
                </div>
              )}

              <Link
                href="/dashboard/paciente/citas"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Ver todas mis citas
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="mb-3 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-500">No tienes citas programadas</p>
              <Link
                href="/dashboard/paciente/reservar"
                className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Agendar ahora
              </Link>
            </div>
          )}
        </section>

        {/* Historial reciente */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Historial reciente
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : historialReciente.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="mb-3 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-slate-500">Tu historial médico está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historialReciente.map((cita) => {
                const badgeStyle =
                  cita.estado === "ATENDIDA"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500";
                const badgeLabel =
                  cita.estado === "ATENDIDA"
                    ? "Atendida"
                    : cita.estado === "CANCELADA_PACIENTE"
                    ? "Cancelada por ti"
                    : "Cancelada por médico";

                return (
                  <div
                    key={cita.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {cita.motivo_cita}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(cita.fecha_cita)}
                        {cita.medico_detalle &&
                          ` · Dr. ${cita.medico_detalle.nombre} ${cita.medico_detalle.apellido}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}
                    >
                      {badgeLabel}
                    </span>
                  </div>
                );
              })}

              <Link
                href="/dashboard/paciente/citas"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                Ver historial completo
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
