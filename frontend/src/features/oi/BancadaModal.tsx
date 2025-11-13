import { useForm } from "react-hook-form";
import { useEffect } from "react";
import type { QBlock } from "../../api/oi";

export type BancadaForm = {
  medidor?: string;
  estado: number;
  rows: number;
  q3?: QBlock;
  q2?: QBlock;
  q1?: QBlock;
};

type Props = {
  show: boolean;
  title: string;
  initial?: BancadaForm;
  onClose: () => void;
  onSubmit: (v: BancadaForm) => void;
};

export default function BancadaModal({ show, title, initial, onClose, onSubmit }: Props) {
  const defaultValues: BancadaForm = {
    medidor: initial?.medidor ?? undefined,
    estado: initial?.estado ?? 0,
    rows: initial?.rows ?? 15,
    q3: initial?.q3 ?? {},
    q2: initial?.q2 ?? {},
    q1: initial?.q1 ?? {},
   };

  const { register, handleSubmit, reset } = useForm<BancadaForm>({ defaultValues });

  useEffect(() => {
    reset({
      medidor: initial?.medidor ?? "",
      estado: initial?.estado ?? 0,
      rows: initial?.rows ?? 15,
      q3: initial?.q3 ?? {},
      q2: initial?.q2 ?? {},
      q1: initial?.q1 ?? {},
     });
   }, [initial, reset]);

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
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label"># Medidor</label>
                <input className="form-control" {...register("medidor")} />
              </div>
              <div className="mb-3">
                <label className="form-label">Estado</label> 
                <select
                  className="form-select"
                  id="estado"
                  {...register("estado", { valueAsNumber: true })}
                >
                  <option value={0}>0 = Conforme</option>
                  <option value={1}>1 = Daño Físico</option>
                  <option value={2}>2 = Fuga</option>
                  <option value={3}>3 = Picado</option>
                  <option value={4}>4 = Desfasado</option>
                  <option value={5}>5 = Paralizado</option>
                </select>
                <div className="form-text">Default 0 (editable)</div>
              </div>
              <div className="mb-3">
                <label className="form-label">Filas (rows)</label>
                <input
                  type="number"
                  id="rows"
                  className="form-control"
                  min={1}
                  step={1}
                  {...register("rows", { valueAsNumber: true, required: true, min: 1 })}
                />
              </div>

              <hr className="my-3" />

              {/* Q3 – Primera fila (J..P) */}
              <div className="mb-3">
                <label className="form-label fw-bold">Q3 – Primera fila (J..P)</label>
                <div className="row g-2">
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">J – Temperatura</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q3.c1", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">K – P. Entrada</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q3.c2", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">L – P. Salida</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q3.c3", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">M – L.I.</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q3.c4", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">N – L.F.</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q3.c5", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">O – Vol. P</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q3.c6", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">P – Tiempo</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q3.c7", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              {/* Q2 – Primera fila (V..AB) */}
              <div className="mb-3">
                <label className="form-label fw-bold">Q2 – Primera fila (V..AB)</label>
                <div className="row g-2">
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">V</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q2.c1", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">W</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q2.c2", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">X</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q2.c3", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">Y</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q2.c4", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">Z</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q2.c5", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AA</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q2.c6", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AB</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q2.c7", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              {/* Q1 – Primera fila (AH..AN) */}
              <div className="mb-0">
                <label className="form-label fw-bold">Q1 – Primera fila (AH..AN)</label>
                <div className="row g-2">
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AH</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q1.c1", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AI</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q1.c2", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AJ</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q1.c3", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AK</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q1.c4", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AL</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q1.c5", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AM</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q1.c6", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label mb-1">AN</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      {...register("q1.c7", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary">Guardar</button>
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
