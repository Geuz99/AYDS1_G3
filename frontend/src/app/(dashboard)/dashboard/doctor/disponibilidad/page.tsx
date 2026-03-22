"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getSession, isAuthenticated } from "@/lib/auth";

type Horario = {
  id: number;
  dias_semana: string[];
  hora_inicio: string;
  hora_fin: string;
};

type Conflict = {
  id: number;
  fecha_cita: string;
  hora_cita: string;
  motivo_cita: string;
};

const DAYS = [
  { code: "MON", label: "Lunes" },
  { code: "TUE", label: "Martes" },
  { code: "WED", label: "Miércoles" },
  { code: "THU", label: "Jueves" },
  { code: "FRI", label: "Viernes" },
  { code: "SAT", label: "Sábado" },
  { code: "SUN", label: "Domingo" },
];

const DEFAULT_START = "08:00";
const DEFAULT_END = "17:00";

const normalizeApiError = async (response: Response): Promise<{ detail: string; conflicts: Conflict[] }> => {
  try {
    const data = await response.json();
    const detail = data?.detail || "No se pudo guardar el horario.";
    const conflicts = Array.isArray(data?.affected_appointments) ? (data.affected_appointments as Conflict[]) : [];
    return { detail, conflicts };
  } catch {
    return { detail: "No se pudo guardar el horario.", conflicts: [] };
  }
};

const sortHorarios = (horarios: Horario[]) => {
  return [...horarios].sort((a, b) => {
    const firstDayA = DAYS.findIndex((day) => a.dias_semana.includes(day.code));
    const firstDayB = DAYS.findIndex((day) => b.dias_semana.includes(day.code));
    if (firstDayA !== firstDayB) {
      return firstDayA - firstDayB;
    }
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });
};

const formatDias = (dias: string[]) => {
  return DAYS.filter((day) => dias.includes(day.code))
    .map((day) => day.label)
    .join(", ");
};

export default function DisponibilidadPage() {
  const router = useRouter();
  const session = getSession();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState(DEFAULT_START);
  const [horaFin, setHoraFin] = useState(DEFAULT_END);
  const [editingHorarioId, setEditingHorarioId] = useState<number | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const sortedHorarios = useMemo(() => sortHorarios(horarios), [horarios]);

  const clearForm = () => {
    setSelectedDays([]);
    setHoraInicio(DEFAULT_START);
    setHoraFin(DEFAULT_END);
    setEditingHorarioId(null);
  };

  const loadHorarios = async () => {
    if (!session?.access || session.role !== "DOCTOR") {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}horarios/`, {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar los horarios.");
      }

      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : payload?.results || [];
      setHorarios(list as Horario[]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error inesperado al cargar horarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    if (session?.role !== "DOCTOR") {
      router.replace("/login");
      return;
    }

    void loadHorarios();
  }, [router, session?.access, session?.role]);

  const toggleDay = (dayCode: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayCode)) {
        return prev.filter((day) => day !== dayCode);
      }
      return [...prev, dayCode];
    });
  };

  const handleEdit = (horario: Horario) => {
    setEditingHorarioId(horario.id);
    setSelectedDays(horario.dias_semana);
    setHoraInicio(horario.hora_inicio.slice(0, 5));
    setHoraFin(horario.hora_fin.slice(0, 5));
    setSuccessMessage("");
    setErrorMessage("");
    setConflicts([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");
    setConflicts([]);

    if (!session?.access) {
      setErrorMessage("Sesión no válida para guardar horarios.");
      return;
    }

    if (selectedDays.length === 0) {
      setErrorMessage("Selecciona al menos un día de atención.");
      return;
    }

    if (horaInicio >= horaFin) {
      setErrorMessage("La hora fin debe ser mayor que la hora inicio.");
      return;
    }

    setSaving(true);

    try {
      const endpoint = editingHorarioId
        ? `${API_BASE_URL}horarios/${editingHorarioId}/`
        : `${API_BASE_URL}horarios/`;
      const method = editingHorarioId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${session.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dias_semana: selectedDays,
          hora_inicio: `${horaInicio}:00`,
          hora_fin: `${horaFin}:00`,
        }),
      });

      if (!response.ok) {
        const parsed = await normalizeApiError(response);
        setErrorMessage(parsed.detail);
        setConflicts(parsed.conflicts);
        return;
      }

      await loadHorarios();
      setSuccessMessage(editingHorarioId ? "Horario actualizado correctamente." : "Horario creado correctamente.");
      clearForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error inesperado al guardar horario.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (horarioId: number) => {
    if (!session?.access) {
      setErrorMessage("Sesión no válida para eliminar horarios.");
      return;
    }

    const confirmed = window.confirm("¿Seguro que deseas eliminar este horario?");
    if (!confirmed) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setConflicts([]);
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}horarios/${horarioId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });

      if (!response.ok) {
        const parsed = await normalizeApiError(response);
        setErrorMessage(parsed.detail);
        setConflicts(parsed.conflicts);
        return;
      }

      await loadHorarios();
      setSuccessMessage("Horario eliminado correctamente.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error inesperado al eliminar horario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Horarios del Médico</h1>
          <p className="text-sm text-slate-600">Define disponibilidad por días con un único rango de hora para todos los días seleccionados.</p>
        </div>
        <Link href="/dashboard/doctor" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Volver al panel
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Configurar disponibilidad</h2>
        <p className="mt-1 text-sm text-slate-600">Los horarios se publican de inmediato para que los pacientes puedan agendar dentro de este rango.</p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Días de atención</label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {DAYS.map((day) => {
                const checked = selectedDays.includes(day.code);
                return (
                  <button
                    key={day.code}
                    type="button"
                    onClick={() => toggleDay(day.code)}
                    className={[
                      "rounded-md border px-3 py-2 text-sm font-medium transition",
                      checked
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Hora inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(event) => setHoraInicio(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Hora fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(event) => setHoraFin(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Guardando..." : editingHorarioId ? "Actualizar horario" : "Guardar horario"}
            </button>
            {editingHorarioId ? (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>
        </form>

        {successMessage ? <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}
        {errorMessage ? <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

        {conflicts.length > 0 ? (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-700">Citas activas afectadas por este cambio:</p>
            <ul className="mt-2 space-y-1 text-sm text-rose-700">
              {conflicts.map((conflict) => (
                <li key={conflict.id}>
                  #{conflict.id} - {conflict.fecha_cita} {conflict.hora_cita.slice(0, 5)} - {conflict.motivo_cita}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Horarios actuales</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{sortedHorarios.length} horario(s)</span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Cargando horarios...</p>
        ) : sortedHorarios.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has configurado horarios de atención.</p>
        ) : (
          <div className="space-y-3">
            {sortedHorarios.map((horario) => (
              <div key={horario.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{formatDias(horario.dias_semana)}</p>
                <p className="text-sm text-slate-700">
                  {horario.hora_inicio.slice(0, 5)} - {horario.hora_fin.slice(0, 5)}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(horario)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(horario.id)}
                    className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
