import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import OiPage from "../features/oi/OiPage";
import RequireAuth from "../features/auth/RequireAuth";
import AdminatorLayout from "../layouts/AdminatorLayout";
import OiListPage from "../features/oi/OiListPage";

export default function AppRouter() {
  return (
  <>
      {/* Login sin sidebar ni topbar */}
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Rutas protegidas: el Topbar y el Sidebar están dentro de AdminatorLayout */}
        <Route element={<RequireAuth />}>
          <Route element={<AdminatorLayout />}>
            <Route path="/oi" element={<OiPage />} />
            <Route path="/oi/list" element={<OiListPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
