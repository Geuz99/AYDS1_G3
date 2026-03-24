"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isAuthenticated } from "@/lib/auth";
import ReportesSection from "@/components/ReportesSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

interface UserInfo { id: number; username: string; email: string; role: string; approval_status: string; }
interface Patient { id: number; nombre: string; apellido: string; dpi: string; genero: string; fecha_nacimiento: string; correo_electronico: string; fotografia: string | null; telefono?: string; direccion?: string; user: UserInfo; }
interface Doctor { id: number; nombre: string; apellido: string; dpi: string; genero: string; especialidad: string; numero_colegiado: string; correo_electronico: string; fotografia: string | null; telefono?: string; direccion_clinica?: string; fecha_nacimiento?: string; user: UserInfo; }

type Section = "inicio" | "pendientes-pacientes" | "pendientes-medicos" | "pacientes" | "medicos" | "inactivos" | "reportes" | "perfil";

function Avatar({ foto, nombre }: { foto: string | null; nombre: string }) {
  if (foto) return <img src={foto.startsWith("http") ? foto : `http://localhost:8000${foto}`} alt={nombre} className="h-10 w-10 rounded-full object-cover border border-slate-200" />;
  return <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold text-sm">{nombre.charAt(0).toUpperCase()}</div>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [section, setSection] = useState<Section>("inicio");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({ pendP: 0, pendM: 0, totalP: 0, totalM: 0, inactivos: 0 });
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [new2FA, setNew2FA] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const s = getSession();
    if (s?.role !== "ADMIN") { router.replace("/login"); return; }
    setEmail(s.email || "");
    setToken(s.access || "");
    setUsername(s.email?.split("@")[0] || "admin");
  }, [router]);

  useEffect(() => {
    if (!token) return;
    if (section === "inicio") loadCounts();
    else if (section !== "perfil" && section !== "reportes") fetchData();
  }, [section, token]);

  async function loadCounts() {
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [rp, rd] = await Promise.all([
        fetch(`${API_URL}/patients/`, { headers: h }).then(r => r.json()),
        fetch(`${API_URL}/doctors/`, { headers: h }).then(r => r.json()),
      ]);
      const pp = (Array.isArray(rp) ? rp : rp.results || []) as Patient[];
      const dd = (Array.isArray(rd) ? rd : rd.results || []) as Doctor[];
      setCounts({
        pendP: pp.filter(p => p.user.approval_status === "PENDING").length,
        pendM: dd.filter(d => d.user.approval_status === "PENDING").length,
        totalP: pp.filter(p => p.user.approval_status === "APPROVED").length,
        totalM: dd.filter(d => d.user.approval_status === "APPROVED").length,
        inactivos: pp.filter(p => p.user.approval_status === "INACTIVE").length + dd.filter(d => d.user.approval_status === "INACTIVE").length,
      });
    } catch {}
  }

  async function fetchData() {
    setLoading(true); setError("");
    try {
      const h = { Authorization: `Bearer ${token}` };
      if (section === "inactivos") {
        const [rp, rd] = await Promise.all([
          fetch(`${API_URL}/patients/`, { headers: h }).then(r => r.json()),
          fetch(`${API_URL}/doctors/`, { headers: h }).then(r => r.json()),
        ]);
        setPatients(Array.isArray(rp) ? rp : rp.results || []);
        setDoctors(Array.isArray(rd) ? rd : rd.results || []);
      } else if (["pendientes-pacientes","pacientes"].includes(section)) {
        const d = await fetch(`${API_URL}/patients/`, { headers: h }).then(r => r.json());
        setPatients(Array.isArray(d) ? d : d.results || []);
      } else if (["pendientes-medicos","medicos"].includes(section)) {
        const d = await fetch(`${API_URL}/doctors/`, { headers: h }).then(r => r.json());
        setDoctors(Array.isArray(d) ? d : d.results || []);
      }
    } catch { setError("Error al cargar los datos."); }
    finally { setLoading(false); }
  }

  async function cambiarEstado(userId: number, newStatus: "APPROVED" | "REJECTED" | "INACTIVE") {
    setMensaje(""); setError("");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approval_status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<string,string> = { APPROVED: "aprobado", REJECTED: "rechazado", INACTIVE: "dado de baja" };
      setMensaje(`Usuario ${labels[newStatus]} correctamente.`);
      fetchData(); loadCounts();
    } catch { setError("No se pudo actualizar el estado del usuario."); }
  }

  async function cambiarPassword() {
    setPwdMsg(""); setPwdErr(""); setSaving(true);
    try {
      if (newPwd) {
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
      setPwdMsg("Cambios guardados correctamente.");
      setCurrentPwd(""); setNewPwd(""); setNew2FA("");
    } catch (e: unknown) {
      setPwdErr(e instanceof Error ? e.message : "Error al guardar.");
    } finally { setSaving(false); }
  }

  const pendP = patients.filter(p => p.user.approval_status === "PENDING");
  const aprobP = patients.filter(p => p.user.approval_status === "APPROVED");
  const pendM = doctors.filter(d => d.user.approval_status === "PENDING");
  const aprobM = doctors.filter(d => d.user.approval_status === "APPROVED");
  const inactivosP = patients.filter(p => p.user.approval_status === "INACTIVE");
  const inactivosM = doctors.filter(d => d.user.approval_status === "INACTIVE");

  function PatientCard({ p, tipo }: { p: Patient; tipo: "pendiente"|"aprobado"|"inactivo" }) {
    const [expanded, setExpanded] = useState(false);
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 flex-1 text-left min-w-0">
            <Avatar foto={p.fotografia} nombre={p.nombre} />
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{p.nombre} {p.apellido}</p>
              <p className="text-xs text-slate-500 truncate">{p.correo_electronico}</p>
            </div>
            <svg className={`w-4 h-4 text-slate-400 ml-2 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="flex gap-2 ml-3 shrink-0">
            {tipo === "pendiente" && <>
              <button onClick={() => cambiarEstado(p.user.id, "APPROVED")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">Aceptar</button>
              <button onClick={() => cambiarEstado(p.user.id, "REJECTED")} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition">Rechazar</button>
            </>}
            {tipo === "aprobado" && <button onClick={() => { if (confirm("¿Dar de baja a este paciente?")) cambiarEstado(p.user.id, "INACTIVE"); }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition">Dar de baja</button>}
            {tipo === "inactivo" && <button onClick={() => cambiarEstado(p.user.id, "APPROVED")} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition">Reactivar</button>}
          </div>
        </div>
        {expanded && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
            {p.fotografia && (
              <div className="flex justify-center mb-4">
                <img src={p.fotografia.startsWith("http") ? p.fotografia : `http://localhost:8000${p.fotografia}`}
                  alt={p.nombre} className="h-20 w-20 rounded-full object-cover border-2 border-white shadow" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Nombre completo", value: `${p.nombre} ${p.apellido}`, full: true },
                { label: "DPI", value: p.dpi },
                { label: "Género", value: p.genero === "M" ? "Masculino" : p.genero === "F" ? "Femenino" : "Otro" },
                { label: "Fecha de nacimiento", value: p.fecha_nacimiento },
                { label: "Teléfono", value: p.telefono || "—" },
                { label: "Correo", value: p.correo_electronico, full: true },
                { label: "Dirección", value: p.direccion || "—", full: true },
                { label: "Estado", value: p.user.approval_status },
              ].map((item, i) => (
                <div key={i} className={item.full ? "col-span-2" : ""}>
                  <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-slate-700 break-all">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function DoctorCard({ d, tipo }: { d: Doctor; tipo: "pendiente"|"aprobado"|"inactivo" }) {
    const [expanded, setExpanded] = useState(false);
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-3 flex-1 text-left min-w-0">
            <Avatar foto={d.fotografia} nombre={d.nombre} />
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{d.nombre} {d.apellido}</p>
              <p className="text-xs text-slate-500 truncate">{d.especialidad} · {d.correo_electronico}</p>
            </div>
            <svg className={`w-4 h-4 text-slate-400 ml-2 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="flex gap-2 ml-3 shrink-0">
            {tipo === "pendiente" && <>
              <button onClick={() => cambiarEstado(d.user.id, "APPROVED")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">Aceptar</button>
              <button onClick={() => cambiarEstado(d.user.id, "REJECTED")} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition">Rechazar</button>
            </>}
            {tipo === "aprobado" && <button onClick={() => { if (confirm("¿Dar de baja a este médico?")) cambiarEstado(d.user.id, "INACTIVE"); }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition">Dar de baja</button>}
            {tipo === "inactivo" && <button onClick={() => cambiarEstado(d.user.id, "APPROVED")} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition">Reactivar</button>}
          </div>
        </div>
        {expanded && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
            {d.fotografia && (
              <div className="flex justify-center mb-4">
                <img src={d.fotografia.startsWith("http") ? d.fotografia : `http://localhost:8000${d.fotografia}`}
                  alt={d.nombre} className="h-20 w-20 rounded-full object-cover border-2 border-white shadow" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Nombre completo", value: `${d.nombre} ${d.apellido}`, full: true },
                { label: "DPI", value: d.dpi },
                { label: "Género", value: d.genero === "M" ? "Masculino" : d.genero === "F" ? "Femenino" : "Otro" },
                { label: "Fecha de nacimiento", value: d.fecha_nacimiento || "—" },
                { label: "Número colegiado", value: d.numero_colegiado },
                { label: "Especialidad", value: d.especialidad },
                { label: "Teléfono", value: d.telefono || "—" },
                { label: "Correo", value: d.correo_electronico, full: true },
                { label: "Dirección clínica", value: d.direccion_clinica || "—", full: true },
                { label: "Estado", value: d.user.approval_status },
              ].map((item, i) => (
                <div key={i} className={item.full ? "col-span-2" : ""}>
                  <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-slate-700 break-all">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const menuCards = [
    { key: "pendientes-pacientes" as Section, label: "Pacientes Pendientes", count: counts.pendP, color: "from-orange-500 to-amber-400", badge: counts.pendP > 0, icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> },
    { key: "pendientes-medicos" as Section, label: "Médicos Pendientes", count: counts.pendM, color: "from-purple-600 to-violet-500", badge: counts.pendM > 0, icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" /></svg> },
    { key: "pacientes" as Section, label: "Pacientes Aprobados", count: counts.totalP, color: "from-sky-600 to-cyan-500", badge: false, icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
    { key: "medicos" as Section, label: "Médicos Aprobados", count: counts.totalM, color: "from-emerald-600 to-green-500", badge: false, icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> },
    { key: "inactivos" as Section, label: "Dados de Baja", count: counts.inactivos, color: "from-slate-500 to-slate-400", badge: false, icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg> },
    { key: "reportes" as Section, label: "Reportes", count: null, color: "from-slate-700 to-slate-600", badge: false, icon: <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-700 to-cyan-600 p-6 text-white">
        <p className="text-sm text-sky-200 mb-1">Panel de control</p>
        <h1 className="text-2xl font-bold">Administrador</h1>
        <p className="text-sky-200 text-sm mt-1">{email}</p>
      </div>

      {mensaje && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{mensaje}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {section === "inicio" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuCards.map(card => (
            <button key={card.key} onClick={() => setSection(card.key)}
              className="relative rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white border border-slate-100 overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-sm`}>{card.icon}</div>
              {card.badge && <span className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500 animate-pulse" />}
              <p className="text-2xl font-bold text-slate-900">{card.count !== null ? card.count : "→"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </button>
          ))}
        </div>
      )}

      {section !== "inicio" && (
        <div className="space-y-4">
          <button onClick={() => { setSection("inicio"); setMensaje(""); setError(""); }}
            className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver al inicio
          </button>
          <h2 className="text-lg font-semibold text-slate-900">{menuCards.find(c => c.key === section)?.label}</h2>

          {section === "perfil" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 max-w-lg">
              <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                {[
                  { label: "Usuario", value: username || "admin" },
                  { label: "Email", value: email },
                  { label: "Rol", value: "Administrador" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Cambiar contraseña principal</h3>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Contraseña actual</label>
                  <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Nueva contraseña</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mín. 8 chars, mayúscula, número" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Cambiar segunda contraseña (2FA)</h3>
                <p className="text-xs text-slate-500">Contraseña del archivo <code className="bg-slate-100 px-1 rounded">auth2-ayd1.txt</code></p>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Nueva contraseña 2FA</label>
                  <input type="password" value={new2FA} onChange={e => setNew2FA(e.target.value)} placeholder="Nueva contraseña para el archivo" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </div>
              </div>
              {pwdMsg && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{pwdMsg}</div>}
              {pwdErr && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pwdErr}</div>}
              <button onClick={cambiarPassword} disabled={saving || (!newPwd && !new2FA)} className="w-full rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}

          {section === "reportes" && <ReportesSection token={token} />}

          {loading && !["perfil","reportes"].includes(section) && <div className="text-center py-12 text-slate-400">Cargando...</div>}

          {!loading && (
            <div className="space-y-3">
              {section === "pendientes-pacientes" && (pendP.length === 0 ? <p className="text-slate-500 text-sm">No hay pacientes pendientes.</p> : pendP.map(p => <PatientCard key={p.id} p={p} tipo="pendiente" />))}
              {section === "pacientes" && (aprobP.length === 0 ? <p className="text-slate-500 text-sm">No hay pacientes aprobados.</p> : aprobP.map(p => <PatientCard key={p.id} p={p} tipo="aprobado" />))}
              {section === "pendientes-medicos" && (pendM.length === 0 ? <p className="text-slate-500 text-sm">No hay médicos pendientes.</p> : pendM.map(d => <DoctorCard key={d.id} d={d} tipo="pendiente" />))}
              {section === "medicos" && (aprobM.length === 0 ? <p className="text-slate-500 text-sm">No hay médicos aprobados.</p> : aprobM.map(d => <DoctorCard key={d.id} d={d} tipo="aprobado" />))}
              {section === "inactivos" && (
                <>
                  {inactivosP.length === 0 && inactivosM.length === 0 && <p className="text-slate-500 text-sm">No hay usuarios dados de baja.</p>}
                  {inactivosP.length > 0 && <><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pacientes dados de baja</p>{inactivosP.map(p => <PatientCard key={p.id} p={p} tipo="inactivo" />)}</>}
                  {inactivosM.length > 0 && <><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4">Médicos dados de baja</p>{inactivosM.map(d => <DoctorCard key={d.id} d={d} tipo="inactivo" />)}</>}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}