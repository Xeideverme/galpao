import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, TrendingUp, TrendingDown, Droplets, Scale } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const RelatorioNutricional = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('7');
  const [relatorio, setRelatorio] = useState(null);
  const [aluno, setAluno] = useState(null);

  useEffect(() => { fetchData(); }, [alunoId, periodo]);

  const fetchData = async () => {
    try {
      const [relRes, alunoRes] = await Promise.all([
        axios.get(`${API_URL}/api/registros-alimentares/aluno/${alunoId}/relatorio?dias=${periodo}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/alunos/${alunoId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRelatorio(relRes.data);
      setAluno(alunoRes.data);
    } catch { toast.error('Erro ao carregar'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const pesoData = relatorio?.evolucao_peso || [];
  const primeiroP = pesoData[0]?.peso || 0;
  const ultimoP = pesoData[pesoData.length - 1]?.peso || 0;
  const difPeso = (ultimoP - primeiroP).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="relatorio-nutricional-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Relatório Nutricional</h1>
          <p className="text-gray-500">{aluno?.nome}</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Última semana</SelectItem>
            <SelectItem value="14">Últimas 2 semanas</SelectItem>
            <SelectItem value="30">Último mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Média Calorias/dia</p>
          <p className="text-2xl font-bold">{relatorio?.media_calorias || 0} <span className="text-sm font-normal text-gray-500">kcal</span></p>
          {relatorio?.meta_calorias && <p className="text-xs text-gray-400">Meta: {relatorio.meta_calorias} kcal</p>}
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Aderência ao Plano</p>
          <p className="text-2xl font-bold">{relatorio?.aderencia_percentual || 0}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Registros</p>
          <p className="text-2xl font-bold">{relatorio?.registros_encontrados || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500 flex items-center gap-1"><Scale size={14} /> Variação Peso</p>
          <p className={`text-2xl font-bold ${parseFloat(difPeso) > 0 ? 'text-red-600' : parseFloat(difPeso) < 0 ? 'text-green-600' : ''}`}>
            {parseFloat(difPeso) > 0 ? '+' : ''}{difPeso} kg
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-600">Proteínas</p>
          <p className="text-xl font-bold text-blue-700">{relatorio?.media_proteinas || 0}g</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600">Carboidratos</p>
          <p className="text-xl font-bold text-green-700">{relatorio?.media_carboidratos || 0}g</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-sm text-yellow-600">Gorduras</p>
          <p className="text-xl font-bold text-yellow-700">{relatorio?.media_gorduras || 0}g</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-4 text-center">
          <p className="text-sm text-cyan-600 flex items-center justify-center gap-1"><Droplets size={14} /> Água</p>
          <p className="text-xl font-bold text-cyan-700">-</p>
        </div>
      </div>

      {pesoData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4">Evolução do Peso</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={pesoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 12 }} tickFormatter={v => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
              <Tooltip formatter={v => [`${v} kg`, 'Peso']} labelFormatter={v => new Date(v).toLocaleDateString('pt-BR')} />
              <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {relatorio?.registros_encontrados === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <p className="text-gray-500">Nenhum registro encontrado no período</p>
          <Button className="mt-4" onClick={() => navigate('/nutricao/registro')}>Registrar Consumo</Button>
        </div>
      )}
    </div>
  );
};

export default RelatorioNutricional;
