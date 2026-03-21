import DoctorRegistrationForm from "@/components/DoctorRegistrationForm";
import Link from "next/link";

export const metadata = {
  title: "Registro de Médico | SaludPlus",
  description: "Crea tu cuenta como médico en SaludPlus.",
};

export default function RegisterDoctorPage() {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Registro de Médico
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Completa todos los campos para crear tu cuenta. Tu registro será
          revisado por un administrador antes de ser aprobado.
        </p>
      </div>

      <DoctorRegistrationForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-sky-600 hover:text-sky-700 transition">
          Iniciar sesión
        </Link>
      </p>
    </section>
  );
}
