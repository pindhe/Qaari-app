import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "./api";
import Shell from "./layout/Shell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reciters from "./pages/Reciters";
import QaariForm from "./pages/QaariForm";
import QaariDetail from "./pages/QaariDetail";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function Guard({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Guard>
            <Shell />
          </Guard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/qaaris" element={<Reciters />} />
        <Route path="/qaaris/new" element={<QaariForm />} />
        <Route path="/qaaris/:id" element={<QaariDetail />} />
        <Route path="/qaaris/:id/edit" element={<QaariForm />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
