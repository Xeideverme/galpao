import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Activity } from 'lucide-react';
import AvaliacaoCard from '../components/AvaliacaoCard';

const AvaliacoesFisicas = () => {
  const navigate = useNavigate();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('todos');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [avaliacoesRes, alunosRes] = await Promise.all([
        api.get('/avaliacoes'),
        api.get('/alunos')
      ]);
      setAvaliacoes(avaliacoesRes.data);
      setAlunos(alunosRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const avaliacoesFiltradas = avaliacoes.filter(avaliacao => {
    const matchSearch = avaliacao.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        avaliacao.professor_nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchAluno = filtroAluno === 'todos' || avaliacao.aluno_id === filtroAluno;

    return matchSearch && matchAluno;
  });

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="avaliacoes-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-purple-600" />
            Avaliações Físicas
          </h1>
          <p className="text-gray-500 mt-1">Gerencie as avaliações físicas dos alunos</p>
        </div>
        <Button 
          onClick={() => navigate('/avaliacoes/nova')}
          data-testid="nova-avaliacao-btn"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Avaliação
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por aluno ou professor..."
            data-testid="search-avaliacoes"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filtroAluno} onValueChange={setFiltroAluno}>
          <SelectTrigger className="w-64" data-testid="filtro-aluno">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os alunos</SelectItem>
            {alunos.map(aluno => (
              <SelectItem key={aluno.id} value={aluno.id}>{aluno.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Avaliações */}
      <div>
        <p className="text-sm text-gray-600 mb-4">
          {avaliacoesFiltradas.length} avaliação(ões) encontrada(s)
        </p>
        
        {avaliacoesFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avaliacoesFiltradas.map((avaliacao) => (
              <AvaliacaoCard key={avaliacao.id} avaliacao={avaliacao} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Nenhuma avaliação encontrada</p>
            <p className="text-gray-400 text-sm mb-4">Comece criando uma nova avaliação física</p>
            <Button onClick={() => navigate('/avaliacoes/nova')}>
              <Plus className="mr-2 h-4 w-4" /> Nova Avaliação
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvaliacoesFisicas;
