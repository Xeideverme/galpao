import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, ClipboardList, X, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import FichaCard from '../components/FichaCard';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const tiposFicha = [
  { value: 'ABC', label: 'ABC' },
  { value: 'ABCD', label: 'ABCD' },
  { value: 'Push_Pull_Legs', label: 'Push/Pull/Legs' },
  { value: 'Upper_Lower', label: 'Upper/Lower' },
  { value: 'FullBody', label: 'Full Body' }
];

const objetivos = [
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'forca', label: 'Força' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'condicionamento', label: 'Condicionamento' }
];

const FichasTreino = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [fichas, setFichas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    Promise.all([fetchFichas(), fetchAlunos()]).finally(() => setLoading(false));
  }, []);

  const fetchFichas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/fichas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFichas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar fichas');
    }
  };

  const fetchAlunos = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/alunos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlunos(response.data);
    } catch (error) {
      console.error('Erro ao carregar alunos');
    }
  };

  const handleDuplicate = async (ficha) => {
    try {
      await axios.post(`${API_URL}/api/fichas/${ficha.id}/duplicar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ficha duplicada!');
      fetchFichas();
    } catch (error) {
      toast.error('Erro ao duplicar ficha');
    }
  };

  const handleArchive = async (ficha) => {
    if (window.confirm(`Deseja arquivar a ficha "${ficha.nome}"?`)) {
      try {
        await axios.post(`${API_URL}/api/fichas/${ficha.id}/arquivar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Ficha arquivada!');
        fetchFichas();
      } catch (error) {
        toast.error('Erro ao arquivar ficha');
      }
    }
  };

  const handleDelete = async (ficha) => {
    if (window.confirm(`Deseja excluir a ficha "${ficha.nome}"? Esta ação não pode ser desfeita.`)) {
      try {
        await axios.delete(`${API_URL}/api/fichas/${ficha.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Ficha excluída!');
        fetchFichas();
      } catch (error) {
        toast.error('Erro ao excluir ficha');
      }
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFiltroAluno('');
    setFiltroTipo('');
    setFiltroStatus('');
  };

  // Get ficha status
  const getFichaStatus = (ficha) => {
    const hoje = new Date().toISOString().split('T')[0];
    if (!ficha.ativo) return 'arquivada';
    if (ficha.data_fim && ficha.data_fim < hoje) return 'expirada';
    return 'ativa';
  };

  // Filter fichas
  const filteredFichas = fichas.filter(ficha => {
    const matchSearch = ficha.nome.toLowerCase().includes(search.toLowerCase()) ||
                        ficha.aluno_nome.toLowerCase().includes(search.toLowerCase());
    const matchAluno = !filtroAluno || ficha.aluno_id === filtroAluno;
    const matchTipo = !filtroTipo || ficha.tipo === filtroTipo;
    const matchStatus = !filtroStatus || getFichaStatus(ficha) === filtroStatus;
    return matchSearch && matchAluno && matchTipo && matchStatus;
  });

  const hasFilters = search || filtroAluno || filtroTipo || filtroStatus;

  // Stats
  const fichasAtivas = fichas.filter(f => getFichaStatus(f) === 'ativa').length;
  const fichasExpiradas = fichas.filter(f => getFichaStatus(f) === 'expirada').length;
  const fichasArquivadas = fichas.filter(f => getFichaStatus(f) === 'arquivada').length;

  return (
    <div className="space-y-6" data-testid="fichas-treino-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fichas de Treino</h1>
          <p className="text-gray-500">{fichas.length} fichas cadastradas</p>
        </div>
        <Button onClick={() => navigate('/fichas/nova')} data-testid="nova-ficha-btn">
          <Plus size={20} className="mr-2" /> Nova Ficha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fichasAtivas}</p>
            <p className="text-sm text-gray-500">Fichas Ativas</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fichasExpiradas}</p>
            <p className="text-sm text-gray-500">Expiradas</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="text-gray-600" size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{fichasArquivadas}</p>
            <p className="text-sm text-gray-500">Arquivadas</p>
          </div>
        </div>
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
              placeholder="Buscar ficha ou aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={filtroAluno} onValueChange={setFiltroAluno}>
            <SelectTrigger data-testid="filtro-aluno">
              <SelectValue placeholder="Aluno" />
            </SelectTrigger>
            <SelectContent>
              {alunos.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger data-testid="filtro-tipo">
              <SelectValue placeholder="Tipo de Treino" />
            </SelectTrigger>
            <SelectContent>
              {tiposFicha.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger data-testid="filtro-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="expirada">Expirada</SelectItem>
              <SelectItem value="arquivada">Arquivada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fichas List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredFichas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <ClipboardList className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500">Nenhuma ficha encontrada</p>
          <Button onClick={() => navigate('/fichas/nova')} className="mt-4">
            <Plus size={16} className="mr-2" /> Criar Primeira Ficha
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFichas.map(ficha => (
            <FichaCard
              key={ficha.id}
              ficha={ficha}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FichasTreino;
