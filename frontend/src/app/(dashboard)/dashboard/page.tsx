"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { getSession, isAuthenticated } from "@/lib/auth";

type DoctorProfile = {
  id: number;
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
  fotografia: string | null;
};

type DoctorsApiResponse = DoctorProfile[] | { results?: DoctorProfile[] };
type ToastState = { type: "success" | "error"; message: string } | null;

const fieldLabelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";
const fieldValueClass = "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700";

const getApiOrigin = () => API_BASE_URL.replace(/\/api\/$/, "");

const resolvePhotoUrl = (photoPath: string | null): string | null => {
  if (!photoPath) {
    return null;
  }

  if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
    return photoPath;
  }

  const apiOrigin = getApiOrigin();
  const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  return `${apiOrigin}${cleanPath}`;
};

export default function DashboardHomePage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoToast, setPhotoToast] = useState<ToastState>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showAccountSection, setShowAccountSection] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordToast, setPasswordToast] = useState<ToastState>(null);

  const photoUrl = useMemo(() => resolvePhotoUrl(doctor?.fotografia || null), [doctor]);

  const fetchDoctorProfile = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}doctors/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("No se pudo cargar el perfil del médico.");
    }

    const payload = (await response.json()) as DoctorsApiResponse;
    const doctors = Array.isArray(payload) ? payload : payload.results || [];

    if (!doctors.length) {
      throw new Error("No se encontró perfil médico para este usuario.");
    }

    setDoctor(doctors[0]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      const session = getSession();
      if (!session || session.role !== "DOCTOR") {
        router.replace("/login");
        return;
      }

      setAccessToken(session.access);
      setEmail(session.email || "");

      try {
        await fetchDoctorProfile(session.access);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Error inesperado al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  useEffect(() => {
    if (!photoToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPhotoToast(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [photoToast]);

  useEffect(() => {
    if (!passwordToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPasswordToast(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [passwordToast]);

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!accessToken || !doctor?.id) {
      const message = "No hay sesión activa para actualizar la foto.";
      setPhotoError(message);
      setPhotoToast({ type: "error", message });
      return;
    }

    setPhotoSaving(true);
    setPhotoError("");
    setPhotoMessage("");

    try {
      const formData = new FormData();
      formData.append("fotografia", selectedFile);

      const response = await fetch(`${API_BASE_URL}doctors/${doctor.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar la foto de perfil.");
      }

      await fetchDoctorProfile(accessToken);
      const message = "Foto de perfil actualizada correctamente.";
      setPhotoMessage(message);
      setPhotoToast({ type: "success", message });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al actualizar la foto.";
      setPhotoError(message);
      setPhotoToast({ type: "error", message });
    } finally {
      setPhotoSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      const message = "No hay sesión activa para cambiar la contraseña.";
      setPasswordError(message);
      setPasswordToast({ type: "error", message });
      return;
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      const message = "Debes completar la contraseña actual, la nueva contraseña y su confirmación.";
      setPasswordError(message);
      setPasswordToast({ type: "error", message });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      const message = "La confirmación no coincide con la nueva contraseña.";
      setPasswordError(message);
      setPasswordToast({ type: "error", message });
      return;
    }

    setPasswordSaving(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}auth/change-password/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiError =
          data?.current_password?.[0] ||
          data?.new_password?.[0] ||
          data?.non_field_errors?.[0] ||
          data?.detail ||
          "No se pudo cambiar la contraseña.";
        throw new Error(String(apiError));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      const message = "Contraseña actualizada correctamente en la base de datos.";
      setPasswordMessage(message);
      setPasswordToast({ type: "success", message });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al cambiar la contraseña.";
      setPasswordError(message);
      setPasswordToast({ type: "error", message });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Cargando perfil del médico...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-700">No se pudo cargar Mi Perfil</h2>
        <p className="mt-2 text-sm text-rose-600">{errorMessage}</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">No hay datos de perfil para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {photoToast ? (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed right-6 top-20 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg",
            photoToast.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800",
          ].join(" ")}
        >
          {photoToast.message}
        </div>
      ) : null}

      {passwordToast ? (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed right-6 top-36 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg",
            passwordToast.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800",
          ].join(" ")}
        >
          {passwordToast.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Mi Perfil</h2>
            <p className="mt-1 text-sm text-slate-600">
              Información del médico de la sesión actual. Los datos personales son solo lectura por ahora.
            </p>
          </div>
          <Link
            href="/dashboard/doctor"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Volver al panel
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-48 w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Foto de perfil del médico" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Sin fotografía</div>
              )}
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoSaving}
                className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {photoSaving ? "Cambiando..." : "Cambiar foto"}
              </button>
              {photoMessage ? <p className="text-xs text-emerald-600">{photoMessage}</p> : null}
              {photoError ? <p className="text-xs text-rose-600">{photoError}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabelClass}>Nombre</label>
              <p className={fieldValueClass}>{doctor.nombre}</p>
            </div>
            <div>
              <label className={fieldLabelClass}>Apellido</label>
              <p className={fieldValueClass}>{doctor.apellido}</p>
            </div>
            <div>
              <label className={fieldLabelClass}>DPI</label>
              <p className={fieldValueClass}>{doctor.dpi}</p>
            </div>
            <div>
              <label className={fieldLabelClass}>Fecha de nacimiento</label>
              <p className={fieldValueClass}>{doctor.fecha_nacimiento}</p>
            </div>
            <div>
              <label className={fieldLabelClass}>Genero</label>
              <p className={fieldValueClass}>{doctor.genero}</p>
            </div>
            <div>
              <label className={fieldLabelClass}>Telefono</label>
              <p className={fieldValueClass}>{doctor.telefono}</p>
            </div>
            <div>
              <label className={fieldLabelClass}>Número colegiado</label>
              <p className={fieldValueClass}>{doctor.numero_colegiado}</p>
            </div>
            <div>
              <label className={fieldLabelClass}>Especialidad</label>
              <p className={fieldValueClass}>{doctor.especialidad}</p>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabelClass}>Dirección personal</label>
              <p className={fieldValueClass}>{doctor.direccion}</p>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabelClass}>Dirección clínica</label>
              <p className={fieldValueClass}>{doctor.direccion_clinica}</p>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabelClass}>Correo del perfil médico</label>
              <p className={fieldValueClass}>{doctor.correo_electronico}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Mi Cuenta</h3>
            <p className="mt-1 text-sm text-slate-600">Credenciales de acceso de la sesión actual.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAccountSection((prev) => !prev)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {showAccountSection ? "Ocultar" : "Ver Mi Cuenta"}
          </button>
        </div>

        {showAccountSection ? (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className={fieldLabelClass}>Correo de ingreso</label>
                  <p className={fieldValueClass}>{email || "No disponible"}</p>
              </div>
              <div>
                <label className={fieldLabelClass}>Contraseña actual almacenada</label>
                <p className={fieldValueClass}>********</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 max-w-2xl space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-24 text-sm text-slate-700 outline-none transition focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {showCurrentPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-24 text-sm text-slate-700 outline-none transition focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {showNewPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-24 text-sm text-slate-700 outline-none transition focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    {showConfirmNewPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {passwordSaving ? "Actualizando..." : "Cambiar contraseña"}
                </button>
              </div>
            </form>

            {passwordMessage ? <p className="mt-3 text-sm text-emerald-600">{passwordMessage}</p> : null}
            {passwordError ? <p className="mt-3 text-sm text-rose-600">{passwordError}</p> : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
