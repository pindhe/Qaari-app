import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import QaariForm from "./pages/QaariForm";
import QaariDetail from "./pages/QaariDetail";

function Guard({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Guard>
            <Dashboard />
          </Guard>
        }
      />
      <Route
        path="/qaaris/new"
        element={
          <Guard>
            <QaariForm />
          </Guard>
        }
      />
      <Route
        path="/qaaris/:id"
        element={
          <Guard>
            <QaariDetail />
          </Guard>
        }
      />
      <Route
        path="/qaaris/:id/edit"
        element={
          <Guard>
            <QaariForm />
          </Guard>
        }
      />
    </Routes>
  );
}
