import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Dumbbell,
  Package,
  MessageSquare,
  DollarSign,
  LogOut,
  Menu,
  X,
  GraduationCap,
  CheckCircle,
  Activity,
  ClipboardList,
  BarChart3,
  Apple,
  UtensilsCrossed,
  PieChart
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Alunos', path: '/alunos' },
    { icon: Activity, label: 'Avaliações Físicas', path: '/avaliacoes' },
    { icon: Dumbbell, label: 'Exercícios', path: '/exercicios' },
    { icon: ClipboardList, label: 'Fichas de Treino', path: '/fichas' },
    { icon: Apple, label: 'Alimentos', path: '/alimentos' },
    { icon: UtensilsCrossed, label: 'Planos Alimentares', path: '/planos-alimentares' },
    { icon: PieChart, label: 'Relatórios', path: '/relatorios' },
    { icon: CreditCard, label: 'Planos', path: '/planos' },
    { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
    { icon: GraduationCap, label: 'Professores', path: '/professores' },
    { icon: Calendar, label: 'Aulas', path: '/aulas' },
    { icon: CheckCircle, label: 'Check-ins', path: '/checkins' },
    { icon: Package, label: 'Equipamentos', path: '/equipamentos' },
    { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && (
            <h1 className="text-xl font-bold">NextFit CRM</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-700 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">{user?.nome?.charAt(0)}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium text-sm">{user?.nome}</p>
                <p className="text-xs text-blue-200">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            title={!sidebarOpen ? 'Sair' : ''}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
