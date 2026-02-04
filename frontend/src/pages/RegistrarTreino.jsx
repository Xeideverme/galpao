import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Play, Pause, RotateCcw, Check, Dumbbell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const RegistrarTreino = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fichas, setFichas] = useState([]);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [exerciciosDetalhes, setExerciciosDetalhes] = useState({});
  
  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // Form
  const [fichaId, setFichaId] = useState(searchParams.get('ficha') || '');
  const [alunoId, setAlunoId] = useState(searchParams.get('aluno') || '');
  const [observacoes, setObservacoes] = useState('');
  const [exerciciosRealizados, setExerciciosRealizados] = useState([]);

  useEffect(() => {
    fetchFichas();
  }, []);

  useEffect(() => {
    if (fichaId) {
      fetchFichaDetalhes(fichaId);
    }
  }, [fichaId]);

  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const fetchFichas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/fichas?ativo=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFichas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar fichas');
    } finally {
      setLoading(false);
    }
  };

  const fetchFichaDetalhes = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/fichas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedFicha(response.data);
      setAlunoId(response.data.aluno_id);
      
      // Fetch exercise details and initialize form
      const detalhes = {};
      const realizados = [];
      
      for (const ex of response.data.exercicios) {
        try {
          const exRes = await axios.get(`${API_URL}/api/exercicios/${ex.exercicio_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          detalhes[ex.exercicio_id] = exRes.data;
        } catch (e) {
          console.error(`Erro ao buscar exercício ${ex.exercicio_id}`);
        }
        
        // Initialize series
        const series = [];
        for (let i = 1; i <= ex.series; i++) {
          series.push({
            numero_serie: i,
            repeticoes: parseInt(ex.repeticoes.split('-')[0]) || 10,
            carga: parseFloat(ex.carga) || 0,
            concluida: false
          });
        }
        
        realizados.push({
          exercicio_id: ex.exercicio_id,
          realizado: false,
          series_realizadas: series
        });
      }
      
      setExerciciosDetalhes(detalhes);
      setExerciciosRealizados(realizados);
    } catch (error) {
      toast.error('Erro ao carregar ficha');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExercicio = (index, checked) => {
    const updated = [...exerciciosRealizados];
    updated[index].realizado = checked;
    if (checked) {
      updated[index].series_realizadas = updated[index].series_realizadas.map(s => ({
        ...s,
        concluida: true
      }));
    }
    setExerciciosRealizados(updated);
  };

  const updateSerie = (exIndex, serieIndex, field, value) => {
    const updated = [...exerciciosRealizados];
    updated[exIndex].series_realizadas[serieIndex][field] = value;
    setExerciciosRealizados(updated);
  };

  const toggleSerie = (exIndex, serieIndex) => {
    const updated = [...exerciciosRealizados];
    updated[exIndex].series_realizadas[serieIndex].concluida = 
      !updated[exIndex].series_realizadas[serieIndex].concluida;
    
    // Check if all series are done
    const allDone = updated[exIndex].series_realizadas.every(s => s.concluida);
    updated[exIndex].realizado = allDone;
    
    setExerciciosRealizados(updated);
  };

  const handleSubmit = async () => {
    const exerciciosComDados = exerciciosRealizados
      .filter(ex => ex.realizado || ex.series_realizadas.some(s => s.concluida))
      .map(ex => ({
        exercicio_id: ex.exercicio_id,
        series_realizadas: ex.series_realizadas
          .filter(s => s.concluida)
          .map(s => ({
            numero_serie: s.numero_serie,
            repeticoes: parseInt(s.repeticoes) || 0,
            carga: parseFloat(s.carga) || 0,
            concluida: true
          }))
      }));

    if (exerciciosComDados.length === 0) {
      toast.error('Marque pelo menos um exercício como realizado');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/registros-treino`, {
        aluno_id: alunoId,
        ficha_id: fichaId,
        divisao: selectedFicha?.divisao || 'A',
        exercicios_realizados: exerciciosComDados,
        duracao_minutos: Math.ceil(timerSeconds / 60),
        observacoes: observacoes || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Treino registrado com sucesso!');
      navigate(`/treinos/historico/${alunoId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao registrar treino');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="registrar-treino-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Registrar Treino</h1>
          <p className="text-gray-500">Registre o treino executado</p>
        </div>
      </div>

      {/* Timer */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center gap-6">
          <span className="text-4xl font-mono font-bold text-gray-900">
            {formatTime(timerSeconds)}
          </span>
          <div className="flex gap-2">
            <Button
              variant={timerRunning ? "destructive" : "default"}
              onClick={() => setTimerRunning(!timerRunning)}
            >
              {timerRunning ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            <Button variant="outline" onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}>
              <RotateCcw size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Ficha Selection */}
      {!selectedFicha && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <Label>Selecione a Ficha de Treino</Label>
          <Select value={fichaId} onValueChange={setFichaId}>
            <SelectTrigger className="mt-2" data-testid="select-ficha">
              <SelectValue placeholder="Selecione uma ficha" />
            </SelectTrigger>
            <SelectContent>
              {fichas.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome} - {f.aluno_nome} ({f.divisao})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Exercises */}
      {selectedFicha && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{selectedFicha.nome}</h2>
                <p className="text-sm text-gray-500">{selectedFicha.aluno_nome} • Divisão {selectedFicha.divisao}</p>
              </div>
              <Badge>{selectedFicha.objetivo}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            {exerciciosRealizados.map((ex, exIndex) => {
              const detalhe = exerciciosDetalhes[ex.exercicio_id];
              const fichaEx = selectedFicha.exercicios[exIndex];
              
              return (
                <div 
                  key={ex.exercicio_id}
                  className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
                    ex.realizado ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Checkbox
                      checked={ex.realizado}
                      onCheckedChange={(checked) => toggleExercicio(exIndex, checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{detalhe?.nome || 'Exercício'}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {detalhe?.grupo_muscular}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {fichaEx?.series}x{fichaEx?.repeticoes} • {fichaEx?.carga || 'Livre'} • Descanso: {fichaEx?.descanso || '60s'}
                      </p>
                    </div>
                    {ex.realizado && <Check className="text-green-600" size={24} />}
                  </div>

                  <div className="space-y-2">
                    {ex.series_realizadas.map((serie, serieIndex) => (
                      <div 
                        key={serieIndex}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          serie.concluida ? 'bg-green-100' : 'bg-gray-50'
                        }`}
                      >
                        <Checkbox
                          checked={serie.concluida}
                          onCheckedChange={() => toggleSerie(exIndex, serieIndex)}
                        />
                        <span className="text-sm font-medium w-16">Série {serie.numero_serie}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={serie.repeticoes}
                            onChange={(e) => updateSerie(exIndex, serieIndex, 'repeticoes', parseInt(e.target.value))}
                            className="w-20 h-8"
                            min="0"
                          />
                          <span className="text-sm text-gray-500">reps</span>
                        </div>
                        <span className="text-gray-400">x</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={serie.carga}
                            onChange={(e) => updateSerie(exIndex, serieIndex, 'carga', parseFloat(e.target.value))}
                            className="w-20 h-8"
                            min="0"
                            step="0.5"
                          />
                          <span className="text-sm text-gray-500">kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observations */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Como foi o treino? Alguma observação?"
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="finalizar-treino-btn"
            >
              <Dumbbell size={18} className="mr-2" />
              {submitting ? 'Salvando...' : 'Finalizar Treino'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default RegistrarTreino;
