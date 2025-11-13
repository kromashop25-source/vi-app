import { useQuery } from "@tanstack/react-query";
import { listOI, generateExcel, saveCurrentOI } from "../../api/oi";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";
import Spinner from "../../components/Spinner";

export default function OiListPage() {
    const { toast } = useToast();
    const navigate = useNavigate();

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["oi", "list"],
        queryFn: listOI,
    });

    const busy = isLoading || isFetching;

    const handleOpen = (id: number, code: string) => {
        try {
            saveCurrentOI({ id, code});
            toast({ kind: "success", message: `OI ${code} cargada`});
            navigate("/oi");
        } catch (e: any) {
            toast({ kind: "error", title:"Error", message: e?.message ?? "No se pudo abrir el OI"});
        }
    };

    const handleExcel = async (id: number) => {
        try {
            await generateExcel(id);
            toast({ kind: "success", message:"Excel generado"});
        } catch (e: any) {
            toast({ kind: "error", title: "Error", message: e?.message ?? "No se pudo generar el Excel"});
        }
    };

    return (
        <div>
      <Spinner show={busy} />
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 mb-0">Listado de OI</h1>
        <button className="btn btn-outline-secondary" onClick={() => refetch()} disabled={busy}>
          Recargar
        </button>
      </div>

      {isError && (
        <div className="alert alert-danger">
          {(error as any)?.message ?? "Error cargando listado"}
        </div>
      )}

      <div className="card vi-card-table">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h2 className="h6 mb-0">Registros</h2>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>OI</th>
                  <th>Q3</th>
                  <th>Alcance</th>
                  <th>PMA</th>
                  <th>Banco</th>
                  <th>Técnico</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(!data || data.length === 0) && !busy && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-3">Sin registros.</td>
                  </tr>
                )}

                {data?.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.code}</td>
                    <td>{r.q3}</td>
                    <td>{r.alcance}</td>
                    <td>{r.pma}</td>
                    <td>{r.banco_id}</td>
                    <td>{r.tech_number}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpen(r.id, r.code)}
                        disabled={busy}
                        title="Abrir OI"
                        aria-label={`Abrir OI ${r.code}`}
                      >
                        Abrir
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleExcel(r.id)}
                        disabled={busy}
                        title="Descargar Excel"
                        aria-label={`Descargar Excel ${r.code}`}
                      >
                        Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
