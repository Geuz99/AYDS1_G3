"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isAuthenticated } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

export default function AdminPerfilPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [new2FA, setNew2FA] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const s = getSession();
    if (s?.role !== "ADMIN") { router.replace("/login"); return; }
    setEmail(s.email || "");
    setToken(s.access || "");
    // Intentar obtener username del backend
    fetch(`${API_URL}/auth/me/`, {
      headers: { Authorization: `Bearer ${s.access}` }
    }).then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.username) setUsername(d.username); })
      .catch(() => {});
  }, [router]);

  async function handleGuardar() {
    setMsg(""); setErr(""); setSaving(true);
    try {
      if (newPwd) {
        if (!currentPwd) throw new Error("Ingresa tu contraseña actual.");
        const res = await fetch(`${API_URL}/auth/change-password/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.current_password?.[0] || d?.new_password?.[0] || d?.detail || "Error al cambiar contraseña.");
      }
      if (new2FA) {
        const res = await fetch(`${API_URL}/admin/change-2fa/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ new_second_password: new2FA }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.detail || "Error al cambiar 2FA.");
      }
      if (!newPwd && !new2FA) throw new Error("Ingresa al menos una contraseña para guardar.");
      setMsg("Cambios guardados correctamente.");
      setCurrentPwd(""); setNewPwd(""); setNew2FA("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al guardar.");
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Información de tu cuenta de administrador</p>
      </div>

      {/* Información */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Datos de la cuenta</h2>
        {[
          { label: "Usuario", value: username || "admin" },
          { label: "Email", value: email },
          { label: "Rol", value: "Administrador" },
        ].map((item, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-500">{item.label}</span>
            <span className="text-sm font-medium text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Cambiar contraseña principal */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Cambiar contraseña principal</h2>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Contraseña actual</label>
          <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Nueva contraseña</label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
            placeholder="Mín. 8 chars, mayúscula y número"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition" />
        </div>
      </div>

      {/* Cambiar 2FA */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Cambiar segunda contraseña (2FA)</h2>
        <p className="text-xs text-slate-500">
          Esta contraseña va dentro del archivo{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">auth2-ayd1.txt</code>{" "}
          que se usa para el segundo factor de autenticación.
        </p>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Nueva contraseña 2FA</label>
          <input type="password" value={new2FA} onChange={e => setNew2FA(e.target.value)}
            placeholder="Nueva contraseña para auth2-ayd1.txt"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition" />
        </div>
      </div>

      {msg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      <button onClick={handleGuardar} disabled={saving}
        className="w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}