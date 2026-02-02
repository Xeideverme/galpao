import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Edit, Copy, Archive, Printer, Play, Calendar, User, Target, Dumbbell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import VideoPlayer from '../components/VideoPlayer';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DetalhesFicha = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [ficha, setFicha] = useState(null);
  const [exerciciosDetalhes, setExerciciosDetalhes] = useState({});
  const [loading, setLoading] = useState(true);
  const [showVideos, setShowVideos] = useState(false);

  useEffect(() => {
    fetchFicha();
  }, [id]);

  const fetchFicha = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/fichas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFicha(response.data);
      
      // Fetch exercise details
      const exerciciosIds = response.data.exercicios.map(e => e.exercicio_id);
      const detalhes = {};
      for (const exId of exerciciosIds) {
        try {
          const exRes = await axios.get(`${API_URL}/api/exercicios/${exId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          detalhes[exId] = exRes.data;
        } catch (e) {
          console.error(`Erro ao buscar exercício ${exId}`);
        }
      }
      setExerciciosDetalhes(detalhes);
    } catch (error) {
      toast.error('Erro ao carregar ficha');
      navigate('/fichas');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      await axios.post(`${API_URL}/api/fichas/${id}/duplicar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ficha duplicada!');
      navigate('/fichas');
    } catch (error) {
      toast.error('Erro ao duplicar');
    }
  };

  const handleArchive = async () => {
    if (window.confirm('Deseja arquivar esta ficha?')) {
      try {
        await axios.post(`${API_URL}/api/fichas/${id}/arquivar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Ficha arquivada!');
        fetchFicha();
      } catch (error) {
        toast.error('Erro ao arquivar');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ficha) return null;

  const hoje = new Date().toISOString().split('T')[0];
  const isExpirada = ficha.data_fim && ficha.data_fim < hoje;
  const isAtiva = ficha.ativo && !isExpirada;

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="detalhes-ficha-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/fichas')}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ficha.nome}</h1>
          <div className="flex items-center gap-2 mt-1">
            {!ficha.ativo && <Badge variant="secondary">ARQUIVADA</Badge>}
            {isExpirada && ficha.ativo && <Badge variant="destructive">EXPIRADA</Badge>}
            {isAtiva && <Badge className="bg-green-500">ATIVA</Badge>}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <User size={16} />
            <span className="text-sm">Aluno</span>
          </div>
          <p className="font-medium">{ficha.aluno_nome}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <User size={16} />
            <span className="text-sm">Professor</span>
          </div>
          <p className="font-medium">{ficha.professor_nome}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Target size={16} />
            <span className="text-sm">Objetivo</span>
          </div>
          <p className="font-medium capitalize">{ficha.objetivo}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Calendar size={16} />
            <span className="text-sm">Tipo</span>
          </div>
          <p className="font-medium">{ficha.tipo} - {ficha.divisao}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleDuplicate}>
          <Copy size={16} className="mr-2" /> Duplicar
        </Button>
        {ficha.ativo && (
          <Button variant="outline" onClick={handleArchive}>
            <Archive size={16} className="mr-2" /> Arquivar
          </Button>
        )}
        <Button variant="outline" onClick={handlePrint}>
          <Printer size={16} className="mr-2" /> Imprimir
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowVideos(!showVideos)}
        >
          <Play size={16} className="mr-2" /> {showVideos ? 'Ocultar' : 'Ver'} Vídeos
        </Button>
        {isAtiva && (
          <Button 
            className="bg-green-600 hover:bg-green-700 ml-auto"
            onClick={() => navigate(`/treinos/registrar?ficha=${ficha.id}&aluno=${ficha.aluno_id}`)}
          >
            <Dumbbell size={16} className="mr-2" /> Registrar Treino
          </Button>
        )}
      </div>

      {/* Exercises Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Exercícios ({ficha.exercicios?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Exercício</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Séries</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Reps</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Carga</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Descanso</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Técnica</th>
              </tr>
            </thead>
            <tbody>
              {ficha.exercicios?.map((ex, index) => {
                const detalhe = exerciciosDetalhes[ex.exercicio_id];
                return (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{ex.ordem}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{detalhe?.nome || 'Exercício'}</p>
                        <p className="text-xs text-gray-500 capitalize">{detalhe?.grupo_muscular}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{ex.series}</td>
                    <td className="px-4 py-3 text-sm">{ex.repeticoes}</td>
                    <td className="px-4 py-3 text-sm">{ex.carga || '-'}</td>
                    <td className="px-4 py-3 text-sm">{ex.descanso || '-'}</td>
                    <td className="px-4 py-3 text-sm">{ex.tecnica || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Videos Section */}
      {showVideos && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold mb-4">Vídeos dos Exercícios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ficha.exercicios?.map((ex, index) => {
              const detalhe = exerciciosDetalhes[ex.exercicio_id];
              if (!detalhe?.video_url) return null;
              return (
                <div key={index}>
                  <p className="font-medium mb-2">{detalhe.nome}</p>
                  <VideoPlayer url={detalhe.video_url} />
                </div>
              );
            })}
          </div>
          {!ficha.exercicios?.some(ex => exerciciosDetalhes[ex.exercicio_id]?.video_url) && (
            <p className="text-gray-500 text-center py-8">Nenhum vídeo disponível</p>
          )}
        </div>
      )}

      {/* Observations */}
      {ficha.observacoes && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold mb-2">Observações</h2>
          <p className="text-gray-600">{ficha.observacoes}</p>
        </div>
      )}

      {/* Period */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold mb-2">Período de Validade</h2>
        <p className="text-gray-600">
          Início: {new Date(ficha.data_inicio).toLocaleDateString('pt-BR')}
          {ficha.data_fim && (
            <> • Fim: {new Date(ficha.data_fim).toLocaleDateString('pt-BR')}</>
          )}
        </p>
      </div>
    </div>
  );
};

export default DetalhesFicha;
