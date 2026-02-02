import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowLeft, ArrowRight, Check, Plus, Search, GripVertical, Trash2, X, Dumbbell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const tiposFicha = [
  { value: 'ABC', label: 'ABC' },
  { value: 'ABCD', label: 'ABCD' },
  { value: 'Push_Pull_Legs', label: 'Push/Pull/Legs' },
  { value: 'Upper_Lower', label: 'Upper/Lower' },
  { value: 'FullBody', label: 'Full Body' }
];

const divisoes = {
  'ABC': ['A', 'B', 'C'],
  'ABCD': ['A', 'B', 'C', 'D'],
  'Push_Pull_Legs': ['Push', 'Pull', 'Legs'],
  'Upper_Lower': ['Upper', 'Lower'],
  'FullBody': ['Full']
};

const objetivos = [
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'forca', label: 'Força' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'condicionamento', label: 'Condicionamento' }
];

const NovaFichaTreino = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data from API
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [exercicios, setExercicios] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    aluno_id: '',
    professor_id: '',
    nome: '',
    tipo: 'ABC',
    divisao: 'A',
    objetivo: 'hipertrofia',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    observacoes: ''
  });
  
  // Exercícios na ficha
  const [exerciciosFicha, setExerciciosFicha] = useState([]);
  
  // Modal para adicionar exercício
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchExercicio, setSearchExercicio] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [alunosRes, professoresRes, exerciciosRes] = await Promise.all([
        axios.get(`${API_URL}/api/alunos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/professores`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/exercicios`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAlunos(alunosRes.data.filter(a => a.status === 'ativo'));
      setProfessores(professoresRes.data.filter(p => p.ativo));
      setExercicios(exerciciosRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(exerciciosFicha);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update ordem
    const updated = items.map((item, index) => ({ ...item, ordem: index + 1 }));
    setExerciciosFicha(updated);
  };

  const addExercicio = (exercicio) => {
    const newExercicio = {
      exercicio_id: exercicio.id,
      exercicio_nome: exercicio.nome,
      exercicio_grupo: exercicio.grupo_muscular,
      ordem: exerciciosFicha.length + 1,
      series: 3,
      repeticoes: '10-12',
      carga: '',
      descanso: '60s',
      tecnica: '',
      observacoes: ''
    };
    setExerciciosFicha([...exerciciosFicha, newExercicio]);
    toast.success(`${exercicio.nome} adicionado!`);
  };

  const removeExercicio = (index) => {
    const updated = exerciciosFicha.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      ordem: i + 1
    }));
    setExerciciosFicha(updated);
  };

  const updateExercicio = (index, field, value) => {
    const updated = [...exerciciosFicha];
    updated[index] = { ...updated[index], [field]: value };
    setExerciciosFicha(updated);
  };

  const handleSubmit = async () => {
    if (exerciciosFicha.length === 0) {
      toast.error('Adicione pelo menos 1 exercício');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        exercicios: exerciciosFicha.map(ex => ({
          exercicio_id: ex.exercicio_id,
          ordem: ex.ordem,
          series: ex.series,
          repeticoes: ex.repeticoes,
          carga: ex.carga || null,
          descanso: ex.descanso || null,
          tecnica: ex.tecnica || null,
          observacoes: ex.observacoes || null
        }))
      };
      
      await axios.post(`${API_URL}/api/fichas`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Ficha criada com sucesso!');
      navigate('/fichas');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar ficha');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.aluno_id && formData.professor_id && formData.nome && formData.tipo && formData.divisao && formData.objetivo && formData.data_inicio;
    }
    if (step === 2) {
      return exerciciosFicha.length > 0;
    }
    return true;
  };

  // Filter exercícios for modal
  const filteredExercicios = exercicios.filter(ex => {
    const matchSearch = ex.nome.toLowerCase().includes(searchExercicio.toLowerCase());
    const matchGrupo = !filtroGrupo || ex.grupo_muscular === filtroGrupo;
    const notAdded = !exerciciosFicha.find(ef => ef.exercicio_id === ex.id);
    return matchSearch && matchGrupo && notAdded;
  });

  const gruposMusculares = [...new Set(exercicios.map(e => e.grupo_muscular))].sort();

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="nova-ficha-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/fichas')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Ficha de Treino</h1>
          <p className="text-gray-500">Passo {step} de 3</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              s < step ? 'bg-green-500 text-white' :
              s === step ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {s < step ? <Check size={20} /> : s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Informações Básicas */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <h2 className="text-lg font-semibold">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Aluno *</Label>
              <Select value={formData.aluno_id} onValueChange={(v) => setFormData({...formData, aluno_id: v})}>
                <SelectTrigger data-testid="select-aluno">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Professor Responsável *</Label>
              <Select value={formData.professor_id} onValueChange={(v) => setFormData({...formData, professor_id: v})}>
                <SelectTrigger data-testid="select-professor">
                  <SelectValue placeholder="Selecione o professor" />
                </SelectTrigger>
                <SelectContent>
                  {professores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Nome da Ficha *</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              placeholder="Ex: Treino A - Peito/Tríceps"
              data-testid="input-nome"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo de Treino *</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v, divisao: divisoes[v][0]})}>
                <SelectTrigger data-testid="select-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposFicha.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Divisão *</Label>
              <Select value={formData.divisao} onValueChange={(v) => setFormData({...formData, divisao: v})}>
                <SelectTrigger data-testid="select-divisao">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {divisoes[formData.tipo]?.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Objetivo *</Label>
              <Select value={formData.objetivo} onValueChange={(v) => setFormData({...formData, objetivo: v})}>
                <SelectTrigger data-testid="select-objetivo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {objetivos.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                data-testid="input-data-inicio"
              />
            </div>
            <div>
              <Label>Data de Fim (Opcional)</Label>
              <Input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
                data-testid="input-data-fim"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              placeholder="Observações gerais sobre a ficha..."
              rows={3}
              data-testid="input-observacoes"
            />
          </div>
        </div>
      )}

      {/* Step 2: Adicionar Exercícios */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Exercícios da Ficha</h2>
              <Button onClick={() => setShowAddModal(true)} data-testid="add-exercicio-btn">
                <Plus size={18} className="mr-2" /> Adicionar Exercício
              </Button>
            </div>

            {exerciciosFicha.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Dumbbell className="mx-auto text-gray-300" size={48} />
                <p className="mt-4 text-gray-500">Nenhum exercício adicionado</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-4" variant="outline">
                  <Plus size={16} className="mr-2" /> Adicionar Primeiro Exercício
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="exercicios">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {exerciciosFicha.map((ex, index) => (
                        <Draggable key={ex.exercicio_id} draggableId={ex.exercicio_id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-gray-50 rounded-lg p-4 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div {...provided.dragHandleProps} className="pt-2 cursor-grab">
                                  <GripVertical className="text-gray-400" size={20} />
                                </div>
                                
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm text-gray-500 mr-2">#{ex.ordem}</span>
                                      <span className="font-medium">{ex.exercicio_nome}</span>
                                      <Badge variant="outline" className="ml-2 capitalize text-xs">
                                        {ex.exercicio_grupo}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeExercicio(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    <div>
                                      <Label className="text-xs">Séries</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={ex.series}
                                        onChange={(e) => updateExercicio(index, 'series', parseInt(e.target.value))}
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Repetições</Label>
                                      <Input
                                        value={ex.repeticoes}
                                        onChange={(e) => updateExercicio(index, 'repeticoes', e.target.value)}
                                        placeholder="8-12"
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Carga</Label>
                                      <Input
                                        value={ex.carga}
                                        onChange={(e) => updateExercicio(index, 'carga', e.target.value)}
                                        placeholder="20kg"
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Descanso</Label>
                                      <Input
                                        value={ex.descanso}
                                        onChange={(e) => updateExercicio(index, 'descanso', e.target.value)}
                                        placeholder="60s"
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Técnica</Label>
                                      <Input
                                        value={ex.tecnica}
                                        onChange={(e) => updateExercicio(index, 'tecnica', e.target.value)}
                                        placeholder="dropset"
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Revisão */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <h2 className="text-lg font-semibold">Revisão da Ficha</h2>
          
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Aluno</p>
              <p className="font-medium">{alunos.find(a => a.id === formData.aluno_id)?.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Professor</p>
              <p className="font-medium">{professores.find(p => p.id === formData.professor_id)?.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nome da Ficha</p>
              <p className="font-medium">{formData.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium">{formData.tipo} - Divisão {formData.divisao}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Objetivo</p>
              <p className="font-medium capitalize">{formData.objetivo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Período</p>
              <p className="font-medium">
                {new Date(formData.data_inicio).toLocaleDateString('pt-BR')}
                {formData.data_fim && ` até ${new Date(formData.data_fim).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Exercícios ({exerciciosFicha.length})</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">#</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Exercício</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Séries</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Reps</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Carga</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Descanso</th>
                  </tr>
                </thead>
                <tbody>
                  {exerciciosFicha.map((ex, index) => (
                    <tr key={ex.exercicio_id} className="border-t">
                      <td className="px-4 py-2 text-sm">{ex.ordem}</td>
                      <td className="px-4 py-2 text-sm font-medium">{ex.exercicio_nome}</td>
                      <td className="px-4 py-2 text-sm">{ex.series}</td>
                      <td className="px-4 py-2 text-sm">{ex.repeticoes}</td>
                      <td className="px-4 py-2 text-sm">{ex.carga || '-'}</td>
                      <td className="px-4 py-2 text-sm">{ex.descanso || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {formData.observacoes && (
            <div>
              <h3 className="font-medium mb-2">Observações</h3>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{formData.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          <ArrowLeft size={18} className="mr-2" /> Voltar
        </Button>
        
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            data-testid="next-step-btn"
          >
            Próximo <ArrowRight size={18} className="ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
            data-testid="submit-ficha-btn"
          >
            {loading ? 'Salvando...' : 'Criar Ficha'}
          </Button>
        )}
      </div>

      {/* Add Exercise Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar Exercício</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar exercício..."
                value={searchExercicio}
                onChange={(e) => setSearchExercicio(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {gruposMusculares.map(g => (
                  <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredExercicios.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum exercício encontrado</p>
            ) : (
              filteredExercicios.map(ex => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium">{ex.nome}</p>
                    <p className="text-sm text-gray-500 capitalize">{ex.grupo_muscular} • {ex.equipamento.replace('_', ' ')}</p>
                  </div>
                  <Button size="sm" onClick={() => addExercicio(ex)}>
                    <Plus size={16} className="mr-1" /> Adicionar
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NovaFichaTreino;
