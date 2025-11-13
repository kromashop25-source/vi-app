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
      <div className="modal-dialog modal-xl" style={{maxWidth: "95vw"}}>
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
                      <th className="table-primary border-start border-dark" colSpan={7}>Q3 (J..P)</th>
                      <th className="table-success border-start border-dark" colSpan={7}>Q2 (V..AB)</th>
                      <th className="table-info border-start border-dark" colSpan={7}>Q1 (AH..AN)</th>
                    </tr>
                    <tr style={{fontSize:"0.75rem"}}>
                      <th></th><th></th>
                      {/* Q3 */}
                      <th title="J">Temp</th><th title="K">P.Ent</th><th title="L">P.Sal</th>
                      <th title="M" className="text-primary fw-bold">L.I.</th>
                      <th title="N" className="text-primary fw-bold">L.F.</th>
                      <th title="O">Vol</th><th title="P">Tpo</th>
                      {/* Q2 */}
                      <th title="V" className="border-start border-dark">Temp</th><th title="W">P.Ent</th><th title="X">P.Sal</th>
                      <th title="Y" className="text-success fw-bold">L.I.</th>
                      <th title="Z" className="text-success fw-bold">L.F.</th>
                      <th title="AA">Vol</th><th title="AB">Tpo</th>
                      {/* Q1 */}
                      <th title="AH" className="border-start border-dark">Temp</th><th title="AI">P.Ent</th><th title="AJ">P.Sal</th>
                      <th title="AK">L.I.</th>
                      <th title="AL" className="text-info fw-bold">L.F.</th>
                      <th title="AM">Vol</th><th title="AN">Tpo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const isBase = index === 0;
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
                          
                          {/* Q2 */}
                          <td className="border-start border-dark"><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c1`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c2`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c3`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-success" {...register(`rowsData.${index}.q2.c4`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-success" {...register(`rowsData.${index}.q2.c5`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c6`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q2.c7`, {valueAsNumber:true})} /></td>

                          {/* Q1 */}
                          <td className="border-start border-dark"><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c1`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c2`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c3`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c4`, {valueAsNumber:true})} /></td>
                          <td className="bg-white"><input type="number" step="any" className="form-control form-control-sm p-0 text-center fw-bold text-info" {...register(`rowsData.${index}.q1.c5`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c6`, {valueAsNumber:true})} /></td>
                          <td><input type="number" step="any" className="form-control form-control-sm p-0 text-center" disabled={!isBase} {...register(`rowsData.${index}.q1.c7`, {valueAsNumber:true})} /></td>
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
