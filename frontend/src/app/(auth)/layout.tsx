export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Acceso SaludPlus</h1>
        <p className="mt-1 text-sm text-slate-600">
          Base para Login y Registro.
        </p>
      </div>
      {children}
    </section>
  );
}
