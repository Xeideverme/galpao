import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Activity, AlertTriangle, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Relatorios = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/relatorios/kpis`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setKpis(res.data))
      .catch(() => toast.error('Erro ao carregar KPIs'))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Relatório Financeiro', desc: 'Receitas, despesas, MRR, inadimplência', icon: DollarSign, path: '/relatorios/financeiro', color: 'bg-green-500' },
    { title: 'Relatório de Alunos', desc: 'Retenção, churn, LTV, novos alunos', icon: Users, path: '/relatorios/alunos', color: 'bg-blue-500' },
    { title: 'Relatório Operacional', desc: 'Check-ins, treinos, ocupação, aulas', icon: Activity, path: '/relatorios/operacional', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6" data-testid="relatorios-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios & BI</h1>
        <p className="text-gray-500">Análises e métricas do seu negócio</p>
      </div>

      {/* KPIs Resumo */}
      {!loading && kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Alunos Ativos</p>
            <p className="text-2xl font-bold text-blue-600">{kpis.alunos_ativos}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">MRR</p>
            <p className="text-2xl font-bold text-green-600">R$ {kpis.mrr?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Lucro Mês</p>
            <p className="text-2xl font-bold text-emerald-600">R$ {kpis.lucro_mes?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Ticket Médio</p>
            <p className="text-2xl font-bold text-purple-600">R$ {kpis.ticket_medio}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Treinos/Mês</p>
            <p className="text-2xl font-bold text-orange-600">{kpis.treinos_mes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500">Média Treinos/Aluno</p>
            <p className="text-2xl font-bold text-cyan-600">{kpis.media_treinos_aluno}</p>
          </div>
        </div>
      )}

      {/* Cards de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(card.path)}>
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
              <card.icon className="text-white" size={24} />
            </div>
            <h3 className="font-semibold text-lg text-gray-900">{card.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
            <Button variant="outline" className="mt-4 w-full">Ver Relatório</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Relatorios;
