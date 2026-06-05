import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import EmployeeRegister from "./pages/EmployeeRegister";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";
import Analytics from "./pages/Analytics";
import Account from "./pages/Account";
import SuperAdmin from "./pages/SuperAdmin";

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/employee" element={<EmployeeRegister />} />

          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/documents" element={
            <ProtectedRoute roles={['admin']}>
              <Documents />
            </ProtectedRoute>
          } />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route path="/chat" element={
            <ProtectedRoute roles={['admin', 'member']}>
              <Chat />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}
