"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { setTokenProvider } from "@/lib/api";

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: CitaMedica["estado"] }) {
  const styles: Record<CitaMedica["estado"], string> = {
    ACTIVA: "bg-sky-100 text-sky-700",
    ATENDIDA: "bg-emerald-100 text-emerald-700",
    CANCELADA_PACIENTE: "bg-slate-100 text-slate-600",
    CANCELADA_MEDICO: "bg-red-100 text-red-700",
  };
  const labels: Record<CitaMedica["estado"], string> = {
    ACTIVA: "Activa",
    ATENDIDA: "Atendida",
    CANCELADA_PACIENTE: "Cancelada por ti",
    CANCELADA_MEDICO: "Cancelada por médico",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${styles[estado]}`}
    >
      {labels[estado]}
    </span>
  );
}

function CitaActivaCard({
  cita,
  onCancelar,
}: {
  cita: CitaMedica;
  onCancelar: (id: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {cita.fecha_cita} &mdash; {cita.hora_cita.slice(0, 5)} hs
          </p>
          <p className="text-base font-medium text-slate-900">{cita.motivo_cita}</p>
          {cita.medico_detalle && (
            <div className="pt-1 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-700">Médico: </span>
                {cita.medico_detalle.nombre} {cita.medico_detalle.apellido}
              </p>
              <p>
                <span className="font-medium text-slate-700">Clínica: </span>
                {cita.medico_detalle.direccion_clinica}
              </p>
            </div>
          )}
        </div>
        <EstadoBadge estado={cita.estado} />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onCancelar(cita.id)}
          className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-600 active:scale-95"
        >
          Cancelar cita
        </button>
      </div>
    </div>
  );
}

function HistorialCard({ cita }: { cita: CitaMedica }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {cita.fecha_cita} &mdash; {cita.hora_cita.slice(0, 5)} hs
          </p>
          <p className="text-base font-medium text-slate-900">{cita.motivo_cita}</p>
          {cita.medico_detalle && (
            <div className="pt-1 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-700">Médico: </span>
                {cita.medico_detalle.nombre} {cita.medico_detalle.apellido}
              </p>
              <p>
                <span className="font-medium text-slate-700">Clínica: </span>
                {cita.medico_detalle.direccion_clinica}
              </p>
            </div>
          )}
          {cita.estado === "ATENDIDA" && cita.tratamiento && (
            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">
                Tratamiento indicado
              </p>
              <p className="text-sm text-emerald-900">{cita.tratamiento}</p>
            </div>
          )}
        </div>
        <div className="shrink-0">
          <EstadoBadge estado={cita.estado} />
        </div>
      </div>
    </div>
  );
}

function CancelModal({
  onConfirm,
  onClose,
  isSubmitting,
}: {
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">¿Cancelar esta cita?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Esta acción no se puede deshacer. El médico será notificado de la cancelación.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60 active:scale-95"
          >
            {isSubmitting ? "Cancelando…" : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GestionCitasPaciente() {
  const [citas, setCitas] = useState<CitaMedica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [citaIdToCancel, setCitaIdToCancel] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Register token provider once on mount
  useEffect(() => {
    setTokenProvider(() => getSession()?.access ?? null);
    return () => setTokenProvider(null);
  }, []);

  // Fetch appointments on mount
  useEffect(() => {
    async function fetchCitas() {
      try {
        const data = await api.get<CitaMedica[]>("citas/");
        setCitas(data);
      } catch {
        setFetchError("No se pudieron cargar las citas. Intenta recargar la página.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCitas();
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────
  const citasActivas = citas.filter((c) => c.estado === "ACTIVA");
  const historialCitas = citas.filter((c) => c.estado !== "ACTIVA");

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleOpenCancelModal(id: number) {
    setCitaIdToCancel(id);
    setCancelError(null);
    setIsCancelModalOpen(true);
  }

  function handleCloseModal() {
    if (isSubmitting) return;
    setIsCancelModalOpen(false);
    setCitaIdToCancel(null);
    setCancelError(null);
  }

  async function handleConfirmCancel() {
    if (citaIdToCancel === null) return;
    setIsSubmitting(true);
    setCancelError(null);

    try {
      await api.patch<CitaMedica>(`citas/${citaIdToCancel}/`, {
        estado: "CANCELADA_PACIENTE",
      });

      // Update local state — no page reload needed
      setCitas((prev) =>
        prev.map((c) =>
          c.id === citaIdToCancel ? { ...c, estado: "CANCELADA_PACIENTE" } : c,
        ),
      );
      handleCloseModal();
    } catch (err) {
      let message = "Ocurrió un error al cancelar. Intenta de nuevo.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message) as { details?: { detail?: string } };
          if (parsed.details?.detail) message = parsed.details.detail;
        } catch {
          // use default message
        }
      }
      setCancelError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {fetchError}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Citas Activas ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">Mis Citas Activas</h2>
          {citasActivas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500">
              No tienes citas activas por el momento.
            </div>
          ) : (
            <div className="space-y-4">
              {citasActivas.map((cita) => (
                <CitaActivaCard
                  key={cita.id}
                  cita={cita}
                  onCancelar={handleOpenCancelModal}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Historial ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">Mi Historial Médico</h2>
          {historialCitas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500">
              Tu historial médico está vacío.
            </div>
          ) : (
            <div className="space-y-4">
              {historialCitas.map((cita) => (
                <HistorialCard key={cita.id} cita={cita} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Cancel Modal ──────────────────────────────────────────────────── */}
      {isCancelModalOpen && (
        <CancelModal
          onConfirm={handleConfirmCancel}
          onClose={handleCloseModal}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ── Cancel inline error (shown below modal when still open) ───────── */}
      {cancelError && isCancelModalOpen && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {cancelError}
        </div>
      )}
    </>
  );
}
