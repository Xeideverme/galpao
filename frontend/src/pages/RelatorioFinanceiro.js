import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const RelatorioFinanceiro = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [periodo, setPeriodo] = useState('mes');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [periodo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/relatorios/financeiro/${periodo}`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch { toast.error('Erro ao carregar'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6" data-testid="relatorio-financeiro-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/relatorios')}><ArrowLeft size={20} /></Button>
        <div className="flex-1"><h1 className="text-2xl font-bold">Relatório Financeiro</h1></div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Última Semana</SelectItem>
            <SelectItem value="mes">Este Mês</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
            <SelectItem value="ano">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><DollarSign size={16} /><span className="text-sm">Receita</span></div>
          <p className="text-2xl font-bold text-green-600">R$ {data?.receita_total?.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><TrendingDown size={16} /><span className="text-sm">Despesas</span></div>
          <p className="text-2xl font-bold text-red-600">R$ {data?.despesa_total?.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><TrendingUp size={16} /><span className="text-sm">Lucro</span></div>
          <p className={`text-2xl font-bold ${data?.lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>R$ {data?.lucro?.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><AlertTriangle size={16} /><span className="text-sm">Inadimplência</span></div>
          <p className="text-2xl font-bold text-orange-600">R$ {data?.inadimplencia?.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-600">MRR</p>
          <p className="text-xl font-bold text-blue-700">R$ {data?.mrr?.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm text-purple-600">Ticket Médio</p>
          <p className="text-xl font-bold text-purple-700">R$ {data?.ticket_medio}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600">Margem de Lucro</p>
          <p className="text-xl font-bold text-green-700">{data?.margem_lucro}%</p>
        </div>
      </div>

      {/* Gráfico de Receita por Mês */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Receita por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.receita_por_mes || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => [`R$ ${v.toLocaleString()}`, 'Receita']} />
            <Bar dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Receita por Plano */}
      {data?.receita_por_plano?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4">Receita por Plano</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.receita_por_plano} cx="50%" cy="50%" outerRadius={80} dataKey="valor" nameKey="plano" label={({ plano, percent }) => `${plano} ${(percent * 100).toFixed(0)}%`}>
                {data.receita_por_plano.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `R$ ${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RelatorioFinanceiro;
