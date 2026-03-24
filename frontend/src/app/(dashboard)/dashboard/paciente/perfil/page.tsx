"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL, setTokenProvider } from "@/lib/api";
import { getSession, isAuthenticated } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type PatientProfile = {
  id: number;
  nombre: string;
  apellido: string;
  dpi: string;
  genero: "M" | "F" | "O";
  direccion: string;
  telefono: string;
  fecha_nacimiento: string;
  correo_electronico: string;
  fotografia: string | null;
};

type FormState = Omit<PatientProfile, "id" | "fotografia">;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GENERO_LABELS: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
};

const getApiOrigin = () => API_BASE_URL.replace(/\/api\/$/, "");

const resolvePhotoUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = getApiOrigin();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${clean}`;
};

const initials = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerfilPacientePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<FormState>({
    nombre: "",
    apellido: "",
    dpi: "",
    genero: "M",
    direccion: "",
    telefono: "",
    fecha_nacimiento: "",
    correo_electronico: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
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
    setTokenProvider(() => session.access ?? null);
    return () => setTokenProvider(null);
  }, [router]);

  // ── Fetch profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}patients/`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Error al cargar el perfil.");
        const data = await res.json();
        const list: PatientProfile[] = Array.isArray(data) ? data : (data.results ?? []);
        const p = list[0];
        if (!p) throw new Error("Perfil no encontrado.");
        setProfile(p);
        populateForm(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const populateForm = (p: PatientProfile) => {
    setForm({
      nombre: p.nombre,
      apellido: p.apellido,
      dpi: p.dpi,
      genero: p.genero,
      direccion: p.direccion,
      telefono: p.telefono,
      fecha_nacimiento: p.fecha_nacimiento,
      correo_electronico: p.correo_electronico,
    });
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleField = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    if (profile) populateForm(profile);
    setPhotoFile(null);
    setPhotoPreview(null);
    setError("");
    setSuccess("");
    setEditing(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !token) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
        formData.append(key, form[key]);
      });
      if (photoFile) formData.append("fotografia", photoFile);

      const res = await fetch(`${API_BASE_URL}patients/${profile.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data: Record<string, string[]> = await res.json().catch(() => ({}));
        const firstMsg =
          Object.values(data)[0]?.[0] ?? "No se pudo guardar el perfil.";
        throw new Error(firstMsg);
      }

      const updated: PatientProfile = await res.json();
      setProfile(updated);
      setPhotoFile(null);
      setPhotoPreview(null);
      setSuccess("Perfil actualizado correctamente.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const photoUrl = photoPreview ?? resolvePhotoUrl(profile?.fotografia ?? null);
  const displayName = profile ? `${profile.nombre} ${profile.apellido}` : "";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/paciente"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
            <p className="text-sm text-slate-500">Consulta y actualiza tu información personal</p>
          </div>
        </div>

        {!editing && !loading && (
          <button
            type="button"
            onClick={() => { setEditing(true); setSuccess(""); setError(""); }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar perfil
          </button>
        )}
      </div>

      {/* ── Feedback ───────────────────────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Loading skeleton ────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mx-auto h-28 w-28 rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-3/4 mx-auto rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 mx-auto rounded bg-slate-200" />
          </div>
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <div className="h-10 rounded-lg bg-slate-200" />
                <div className="h-10 rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      {!loading && profile && (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

            {/* ── Avatar card ────────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Avatar */}
              <div className="relative h-28 w-28">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-indigo-100 bg-indigo-50">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-indigo-600">
                      {initials(profile.nombre, profile.apellido)}
                    </span>
                  )}
                </div>

                {editing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow transition hover:bg-indigo-700"
                    title="Cambiar foto"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">{displayName}</p>
                <span className="mt-1 inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
                  Paciente
                </span>
              </div>

              {editing && (
                <p className="text-center text-xs text-slate-400">
                  Haz clic en el ícono de cámara para cambiar tu foto
                </p>
              )}

              {!editing && (
                <div className="w-full space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{profile.correo_electronico}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.5 10.5a11.042 11.042 0 005 5l1.115-1.724a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{profile.telefono}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Info card ──────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {editing ? "Editar información personal" : "Información personal"}
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Nombre */}
                <Field label="Nombre">
                  {editing ? (
                    <input name="nombre" value={form.nombre} onChange={handleField} required
                      className={inputCls} placeholder="Nombre" />
                  ) : (
                    <Value>{profile.nombre}</Value>
                  )}
                </Field>

                {/* Apellido */}
                <Field label="Apellido">
                  {editing ? (
                    <input name="apellido" value={form.apellido} onChange={handleField} required
                      className={inputCls} placeholder="Apellido" />
                  ) : (
                    <Value>{profile.apellido}</Value>
                  )}
                </Field>

                {/* DPI */}
                <Field label="DPI">
                  {editing ? (
                    <input name="dpi" value={form.dpi} onChange={handleField} required
                      maxLength={13} pattern="[0-9]{13}"
                      className={inputCls} placeholder="13 dígitos" />
                  ) : (
                    <Value>{profile.dpi}</Value>
                  )}
                </Field>

                {/* Fecha de nacimiento */}
                <Field label="Fecha de nacimiento">
                  {editing ? (
                    <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento}
                      onChange={handleField} required className={inputCls} />
                  ) : (
                    <Value>{formatDate(profile.fecha_nacimiento)}</Value>
                  )}
                </Field>

                {/* Género */}
                <Field label="Género">
                  {editing ? (
                    <select name="genero" value={form.genero} onChange={handleField} className={inputCls}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  ) : (
                    <Value>{GENERO_LABELS[profile.genero] ?? profile.genero}</Value>
                  )}
                </Field>

                {/* Teléfono */}
                <Field label="Teléfono">
                  {editing ? (
                    <input name="telefono" value={form.telefono} onChange={handleField} required
                      className={inputCls} placeholder="Ej: 55551234" />
                  ) : (
                    <Value>{profile.telefono}</Value>
                  )}
                </Field>

                {/* Correo electrónico — full width */}
                <Field label="Correo electrónico" wide>
                  {editing ? (
                    <input name="correo_electronico" type="email" value={form.correo_electronico}
                      onChange={handleField} required className={inputCls} placeholder="correo@ejemplo.com" />
                  ) : (
                    <Value>{profile.correo_electronico}</Value>
                  )}
                </Field>

                {/* Dirección — full width */}
                <Field label="Dirección" wide>
                  {editing ? (
                    <input name="direccion" value={form.direccion} onChange={handleField} required
                      className={inputCls} placeholder="Dirección completa" />
                  ) : (
                    <Value>{profile.direccion}</Value>
                  )}
                </Field>

              </div>

              {/* ── Actions ─────────────────────────────────────────────── */}
              {editing && (
                <div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Micro helpers ────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm " +
  "focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300";

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
      {children}
    </p>
  );
}
