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
import Exercicios from './pages/Exercicios';
import FichasTreino from './pages/FichasTreino';
import NovaFichaTreino from './pages/NovaFichaTreino';
import DetalhesFicha from './pages/DetalhesFicha';
import RegistrarTreino from './pages/RegistrarTreino';
import HistoricoTreino from './pages/HistoricoTreino';
import ProgressaoCarga from './pages/ProgressaoCarga';
import Alimentos from './pages/Alimentos';
import PlanosAlimentares from './pages/PlanosAlimentares';
import NovoPlanoAlimentar from './pages/NovoPlanoAlimentar';
import DetalhesPlanoAlimentar from './pages/DetalhesPlanoAlimentar';
import RegistrarConsumo from './pages/RegistrarConsumo';
import RelatorioNutricional from './pages/RelatorioNutricional';
import Relatorios from './pages/Relatorios';
import RelatorioFinanceiro from './pages/RelatorioFinanceiro';
import RelatorioAlunos from './pages/RelatorioAlunos';
import RelatorioOperacional from './pages/RelatorioOperacional';
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
            <Route path="avaliacoes" element={<AvaliacoesFisicas />} />
            <Route path="avaliacoes/nova" element={<NovaAvaliacao />} />
            <Route path="exercicios" element={<Exercicios />} />
            <Route path="fichas" element={<FichasTreino />} />
            <Route path="fichas/nova" element={<NovaFichaTreino />} />
            <Route path="fichas/:id" element={<DetalhesFicha />} />
            <Route path="treinos/registrar" element={<RegistrarTreino />} />
            <Route path="treinos/historico/:alunoId" element={<HistoricoTreino />} />
            <Route path="treinos/progressao/:alunoId" element={<ProgressaoCarga />} />
            <Route path="alimentos" element={<Alimentos />} />
            <Route path="planos-alimentares" element={<PlanosAlimentares />} />
            <Route path="planos-alimentares/novo" element={<NovoPlanoAlimentar />} />
            <Route path="planos-alimentares/:id" element={<DetalhesPlanoAlimentar />} />
            <Route path="nutricao/registro" element={<RegistrarConsumo />} />
            <Route path="nutricao/relatorio/:alunoId" element={<RelatorioNutricional />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
