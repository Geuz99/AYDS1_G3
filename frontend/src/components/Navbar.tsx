"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, getSession, logout, getDashboardRoute } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ role: string; email: string | null } | null>(null);

  // Ocultar navbar en páginas de autenticación
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/admin-2fa" ||
    pathname === "/register" ||
    pathname === "/registro/paciente";

  useEffect(() => {
    if (isAuthenticated()) {
      const s = getSession();
      if (s) setSession({ role: s.role, email: s.email });
    } else {
      setSession(null);
    }
  }, [pathname]); // Re-evalúa cuando cambia la ruta

  function handleLogout() {
    logout(router);
    setSession(null);
  }

  if (isAuthPage) return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-slate-900">
          SaludPlus
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700 transition"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          Regresar al Inicio
        </Link>
      </nav>
    </header>
  );

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight text-slate-900">
          SaludPlus
        </Link>

        <div className="flex items-center gap-3 text-sm font-medium">
          {session ? (
            // Usuario con sesión activa
            <>
              <Link
                href={getDashboardRoute(session.role)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Mi Panel
              </Link>
              <span className="text-slate-500 text-xs hidden sm:block">
                {session.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            // Sin sesión
            <>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro/paciente"
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}