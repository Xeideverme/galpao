import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Activity, Users, Calendar, Dumbbell, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const RelatorioOperacional = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/relatorios/operacional`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setData(res.data))
      .catch(() => toast.error('Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6" data-testid="relatorio-operacional-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/relatorios')}><ArrowLeft size={20} /></Button>
        <h1 className="text-2xl font-bold">Relatório Operacional</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Activity size={16} /><span className="text-sm">Check-ins Hoje</span></div>
          <p className="text-2xl font-bold text-blue-600">{data?.checkins_hoje}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar size={16} /><span className="text-sm">Check-ins Mês</span></div>
          <p className="text-2xl font-bold">{data?.checkins_mes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Dumbbell size={16} /><span className="text-sm">Treinos Hoje</span></div>
          <p className="text-2xl font-bold text-green-600">{data?.treinos_hoje}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Dumbbell size={16} /><span className="text-sm">Treinos Mês</span></div>
          <p className="text-2xl font-bold">{data?.treinos_mes}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-sm text-purple-600">Fichas Ativas</p>
          <p className="text-xl font-bold text-purple-700">{data?.fichas_ativas}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-600">Professores</p>
          <p className="text-xl font-bold text-blue-700">{data?.total_professores}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600">Aulas</p>
          <p className="text-xl font-bold text-green-700">{data?.total_aulas}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-sm text-orange-600">Taxa Ocupação</p>
          <p className="text-xl font-bold text-orange-700">{data?.taxa_ocupacao}%</p>
        </div>
      </div>

      {/* Check-ins por Dia da Semana */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Check-ins por Dia da Semana</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data?.checkins_por_dia_semana || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Horários de Pico */}
      {data?.horarios_pico?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock size={18} /> Horários de Pico</h3>
          <div className="space-y-2">
            {data.horarios_pico.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-16 font-medium">{h.hora}:00</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4">
                  <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${(h.total / data.horarios_pico[0].total) * 100}%` }}></div>
                </div>
                <span className="w-12 text-right text-sm text-gray-600">{h.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelatorioOperacional;
