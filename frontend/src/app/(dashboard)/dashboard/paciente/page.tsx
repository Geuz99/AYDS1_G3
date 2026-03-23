"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isAuthenticated } from "@/lib/auth";
import Link from "next/link";

export default function PacienteDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");

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
    setEmail(session.email || "");
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">        
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Paciente</h1>
          <p className="text-sm text-slate-500">{email}</p>
        </div>
        <Link href="/dashboard/paciente/reservar"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Programar nueva cita
        </Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Bienvenido al panel de paciente. Aquí irán los módulos de gestión.</p>
      </div>
    </div>
  );
}