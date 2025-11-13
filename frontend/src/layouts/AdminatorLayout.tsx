import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminatorLayout() {
    return (
    <>
      <Topbar />
      <div className="d-flex min-vh-100">
        <aside className="bg-light border-end vi-sidebar">
          <Sidebar />
        </aside>

      <main className="flex-grow-1">
          <div className="container py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}