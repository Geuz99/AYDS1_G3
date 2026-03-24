"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, getSession, logout, getProfileRoute, getDashboardRoute } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ role: string; email: string | null } | null>(null);
  const brandHref = session ? getDashboardRoute(session.role) : "/";

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
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
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
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href={brandHref} className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          SaludPlus
        </Link>

        <div className="flex items-center gap-3 text-sm font-medium">
          {session ? (
            // Usuario con sesión activa
            <>
              <span className="hidden text-xs text-slate-500 sm:block">
                {session.email}
              </span>
              <Link
                href={getProfileRoute(session.role)}
                className="rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-white transition hover:bg-sky-700"
              >
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
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