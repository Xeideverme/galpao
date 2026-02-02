import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, TrendingUp, Search, Dumbbell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ProgressaoGrafico from '../components/ProgressaoGrafico';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProgressaoCarga = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [aluno, setAluno] = useState(null);
  const [exercicios, setExercicios] = useState([]);
  const [selectedExercicio, setSelectedExercicio] = useState('');
  const [progressao, setProgressao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchExercicio, setSearchExercicio] = useState('');

  useEffect(() => {
    fetchData();
  }, [alunoId]);

  useEffect(() => {
    if (selectedExercicio) {
      fetchProgressao(selectedExercicio);
    }
  }, [selectedExercicio]);

  const fetchData = async () => {
    try {
      const [alunoRes, exerciciosRes] = await Promise.all([
        axios.get(`${API_URL}/api/alunos/${alunoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/exercicios`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAluno(alunoRes.data);
      setExercicios(exerciciosRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressao = async (exercicioId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/registros-treino/aluno/${alunoId}/progressao/${exercicioId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProgressao(response.data);
    } catch (error) {
      toast.error('Erro ao carregar progressão');
    }
  };

  const filteredExercicios = exercicios.filter(ex =>
    ex.nome.toLowerCase().includes(searchExercicio.toLowerCase())
  );

  // Calculate progress stats
  const getProgressStats = () => {
    if (!progressao || progressao.historico.length < 2) return null;
    
    const primeiro = progressao.historico[0];
    const ultimo = progressao.historico[progressao.historico.length - 1];
    
    const diferenca = ultimo.carga_maxima - primeiro.carga_maxima;
    const percentual = ((diferenca / primeiro.carga_maxima) * 100).toFixed(1);
    
    return {
      diferenca,
      percentual,
      positivo: diferenca > 0
    };
  };

  const stats = getProgressStats();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="progressao-carga-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Progressão de Carga</h1>
          <p className="text-gray-500">{aluno?.nome}</p>
        </div>
      </div>

      {/* Exercise Selection */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold mb-4">Selecione um Exercício</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar exercício..."
              value={searchExercicio}
              onChange={(e) => setSearchExercicio(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedExercicio} onValueChange={setSelectedExercicio}>
          <SelectTrigger data-testid="select-exercicio">
            <SelectValue placeholder="Selecione um exercício para ver a progressão" />
          </SelectTrigger>
          <SelectContent>
            {filteredExercicios.map(ex => (
              <SelectItem key={ex.id} value={ex.id}>
                {ex.nome} ({ex.grupo_muscular})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress Stats */}
      {progressao && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">Carga Inicial</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {progressao.historico[0]?.carga_maxima || 0} kg
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">Carga Atual</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {progressao.historico[progressao.historico.length - 1]?.carga_maxima || 0} kg
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">Evolução</span>
            </div>
            <p className={`text-2xl font-bold ${stats.positivo ? 'text-green-600' : 'text-red-600'}`}>
              {stats.positivo ? '+' : ''}{stats.diferenca} kg ({stats.percentual}%)
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {selectedExercicio && progressao && (
        <ProgressaoGrafico 
          data={progressao.historico} 
          exercicioNome={progressao.exercicio_nome}
        />
      )}

      {/* History Table */}
      {progressao && progressao.historico.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Histórico Completo</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Data</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Carga Média</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Carga Máxima</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Séries</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Total Reps</th>
                </tr>
              </thead>
              <tbody>
                {progressao.historico.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{item.carga_media} kg</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.carga_maxima} kg</td>
                    <td className="px-4 py-3 text-sm">{item.total_series}</td>
                    <td className="px-4 py-3 text-sm">{item.total_reps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedExercicio && progressao && progressao.historico.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Dumbbell className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500">Nenhum registro encontrado para este exercício</p>
          <p className="text-sm text-gray-400">Comece a registrar seus treinos para ver a progressão</p>
        </div>
      )}

      {!selectedExercicio && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <TrendingUp className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500">Selecione um exercício para ver sua progressão de carga</p>
        </div>
      )}
    </div>
  );
};

export default ProgressaoCarga;
