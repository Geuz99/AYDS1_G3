"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isAuthenticated } from "@/lib/auth";

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
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Bienvenido al panel de paciente. Aquí irán los módulos de gestión.</p>
      </div>
    </div>
  );
}