import { NavLink } from "react-router-dom";
import { getAuth } from "../api/auth";

// Clases Adminator (degradan bien si no está el CSS aún)
const linkCls = ({ isActive }: { isActive: boolean }) =>
  "sidebar-link d-flex align-items-center" + (isActive ? " active" : "");

export default function Sidebar() {
    const isAuth = !!getAuth();
    return (
    <nav className="sidebar p-2">
      <div className="sidebar-header px-2 py-3">
        <span className="h6 m-0">VI</span>
      </div>
      <ul className="sidebar-menu list-unstyled">
        {/* Login solo cuando NO hay sesión */}
          {!isAuth && (
            <li>
              <NavLink to="/" className={linkCls}>
                <i className="ti ti-login me-2" />
                <span>Login</span>
              </NavLink>
            </li>
          )}
        <li>
          <NavLink to="/oi" className={linkCls}>
            {/* (Opcional) <i className="fa fa-file-alt me-2" /> */}
            <span className="me-2">📄</span> Formulario OI
          </NavLink>
        </li>
        {/* Listado OI (solo con sesión) */}
        {isAuth && (
          <li>
            <NavLink to="/oi/list" className={linkCls}>
              <i className="ti ti-list me-2" />
              <span>Listado OI</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}