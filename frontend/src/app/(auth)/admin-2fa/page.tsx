"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { verify2FA, getDashboardRoute, clearSession } from "@/lib/auth";

export default function Admin2FAPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name !== "auth2-ayd1.txt") {
      setError("El archivo debe llamarse exactamente 'auth2-ayd1.txt'.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedFile) {
      setError("Debes seleccionar el archivo auth2-ayd1.txt.");
      return;
    }

    setLoading(true);

    try {
      const accessToken = localStorage.getItem("access") || "";
      await verify2FA(accessToken, selectedFile);
      // 2FA exitoso → ir al dashboard admin
      router.push(getDashboardRoute("ADMIN"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error en la verificación.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancelar() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Verificación de administrador</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sube el archivo <span className="font-mono font-semibold text-slate-700">auth2-ayd1.txt</span> para continuar
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Zona de archivo */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-sky-400 hover:bg-sky-50"
            >
              <svg className="mx-auto mb-2 h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {selectedFile ? (
                <p className="text-sm font-medium text-sky-600">{selectedFile.name} ✓</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-600">Haz clic para seleccionar el archivo</p>
                  <p className="mt-1 text-xs text-slate-400">Solo se acepta auth2-ayd1.txt</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Botones */}
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="w-full rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Verificar identidad"}
            </button>

            <button
              type="button"
              onClick={handleCancelar}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar y volver al login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}