import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alunos from './pages/Alunos';
import Planos from './pages/Planos';
import Financeiro from './pages/Financeiro';
import Professores from './pages/Professores';
import Aulas from './pages/Aulas';
import CheckIns from './pages/CheckIns';
import Equipamentos from './pages/Equipamentos';
import WhatsApp from './pages/WhatsApp';
import AvaliacoesFisicas from './pages/AvaliacoesFisicas';
import NovaAvaliacao from './pages/NovaAvaliacao';
import '@/App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="alunos" element={<Alunos />} />
            <Route path="planos" element={<Planos />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="professores" element={<Professores />} />
            <Route path="aulas" element={<Aulas />} />
            <Route path="checkins" element={<CheckIns />} />
            <Route path="equipamentos" element={<Equipamentos />} />
            <Route path="whatsapp" element={<WhatsApp />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
