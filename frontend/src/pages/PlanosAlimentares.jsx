import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, UtensilsCrossed } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const PlanosAlimentares = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [planos, setPlanos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/planos-alimentares`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/api/alunos`, { headers: { Authorization: `Bearer ${token}` } })
    ]).then(([planosRes, alunosRes]) => {
      setPlanos(planosRes.data);
      setAlunos(alunosRes.data);
    }).catch(() => toast.error('Erro ao carregar')).finally(() => setLoading(false));
  }, []);

  const hoje = new Date().toISOString().split('T')[0];
  const getStatus = (p) => {
    if (!p.ativo) return 'arquivado';
    if (p.data_fim && p.data_fim < hoje) return 'expirado';
    return 'ativo';
  };

  const filtered = planos.filter(p => {
    const matchAluno = !filtroAluno || filtroAluno === 'all' || p.aluno_id === filtroAluno;
    const matchStatus = !filtroStatus || filtroStatus === 'all' || getStatus(p) === filtroStatus;
    return matchAluno && matchStatus;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este plano?')) {
      try {
        await axios.delete(`${API_URL}/api/planos-alimentares/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Plano excluído');
        setPlanos(planos.filter(p => p.id !== id));
      } catch { toast.error('Erro ao excluir'); }
    }
  };

  return (
    <div className="space-y-6" data-testid="planos-alimentares-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos Alimentares</h1>
          <p className="text-gray-500">{planos.length} planos cadastrados</p>
        </div>
        <Button onClick={() => navigate('/planos-alimentares/novo')}><Plus size={20} className="mr-2" /> Novo Plano</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select value={filtroAluno} onValueChange={setFiltroAluno}>
            <SelectTrigger><SelectValue placeholder="Filtrar por aluno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="expirado">Expirado</SelectItem>
              <SelectItem value="arquivado">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <UtensilsCrossed className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500">Nenhum plano encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const status = getStatus(p);
            return (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                    <p className="text-sm text-gray-500">{p.aluno_nome}</p>
                  </div>
                  <Badge className={status === 'ativo' ? 'bg-green-500' : status === 'expirado' ? 'bg-red-500' : 'bg-gray-500'}>{status.toUpperCase()}</Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>Objetivo: <span className="font-medium capitalize">{p.objetivo}</span></p>
                  <p>Calorias: <span className="font-medium">{p.calorias_alvo} kcal</span></p>
                  <div className="flex gap-3">
                    <span className="text-blue-600">P: {p.proteinas_alvo}g</span>
                    <span className="text-green-600">C: {p.carboidratos_alvo}g</span>
                    <span className="text-yellow-600">G: {p.gorduras_alvo}g</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/planos-alimentares/${p.id}`)}>Ver</Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(p.id)}>Excluir</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanosAlimentares;
