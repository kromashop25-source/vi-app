import { api } from "./client";

export type OICreate = {
  code: string;
  q3: number;
  alcance: number;
  pma: number;
  banco_id: number;
  tech_number: number;
};
export type OIRead = OICreate & { id: number; presion_bar: number };
// Bloques Q3/Q2/Q1 (7 columnas por bloque, primera fila)
export type QBlock = {
  c1?: number | null;
  c2?: number | null;
  c3?: number | null;
  c4?: number | null;
  c5?: number | null;
  c6?: number | null;
  c7?: number | null;
};

// Nueva estructura para una fila individual de la bancada
export type BancadaRow = {
  medidor?: string | null;
  q3?: QBlock | null;
  q2?: QBlock | null;
  q1?: QBlock | null;
};

export type BancadaCreate = {
  estado: number;
  rows: number;
  // Ahora enviamos la data completa de las filas
  rows_data: BancadaRow[];
};
export type BancadaRead = {
  id: number;
  item: number;
  // Mantenemos comptibilidad visual en lista, pero la data real está en rows_data
  medidor?: string | null;
  estado: number;
  rows: number;
  rows_data?: BancadaRow[];
  q3?: QBlock | null;
  q2?: QBlock | null;
  q1?: QBlock | null;
};
export type OIWithBancadas = OIRead & { bancadas: BancadaRead[] };
export type CurrentOI = { id:number; code:string };

export async function createOI(payload: OICreate): Promise<OIRead> {
  try {
    const { data } = await api.post<OIRead>("/oi", payload);
    return data;
  } catch (e: any) {
    const msg = e?.response?.data?.detail ?? e?.message ?? "No se pudo crear el OI";
    throw new Error(msg);
  }
}

export async function listBancadas(oiId: number): Promise<BancadaRead[]> {
  // Si mantienes un endpoint de listado independiente
  const r = await api.get<BancadaRead[]>(`/oi/${oiId}/bancadas-list`, {validateStatus: s => s <500}).catch(() => null);
  return r?.data ?? [];
}

export async function addBancada(oiId: number, payload: BancadaCreate): Promise<BancadaRead> {
  try {
    const { data } = await api.post<BancadaRead>(`/oi/${oiId}/bancadas`, payload);
    return data;
  } catch (e: any) {
    const msg = e?.response?.data?.detail ?? e?.message ?? "No se puedo agregar la bancada";
    throw new Error(msg)
  }
}

export async function updateBancada(bancadaId: number, payload: BancadaCreate): Promise<BancadaRead> {
  try {
    const { data } = await api.put<BancadaRead>(`/oi/bancadas/${bancadaId}`, payload);
    return data;
  } catch (e: any) {
    const msg = e?.response?.data?.detail ?? e?.message ?? "No se pudo actualizar la bancada";
    throw new Error(msg);
  }
}

export async function deleteBancada(bancadaId: number): Promise<void> {
  try {
    await api.delete(`/oi/bancadas/${bancadaId}`);
  } catch (e:any) {
    const msg = e?.response?.data?.detail ?? e?.message ?? "No se pudo eliminar la bancada";
    throw new Error(msg)
  }
}

export async function generateExcel(oiId: number, password: string): Promise<void> {
  const res = await api.post(`/oi/${oiId}/excel`, { password }, { responseType: "blob" })
    .catch((e: any) => {
      const msg = e?.response?.data?.detail ?? e?.message ?? "No se pudo generar el Excel";
      throw new Error(msg);
    });
  const blob = res.data as Blob;
  // nombre desde Content-Disposition
  const cd = res.headers["content-disposition"] as string | undefined;
  const match = cd?.match(/filename="(.+?)"/i);
  const filename = match?.[1] ?? `OI-${oiId}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

// ---------- Nuevo: cargar OI completo (con bancadas) ----------
export async function getOiFull(oiId: number): Promise<OIWithBancadas> {
  try {
    const { data } = await api.get<OIWithBancadas>(`/oi/${oiId}/full`);
  return data;
  } catch (e: any) {
    const msg = e?.response?.data?.detail ?? e?.message ?? "No se puedo cargar el OI";
    throw new Error(msg);
  }
}

// ---------- Listado / detalle OI (para la lista) ----------
export async function listOI(): Promise<OIRead[]> {
  try{
    const { data } = await api.get<OIRead[]>("/oi");
    return data;
  } catch (e: any) {
    const msg = e?.response?.data?.detail ?? e?.message?? "No se pudo obtener el listado de OI";
    throw new Error(msg);
  }
}

export async function getOi(oiId:number): Promise<OIRead> {
  try{
    const {data } = await api.get<OIRead>(`/oi/${oiId}`);
    return data;
  } catch (e: any) {
    const msg = e?.response?.data?.detail ?? e?.message ?? "No se pudo obtener el OI";
    throw new Error(msg)
  }
}

// ---------- Helpers de sesión (persistir OI activo) ----------
const KEY = "vi.currentOI";
export function saveCurrentOI(v: CurrentOI ) {
  sessionStorage.setItem(KEY, JSON.stringify(v));
}
export function loadCurrentOI(): CurrentOI | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as CurrentOI; } catch { return null; }
}
export function clearCurrentOI() {
  sessionStorage.removeItem(KEY);
}


