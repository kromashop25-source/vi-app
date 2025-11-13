import { useEffect, useRef, useState } from "react";

type Props = {
    show: boolean;
    title?: string;
    onClose: () => void;
    onConfirm: (password: string) => void;

};

export default function PasswordModal({ show, title = "Contraseña para proteger Excel", onClose, onConfirm}: Props) {
    const [pwd, setPwd] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const canSubmit = pwd.trim().length > 0;

    useEffect(() => {
        if (show) {
            setPwd("");
            // enfocar al abrir
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [show]);

    // Cerrar con ESC cuando el modal está visible
    useEffect(() => {
      if (!show) return;
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [show, onClose]);

    if (!show) return null;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        onConfirm(pwd.trim());
    };

    return (
    <div
      className="modal fade show"
      style={{ display: "block" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwdModalTitle"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog">
        <form className="modal-content" onSubmit={submit}>
          <div className="modal-header">
            <h5 id="pwdModalTitle" className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="pwd" className="form-label">Contraseña</label>
              <input
                id="pwd"
                type="password"
                className="form-control"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                ref={inputRef}
                minLength={1}
                required
              />
              <div className="form-text">
                Se usará para proteger <em>estructura</em> y <em>escritura</em> del libro. No habrá contraseña de apertura.
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>Generar Excel</button>
           </div>
         </form>
       </div>
     </div>
   );
 }