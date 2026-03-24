"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { setTokenProvider } from "@/lib/api";
import { getSession } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReservaCitaFormProps {
  doctorId: string | number;
  doctorName: string;
  /** Called after a successful booking so the parent can react (e.g. redirect) */
  onSuccess?: () => void;
  /** Called when patient cancels the booking flow */
  onCancel?: () => void;
}

interface DisponibilidadResponse {
  fecha: string;
  doctor_id: number;
  disponibles: string[];
  mensaje?: string;
}

interface CitaErrorResponse {
  detail?: string;
  fecha_cita?: string[];
  hora_cita?: string[];
  motivo_cita?: string[];
  medico?: string[];
  paciente?: string[];
  non_field_errors?: string[];
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayISO = (): string => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

/** Flatten Django validation error object to a readable string list */
function extractDjangoErrors(data: CitaErrorResponse): string[] {
  const messages: string[] = [];

  if (data.detail) {
    messages.push(data.detail);
    return messages;
  }

  const fieldLabels: Record<string, string> = {
    fecha_cita: "Fecha",
    hora_cita: "Hora",
    motivo_cita: "Motivo",
    medico: "Médico",
    paciente: "Paciente",
    non_field_errors: "",
  };

  for (const [field, errs] of Object.entries(data)) {
    if (!Array.isArray(errs)) continue;
    const label = fieldLabels[field] ?? field;
    for (const e of errs as string[]) {
      messages.push(label ? `${label}: ${e}` : e);
    }
  }

  return messages.length > 0 ? messages : ["Error desconocido. Intenta de nuevo."];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReservaCitaForm({
  doctorId,
  doctorName,
  onSuccess,
  onCancel,
}: ReservaCitaFormProps) {
  // Inject session token into the api helper once on mount
  useEffect(() => {
    setTokenProvider(() => getSession()?.access ?? null);
    return () => setTokenProvider(null);
  }, []);

  const today = todayISO();

  // ── State ────────────────────────────────────────────────────────────────
  const [fecha, setFecha] = useState<string>("");
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  /** Track whether user has already picked a date (to show "no hay disponibilidad") */
  const fetchedForFecha = useRef<string>("");

  // ── Fetch disponibilidad when fecha changes ───────────────────────────────
  useEffect(() => {
    if (!fecha || fecha < today) {
      setHorariosDisponibles([]);
      setHoraSeleccionada("");
      return;
    }

    let cancelled = false;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setError("");
      setFieldErrors([]);
      setHorariosDisponibles([]);
      setHoraSeleccionada("");
      fetchedForFecha.current = fecha;

      try {
        const data = await api.get<DisponibilidadResponse>(
          `doctors/${doctorId}/disponibilidad/?fecha=${fecha}`
        );
        if (!cancelled) {
          setHorariosDisponibles(data.disponibles ?? []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          let msg = "No se pudo cargar la disponibilidad.";
          if (err instanceof Error) {
            try {
              const parsed = JSON.parse(err.message);
              msg = parsed?.details?.detail ?? msg;
            } catch {
              // keep default
            }
          }
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      cancelled = true;
    };
  }, [fecha, doctorId, today]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFieldErrors([]);
    setSuccessMessage("");

    if (!fecha || !horaSeleccionada || !motivo.trim()) {
      setError("Por favor completa todos los campos antes de confirmar.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("citas/", {
        medico: doctorId,
        fecha_cita: fecha,
        hora_cita: horaSeleccionada,
        motivo_cita: motivo.trim(),
      });

      setSuccessMessage(
        `¡Cita confirmada! ${doctorName} te atenderá el ${fecha} a las ${horaSeleccionada}.`
      );
      // Reset form
      setFecha("");
      setHorariosDisponibles([]);
      setHoraSeleccionada("");
      setMotivo("");
      fetchedForFecha.current = "";

      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          const details = parsed?.details as CitaErrorResponse | undefined;
          if (details) {
            const msgs = extractDjangoErrors(details);
            if (msgs.length === 1) {
              setError(msgs[0]);
            } else {
              setFieldErrors(msgs);
            }
          } else {
            setError("Error al programar la cita. Intenta de nuevo.");
          }
        } catch {
          setError("Error inesperado. Intenta de nuevo.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived state for button guard ────────────────────────────────────────
  const isFormReady =
    !!fecha && !!horaSeleccionada && motivo.trim().length > 0 && !isLoadingSlots;

  const handleCancel = () => {
    if (isSubmitting) return;
    setFecha("");
    setHorariosDisponibles([]);
    setHoraSeleccionada("");
    setMotivo("");
    setError("");
    setFieldErrors([]);
    setSuccessMessage("");
    fetchedForFecha.current = "";
    onCancel?.();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Programar cita</h2>
        <p className="mt-1 text-sm text-gray-500">
          Con <span className="font-semibold text-indigo-600">{doctorName}</span>
        </p>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm"
        >
          <span className="mt-0.5 shrink-0 text-emerald-500" aria-hidden>✔</span>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ── Fecha ────────────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="fecha-cita"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha de la cita
          </label>
          <input
            id="fecha-cita"
            type="date"
            min={today}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setSuccessMessage("");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                       disabled:opacity-50"
          />
        </div>

        {/* ── Horarios disponibles ─────────────────────────────────────── */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            Horario disponible
          </p>

          {isLoadingSlots && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 py-3">
              <svg
                className="animate-spin h-4 w-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Buscando horarios disponibles…
            </div>
          )}

          {!isLoadingSlots && fecha && fetchedForFecha.current === fecha && (
            <>
              {horariosDisponibles.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  No hay disponibilidad para este día. Selecciona otra fecha.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2" role="group" aria-label="Horarios disponibles">
                  {horariosDisponibles.map((hora) => {
                    const selected = hora === horaSeleccionada;
                    return (
                      <button
                        key={hora}
                        type="button"
                        id={`slot-${hora.replace(":", "-")}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setHoraSeleccionada(hora);
                          setSuccessMessage("");
                        }}
                        className={`
                          rounded-lg border px-2 py-2 text-sm font-medium transition-all duration-150
                          focus:outline-none focus:ring-2 focus:ring-indigo-400
                          ${
                            selected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                              : "bg-white border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                          }
                        `}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!isLoadingSlots && !fecha && (
            <p className="text-sm text-gray-400 italic">
              Selecciona una fecha primero.
            </p>
          )}
        </div>

        {/* ── Motivo ───────────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="motivo-cita"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Motivo de la consulta
          </label>
          <textarea
            id="motivo-cita"
            rows={4}
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              setSuccessMessage("");
            }}
            placeholder="Describe brevemente el motivo de tu cita…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                       placeholder:text-gray-400"
          />
        </div>

        {/* ── Error messages ───────────────────────────────────────────── */}
        {(error || fieldErrors.length > 0) && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 space-y-1"
          >
            {error && <p>{error}</p>}
            {fieldErrors.map((msg, i) => (
              <p key={i}>• {msg}</p>
            ))}
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            id="btn-cancelar-cita"
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3
                       text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150
                       hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            id="btn-confirmar-cita"
            type="submit"
            disabled={!isFormReady || isSubmitting}
            className="w-full flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3
                       text-sm font-semibold text-white shadow-sm transition-all duration-150
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Confirmando…
              </>
            ) : (
              "Confirmar cita"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
