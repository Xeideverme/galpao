import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Dumbbell, Play, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import ExercicioCard from '../components/ExercicioCard';
import VideoPlayer from '../components/VideoPlayer';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const gruposMusculares = [
  { value: 'peito', label: 'Peito' },
  { value: 'costas', label: 'Costas' },
  { value: 'pernas', label: 'Pernas' },
  { value: 'ombros', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'abdomen', label: 'Abdômen' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'gluteos', label: 'Glúteos' }
];

const equipamentos = [
  { value: 'barra', label: 'Barra' },
  { value: 'halteres', label: 'Halteres' },
  { value: 'maquina', label: 'Máquina' },
  { value: 'cabos', label: 'Cabos' },
  { value: 'peso_corporal', label: 'Peso Corporal' },
  { value: 'funcional', label: 'Funcional' }
];

const dificuldades = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' }
];

const Exercicios = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [exercicios, setExercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroEquipamento, setFiltroEquipamento] = useState('');
  const [filtroDificuldade, setFiltroDificuldade] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExercicio, setSelectedExercicio] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    grupo_muscular: '',
    equipamento: '',
    dificuldade: 'intermediario',
    descricao: '',
    video_url: ''
  });

  useEffect(() => {
    fetchExercicios();
  }, []);

  const fetchExercicios = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/exercicios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExercicios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar exercícios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/exercicios/${selectedExercicio.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Exercício atualizado!');
      } else {
        await axios.post(`${API_URL}/api/exercicios`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Exercício criado!');
      }
      setShowModal(false);
      resetForm();
      fetchExercicios();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar exercício');
    }
  };

  const handleDelete = async (exercicio) => {
    if (window.confirm(`Deseja excluir o exercício "${exercicio.nome}"?`)) {
      try {
        await axios.delete(`${API_URL}/api/exercicios/${exercicio.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Exercício excluído!');
        fetchExercicios();
      } catch (error) {
        toast.error('Erro ao excluir exercício');
      }
    }
  };

  const handleEdit = (exercicio) => {
    setSelectedExercicio(exercicio);
    setFormData({
      nome: exercicio.nome,
      grupo_muscular: exercicio.grupo_muscular,
      equipamento: exercicio.equipamento,
      dificuldade: exercicio.dificuldade,
      descricao: exercicio.descricao || '',
      video_url: exercicio.video_url || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (exercicio) => {
    setSelectedExercicio(exercicio);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      grupo_muscular: '',
      equipamento: '',
      dificuldade: 'intermediario',
      descricao: '',
      video_url: ''
    });
    setSelectedExercicio(null);
    setIsEditing(false);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const clearFilters = () => {
    setSearch('');
    setFiltroGrupo('');
    setFiltroEquipamento('');
    setFiltroDificuldade('');
  };

  // Filter exercícios
  const filteredExercicios = exercicios.filter(ex => {
    const matchSearch = ex.nome.toLowerCase().includes(search.toLowerCase());
    const matchGrupo = !filtroGrupo || ex.grupo_muscular === filtroGrupo;
    const matchEquipamento = !filtroEquipamento || ex.equipamento === filtroEquipamento;
    const matchDificuldade = !filtroDificuldade || ex.dificuldade === filtroDificuldade;
    return matchSearch && matchGrupo && matchEquipamento && matchDificuldade;
  });

  // Group by muscle group
  const exerciciosPorGrupo = filteredExercicios.reduce((acc, ex) => {
    if (!acc[ex.grupo_muscular]) acc[ex.grupo_muscular] = [];
    acc[ex.grupo_muscular].push(ex);
    return acc;
  }, {});

  const hasFilters = search || filtroGrupo || filtroEquipamento || filtroDificuldade;

  return (
    <div className="space-y-6" data-testid="exercicios-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Exercícios</h1>
          <p className="text-gray-500">{exercicios.length} exercícios cadastrados</p>
        </div>
        <Button onClick={openNewModal} data-testid="novo-exercicio-btn">
          <Plus size={20} className="mr-2" /> Novo Exercício
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-gray-500">
              <X size={14} className="mr-1" /> Limpar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar exercício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger data-testid="filtro-grupo">
              <SelectValue placeholder="Grupo Muscular" />
            </SelectTrigger>
            <SelectContent>
              {gruposMusculares.map(g => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEquipamento} onValueChange={setFiltroEquipamento}>
            <SelectTrigger data-testid="filtro-equipamento">
              <SelectValue placeholder="Equipamento" />
            </SelectTrigger>
            <SelectContent>
              {equipamentos.map(e => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroDificuldade} onValueChange={setFiltroDificuldade}>
            <SelectTrigger data-testid="filtro-dificuldade">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              {dificuldades.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exercise List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredExercicios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Dumbbell className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500">Nenhum exercício encontrado</p>
        </div>
      ) : hasFilters ? (
        // Show flat list when filtering
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercicios.map(exercicio => (
            <ExercicioCard
              key={exercicio.id}
              exercicio={exercicio}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      ) : (
        // Show grouped by muscle when not filtering
        <div className="space-y-8">
          {Object.entries(exerciciosPorGrupo).sort().map(([grupo, exs]) => (
            <div key={grupo}>
              <h2 className="text-lg font-semibold text-gray-800 capitalize mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                  {exs.length}
                </span>
                {gruposMusculares.find(g => g.value === grupo)?.label || grupo}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exs.map(exercicio => (
                  <ExercicioCard
                    key={exercicio.id}
                    exercicio={exercicio}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Exercício' : 'Novo Exercício'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome do Exercício *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Supino Reto com Barra"
                required
                data-testid="input-nome"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grupo Muscular *</Label>
                <Select 
                  value={formData.grupo_muscular} 
                  onValueChange={(v) => setFormData({ ...formData, grupo_muscular: v })}
                  required
                >
                  <SelectTrigger data-testid="select-grupo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposMusculares.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipamento *</Label>
                <Select 
                  value={formData.equipamento} 
                  onValueChange={(v) => setFormData({ ...formData, equipamento: v })}
                  required
                >
                  <SelectTrigger data-testid="select-equipamento">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentos.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Dificuldade</Label>
              <Select 
                value={formData.dificuldade} 
                onValueChange={(v) => setFormData({ ...formData, dificuldade: v })}
              >
                <SelectTrigger data-testid="select-dificuldade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dificuldades.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do exercício, dicas de execução..."
                rows={3}
                data-testid="input-descricao"
              />
            </div>
            <div>
              <Label>URL do Vídeo (YouTube)</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                data-testid="input-video"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-testid="submit-exercicio">
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExercicio?.nome}</DialogTitle>
          </DialogHeader>
          {selectedExercicio && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {selectedExercicio.grupo_muscular}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {selectedExercicio.equipamento.replace('_', ' ')}
                </Badge>
                <Badge className={
                  selectedExercicio.dificuldade === 'iniciante' ? 'bg-green-100 text-green-800' :
                  selectedExercicio.dificuldade === 'intermediario' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {selectedExercicio.dificuldade}
                </Badge>
              </div>
              
              {selectedExercicio.descricao && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Descrição</h4>
                  <p className="text-gray-600">{selectedExercicio.descricao}</p>
                </div>
              )}
              
              {selectedExercicio.video_url && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Vídeo Demonstrativo</h4>
                  <VideoPlayer url={selectedExercicio.video_url} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exercicios;
