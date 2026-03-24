"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getSession, isAuthenticated } from "@/lib/auth";
import ReservaCitaForm from "@/components/ReservaCitaForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type DoctorProfile = {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  direccion_clinica: string;
  correo_electronico: string;
  telefono: string;
  fotografia: string | null;
};

type DoctorsApiResponse = DoctorProfile[] | { results?: DoctorProfile[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getApiOrigin = () => API_BASE_URL.replace(/\/api\/$/, "");

const resolvePhotoUrl = (photoPath: string | null): string | null => {
  if (!photoPath) return null;
  if (photoPath.startsWith("http://") || photoPath.startsWith("https://"))
    return photoPath;
  const origin = getApiOrigin();
  const clean = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  return `${origin}${clean}`;
};

/** Initials avatar fallback */
const initials = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservarCitaPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // Step tracking: "list" | "form"
  const [step, setStep] = useState<"list" | "form">("list");

  // Doctor list state
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("Todos");

  // Selected doctor
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
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
    setToken(session.access);
  }, [router]);

  // ── Fetch doctors ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setFetchError("");
      try {
        const res = await fetch(`${API_BASE_URL}doctors/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("No se pudo cargar la lista de médicos.");
        const payload = (await res.json()) as DoctorsApiResponse;
        const list = Array.isArray(payload) ? payload : (payload.results ?? []);
        setDoctors(list);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "Error inesperado al cargar médicos."
        );
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [token]);

  // ── Derived: unique specialties for filter ─────────────────────────────────
  const especialidades = useMemo(() => {
    const set = new Set(doctors.map((d) => d.especialidad));
    return ["Todos", ...Array.from(set).sort()];
  }, [doctors]);

  // ── Derived: filtered + searched doctors ──────────────────────────────────
  const filteredDoctors = useMemo(() => {
    const q = search.toLowerCase().trim();
    return doctors.filter((d) => {
      const matchesEsp =
        especialidadFilter === "Todos" || d.especialidad === especialidadFilter;
      const matchesSearch =
        !q ||
        d.nombre.toLowerCase().includes(q) ||
        d.apellido.toLowerCase().includes(q) ||
        d.especialidad.toLowerCase().includes(q);
      return matchesEsp && matchesSearch;
    });
  }, [doctors, search, especialidadFilter]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectDoctor = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setStep("list");
    setSelectedDoctor(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          {step === "form" && (
            <button
              type="button"
              onClick={handleBack}
              id="btn-volver-lista"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700
                         transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {/* left arrow */}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Programar cita médica</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {step === "list"
                ? "Elige un médico disponible para continuar"
                : `Seleccionaste a Dr. ${selectedDoctor?.nombre} ${selectedDoctor?.apellido}`}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mx-auto mt-4 flex max-w-5xl items-center gap-2">
          {["Elegir médico", "Confirmar cita"].map((label, i) => {
            const active = (step === "list" && i === 0) || (step === "form" && i === 1);
            const done = step === "form" && i === 0;
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition
                    ${active ? "bg-indigo-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={`text-xs font-medium ${active ? "text-indigo-700" : "text-slate-400"}`}>
                  {label}
                </span>
                {i === 0 && (
                  <span className="mx-1 text-slate-300">›</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* STEP 1: Doctor list */}
        {step === "list" && (
          <div className="space-y-6">
            {/* Search + filter bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  id="search-doctor"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o especialidad…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm
                             focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <select
                id="filter-especialidad"
                value={especialidadFilter}
                onChange={(e) => setEspecialidadFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm
                           focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            {/* Loading skeleton */}
            {loadingDoctors && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                      </div>
                    </div>
                    <div className="h-8 w-full rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loadingDoctors && fetchError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {fetchError}
              </div>
            )}

            {/* Empty state */}
            {!loadingDoctors && !fetchError && filteredDoctors.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
                <p className="text-sm text-slate-500">No se encontraron médicos con los filtros actuales.</p>
              </div>
            )}

            {/* Doctor cards grid */}
            {!loadingDoctors && !fetchError && filteredDoctors.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDoctors.map((doctor) => {
                  const photoUrl = resolvePhotoUrl(doctor.fotografia);
                  return (
                    <article
                      key={doctor.id}
                      className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm
                                 transition hover:border-indigo-300 hover:shadow-md"
                    >
                      {/* Card header */}
                      <div className="flex items-center gap-4 p-5">
                        {/* Avatar */}
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-indigo-100 bg-indigo-50">
                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt={`Foto de Dr. ${doctor.nombre}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-indigo-600">
                              {initials(doctor.nombre, doctor.apellido)}
                            </span>
                          )}
                        </div>

                        {/* Name + specialty */}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            Dr. {doctor.nombre} {doctor.apellido}
                          </p>
                          <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {doctor.especialidad}
                          </span>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="flex-1 space-y-1.5 px-5 pb-4">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{doctor.direccion_clinica}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5a11.042 11.042 0 005 5l1.115-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{doctor.telefono}</span>
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="px-5 pb-5">
                        <button
                          type="button"
                          id={`btn-seleccionar-doctor-${doctor.id}`}
                          onClick={() => handleSelectDoctor(doctor)}
                          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white
                                     shadow-sm transition hover:bg-indigo-700
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                     group-hover:shadow-md"
                        >
                          Reservar cita
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Booking form */}
        {step === "form" && selectedDoctor && (
          <div className="flex justify-center">
            <ReservaCitaForm
              doctorId={selectedDoctor.id}
              doctorName={`Dr. ${selectedDoctor.nombre} ${selectedDoctor.apellido}`}
              onSuccess={() => {
                // After booking, wait 2 s then go back to list so patient can book again if needed
                setTimeout(() => handleBack(), 2000);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
