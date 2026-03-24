"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isAuthenticated } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";

interface DoctorProfile {
  id: number;
  nombre: string;
  apellido: string;
  dpi: string;
  genero: string;
  especialidad: string;
  numero_colegiado: string;
  correo_electronico: string;
  fotografia: string | null;
  telefono?: string;
  direccion?: string;
  direccion_clinica?: string;
  fecha_nacimiento?: string;
  user: { id: number; username: string; email: string; role: string; approval_status: string; };
}

export default function DoctorPerfilPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const s = getSession();
    if (s?.role !== "DOCTOR") { router.replace("/login"); return; }
    setToken(s.access || "");

    fetch(`${API_BASE_URL}doctors/`, {
      headers: { Authorization: `Bearer ${s.access}` },
      cache: "no-store",
    })
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : d.results || [];
        if (list[0]) setDoctor(list[0] as DoctorProfile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleGuardar() {
    setMsg(""); setErr(""); setSaving(true);
    try {
      if (!newPwd) throw new Error("Ingresa la nueva contraseña.");
      if (!currentPwd) throw new Error("Ingresa tu contraseña actual.");
      const res = await fetch(`${API_BASE_URL}auth/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.current_password?.[0] || d?.new_password?.[0] || d?.detail || "Error al cambiar contraseña.");
      setMsg("Contraseña actualizada correctamente.");
      setCurrentPwd(""); setNewPwd("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al guardar.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Cargando perfil...</div>;

  const generoLabel = doctor?.genero === "M" ? "Masculino" : doctor?.genero === "F" ? "Femenino" : "Otro";

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Información de tu cuenta como médico</p>
      </div>

      {/* Foto y nombre */}
      {doctor && (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {doctor.fotografia ? (
            <img
              src={doctor.fotografia.startsWith("http") ? doctor.fotografia : `http://localhost:8000${doctor.fotografia}`}
              alt={doctor.nombre}
              className="h-16 w-16 rounded-full object-cover border-2 border-slate-100 shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold">
              {doctor.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-slate-900">Dr. {doctor.nombre} {doctor.apellido}</p>
            <p className="text-sm text-slate-500">{doctor.especialidad}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {doctor.user.approval_status === "APPROVED" ? "Activo" : doctor.user.approval_status}
            </span>
          </div>
        </div>
      )}

      {/* Datos del perfil */}
      {doctor && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Datos profesionales</h2>
          <div className="space-y-2">
            {[
              { label: "Usuario", value: doctor.user.username },
              { label: "Correo de usuario", value: doctor.user.email },
              { label: "Correo de clínica", value: doctor.correo_electronico },
              { label: "DPI", value: doctor.dpi },
              { label: "Número colegiado", value: doctor.numero_colegiado },
              { label: "Especialidad", value: doctor.especialidad },
              { label: "Género", value: generoLabel },
              { label: "Fecha de nacimiento", value: doctor.fecha_nacimiento || "—" },
              { label: "Teléfono", value: doctor.telefono || "—" },
              { label: "Dirección clínica", value: doctor.direccion_clinica || "—" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0 gap-4">
                <span className="text-sm text-slate-500 shrink-0">{item.label}</span>
                <span className="text-sm font-medium text-slate-900 text-right break-all">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cambiar contraseña */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Cambiar contraseña</h2>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Contraseña actual</label>
          <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Nueva contraseña</label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
            placeholder="Mín. 8 chars, mayúscula y número"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition" />
        </div>

        {msg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</div>}
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

        <button onClick={handleGuardar} disabled={saving}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}