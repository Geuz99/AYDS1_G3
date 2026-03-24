"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { API_BASE_URL } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Tipos auxiliares                                                   */
/* ------------------------------------------------------------------ */
interface FieldErrors {
  [field: string]: string[];
}

interface DjangoErrorResponse {
  message?: string;
  errors?: FieldErrors;
}

/* ------------------------------------------------------------------ */
/*  Estado inicial del formulario                                      */
/* ------------------------------------------------------------------ */
interface DoctorFormState {
  username: string;
  password: string;
  email: string;
  nombre: string;
  apellido: string;
  dpi: string;
  fecha_nacimiento: string;
  genero: string;
  direccion: string;
  telefono: string;
  numero_colegiado: string;
  especialidad: string;
  direccion_clinica: string;
  correo_electronico: string;
}

const INITIAL_STATE: DoctorFormState = {
  username: "",
  password: "",
  email: "",
  nombre: "",
  apellido: "",
  dpi: "",
  fecha_nacimiento: "",
  genero: "",
  direccion: "",
  telefono: "",
  numero_colegiado: "",
  especialidad: "",
  direccion_clinica: "",
  correo_electronico: "",
};

/* ------------------------------------------------------------------ */
/*  Componente                                                         */
/* ------------------------------------------------------------------ */
export default function DoctorRegistrationForm() {
  const [form, setForm] = useState<DoctorFormState>(INITIAL_STATE);
  const [fotografia, setFotografia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /* ---------- helpers ---------- */
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFotografia(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function resetMessages() {
    setSuccessMsg(null);
    setGlobalError(null);
    setFieldErrors({});
  }

  /* ---------- submit ---------- */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetMessages();

    if (!fotografia) {
      setGlobalError("La fotografía es obligatoria.");
      return;
    }

    setLoading(true);

    const formData = new FormData();

    // Append de todos los campos de texto
    (Object.keys(form) as (keyof DoctorFormState)[]).forEach((key) => {
      formData.append(key, form[key]);
    });

    // Append del archivo
    formData.append("fotografia", fotografia);

    try {
      const res = await fetch(
        `${API_BASE_URL}auth/register/doctor/`,
        {
          method: "POST",
          body: formData,
          // NO se establece Content-Type: el navegador lo agrega
          // automáticamente con el boundary de multipart/form-data.
        },
      );

      if (res.status === 201) {
        setSuccessMsg(
          "¡Registro exitoso! Tu cuenta de médico ha sido creada y está pendiente de aprobación.",
        );
        setForm(INITIAL_STATE);
        setFotografia(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);

        // Resetear el input file visualmente
        const fileInput = document.getElementById(
          "fotografia",
        ) as HTMLInputElement | null;
        if (fileInput) fileInput.value = "";
        return;
      }

      // Errores de validación (400) u otros errores
      const data: DjangoErrorResponse = await res.json().catch(() => ({}));

      if (data.errors) {
        setFieldErrors(data.errors);
      }

      setGlobalError(
        data.message ?? `Error inesperado (código ${res.status}).`,
      );
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? `Error de red: ${err.message}`
          : "Ocurrió un error inesperado.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------- UI helpers ---------- */
  const inputClass =
    "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";
  const errorListClass = "mt-1 text-xs text-red-600";

  function renderFieldError(field: string) {
    const errs = fieldErrors[field];
    if (!errs || errs.length === 0) return null;
    return (
      <ul className={errorListClass}>
        {errs.map((msg, i) => (
          <li key={i}>• {msg}</li>
        ))}
      </ul>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <form onSubmit={onSubmit} className="space-y-8" encType="multipart/form-data">
      {/* ====== Mensajes globales ====== */}
      {successMsg && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}
      {globalError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {globalError}
        </div>
      )}

      {/* ====== Sección: Credenciales ====== */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2 w-full">
          Credenciales de acceso
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Username */}
          <div>
            <label htmlFor="username" className={labelClass}>
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="dr.juanperez"
              className={inputClass}
            />
            {renderFieldError("username")}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelClass}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              className={inputClass}
            />
            {renderFieldError("password")}
          </div>
        </div>

        {/* Email de usuario */}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email de usuario
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="juan.perez@ejemplo.com"
            className={inputClass}
          />
          {renderFieldError("email")}
        </div>
      </fieldset>

      {/* ====== Sección: Datos personales ====== */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2 w-full">
          Datos personales
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className={labelClass}>
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={handleChange}
              placeholder="Juan"
              className={inputClass}
            />
            {renderFieldError("nombre")}
          </div>

          {/* Apellido */}
          <div>
            <label htmlFor="apellido" className={labelClass}>
              Apellido
            </label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              required
              value={form.apellido}
              onChange={handleChange}
              placeholder="Pérez"
              className={inputClass}
            />
            {renderFieldError("apellido")}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* DPI */}
          <div>
            <label htmlFor="dpi" className={labelClass}>
              DPI
            </label>
            <input
              id="dpi"
              name="dpi"
              type="text"
              required
              maxLength={13}
              value={form.dpi}
              onChange={handleChange}
              placeholder="1234567890123"
              className={inputClass}
            />
            {renderFieldError("dpi")}
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label htmlFor="fecha_nacimiento" className={labelClass}>
              Fecha de nacimiento
            </label>
            <input
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              required
              value={form.fecha_nacimiento}
              onChange={handleChange}
              className={inputClass}
            />
            {renderFieldError("fecha_nacimiento")}
          </div>

          {/* Género */}
          <div>
            <label htmlFor="genero" className={labelClass}>
              Género
            </label>
            <select
              id="genero"
              name="genero"
              required
              value={form.genero}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
            {renderFieldError("genero")}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Dirección */}
          <div>
            <label htmlFor="direccion" className={labelClass}>
              Dirección personal
            </label>
            <input
              id="direccion"
              name="direccion"
              type="text"
              required
              value={form.direccion}
              onChange={handleChange}
              placeholder="Zona 10, Ciudad de Guatemala"
              className={inputClass}
            />
            {renderFieldError("direccion")}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className={labelClass}>
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              required
              value={form.telefono}
              onChange={handleChange}
              placeholder="12345678"
              className={inputClass}
            />
            {renderFieldError("telefono")}
          </div>
        </div>
      </fieldset>

      {/* ====== Sección: Datos profesionales ====== */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2 w-full">
          Datos profesionales
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Número de colegiado */}
          <div>
            <label htmlFor="numero_colegiado" className={labelClass}>
              Número de colegiado
            </label>
            <input
              id="numero_colegiado"
              name="numero_colegiado"
              type="text"
              required
              value={form.numero_colegiado}
              onChange={handleChange}
              placeholder="COL-12345"
              className={inputClass}
            />
            {renderFieldError("numero_colegiado")}
          </div>

          {/* Especialidad */}
          <div>
            <label htmlFor="especialidad" className={labelClass}>
              Especialidad
            </label>
            <input
              id="especialidad"
              name="especialidad"
              type="text"
              required
              value={form.especialidad}
              onChange={handleChange}
              placeholder="Cardiología"
              className={inputClass}
            />
            {renderFieldError("especialidad")}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Dirección de clínica */}
          <div>
            <label htmlFor="direccion_clinica" className={labelClass}>
              Dirección de clínica
            </label>
            <input
              id="direccion_clinica"
              name="direccion_clinica"
              type="text"
              required
              value={form.direccion_clinica}
              onChange={handleChange}
              placeholder="Hospital General, Torre 3, Oficina 501"
              className={inputClass}
            />
            {renderFieldError("direccion_clinica")}
          </div>

          {/* Correo electrónico del perfil */}
          <div>
            <label htmlFor="correo_electronico" className={labelClass}>
              Correo electrónico profesional
            </label>
            <input
              id="correo_electronico"
              name="correo_electronico"
              type="email"
              required
              value={form.correo_electronico}
              onChange={handleChange}
              placeholder="consultorio@ejemplo.com"
              className={inputClass}
            />
            {renderFieldError("correo_electronico")}
          </div>
        </div>
      </fieldset>

      {/* ====== Sección: Fotografía ====== */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-2 w-full">
          Fotografía
        </legend>

        <div>
          <label htmlFor="fotografia" className={labelClass}>
            Foto de perfil (obligatoria)
          </label>
          <input
            id="fotografia"
            name="fotografia"
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-700 hover:file:bg-sky-100 transition cursor-pointer"
          />
          {renderFieldError("fotografia")}

          {/* Preview de la imagen */}
          {previewUrl && (
            <div className="mt-3">
              <img
                src={previewUrl}
                alt="Vista previa"
                className="h-32 w-32 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
            </div>
          )}
        </div>
      </fieldset>

      {/* ====== Botón submit ====== */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Registrando…" : "Crear cuenta de médico"}
      </button>
    </form>
  );
}
