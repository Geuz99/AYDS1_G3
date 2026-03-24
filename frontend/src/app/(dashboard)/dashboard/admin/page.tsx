"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isAuthenticated } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  approval_status: string;
}

interface Patient {
  id: number;
  nombre: string;
  apellido: string;
  dpi: string;
  genero: string;
  fecha_nacimiento: string;
  correo_electronico: string;
  fotografia: string | null;
  user: UserInfo;
}

interface Doctor {
  id: number;
  nombre: string;
  apellido: string;
  dpi: string;
  genero: string;
  especialidad: string;
  numero_colegiado: string;
  correo_electronico: string;
  fotografia: string | null;
  user: UserInfo;
}

type Tab = "pendientes-pacientes" | "pendientes-medicos" | "pacientes" | "medicos";

export default function AdminDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<Tab>("pendientes-pacientes");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const session = getSession();
    if (session?.role !== "ADMIN") { router.replace("/login"); return; }
    setEmail(session.email || "");
    setToken(session.access || "");
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [tab, token]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (tab === "pendientes-pacientes" || tab === "pacientes") {
        const res = await fetch(`${API_URL}/patients/`, { headers });
        const data = await res.json();
        setPatients(Array.isArray(data) ? data : data.results || []);
      } else {
        const res = await fetch(`${API_URL}/doctors/`, { headers });
        const data = await res.json();
        setDoctors(Array.isArray(data) ? data : data.results || []);
      }
    } catch {
      setError("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(userId: number, status: "APPROVED" | "REJECTED" | "INACTIVE") {
    setMensaje("");
    setError("");
    try {
      const res = await fetch(`${API_URL}/users/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approval_status: status }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<string, string> = {
        APPROVED: "aprobado", REJECTED: "rechazado", INACTIVE: "dado de baja"
      };
      setMensaje(`Usuario ${labels[status]} correctamente.`);
      fetchData();
    } catch {
      setError("No se pudo actualizar el estado del usuario.");
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "pendientes-pacientes", label: "Pacientes Pendientes" },
    { key: "pendientes-medicos", label: "Médicos Pendientes" },
    { key: "pacientes", label: "Pacientes Aprobados" },
    { key: "medicos", label: "Médicos Aprobados" },
  ];

  function Avatar({ foto, nombre }: { foto: string | null; nombre: string }) {
    if (foto) {
      return <img src={foto.startsWith("http") ? foto : `http://localhost:8000${foto}`} alt={nombre} className="h-10 w-10 rounded-full object-cover border border-slate-200" />;
    }
    return <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold text-sm">{nombre.charAt(0).toUpperCase()}</div>;
  }

  // Filtros por approval_status
  const pendientesPacientes = patients.filter(p => p.user.approval_status === "PENDING");
  const aprobadosPacientes = patients.filter(p => p.user.approval_status === "APPROVED");
  const pendientesMedicos = doctors.filter(d => d.user.approval_status === "PENDING");
  const aprobadosMedicos = doctors.filter(d => d.user.approval_status === "APPROVED");

  function PatientCard({ p, tipo }: { p: Patient; tipo: "pendiente" | "aprobado" }) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar foto={p.fotografia} nombre={p.nombre} />
          <div>
            <p className="font-medium text-slate-900">{p.nombre} {p.apellido}</p>
            <p className="text-xs text-slate-500">DPI: {p.dpi} · {p.genero === "M" ? "Masculino" : p.genero === "F" ? "Femenino" : "Otro"} · Nac: {p.fecha_nacimiento}</p>
            <p className="text-xs text-slate-500">{p.correo_electronico}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tipo === "pendiente" ? (
            <>
              <button onClick={() => cambiarEstado(p.user.id, "APPROVED")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">Aceptar</button>
              <button onClick={() => cambiarEstado(p.user.id, "REJECTED")} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition">Rechazar</button>
            </>
          ) : (
            <button onClick={() => { if (confirm("¿Dar de baja a este paciente?")) cambiarEstado(p.user.id, "INACTIVE"); }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition">Dar de baja</button>
          )}
        </div>
      </div>
    );
  }

  function DoctorCard({ d, tipo }: { d: Doctor; tipo: "pendiente" | "aprobado" }) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar foto={d.fotografia} nombre={d.nombre} />
          <div>
            <p className="font-medium text-slate-900">{d.nombre} {d.apellido}</p>
            <p className="text-xs text-slate-500">DPI: {d.dpi} · Colegiado: {d.numero_colegiado}</p>
            <p className="text-xs text-slate-500">Especialidad: {d.especialidad} · {d.correo_electronico}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {tipo === "pendiente" ? (
            <>
              <button onClick={() => cambiarEstado(d.user.id, "APPROVED")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition">Aceptar</button>
              <button onClick={() => cambiarEstado(d.user.id, "REJECTED")} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition">Rechazar</button>
            </>
          ) : (
            <button onClick={() => { if (confirm("¿Dar de baja a este médico?")) cambiarEstado(d.user.id, "INACTIVE"); }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition">Dar de baja</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administrador</h1>
          <p className="text-sm text-slate-500">{email}</p>
        </div>
      </div>

      {mensaje && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{mensaje}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}
            {t.key === "pendientes-pacientes" && pendientesPacientes.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pendientesPacientes.length}</span>
            )}
            {t.key === "pendientes-medicos" && pendientesMedicos.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pendientesMedicos.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {tab === "pendientes-pacientes" && (
            pendientesPacientes.length === 0
              ? <p className="text-slate-500 text-sm">No hay pacientes pendientes de aprobación.</p>
              : pendientesPacientes.map(p => <PatientCard key={p.id} p={p} tipo="pendiente" />)
          )}
          {tab === "pacientes" && (
            aprobadosPacientes.length === 0
              ? <p className="text-slate-500 text-sm">No hay pacientes aprobados.</p>
              : aprobadosPacientes.map(p => <PatientCard key={p.id} p={p} tipo="aprobado" />)
          )}
          {tab === "pendientes-medicos" && (
            pendientesMedicos.length === 0
              ? <p className="text-slate-500 text-sm">No hay médicos pendientes de aprobación.</p>
              : pendientesMedicos.map(d => <DoctorCard key={d.id} d={d} tipo="pendiente" />)
          )}
          {tab === "medicos" && (
            aprobadosMedicos.length === 0
              ? <p className="text-slate-500 text-sm">No hay médicos aprobados.</p>
              : aprobadosMedicos.map(d => <DoctorCard key={d.id} d={d} tipo="aprobado" />)
          )}
        </div>
      )}
    </div>
  );
}