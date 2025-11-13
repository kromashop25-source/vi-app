import { NavLink, Link } from "react-router-dom";
import { getAuth, logout } from "../api/auth";

export default function Topbar() {
  const auth = getAuth();
  const displayUser = (auth as any)?.user ?? (auth as any)?.username ?? "";

  const handleLogout = () => {
    logout();
    // Recarga total para limpiar estado (auth, react-query, banner)
    location.assign("/");
  };

  return (
    <header className="navbar navbar-expand bg-white border-bottom sticky-top vi-topbar px-3">
      <Link to={auth ? "/oi" : "/"} className="navbar-brand fw-semibold">VI</Link>

      <ul className="navbar-nav me-auto">
          {!auth && (
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Login</NavLink>
            </li>
          )}
          <li className="nav-item"><NavLink className="nav-link" to="/oi">Formulario OI</NavLink></li>
          <li className="nav-item"><NavLink className="nav-link" to="/oi/list">Listado OI</NavLink></li>
        </ul>

      <div className="d-flex align-items-center gap-3">
        {auth && (
          <span className="text-muted small">
            Usuario: <strong>{displayUser || "—"}</strong> · Banco {auth.bancoId} · Técnico {auth.techNumber}
          </span>
        )}
        {auth && (
          <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>
            Salir
          </button>
        )}
      </div>
    </header>
  );
}
