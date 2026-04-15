import React from 'react';
import {
  BrowserRouter as Router,
  Routes, Route, Navigate
} from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import ProtectedRoute    from './components/ProtectedRoute';

import Login      from '.pages/Login'

export default function App() {
  return (
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/"         element={<Navigate to="/login" />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/employee" element={<EmployeeRegister />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
  );
}