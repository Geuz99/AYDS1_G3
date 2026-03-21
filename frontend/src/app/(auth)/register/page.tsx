"use client";

import Link from "next/link";
import { ChangeEvent, FocusEvent, FormEvent, useMemo, useState } from "react";

import { API_BASE_URL } from "@/lib/api";

type RegisterFields = {
  nombre: string;
  apellido: string;
  dpi: string;
  genero: "M" | "F" | "O" | "";
  direccion: string;
  telefono: string;
  fecha_nacimiento: string;
  correo_electronico: string;
  password: string;
};

const defaultFields: RegisterFields = {
  nombre: "",
  apellido: "",
  dpi: "",
  genero: "",
  direccion: "",
  telefono: "",
  fecha_nacimiento: "",
  correo_electronico: "",
  password: "",
};

const PASSWORD_HELP = "Minimo 8 caracteres, con 1 minuscula, 1 mayuscula y 1 numero.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^(?:\+502)?[0-9]{8}$/;
const DPI_REGEX = /^[0-9]{13}$/;

const REQUIRED_FIELDS: Array<keyof RegisterFields> = [
  "nombre",
  "apellido",
  "dpi",
  "genero",
  "direccion",
  "telefono",
  "fecha_nacimiento",
  "correo_electronico",
  "password",
];

type FieldErrors = Partial<Record<keyof RegisterFields, string>>;

function getErrorMessage(errorBody: unknown): string {
  if (!errorBody || typeof errorBody !== "object") {
    return "No se pudo completar el registro.";
  }

  const body = errorBody as {
    message?: string;
    errors?: Record<string, string[] | string>;
  };

  if (body.errors && typeof body.errors === "object") {
    const flattened = Object.values(body.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean);

    if (flattened.length > 0) {
      return String(flattened[0]);
    }
  }

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }

  return "No se pudo completar el registro.";
}

export default function RegisterPage() {
  const [fields, setFields] = useState<RegisterFields>(defaultFields);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterFields, boolean>>>({});

  const passwordChecks = useMemo(() => {
    const value = fields.password;
    return {
      minLength: value.length >= 8,
      lower: /[a-z]/.test(value),
      upper: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
    };
  }, [fields.password]);

  const passwordValid = passwordChecks.minLength && passwordChecks.lower && passwordChecks.upper && passwordChecks.number;

  const fieldErrors = useMemo<FieldErrors>(() => {
    const nextErrors: FieldErrors = {};

    if (!fields.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!fields.apellido.trim()) nextErrors.apellido = "El apellido es obligatorio.";

    if (!fields.dpi.trim()) {
      nextErrors.dpi = "El DPI es obligatorio.";
    } else if (!DPI_REGEX.test(fields.dpi.trim())) {
      nextErrors.dpi = "El DPI debe tener exactamente 13 digitos.";
    }

    if (!fields.genero) nextErrors.genero = "El genero es obligatorio.";
    if (!fields.direccion.trim()) nextErrors.direccion = "La direccion es obligatoria.";

    if (!fields.telefono.trim()) {
      nextErrors.telefono = "El telefono es obligatorio.";
    } else if (!PHONE_REGEX.test(fields.telefono.trim())) {
      nextErrors.telefono = "Formato invalido. Usa +502XXXXXXXX o 8 digitos.";
    }

    if (!fields.fecha_nacimiento) nextErrors.fecha_nacimiento = "La fecha de nacimiento es obligatoria.";

    if (!fields.correo_electronico.trim()) {
      nextErrors.correo_electronico = "El correo electronico es obligatorio.";
    } else if (!EMAIL_REGEX.test(fields.correo_electronico.trim())) {
      nextErrors.correo_electronico = "Debe incluir usuario, @ y dominio valido (ej: correo@dominio.com).";
    }

    if (!fields.password) {
      nextErrors.password = "La contrasena es obligatoria.";
    } else if (!passwordValid) {
      nextErrors.password = PASSWORD_HELP;
    }

    return nextErrors;
  }, [fields, passwordValid]);

  const isFormValid = Object.keys(fieldErrors).length === 0;

  const onFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const onFieldBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhoto(file);
  };

  const markAllTouched = () => {
    const allTouched = REQUIRED_FIELDS.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Partial<Record<keyof RegisterFields, boolean>>);

    setTouched(allTouched);
  };

  const getInputStateClasses = (field: keyof RegisterFields): string => {
    if (!touched[field]) return "border-slate-300 focus:border-sky-500 focus:ring-sky-100";
    return fieldErrors[field]
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markAllTouched();

    if (!isFormValid) {
      setError("Corrige los campos marcados antes de continuar.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.append("nombre", fields.nombre.trim());
      payload.append("apellido", fields.apellido.trim());
      payload.append("dpi", fields.dpi.trim());
      payload.append("genero", fields.genero);
      payload.append("direccion", fields.direccion.trim());
      payload.append("telefono", fields.telefono.trim());
      payload.append("fecha_nacimiento", fields.fecha_nacimiento);
      payload.append("correo_electronico", fields.correo_electronico.trim().toLowerCase());
      payload.append("password", fields.password);

      if (photo) {
        payload.append("fotografia", photo);
      }

      const response = await fetch(`${API_BASE_URL}auth/register/patient/`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        let details: unknown = null;
        try {
          details = await response.json();
        } catch {
          details = null;
        }
        throw new Error(getErrorMessage(details));
      }

      setFields(defaultFields);
      setPhoto(null);
      setTouched({});
      setSuccess("Registro completado. Tu solicitud fue enviada para aprobacion.");
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Error al registrar paciente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Registro de Paciente</h2>
        <p className="mt-1 text-sm text-slate-600">Completa tus datos para solicitar acceso a citas medicas.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Nombre <span className="text-red-600">*</span></span>
            <input
              name="nombre"
              required
              value={fields.nombre}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("nombre")}`}
            />
            {touched.nombre && fieldErrors.nombre && <p className="text-xs text-red-600">{fieldErrors.nombre}</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Apellido <span className="text-red-600">*</span></span>
            <input
              name="apellido"
              required
              value={fields.apellido}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("apellido")}`}
            />
            {touched.apellido && fieldErrors.apellido && <p className="text-xs text-red-600">{fieldErrors.apellido}</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">DPI <span className="text-red-600">*</span></span>
            <input
              name="dpi"
              required
              value={fields.dpi}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              inputMode="numeric"
              pattern="[0-9]{13}"
              maxLength={13}
              placeholder="13 digitos"
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("dpi")}`}
            />
            {touched.dpi && fieldErrors.dpi && <p className="text-xs text-red-600">{fieldErrors.dpi}</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Genero <span className="text-red-600">*</span></span>
            <select
              name="genero"
              required
              value={fields.genero}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              className={`w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("genero")}`}
            >
              <option value="" disabled>
                Selecciona una opcion
              </option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
            {touched.genero && fieldErrors.genero && <p className="text-xs text-red-600">{fieldErrors.genero}</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
            <span className="font-medium">Direccion <span className="text-red-600">*</span></span>
            <textarea
              name="direccion"
              required
              value={fields.direccion}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              rows={2}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("direccion")}`}
            />
            {touched.direccion && fieldErrors.direccion && <p className="text-xs text-red-600">{fieldErrors.direccion}</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Telefono <span className="text-red-600">*</span></span>
            <input
              name="telefono"
              required
              value={fields.telefono}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              inputMode="tel"
              placeholder="+50212345678 o 12345678"
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("telefono")}`}
            />
            {touched.telefono && fieldErrors.telefono && <p className="text-xs text-red-600">{fieldErrors.telefono}</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span className="font-medium">Fecha de nacimiento <span className="text-red-600">*</span></span>
            <input
              name="fecha_nacimiento"
              type="date"
              required
              value={fields.fecha_nacimiento}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("fecha_nacimiento")}`}
            />
            {touched.fecha_nacimiento && fieldErrors.fecha_nacimiento && (
              <p className="text-xs text-red-600">{fieldErrors.fecha_nacimiento}</p>
            )}
          </label>

          <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
            <span className="font-medium">Correo electronico <span className="text-red-600">*</span></span>
            <input
              name="correo_electronico"
              type="email"
              required
              value={fields.correo_electronico}
              onChange={onFieldChange}
              onBlur={onFieldBlur}
              placeholder="correo@dominio.com"
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${getInputStateClasses("correo_electronico")}`}
            />
            <p className="text-xs text-slate-500">Debe incluir usuario, @ y dominio (ej: correo@dominio.com).</p>
            {touched.correo_electronico && fieldErrors.correo_electronico && (
              <p className="text-xs text-red-600">{fieldErrors.correo_electronico}</p>
            )}
          </label>

          <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
            <span className="font-medium">Contrasena <span className="text-red-600">*</span></span>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={fields.password}
                onChange={onFieldChange}
                onBlur={onFieldBlur}
                placeholder="********"
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none focus:ring-2 ${getInputStateClasses("password")}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 my-1 rounded-md px-2 text-xs font-medium text-sky-700 hover:bg-sky-50"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <p className={passwordChecks.minLength ? "text-emerald-700" : "text-slate-500"}>- Minimo 8 caracteres</p>
              <p className={passwordChecks.lower ? "text-emerald-700" : "text-slate-500"}>- Al menos 1 minuscula</p>
              <p className={passwordChecks.upper ? "text-emerald-700" : "text-slate-500"}>- Al menos 1 mayuscula</p>
              <p className={passwordChecks.number ? "text-emerald-700" : "text-slate-500"}>- Al menos 1 numero</p>
            </div>
            {touched.password && fieldErrors.password && <p className="text-xs text-red-600">{fieldErrors.password}</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
            <span className="font-medium">Fotografia (opcional)</span>
            <input
              name="fotografia"
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrar Paciente"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-sky-600 hover:underline">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
