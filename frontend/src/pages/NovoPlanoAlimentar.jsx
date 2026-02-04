import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ArrowRight, Check, Plus, Search, Trash2, Calculator } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import GraficoMacros from '../components/GraficoMacros';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const objetivos = [
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'saude', label: 'Saúde Geral' },
];

const restricoesOpcoes = ['Lactose', 'Glúten', 'Vegetariano', 'Vegano', 'Low Carb', 'Sem Açúcar'];

const refeicoesBase = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'];

const NovoPlanoAlimentar = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [alimentos, setAlimentos] = useState([]);
  
  const [formData, setFormData] = useState({
    aluno_id: '', nutricionista_id: '', nome: '', objetivo: 'hipertrofia',
    data_inicio: new Date().toISOString().split('T')[0], data_fim: '',
    calorias_alvo: 2000, proteinas_alvo: 150, carboidratos_alvo: 200, gorduras_alvo: 70,
    restricoes: [], observacoes: ''
  });
  
  const [calcData, setCalcData] = useState({ peso: 70, altura: 170, idade: 30, sexo: 'masculino', nivel_atividade: 'moderado', objetivo: 'hipertrofia' });
  const [refeicoes, setRefeicoes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentRefeicao, setCurrentRefeicao] = useState(null);
  const [searchAlimento, setSearchAlimento] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/alunos`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/api/professores`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/api/alimentos`, { headers: { Authorization: `Bearer ${token}` } })
    ]).then(([a, p, al]) => {
      setAlunos(a.data.filter(x => x.status === 'ativo'));
      setProfessores(p.data.filter(x => x.ativo));
      setAlimentos(al.data);
    });
  }, []);

  const calcularMacros = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/planos-alimentares/calcular-macros`, calcData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ ...formData, calorias_alvo: res.data.calorias_alvo, proteinas_alvo: res.data.proteinas_alvo, carboidratos_alvo: res.data.carboidratos_alvo, gorduras_alvo: res.data.gorduras_alvo });
      toast.success(`TMB: ${res.data.tmb} | TDEE: ${res.data.tdee} | Calorias: ${res.data.calorias_alvo}`);
    } catch { toast.error('Erro ao calcular'); }
  };

  const addRefeicao = (nome) => {
    setRefeicoes([...refeicoes, { nome, horario_sugerido: '', alimentos: [] }]);
  };

  const removeRefeicao = (index) => {
    setRefeicoes(refeicoes.filter((_, i) => i !== index));
  };

  const openAddAlimento = (index) => {
    setCurrentRefeicao(index);
    setShowAddModal(true);
  };

  const addAlimentoToRefeicao = (alimento) => {
    const updated = [...refeicoes];
    updated[currentRefeicao].alimentos.push({ alimento_id: alimento.id, alimento_nome: alimento.nome, quantidade: 100, _macros: alimento });
    setRefeicoes(updated);
  };

  const updateAlimentoQtd = (refIndex, alimIndex, qtd) => {
    const updated = [...refeicoes];
    updated[refIndex].alimentos[alimIndex].quantidade = qtd;
    setRefeicoes(updated);
  };

  const removeAlimento = (refIndex, alimIndex) => {
    const updated = [...refeicoes];
    updated[refIndex].alimentos.splice(alimIndex, 1);
    setRefeicoes(updated);
  };

  const calcTotalDia = () => {
    let cal = 0, p = 0, c = 0, g = 0;
    refeicoes.forEach(ref => {
      ref.alimentos.forEach(a => {
        const fator = a.quantidade / 100;
        const m = a._macros || {};
        cal += (m.calorias_por_100g || 0) * fator;
        p += (m.proteinas_por_100g || 0) * fator;
        c += (m.carboidratos_por_100g || 0) * fator;
        g += (m.gorduras_por_100g || 0) * fator;
      });
    });
    return { cal: Math.round(cal), p: Math.round(p), c: Math.round(c), g: Math.round(g) };
  };

  const handleSubmit = async () => {
    if (refeicoes.length === 0 || refeicoes.every(r => r.alimentos.length === 0)) {
      toast.error('Adicione pelo menos um alimento'); return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        refeicoes: refeicoes.map(r => ({
          nome: r.nome,
          horario_sugerido: r.horario_sugerido || '',
          alimentos: r.alimentos.map(a => ({ alimento_id: a.alimento_id, quantidade: a.quantidade, substituicoes: [] }))
        }))
      };
      await axios.post(`${API_URL}/api/planos-alimentares`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Plano criado!');
      navigate('/planos-alimentares');
    } catch (e) { toast.error(e.response?.data?.detail || 'Erro'); }
    finally { setLoading(false); }
  };

  const total = calcTotalDia();
  const filteredAlimentos = alimentos.filter(a => a.nome.toLowerCase().includes(searchAlimento.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="novo-plano-alimentar-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/planos-alimentares')}><ArrowLeft size={20} /></Button>
        <div><h1 className="text-2xl font-bold">Novo Plano Alimentar</h1><p className="text-gray-500">Passo {step} de 4</p></div>
      </div>

      <div className="flex items-center gap-2">
        {[1,2,3,4].map(s => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {s < step ? <Check size={20} /> : s}
            </div>
            {s < 4 && <div className={`flex-1 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Dados Básicos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Aluno *</Label>
              <Select value={formData.aluno_id} onValueChange={v => setFormData({...formData, aluno_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{alunos.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nutricionista *</Label>
              <Select value={formData.nutricionista_id} onValueChange={v => setFormData({...formData, nutricionista_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{professores.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Nome do Plano *</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Dieta para Hipertrofia" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Objetivo *</Label>
              <Select value={formData.objetivo} onValueChange={v => setFormData({...formData, objetivo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{objetivos.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data Início</Label><Input type="date" value={formData.data_inicio} onChange={e => setFormData({...formData, data_inicio: e.target.value})} /></div>
          </div>
          <div><Label>Restrições Alimentares</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {restricoesOpcoes.map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={formData.restricoes.includes(r)} onCheckedChange={c => setFormData({...formData, restricoes: c ? [...formData.restricoes, r] : formData.restricoes.filter(x => x !== r)})} />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Calcular Macros</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Peso (kg)</Label><Input type="number" value={calcData.peso} onChange={e => setCalcData({...calcData, peso: parseFloat(e.target.value)})} /></div>
            <div><Label>Altura (cm)</Label><Input type="number" value={calcData.altura} onChange={e => setCalcData({...calcData, altura: parseFloat(e.target.value)})} /></div>
            <div><Label>Idade</Label><Input type="number" value={calcData.idade} onChange={e => setCalcData({...calcData, idade: parseInt(e.target.value)})} /></div>
            <div><Label>Sexo</Label>
              <Select value={calcData.sexo} onValueChange={v => setCalcData({...calcData, sexo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Nível Atividade</Label>
              <Select value={calcData.nivel_atividade} onValueChange={v => setCalcData({...calcData, nivel_atividade: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentário</SelectItem>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="intenso">Intenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Objetivo</Label>
              <Select value={calcData.objetivo} onValueChange={v => setCalcData({...calcData, objetivo: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={calcularMacros}><Calculator size={18} className="mr-2" /> Calcular TMB/TDEE</Button>
          
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div><Label>Calorias Alvo</Label><Input type="number" value={formData.calorias_alvo} onChange={e => setFormData({...formData, calorias_alvo: parseInt(e.target.value)})} /></div>
            <div><Label>Proteínas (g)</Label><Input type="number" value={formData.proteinas_alvo} onChange={e => setFormData({...formData, proteinas_alvo: parseFloat(e.target.value)})} /></div>
            <div><Label>Carboidratos (g)</Label><Input type="number" value={formData.carboidratos_alvo} onChange={e => setFormData({...formData, carboidratos_alvo: parseFloat(e.target.value)})} /></div>
            <div><Label>Gorduras (g)</Label><Input type="number" value={formData.gorduras_alvo} onChange={e => setFormData({...formData, gorduras_alvo: parseFloat(e.target.value)})} /></div>
          </div>
          <GraficoMacros proteinas={formData.proteinas_alvo} carboidratos={formData.carboidratos_alvo} gorduras={formData.gorduras_alvo} calorias={formData.calorias_alvo} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Montar Refeições</h2>
              <Select onValueChange={addRefeicao}>
                <SelectTrigger className="w-48"><SelectValue placeholder="+ Adicionar Refeição" /></SelectTrigger>
                <SelectContent>{refeicoesBase.filter(r => !refeicoes.find(x => x.nome === r)).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            
            {refeicoes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Adicione refeições usando o seletor acima</p>
            ) : (
              <div className="space-y-4">
                {refeicoes.map((ref, refIndex) => (
                  <div key={refIndex} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{ref.nome}</h3>
                      <div className="flex gap-2">
                        <Input placeholder="Horário" value={ref.horario_sugerido} onChange={e => { const u = [...refeicoes]; u[refIndex].horario_sugerido = e.target.value; setRefeicoes(u); }} className="w-24 h-8" />
                        <Button size="sm" variant="outline" onClick={() => openAddAlimento(refIndex)}><Plus size={14} /> Alimento</Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeRefeicao(refIndex)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                    {ref.alimentos.length === 0 ? (
                      <p className="text-sm text-gray-400">Nenhum alimento</p>
                    ) : (
                      <div className="space-y-2">
                        {ref.alimentos.map((a, aIndex) => (
                          <div key={aIndex} className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                            <span className="flex-1 text-sm">{a.alimento_nome}</span>
                            <Input type="number" value={a.quantidade} onChange={e => updateAlimentoQtd(refIndex, aIndex, parseFloat(e.target.value))} className="w-20 h-8" />
                            <span className="text-xs text-gray-500">g</span>
                            <Button size="sm" variant="ghost" onClick={() => removeAlimento(refIndex, aIndex)}><Trash2 size={14} /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-medium mb-2">Total do Dia</h3>
            <div className="flex gap-6">
              <span>Calorias: <b className={total.cal > formData.calorias_alvo ? 'text-red-600' : 'text-green-600'}>{total.cal}</b>/{formData.calorias_alvo}</span>
              <span>P: <b>{total.p}g</b></span>
              <span>C: <b>{total.c}g</b></span>
              <span>G: <b>{total.g}g</b></span>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Revisão</h2>
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
            <div><span className="text-gray-500">Aluno:</span> <b>{alunos.find(a => a.id === formData.aluno_id)?.nome}</b></div>
            <div><span className="text-gray-500">Objetivo:</span> <b className="capitalize">{formData.objetivo}</b></div>
            <div><span className="text-gray-500">Calorias:</span> <b>{formData.calorias_alvo} kcal</b></div>
            <div><span className="text-gray-500">Macros:</span> <b>P:{formData.proteinas_alvo}g C:{formData.carboidratos_alvo}g G:{formData.gorduras_alvo}g</b></div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Refeições ({refeicoes.length})</h3>
            {refeicoes.map((r, i) => (
              <div key={i} className="border rounded p-3 mb-2">
                <p className="font-medium">{r.nome} {r.horario_sugerido && `- ${r.horario_sugerido}`}</p>
                <ul className="text-sm text-gray-600">{r.alimentos.map((a, j) => <li key={j}>• {a.alimento_nome} ({a.quantidade}g)</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}><ArrowLeft size={18} className="mr-2" /> Voltar</Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={(step === 1 && (!formData.aluno_id || !formData.nutricionista_id || !formData.nome))}>Próximo <ArrowRight size={18} className="ml-2" /></Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">{loading ? 'Salvando...' : 'Criar Plano'}</Button>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Adicionar Alimento</DialogTitle></DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input placeholder="Buscar..." value={searchAlimento} onChange={e => setSearchAlimento(e.target.value)} className="pl-10" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredAlimentos.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                <div>
                  <p className="font-medium text-sm">{a.nome}</p>
                  <p className="text-xs text-gray-500">{a.calorias_por_100g}kcal | P:{a.proteinas_por_100g}g C:{a.carboidratos_por_100g}g G:{a.gorduras_por_100g}g</p>
                </div>
                <Button size="sm" onClick={() => { addAlimentoToRefeicao(a); setShowAddModal(false); }}><Plus size={14} /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NovoPlanoAlimentar;
