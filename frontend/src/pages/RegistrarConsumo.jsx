import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Check, Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const RegistrarConsumo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [planos, setPlanos] = useState([]);
  const [alimentos, setAlimentos] = useState([]);
  const [selectedPlano, setSelectedPlano] = useState(null);
  
  const [planoId, setPlanoId] = useState(searchParams.get('plano') || '');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [aguaMl, setAguaMl] = useState(0);
  const [pesoDia, setPesoDia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [refeicoes, setRefeicoes] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentRefeicao, setCurrentRefeicao] = useState(null);
  const [searchAlimento, setSearchAlimento] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/planos-alimentares?ativo=true`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/api/alimentos`, { headers: { Authorization: `Bearer ${token}` } })
    ]).then(([p, a]) => {
      setPlanos(p.data);
      setAlimentos(a.data);
      if (planoId) {
        const plano = p.data.find(x => x.id === planoId);
        if (plano) selectPlano(plano);
      }
    }).finally(() => setLoading(false));
  }, []);

  const selectPlano = (plano) => {
    setSelectedPlano(plano);
    setRefeicoes(plano.refeicoes.map(r => ({
      nome: r.nome,
      seguiu_plano: true,
      alimentos: r.alimentos.map(a => ({ ...a }))
    })));
  };

  const toggleSeguiuPlano = (index, checked) => {
    const updated = [...refeicoes];
    updated[index].seguiu_plano = checked;
    setRefeicoes(updated);
  };

  const openAddAlimento = (index) => {
    setCurrentRefeicao(index);
    setShowAddModal(true);
  };

  const addAlimento = (alimento) => {
    const updated = [...refeicoes];
    updated[currentRefeicao].alimentos.push({ alimento_id: alimento.id, alimento_nome: alimento.nome, quantidade: 100 });
    setRefeicoes(updated);
    setShowAddModal(false);
  };

  const handleSubmit = async () => {
    if (!selectedPlano) { toast.error('Selecione um plano'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/registros-alimentares`, {
        aluno_id: selectedPlano.aluno_id,
        data,
        refeicoes_consumidas: refeicoes,
        agua_ml: aguaMl || null,
        peso_dia: pesoDia ? parseFloat(pesoDia) : null,
        observacoes: observacoes || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Registro salvo!');
      navigate(`/nutricao/relatorio/${selectedPlano.aluno_id}`);
    } catch (e) { toast.error('Erro ao salvar'); }
    finally { setSubmitting(false); }
  };

  const filteredAlimentos = alimentos.filter(a => a.nome.toLowerCase().includes(searchAlimento.toLowerCase()));

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="registrar-consumo-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
        <div><h1 className="text-2xl font-bold">Registrar Consumo</h1><p className="text-gray-500">O que você comeu hoje?</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Plano Alimentar</Label>
            <Select value={planoId} onValueChange={v => { setPlanoId(v); const p = planos.find(x => x.id === v); if (p) selectPlano(p); }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{planos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} - {p.aluno_nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Água (ml)</Label><Input type="number" value={aguaMl} onChange={e => setAguaMl(parseInt(e.target.value))} placeholder="Ex: 2000" /></div>
          <div><Label>Peso do Dia (kg)</Label><Input type="number" step="0.1" value={pesoDia} onChange={e => setPesoDia(e.target.value)} placeholder="Ex: 75.5" /></div>
        </div>
      </div>

      {selectedPlano && (
        <div className="space-y-4">
          {refeicoes.map((ref, index) => (
            <div key={index} className={`bg-white rounded-xl shadow-sm border p-4 ${ref.seguiu_plano ? 'border-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={ref.seguiu_plano} onCheckedChange={c => toggleSeguiuPlano(index, c)} />
                  <h3 className="font-medium">{ref.nome}</h3>
                  {ref.seguiu_plano && <Check className="text-green-600" size={18} />}
                </div>
                <Button size="sm" variant="outline" onClick={() => openAddAlimento(index)}><Plus size={14} /> Alimento</Button>
              </div>
              <div className="space-y-2">
                {ref.alimentos.map((a, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                    <span className="flex-1">{a.alimento_nome}</span>
                    <Input type="number" value={a.quantidade} onChange={e => { const u = [...refeicoes]; u[index].alimentos[j].quantidade = parseFloat(e.target.value); setRefeicoes(u); }} className="w-20 h-8" />
                    <span className="text-gray-500">g</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <Label>Observações</Label>
        <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Como foi sua alimentação hoje?" className="mt-2" />
      </div>

      <Button onClick={handleSubmit} disabled={submitting || !selectedPlano} className="w-full bg-green-600 hover:bg-green-700">
        {submitting ? 'Salvando...' : 'Salvar Registro'}
      </Button>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Adicionar Alimento</DialogTitle></DialogHeader>
          <Input placeholder="Buscar..." value={searchAlimento} onChange={e => setSearchAlimento(e.target.value)} className="mb-4" />
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredAlimentos.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer" onClick={() => addAlimento(a)}>
                <span className="text-sm font-medium">{a.nome}</span>
                <span className="text-xs text-gray-500">{a.calorias_por_100g}kcal</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrarConsumo;
