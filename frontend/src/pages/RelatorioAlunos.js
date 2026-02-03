import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Users, UserPlus, UserMinus, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const RelatorioAlunos = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/relatorios/alunos/retencao`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => toast.error('Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6" data-testid="relatorio-alunos-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/relatorios')}><ArrowLeft size={20} /></Button>
        <h1 className="text-2xl font-bold">Relatório de Alunos</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Users size={16} /><span className="text-sm">Total</span></div>
          <p className="text-2xl font-bold">{data?.total_alunos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><UserPlus size={16} /><span className="text-sm">Ativos</span></div>
          <p className="text-2xl font-bold text-green-600">{data?.alunos_ativos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><UserPlus size={16} /><span className="text-sm">Novos (mês)</span></div>
          <p className="text-2xl font-bold text-blue-600">{data?.novos_mes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><UserMinus size={16} /><span className="text-sm">Cancelados (mês)</span></div>
          <p className="text-2xl font-bold text-red-600">{data?.cancelados_mes}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600">Taxa de Retenção</p>
          <p className="text-2xl font-bold text-green-700">{data?.taxa_retencao}%</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-sm text-red-600">Churn Rate</p>
          <p className="text-2xl font-bold text-red-700">{data?.churn_rate}%</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm text-purple-600">LTV Estimado</p>
          <p className="text-2xl font-bold text-purple-700">R$ {data?.ltv_estimado?.toLocaleString()}</p>
        </div>
      </div>

      {/* Gráfico Novos vs Cancelados */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Novos vs Cancelados (últimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.alunos_por_mes || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="novos" fill="#10b981" name="Novos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cancelados" fill="#ef4444" name="Cancelados" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alunos por Plano */}
      {data?.alunos_por_plano?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4">Distribuição por Plano</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.alunos_por_plano} cx="50%" cy="50%" outerRadius={80} dataKey="quantidade" nameKey="plano" label={({ plano, percent }) => `${plano} ${(percent * 100).toFixed(0)}%`}>
                {data.alunos_por_plano.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RelatorioAlunos;
