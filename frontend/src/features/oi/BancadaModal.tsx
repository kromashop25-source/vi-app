import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useEffect } from "react";
import type { BancadaRowForm } from "./schema";

export type BancadaForm = {
  estado: number;
  rows: number;
  rowsData: BancadaRowForm[];
};

type Props = {
  show: boolean;
  title: string;
  initial?: BancadaForm;
  onClose: () => void;
  onSubmit: (v: BancadaForm) => void;
};

// Helper para incrementar medidor (ej: PA01 -> PA02)
function incrementMedidor(base: string, index: number): string {
  if (!base) return "";
  const match = base.match(/^(.*?)(\d+)$/);
  if (!match) return base; // Si no hay número, devuelve igual
  const prefix = match[1];
  const numStr = match[2];
  const nextVal = parseInt(numStr, 10) + index;
  return `${prefix}${nextVal.toString().padStart(numStr.length, "0")}`;
}

// --- Lógica de Cálculos en Tiempo Real --

// Parsea tiempo "m:ss,ms" (ej: 1:02,5") a horas decimales
function parseTime(val?: number | string | null): number {
  if (!val) return 0;
  const s = String(val).trim();
  // Asumimos formato m.ss,ms o m:ss.ms según como lo digite el usuario.
  // Si es un número directo de excel (ej. 1.5 min), lo tratamos diferente.
  // Aquí asumiremos que el usuario digita "1.30" para 1 min 30 seg si es number input
  // Ojo: El input type="number" en HTML no deja poner ":". 
  // Si usas type="number", el usuario escribirá 1.30 (1 min 30 seg).
  // Adaptamos la lógica para input numérico: Parte entera = min, Parte decimal = seg.
  const num = Number(val);
  if (isNaN(num)) return 0;
  
  const minutes = Math.floor(num);
  const secondsDecimal = (num - minutes) * 100; // .30 -> 30
  // Fórmula del txt: (Q*60 + R) / 3600
  // (Min * 60 + Seg) / 3600 = Horas
  const totalSeconds = (minutes * 60) + secondsDecimal;
  return totalSeconds > 0 ? totalSeconds / 3600 : 0;
}

function calcFlow(vol?: number | null, timeVal?: number | null): number | null {
  if (!vol || !timeVal) return null;
  const hours = parseTime(timeVal);
  if (hours === 0) return null;
  return vol / hours; // Caudal = Vol / Tiempo(h)
}

function calcError(li?: number | null, lf?: number | null, vol?: number | null): number | null {
  if (li === undefined || lf === undefined || !vol) return null;
  // ((LF - LI - Vol) / Vol) * 100
  return ((Number(lf) - Number(li) - Number(vol)) / Number(vol)) * 100;
}

// Evalúa conformidad simple (basada solo en estado físico por ahora, o lógica BB/BC/BL si se requiere completa)
function calcConformity(estado: number, errQ3: number|null, errQ2: number|null, errQ1: number|null): string {
  if (estado >= 1) return "NO CONFORME"; // Muerte súbita por estado físico
  // Aquí podrías expandir con la lógica de errores máximos permitidos (EMP)
  // Por simplicidad visual:
  if (errQ3 === null || errQ2 === null || errQ1 === null) return "";
  // Lógica placeholder: si todos existen, asumimos cálculo pendiente o "VER EXCEL"
  return "CALCULADO"; 
}
// CORRECCIÓN: Componente auxiliar movido FUERA del componente principal para evitar warnings y remounts
const RenderResult = ({ val, isErr }: { val: number | null | undefined, isErr?: boolean }) => {
  if (val == null || isNaN(val)) return <td className="bg-light"></td>;
  const color = isErr ? (Math.abs(val) > 5 ? "text-danger fw-bold" : "text-dark") : "text-primary";
  return <td className="bg-light"><span className={`small ${color}`}>{val.toFixed(2)}</span></td>;
};



export default function BancadaModal({ show, title, initial, onClose, onSubmit }: Props) {
  const defaultValues: BancadaForm = {
    estado: initial?.estado ?? 0,
    rows: initial?.rows ?? 15,
    rowsData: initial?.rowsData ?? Array.from({ length: 15 }).map(() => ({ medidor: "", q3: {}, q2: {}, q1: {} })),
   };

  const { register, control, handleSubmit, reset, setValue, getValues } = useForm<BancadaForm>({ defaultValues });

  const { fields, append, remove } = useFieldArray({ control, name: "rowsData" });

  // Observar la fila 1 para replicar
  const firstRow = useWatch({ control, name: "rowsData.0" });
  const allRows = useWatch({ control, name: "rowsData" });

  // CORRECCIÓN: Vigilamos el estado para que el cálculo de AT sea reactivo
  const currentEstado = useWatch({ control, name: "estado" });

  // Lógica de replicación y autoincremento
  useEffect(() => {
    if (!firstRow || fields.length <= 1) return;
    
    const baseMed = firstRow.medidor || "";

    fields.forEach((_, i) => {
      if (i === 0) return; // Saltar fila base

      // 1. Autoincremento Medidor
      setValue(`rowsData.${i}.medidor`, incrementMedidor(baseMed, i));

      // 2. Replicar Q3 (J,K,L..O,P). Excluye M(c4), N(c5)
      setValue(`rowsData.${i}.q3.c1`, firstRow.q3?.c1);
      setValue(`rowsData.${i}.q3.c2`, firstRow.q3?.c2);
      setValue(`rowsData.${i}.q3.c3`, firstRow.q3?.c3);
      setValue(`rowsData.${i}.q3.c6`, firstRow.q3?.c6);
      setValue(`rowsData.${i}.q3.c7`, firstRow.q3?.c7);

      // 3. Replicar Q2 (V,W,X..AA,AB). Excluye Y(c4), Z(c5)
      setValue(`rowsData.${i}.q2.c1`, firstRow.q2?.c1);
      setValue(`rowsData.${i}.q2.c2`, firstRow.q2?.c2);
      setValue(`rowsData.${i}.q2.c3`, firstRow.q2?.c3);
      setValue(`rowsData.${i}.q2.c6`, firstRow.q2?.c6);
      setValue(`rowsData.${i}.q2.c7`, firstRow.q2?.c7);

      // 4. Replicar Q1 (AH..AK..AM,AN). Excluye AL(c5)
      setValue(`rowsData.${i}.q1.c1`, firstRow.q1?.c1);
      setValue(`rowsData.${i}.q1.c2`, firstRow.q1?.c2);
      setValue(`rowsData.${i}.q1.c3`, firstRow.q1?.c3);
      setValue(`rowsData.${i}.q1.c4`, firstRow.q1?.c4); // AK se replica
      setValue(`rowsData.${i}.q1.c6`, firstRow.q1?.c6);
      setValue(`rowsData.${i}.q1.c7`, firstRow.q1?.c7);
    });
  }, [firstRow, fields.length, setValue]);

  useEffect(() => {
    reset({
      estado: initial?.estado ?? 0,
      rows: initial?.rows ?? 15,
      rowsData: initial?.rowsData ?? Array.from({ length: 15 }).map(() => ({ medidor: "", q3: {}, q2: {}, q1: {} })),
     });
   }, [initial, reset]);
   
  const handleAddRow = () => {
    append({ medidor: "", q3: {}, q2: {}, q1: {} });
    setValue("rows", (getValues("rows")||0) + 1);
  };
  const handleRemoveRow = () => {
    if (fields.length > 1) {
      remove(fields.length - 1);
      setValue("rows", fields.length - 1);
    }
  };

  if (!show) return null;

  return (
  <>
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      onClick={(e) => {
        // cierra al hacer click fuera del diálogo
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-fluid" style={{maxWidth: "98vw", margin: "1vw"}}>
        <div className="modal-content">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body p-2">
              
              {/* Controles Superiores */}
              <div className="row g-2 mb-2 align-items-end">
                <div className="col-md-2">
                <label className="form-label small mb-1">Estado Bancada</label>
                <select
                  className="form-select form-select-sm"
                  {...register("estado", { valueAsNumber: true })}
                >
                  <option value={0}>0 = Conforme</option>
                  <option value={1}>1 = Daño Físico</option>
                  <option value={2}>2 = Fuga</option>
                  <option value={3}>3 = Picado</option>
                  <option value={4}>4 = Desfasado</option>
                  <option value={5}>5 = Paralizado</option>
                </select>
              </div>

              <div className="col-md-2">
                 <label className="form-label small mb-1">Filas</label>
                 <input className="form-control form-control-sm" readOnly value={allRows?.length || 0} />
              </div>
              <div className="col-md-4">
                 <div className="btn-group btn-group-sm">
                   <button type="button" className="btn btn-outline-primary" onClick={handleAddRow}>+ Fila</button>
                   <button type="button" className="btn btn-outline-danger" onClick={handleRemoveRow}>- Fila</button>
                 </div>
              </div>
              <div className="col-md-4 text-end text-muted small">
                 <small>Fila 1 es base (se replica a las demás).</small>
              </div>
             </div>

              {/* TABLA TIPO EXCEL */}
              <div className="table-responsive border rounded" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <table className="table table-bordered table-sm table-hover mb-0 align-middle text-center vi-spreadsheet">
                  <thead className="table-light sticky-top z-1">
                    <tr>
                      <th style={{width:"30px"}}>#</th>
                      <th style={{width:"120px"}}># Medidor (G)</th>
                      {/* Q3 Expanded: J..P + T, U */}
                      <th className="table-primary border-start border-dark" colSpan={9}>Q3 (Nominal)</th>
                      {/* Q2 Expanded: V..AB + AF, AG */}
                      <th className="table-success border-start border-dark" colSpan={9}>Q2 (Transición)</th>
                      {/* Q1 Expanded: AH..AN + AR, AS */}
                      <th className="table-info border-start border-dark" colSpan={9}>Q1 (Mínimo)</th>
                      <th className="bg-warning text-dark border-start border-dark" style={{width:"100px"}}>AT</th>
                    </tr>
                    <tr style={{fontSize:"0.75rem"}}>
                      <th></th><th></th>
                      {/* Q3 */}
                      <th title="J">Temp</th><th title="K">P.Ent</th><th title="L">P.Sal</th>
                      <th title="M" className="text-primary fw-bold">L.I.</th>
                      <th title="N" className="text-primary fw-bold">L.F.</th>
                      <th title="O">Vol</th><th title="P">Tpo</th>
                      <th title="T (Caudal)" className="bg-light border-start text-muted">Q</th>
                      <th title="U (Error %)" className="bg-light text-muted">E%</th>
                      {/* Q2 */}
                      <th title="V" className="border-start border-dark">Temp</th><th title="W">P.Ent</th><th title="X">P.Sal</th>
                      <th title="Y" className="text-success fw-bold">L.I.</th>
                      <th title="Z" className="text-success fw-bold">L.F.</th>
                      <th title="AA">Vol</th><th title="AB">Tpo</th>
                      <th title="AF (Caudal)" className="bg-light border-start text-muted">Q</th>
                      <th title="AG (Error %)" className="bg-light text-muted">E%</th>
                      {/* Q1 */}
                      <th title="AH" className="border-start border-dark">Temp</th><th title="AI">P.Ent</th><th title="AJ">P.Sal</th>
                      <th title="AK">L.I.</th>
                      <th title="AL" className="text-info fw-bold">L.F.</th>
                      <th title="AM">Vol</th><th title="AN">Tpo</th>
                      <th title="AR (Caudal)" className="bg-light border-start text-muted">Q</th>
                      <th title="AS (Error %)" className="bg-light text-muted">E%</th>
                      <th title="AT (Conformidad)" className="bg-warning">Est</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const isBase = index === 0;
                      // Obtenemos valores para cálculo en vivo (usando watch interno o getValues si no es costoso,
                      // pero para renderizado fluido en tabla grande, mejor usar los values controlados).
                      // Nota: useWatch es mejor, pero aquí accederemos directo a los inputs registrados.
                      // Para simplificar la demo visual, calcularemos con los valores actuales del form state si es posible,
                      // o dejaremos que el usuario "guarde" para ver.
                      // MEJORA: Calcular con variables locales extraídas del `allRows` si se usa useWatch global.
                      const rowData = allRows?.[index] || {};
                      
                      // Cálculos Q3
                      const q3_vol = rowData.q3?.c6; // O
                      const q3_time = rowData.q3?.c7; // P
                      const q3_li = rowData.q3?.c4; // M
                      const q3_lf = rowData.q3?.c5; // N
                      const q3_flow = calcFlow(q3_vol, q3_time);
                      const q3_err = calcError(q3_li, q3_lf, q3_vol);

                      // Cálculos Q2
                      const q2_vol = rowData.q2?.c6; // AA
                      const q2_time = rowData.q2?.c7; // AB
                      const q2_li = rowData.q2?.c4; // Y
                      const q2_lf = rowData.q2?.c5; // Z
                      const q2_flow = calcFlow(q2_vol, q2_time);
                      const q2_err = calcError(q2_li, q2_lf, q2_vol);

                      // Cálculos Q1
                      const q1_vol = rowData.q1?.c6; // AM
                      const q1_time = rowData.q1?.c7; // AN
                      const q1_li = rowData.q1?.c4; // AK
                      const q1_lf = rowData.q1?.c5; // AL
                      const q1_flow = calcFlow(q1_vol, q1_time);
                      const q1_err = calcError(q1_li, q1_lf, q1_vol);

                      // Usamos el estado reactivo (currentEstado) en vez de getValues
                      const conformidad = calcConformity(currentEstado, q3_err, q2_err, q1_err);

                      return (
                        <tr key={field.id} className={isBase ? "table-warning" : ""}>
                          <td className="text-muted small">{index + 1}</td>
                          <td>
                            <input className="form-control form-control-sm p-1 text-center" {...register(`rowsData.${index}.medidor`)} />
                          </td>
                          {/* Q3 */}
                          <td className="border-start border-dark"><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q3.c1`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q3.c2`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q3.c3`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-primary" {...register(`rowsData.${index}.q3.c4`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-primary" {...register(`rowsData.${index}.q3.c5`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q3.c6`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q3.c7`, {valueAsNumber:true})} /></td>
                          <RenderResult val={q3_flow} />
                          <RenderResult val={q3_err} isErr />

                          {/* Q2 */}
                          <td className="border-start border-dark"><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c1`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c2`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c3`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-success" {...register(`rowsData.${index}.q2.c4`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-success" {...register(`rowsData.${index}.q2.c5`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c6`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c7`, {valueAsNumber:true})} /></td>
                          <RenderResult val={q2_flow} />
                          <RenderResult val={q2_err} isErr />

                          {/* Q1 */}
                          <td className="border-start border-dark"><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c1`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c2`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c3`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c4`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-info" {...register(`rowsData.${index}.q1.c5`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c6`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c7`, {valueAsNumber:true})} /></td>
                          <RenderResult val={q1_flow} />
                          <RenderResult val={q1_err} isErr />
                          
                          <td className="bg-light border-start fw-bold small text-center">{conformidad}</td>
                         </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            <div className="modal-footer py-1">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary btn-sm">Guardar Bancada</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    {/* Backdrop de Bootstrap (sin inline styles) */}
    <div className="modal-backdrop show vi-backdrop"></div>
  </>
  );
}
