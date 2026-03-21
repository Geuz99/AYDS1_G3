"use client";
 
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
 
export default function LogoutButton() {
  const router = useRouter();
 
  function handleLogout() {
    logout(router);
  }
 
  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
    >
      Cerrar sesión
    </button>
  );
}