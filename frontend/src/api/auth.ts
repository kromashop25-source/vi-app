import { api } from "./client";

export type LoginInput = { username: string; password: string; bancoId: number };
export type LoginOut = { username: string; bancoId: number; token: string; techNumber: number };
export type AuthPayload = { user?: string; username?: string; bancoId: number; techNumber: number; token: string };

export async function login(payload: LoginInput): Promise<AuthPayload> {
  try {
    const { data } = await api.post<AuthPayload>("/auth/login", payload);
    localStorage.setItem("vi.auth", JSON.stringify(data));
    return data;
  } catch (e: any) {
    const status = e?.response?.status;
    const detail = e?.response?.data?.detail;
    const msg =
      status === 401 ? "Credenciales inválidas" :
      detail ?? e?.message ?? "Error de autenticación";
    throw new Error(msg);
  }
}

export function getAuth(): LoginOut | null {
  const raw = localStorage.getItem("vi.auth") ?? localStorage.getItem("vi_auth");
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as any;
    const auth: LoginOut = {
      username: obj.username ?? obj.user ?? "",
      bancoId: obj.bancoId,
      token: obj.token,
      techNumber: obj.techNumber,
    };
    return auth.username && auth.token ? auth : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("vi.auth");
  localStorage.removeItem("vi_auth");
  // Fuerza reevaluar rutas protegidas y recargar topbar
  window.location.replace("/");
}
