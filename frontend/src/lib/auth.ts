const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:8000/api";

export interface LoginResponse {
  access: string;
  refresh: string;
  role: "ADMIN" | "DOCTOR" | "PATIENT";
  user_id: number;
  email: string;
  requires_2fa?: boolean;
}

export interface Verify2FAResponse {
  detail: string;
  verified: boolean;
  role: string;
  user_id: number;
  email: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Extraer mensaje de error del backend
    const message =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      Object.values(data)?.[0] ||
      "Error al iniciar sesión.";
    throw new Error(String(message));
  }

  return data as LoginResponse;
}

export async function verify2FA(
  accessToken: string,
  file: File
): Promise<Verify2FAResponse> {
  const formData = new FormData();
  formData.append("archivo", file);

  const res = await fetch(`${API_URL}/auth/admin/verify-2fa/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data?.detail || "Error en la verificación.";
    throw new Error(String(message));
  }

  return data as Verify2FAResponse;
}

// Helpers para manejar sesión en localStorage
export function saveSession(loginData: LoginResponse) {
  localStorage.setItem("access", loginData.access);
  localStorage.setItem("refresh", loginData.refresh);
  localStorage.setItem("role", loginData.role);
  localStorage.setItem("user_id", String(loginData.user_id));
  localStorage.setItem("email", loginData.email);
}

export function clearSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("email");
}

export function getRole(): string | null {
  return localStorage.getItem("role");
}

export function getDashboardRoute(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "DOCTOR":
      return "/dashboard/doctor";
    case "PATIENT":
      return "/dashboard/paciente";
    default:
      return "/";
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const access = localStorage.getItem("access");
  const role = localStorage.getItem("role");
  return !!(access && role);
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const access = localStorage.getItem("access");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");
  const user_id = localStorage.getItem("user_id");
  if (!access || !role) return null;
  return { access, role, email, user_id };
}

export function logout(router: { push: (path: string) => void }) {
  clearSession();
  router.push("/login");
}