import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, Clock, Dumbbell, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const HistoricoTreino = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [aluno, setAluno] = useState(null);
  const [calendario, setCalendario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [alunoId]);

  const fetchData = async () => {
    try {
      const [registrosRes, alunoRes, calendarioRes] = await Promise.all([
        axios.get(`${API_URL}/api/registros-treino/aluno/${alunoId}/historico`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/alunos/${alunoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/registros-treino/aluno/${alunoId}/calendario`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRegistros(registrosRes.data);
      setAluno(alunoRes.data);
      setCalendario(calendarioRes.data);
    } catch (error) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  // Get current month calendar
  const getCurrentMonthDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add empty days for alignment
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const treinou = calendario.find(c => c.data === dateStr);
      days.push({
        day: d,
        date: dateStr,
        treinou: !!treinou,
        divisao: treinou?.divisao
      });
    }
    
    return days;
  };

  const monthDays = getCurrentMonthDays();
  const treinosEsteMes = calendario.filter(c => {
    const d = new Date(c.data);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="historico-treino-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Treinos</h1>
          <p className="text-gray-500">{aluno?.nome}</p>
        </div>
        <Button onClick={() => navigate(`/treinos/progressao/${alunoId}`)}>
          <TrendingUp size={18} className="mr-2" /> Ver Progressão
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Dumbbell size={16} />
            <span className="text-sm">Total de Treinos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Calendar size={16} />
            <span className="text-sm">Este Mês</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{treinosEsteMes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock size={16} />
            <span className="text-sm">Tempo Médio</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {registros.length > 0 
              ? Math.round(registros.reduce((acc, r) => acc + (r.duracao_minutos || 0), 0) / registros.length)
              : 0} min
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Calendar size={16} />
            <span className="text-sm">Último Treino</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {registros.length > 0 
              ? new Date(registros[0].data_treino).toLocaleDateString('pt-BR')
              : '-'}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold mb-4">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 py-2">{day}</div>
          ))}
          {monthDays.map((day, i) => (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                day === null ? '' :
                day.treinou ? 'bg-green-500 text-white font-medium' :
                day.day === new Date().getDate() ? 'bg-blue-100 text-blue-600 font-medium' :
                'text-gray-600 hover:bg-gray-100'
              }`}
              title={day?.treinou ? `Treino ${day.divisao}` : ''}
            >
              {day?.day}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Dia com treino</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>Hoje</span>
          </div>
        </div>
      </div>

      {/* Training List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Treinos Realizados</h2>
        </div>
        
        {registros.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="mx-auto text-gray-300" size={48} />
            <p className="mt-4 text-gray-500">Nenhum treino registrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {registros.map(registro => (
              <div key={registro.id} className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === registro.id ? null : registro.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Dumbbell className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{registro.ficha_nome}</span>
                        <Badge variant="outline">{registro.divisao}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(registro.data_treino).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                        {registro.duracao_minutos && ` • ${registro.duracao_minutos} min`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedId === registro.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </Button>
                </div>
                
                {expandedId === registro.id && (
                  <div className="mt-4 pl-16 space-y-3">
                    {registro.exercicios_realizados.map((ex, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{ex.exercicio_nome || 'Exercício'}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ex.series_realizadas.map((serie, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {serie.repeticoes} reps x {serie.carga}kg
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    {registro.observacoes && (
                      <p className="text-sm text-gray-600 italic">"{registro.observacoes}"</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricoTreino;
