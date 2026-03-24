"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { api, API_BASE_URL, setTokenProvider } from "@/lib/api";
import { getSession } from "@/lib/auth";

type DoctorCard = {
  id: number;
  nombre_completo: string;
  especialidad: string;
  direccion_clinica: string;
  fotografia: string | null;
};

type DashboardDoctorsResponse = {
  count: number;
  results: DoctorCard[];
};

const getApiOrigin = () => API_BASE_URL.replace(/\/api\/$/, "");

const resolvePhotoUrl = (photoPath: string | null): string | null => {
  if (!photoPath) return null;
  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return photoPath;
  }

  const origin = getApiOrigin();
  const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  return `${origin}${cleanPath}`;
};

const initialsFromName = (fullName: string) => {
  const parts = fullName.split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
};

export default function PacienteDashboardMedicos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [especialidadInput, setEspecialidadInput] = useState("");
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");

  const fetchDoctors = async (especialidad = "") => {
    setLoading(true);
    setError("");

    try {
      const qs = especialidad.trim()
        ? `?especialidad=${encodeURIComponent(especialidad.trim())}`
        : "";
      const data = await api.get<DashboardDoctorsResponse>(
        `pacientes/dashboard/medicos/${qs}`,
      );
      setDoctors(data.results || []);
    } catch {
      setError("No se pudo cargar el dashboard de medicos. Intenta nuevamente.");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTokenProvider(() => getSession()?.access ?? null);
    fetchDoctors();
    return () => setTokenProvider(null);
  }, []);

  const especialidadesDisponibles = useMemo(() => {
    const unique = new Set<string>(
      doctors.map((d: DoctorCard) => d.especialidad).filter(Boolean),
    );
    return Array.from(unique).sort((a: string, b: string) => a.localeCompare(b));
  }, [doctors]);

  const handleBuscar = () => {
    fetchDoctors(especialidadInput);
    setEspecialidadSeleccionada("");
  };

  const handleEspecialidadChange = (value: string) => {
    setEspecialidadSeleccionada(value);
    setEspecialidadInput(value);
    fetchDoctors(value);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Medicos disponibles para agendar cita
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Filtra por especialidad para encontrar al profesional ideal.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input
            type="text"
            value={especialidadInput}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEspecialidadInput(event.target.value)}
            placeholder="Ejemplo: Cardiologia"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <select
            value={especialidadSeleccionada}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => handleEspecialidadChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Todas las especialidades</option>
            {especialidadesDisponibles.map((especialidad: string) => (
              <option key={especialidad} value={especialidad}>
                {especialidad}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleBuscar}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Buscar
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          Cargando medicos disponibles...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && doctors.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          No encontramos medicos con ese filtro. Prueba otra especialidad.
        </div>
      )}

      {!loading && !error && doctors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor: DoctorCard) => {
            const photoUrl = resolvePhotoUrl(doctor.fotografia);

            return (
              <article
                key={doctor.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full border border-indigo-200 bg-indigo-50">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt={`Foto de ${doctor.nombre_completo}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-indigo-700">
                        {initialsFromName(doctor.nombre_completo)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {doctor.nombre_completo}
                    </h3>
                    <p className="mt-0.5 text-xs text-indigo-700">{doctor.especialidad}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600">{doctor.direccion_clinica}</p>

                <Link
                  href="/dashboard/paciente/reservar"
                  className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                >
                  Agendar cita
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
