import { useQuery } from "@tanstack/react-query";
import { getCatalogs, type Catalogs } from "../../api/catalogs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OISchema, type OIForm, type OIFormInput ,pressureFromPMA } from "./schema";
import { useMemo, useEffect, useState } from "react";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";
import { getAuth } from "../../api/auth";
import BancadaModal, { type BancadaForm } from "./BancadaModal";
import PasswordModal from "./PasswordModal";
import {
  createOI, generateExcel,
  addBancada, updateBancada, deleteBancada,
  getOiFull, saveCurrentOI, loadCurrentOI, clearCurrentOI,
  type BancadaRead
} from "../../api/oi";

export default function OiPage() {
  const { toast } = useToast();
  const { data } = useQuery<Catalogs>({ queryKey: ["catalogs"], queryFn: getCatalogs });
  const { register, handleSubmit, watch, formState:{errors}, reset } = useForm<OIFormInput, unknown, OIForm>({
    resolver: zodResolver(OISchema),
    defaultValues: { oi: `OI-0001-${new Date().getFullYear()}`, estado: 0, pma: 16, q3: 2.5, alcance: 80 }
  });
  const [busy, setBusy] = useState(false);

  // Id del OI creado y lista local de bancadas
  const [oiId, setOiId] = useState<number | null>(null);
  const [bancadas, setBancadas] = useState<BancadaRead[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BancadaRead | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  // Set defaults de selects al cargar catálogos
  useEffect(() => {
    if (data) {
      reset(v => ({ ...v, q3: data.q3[0], alcance: data.alcance[0], pma: 16 }));
    }
  }, [data, reset]);

  // Al montar: si hay un OI activo en sesión, cargarlo (incluye bancadas)
  useEffect(() => {
    const current = loadCurrentOI();
    if (!current) return;
    (async () => {
      try {
        const full = await getOiFull(current.id);
        setOiId(full.id);
        setBancadas(full.bancadas ?? []);
        reset({
          oi: full.code,
          q3: full.q3,
          alcance: full.alcance,
          pma: full.pma,
          estado: 0, // la cabecera Estado = 0 por defecto (editable per-bancada)
        });
      } catch {
        clearCurrentOI();
       }
    })();
  }, [reset]);

  const pma = watch("pma");
  const presion = useMemo(() => pressureFromPMA(Number(pma)), [pma]);

  const onSubmit = async (v: OIForm) => {
    try {
      setBusy(true);
      const auth = getAuth();
      if (!auth) throw new Error("Sesión no válida");
      const payload = {
        code: v.oi,
        q3: Number(v.q3),
        alcance: Number(v.alcance),
        pma: Number(v.pma),
        banco_id: auth.bancoId,
        tech_number: auth.techNumber,
      };
      const created = await createOI(payload);
      setOiId(created.id);
      saveCurrentOI({ id: created.id, code: created.code });
      toast({ kind: "success", title: "OI creada", message: `${created.code} (#${created.id})` });
    } catch (e: any) {
      toast({ kind:"error", title:"Error", message: e?.message ?? "Error creando OI" });
    }
     finally { setBusy(false); }
  };

  const openNew = () => { setEditing(null); setShowModal(true); };
  const openEdit = (row: BancadaRead) => { setEditing(row); setShowModal(true); };

  const handleSaveBancada = async (form: BancadaForm) => {
    if (!oiId) return;
    try {
      setBusy(true);

      const payload = {
        estado: Number(form.estado),
        rows: Number(form.rowsData.length),
        rowsData: form.rowsData,
      };

      if (editing) {
        const upd = await updateBancada(editing.id, payload);
        // Aseguramos tener rowsData localmente para que al reabrir el modal se vean los datos
        setBancadas(prev => prev.map(x => x.id === upd.id ? { ...upd, rowsData: form.rowsData } : x));
        toast({ kind:"success", message:"Bancada actualizada" });
      } else {
        const created = await addBancada(oiId, payload);
        setBancadas(prev => [...prev, { ...created, rowsData: form.rowsData }]);
        toast({ kind:"success", message:"Bancada agregada" });
      }
      setShowModal(false);
    } catch (e: any) {
      toast({ kind:"error", title:"Error", message: e?.message ?? "Error guardando bancada" });
     }
     finally { setBusy(false); }
  };

  const handleDelete = async (row: BancadaRead) => {
    if (!confirm(`Eliminar bancada #${row.item}?`)) return;
    try {
      setBusy(true);
      await deleteBancada(row.id);
      setBancadas(prev => prev.filter(x => x.id !== row.id));
      toast({ kind:"success", message:`Bancada #${row.item} eliminada` });
    } catch (e: any) {
      toast({ kind:"error", title:"Error", message: e?.message ?? "Error eliminando bancada" });
    }
    finally { setBusy(false); }
  };

  const handleExcelClick = () => {
    if (!oiId) {
      toast({ kind: "warning", message: "Primero guarda el OI." });
      return;
    }
    setShowPwd(true);
  };

  const handleExcelConfirmed = async (password: string) => {
    if (!oiId) return;
    try {
      setBusy(true);
      await generateExcel(oiId, password);
      toast({ kind: "success", message: "Excel generado" });
    } catch (e: any) {
      // 422 (listas E4/O4 no coinciden) vendrá como mensaje en e.message
      toast({ kind: "error", title: "Error", message: e?.message ?? "Error generando Excel" });
    } finally {
      setBusy(false);
    }
  };

  const handleCloseOI = () => {
    clearCurrentOI();
    setOiId(null);
    setBancadas([]);
    // opcional: resetear a defaults
    reset({ oi: `OI-0001-${new Date().getFullYear()}`, q3: data?.q3[0] ?? 2.5, alcance: data?.alcance[0] ?? 80, pma: 16, estado: 0 });
    toast({ kind:"info", message:"OI cerrada"});
  };

  // ---- Helpers visuales para Estado (0–5) ----
  const estadoLabel = (n: number) =>
    ["Conforme","Daño Físico","Fuga","Picado","Desfasado","Paralizado"][n] ?? "—";
  const estadoClass = (n: number) =>
    ({
      0: "bg-success",
      1: "bg-secondary",
      2: "bg-warning text-dark",
      3: "bg-info text-dark",
      4: "bg-primary",
      5: "bg-danger",
    } as Record<number, string>)[n] ?? "bg-light text-dark";

  return (
    <div>
       <Spinner show={busy} />
      <h1 className="h3">Formulario OI</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="row g-3 mt-1">
        <div className="col-md-4">
          <label htmlFor="oi" className="form-label">OI (OI-####-YYYY)</label>
          <input id="oi" className="form-control" {...register("oi")} disabled={!!oiId} />
          {errors.oi && <div className="text-danger small">{errors.oi.message}</div>}
        </div>

        <div className="col-md-4">
          <label htmlFor="q3" className="form-label">Q3 (m³/h)</label>
          <select id="q3" className="form-select" {...register("q3",{valueAsNumber:true})} disabled={!!oiId}>
            {data?.q3.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label htmlFor="alcance" className="form-label">Alcance Q3/Q1</label>
          <select id="alcance" className="form-select" {...register("alcance",{valueAsNumber:true})} disabled={!!oiId}>
            {data?.alcance.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label htmlFor="pma" className="form-label">PMA (bar)</label>
          <select id="pma" className="form-select" {...register("pma",{valueAsNumber:true})} disabled={!!oiId}>
            {data?.pma.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <div className="form-text">Solo en formulario; calcula Presión (bar).</div>
        </div>

        <div className="col-md-4">
          <label htmlFor="presion" className="form-label">Presión (bar)</label>
          <input id="presion" className="form-control" value={isNaN(presion) ? "" : presion} readOnly />
        </div>

        <div className="col-md-4">
          <label htmlFor="estado" className="form-label">Estado</label>
          <select id="estado" className="form-select" {...register("estado",{valueAsNumber:true})} defaultValue={0}>
            <option value={0}>0 = Conforme</option>
            <option value={1}>1 = Daño Físico</option>
            <option value={2}>2 = Fuga</option>
            <option value={3}>3 = Picado</option>
            <option value={4}>4 = Desfasado</option>
            <option value={5}>5 = Paralizado</option>
          </select>
        </div>

        <div className="col-12 d-flex align-items-center gap-2">
          <button className="btn btn-success" disabled={!!oiId}>
            {oiId ? "OI guardada" : "Guardar OI"}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleExcelClick} disabled={!oiId || busy}>
            Generar Excel
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={handleCloseOI} disabled={!oiId}>
            Cerrar OI
          </button>
        </div>
      </form>

      <hr className="my-4" />

      {/* ---- Tabla de Bancadas con estilo Adminator ---- */}
      <div className="card vi-card-table mt-3">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h2 className="h6 mb-0">Bancadas</h2>
          <button className="btn btn-primary" onClick={openNew} disabled={!oiId || busy}>Agregar Bancada</button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th className="vi-col-60">Item</th>
                  <th># Medidor</th>
                  <th className="vi-col-140">Estado</th>
                  <th>Filas</th>
                  <th className="vi-col-160 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bancadas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted text-center py-3">
                      Sin bancadas. Agrega la primera.
                    </td>
                  </tr>
                )}
                {bancadas.map(b => {
                  // ABRIMOS LLAVES AQUÍ PARA PODER USAR LOGICA JAVASCRIPT
                  const firstM = b.rowsData?.[0]?.medidor || b.medidor || "";
                  const lastM = b.rowsData?.[(b.rowsData?.length || 0) - 1]?.medidor || "";
                  const displayMed = (firstM && lastM && firstM !== lastM) ? `${firstM} ... ${lastM}` : firstM;

                  // AHORA HACEMOS EL RETURN DEL JSX
                  return (
                    <tr key={b.id}>
                      <td>{b.item}</td>
                      <td>{displayMed}</td>
                      <td>
                        <span
                          className={`badge vi-badge-estado ${estadoClass(b.estado)}`}
                          title={estadoLabel(b.estado)}
                        >
                          {b.estado}
                        </span>
                      </td>
                      <td>{b.rows}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openEdit(b)}
                          disabled={busy}
                          aria-label={`Editar bancada #${b.item}`}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(b)}
                          disabled={busy}
                          aria-label={`Eliminar bancada #${b.item}`}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BancadaModal
        show={showModal}
        title={editing ? `Editar bancada #${editing.item}` : "Nueva bancada"}
        initial={
          editing
            ? {
                estado: editing.estado,
                rows: editing.rows,
                // CORRECCIÓN ROBUSTA: Mapeamos SIEMPRE para eliminar nulls
                rowsData: editing.rowsData 
                  ? editing.rowsData.map(r => ({
                      // Si medidor es null, lo forzamos a "" para que el formulario no se queje
                      medidor: r.medidor ?? "",
                      // Si los bloques son null, pasamos objeto vacío {}
                      q3: r.q3 ?? {},
                      q2: r.q2 ?? {},
                      q1: r.q1 ?? {},
                    }))
                  : Array.from({ length: editing.rows }).map((_, i) => ({
                      // Fallback para bancadas antiguas sin rowsData
                      medidor: i === 0 ? (editing.medidor ?? "") : "", 
                      q3: (i === 0 && editing.q3) ? editing.q3 : {},
                      q2: (i === 0 && editing.q2) ? editing.q2 : {},
                      q1: (i === 0 && editing.q1) ? editing.q1 : {},
                    }))
              }
            : undefined
        }
        onClose={() => setShowModal(false)}
        onSubmit={handleSaveBancada}
      />

      <PasswordModal
        show={showPwd}
        title="Contraseña para proteger Excel"
        onClose={() => setShowPwd(false)}
        onConfirm={(pwd) => { setShowPwd(false); handleExcelConfirmed(pwd); }}
      />
    </div>
  );
}
