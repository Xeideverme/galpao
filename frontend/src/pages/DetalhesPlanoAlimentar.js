import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Printer, User, Target, Calendar, UtensilsCrossed } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import GraficoMacros from '../components/GraficoMacros';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DetalhesPlanoAlimentar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [plano, setPlano] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/planos-alimentares/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPlano(res.data))
      .catch(() => { toast.error('Erro ao carregar'); navigate('/planos-alimentares'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!plano) return null;

  const calcRefeicaoTotal = (ref) => {
    let cal = 0, p = 0, c = 0, g = 0;
    ref.alimentos?.forEach(a => {
      const fator = a.quantidade / 100;
      cal += (a._calorias || 0) * fator;
    });
    return { cal: Math.round(cal) };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="detalhes-plano-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/planos-alimentares')}><ArrowLeft size={20} /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{plano.nome}</h1>
          <Badge className={plano.ativo ? 'bg-green-500' : 'bg-gray-500'}>{plano.ativo ? 'ATIVO' : 'INATIVO'}</Badge>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer size={18} className="mr-2" /> Imprimir</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><User size={16} /><span className="text-sm">Aluno</span></div>
          <p className="font-medium">{plano.aluno_nome}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Target size={16} /><span className="text-sm">Objetivo</span></div>
          <p className="font-medium capitalize">{plano.objetivo}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar size={16} /><span className="text-sm">Início</span></div>
          <p className="font-medium">{new Date(plano.data_inicio).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1"><UtensilsCrossed size={16} /><span className="text-sm">Refeições</span></div>
          <p className="font-medium">{plano.refeicoes?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">Metas Diárias</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Calorias:</span><b>{plano.calorias_alvo} kcal</b></div>
            <div className="flex justify-between"><span>Proteínas:</span><b className="text-blue-600">{plano.proteinas_alvo}g</b></div>
            <div className="flex justify-between"><span>Carboidratos:</span><b className="text-green-600">{plano.carboidratos_alvo}g</b></div>
            <div className="flex justify-between"><span>Gorduras:</span><b className="text-yellow-600">{plano.gorduras_alvo}g</b></div>
          </div>
        </div>
        <GraficoMacros proteinas={plano.proteinas_alvo} carboidratos={plano.carboidratos_alvo} gorduras={plano.gorduras_alvo} calorias={plano.calorias_alvo} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b"><h2 className="font-semibold">Refeições</h2></div>
        <div className="divide-y">
          {plano.refeicoes?.map((ref, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{ref.nome}</h3>
                {ref.horario_sugerido && <span className="text-sm text-gray-500">{ref.horario_sugerido}</span>}
              </div>
              {ref.alimentos?.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum alimento</p>
              ) : (
                <ul className="space-y-1">
                  {ref.alimentos?.map((a, j) => (
                    <li key={j} className="text-sm text-gray-600">• {a.alimento_nome || 'Alimento'} - {a.quantidade}g</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {plano.restricoes?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-2">Restrições</h3>
          <div className="flex flex-wrap gap-2">
            {plano.restricoes.map((r, i) => <Badge key={i} variant="outline">{r}</Badge>)}
          </div>
        </div>
      )}

      {plano.observacoes && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-2">Observações</h3>
          <p className="text-gray-600">{plano.observacoes}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1" onClick={() => navigate(`/nutricao/registro?plano=${plano.id}&aluno=${plano.aluno_id}`)}>Registrar Consumo</Button>
        <Button variant="outline" className="flex-1" onClick={() => navigate(`/nutricao/relatorio/${plano.aluno_id}`)}>Ver Relatório</Button>
      </div>
    </div>
  );
};

export default DetalhesPlanoAlimentar;
