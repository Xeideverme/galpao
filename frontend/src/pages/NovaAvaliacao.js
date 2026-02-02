import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, ArrowLeft } from 'lucide-react';
import CircunferenciaInput from '../components/CircunferenciaInput';
import FotoUploader from '../components/FotoUploader';

const NovaAvaliacao = () => {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    aluno_id: '',
    professor_id: '',
    data_avaliacao: new Date().toISOString().split('T')[0],
    peso: '',
    altura: '',
    percentual_gordura: '',
    massa_magra: '',
    observacoes: '',
    objetivos: ''
  });

  const [circunferencias, setCircunferencias] = useState({
    pescoco: 0,
    torax: 0,
    cintura: 0,
    abdomen: 0,
    quadril: 0,
    braco_direito: 0,
    braco_esquerdo: 0,
    antebraco_direito: 0,
    antebraco_esquerdo: 0,
    coxa_direita: 0,
    coxa_esquerda: 0,
    panturrilha_direita: 0,
    panturrilha_esquerda: 0,
  });

  const [dobrasCutaneas, setDobrasCutaneas] = useState({
    triceps: 0,
    subescapular: 0,
    biceps: 0,
    suprailiaca: 0,
    abdominal: 0,
    coxa: 0,
  });

  const [fotos, setFotos] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alunosRes, profsRes] = await Promise.all([
        api.get('/alunos'),
        api.get('/professores')
      ]);
      setAlunos(alunosRes.data.filter(a => a.status === 'ativo'));
      setProfessores(profsRes.data.filter(p => p.ativo));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const calcularIMC = () => {
    if (formData.peso && formData.altura) {
      const peso = parseFloat(formData.peso);
      const altura = parseFloat(formData.altura) / 100;
      return (peso / (altura * altura)).toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSalvando(true);

    try {
      const dados = {
        ...formData,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        percentual_gordura: formData.percentual_gordura ? parseFloat(formData.percentual_gordura) : null,
        massa_magra: formData.massa_magra ? parseFloat(formData.massa_magra) : null,
        circunferencias,
        dobras_cutaneas: dobrasCutaneas,
        fotos
      };

      await api.post('/avaliacoes', dados);
      setSuccess('Avaliação cadastrada com sucesso!');
      
      setTimeout(() => {
        navigate('/avaliacoes');
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      setError(error.response?.data?.detail || 'Erro ao salvar avaliação');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const imc = calcularIMC();

  return (
    <div className="space-y-6" data-testid="nova-avaliacao-page">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/avaliacoes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Avaliação Física</h1>
          <p className="text-gray-500 mt-1">Registre uma nova avaliação física</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert data-testid="success-alert">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados do aluno e avaliação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aluno_id">Aluno *</Label>
                <Select 
                  value={formData.aluno_id} 
                  onValueChange={(value) => setFormData({ ...formData, aluno_id: value })}
                  required
                >
                  <SelectTrigger data-testid="select-aluno">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos.map(aluno => (
                      <SelectItem key={aluno.id} value={aluno.id}>{aluno.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="professor_id">Professor *</Label>
                <Select 
                  value={formData.professor_id} 
                  onValueChange={(value) => setFormData({ ...formData, professor_id: value })}
                  required
                >
                  <SelectTrigger data-testid="select-professor">
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>{prof.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_avaliacao">Data da Avaliação *</Label>
                <Input
                  id="data_avaliacao"
                  data-testid="data-avaliacao"
                  type="date"
                  value={formData.data_avaliacao}
                  onChange={(e) => setFormData({ ...formData, data_avaliacao: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medidas Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Medidas Básicas</CardTitle>
            <CardDescription>Peso, altura e composição corporal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input
                  id="peso"
                  data-testid="input-peso"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  placeholder="70.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="altura">Altura (cm) *</Label>
                <Input
                  id="altura"
                  data-testid="input-altura"
                  type="number"
                  step="0.1"
                  min="100"
                  max="250"
                  value={formData.altura}
                  onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  placeholder="170"
                  required
                />
              </div>

              <div>
                <Label>IMC (calculado)</Label>
                <div className="h-10 flex items-center px-3 bg-gray-50 rounded-md border text-lg font-bold">
                  {imc}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="percentual_gordura">% Gordura</Label>
                <Input
                  id="percentual_gordura"
                  data-testid="input-gordura"
                  type="number"
                  step="0.1"
                  min="3"
                  max="60"
                  value={formData.percentual_gordura}
                  onChange={(e) => setFormData({ ...formData, percentual_gordura: e.target.value })}
                  placeholder="15.5"
                />
              </div>

              <div>
                <Label htmlFor="massa_magra">Massa Magra (kg)</Label>
                <Input
                  id="massa_magra"
                  data-testid="input-massa-magra"
                  type="number"
                  step="0.1"
                  value={formData.massa_magra}
                  onChange={(e) => setFormData({ ...formData, massa_magra: e.target.value })}
                  placeholder="60.0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Circunferências */}
        <Card>
          <CardHeader>
            <CardTitle>Circunferências</CardTitle>
            <CardDescription>Medidas em centímetros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <CircunferenciaInput 
                label="Pescoço" 
                id="pescoco" 
                value={circunferencias.pescoco}
                onChange={(v) => setCircunferencias({...circunferencias, pescoco: v})}
                testId="circ-pescoco"
              />
              <CircunferenciaInput 
                label="Tórax" 
                id="torax" 
                value={circunferencias.torax}
                onChange={(v) => setCircunferencias({...circunferencias, torax: v})}
                testId="circ-torax"
              />
              <CircunferenciaInput 
                label="Cintura" 
                id="cintura" 
                value={circunferencias.cintura}
                onChange={(v) => setCircunferencias({...circunferencias, cintura: v})}
                testId="circ-cintura"
              />
              <CircunferenciaInput 
                label="Abdômen" 
                id="abdomen" 
                value={circunferencias.abdomen}
                onChange={(v) => setCircunferencias({...circunferencias, abdomen: v})}
                testId="circ-abdomen"
              />
              <CircunferenciaInput 
                label="Quadril" 
                id="quadril" 
                value={circunferencias.quadril}
                onChange={(v) => setCircunferencias({...circunferencias, quadril: v})}
                testId="circ-quadril"
              />
              <CircunferenciaInput 
                label="Braço Direito" 
                id="braco_direito" 
                value={circunferencias.braco_direito}
                onChange={(v) => setCircunferencias({...circunferencias, braco_direito: v})}
                testId="circ-braco-direito"
              />
              <CircunferenciaInput 
                label="Braço Esquerdo" 
                id="braco_esquerdo" 
                value={circunferencias.braco_esquerdo}
                onChange={(v) => setCircunferencias({...circunferencias, braco_esquerdo: v})}
                testId="circ-braco-esquerdo"
              />
              <CircunferenciaInput 
                label="Coxa Direita" 
                id="coxa_direita" 
                value={circunferencias.coxa_direita}
                onChange={(v) => setCircunferencias({...circunferencias, coxa_direita: v})}
                testId="circ-coxa-direita"
              />
              <CircunferenciaInput 
                label="Coxa Esquerda" 
                id="coxa_esquerda" 
                value={circunferencias.coxa_esquerda}
                onChange={(v) => setCircunferencias({...circunferencias, coxa_esquerda: v})}
                testId="circ-coxa-esquerda"
              />
              <CircunferenciaInput 
                label="Panturrilha Direita" 
                id="panturrilha_direita" 
                value={circunferencias.panturrilha_direita}
                onChange={(v) => setCircunferencias({...circunferencias, panturrilha_direita: v})}
                testId="circ-panturrilha-direita"
              />
              <CircunferenciaInput 
                label="Panturrilha Esquerda" 
                id="panturrilha_esquerda" 
                value={circunferencias.panturrilha_esquerda}
                onChange={(v) => setCircunferencias({...circunferencias, panturrilha_esquerda: v})}
                testId="circ-panturrilha-esquerda"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dobras Cutâneas */}
        <Card>
          <CardHeader>
            <CardTitle>Dobras Cutâneas</CardTitle>
            <CardDescription>Protocolo de 7 dobras em milímetros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <CircunferenciaInput 
                label="Tríceps" 
                id="triceps" 
                value={dobrasCutaneas.triceps}
                onChange={(v) => setDobrasCutaneas({...dobrasCutaneas, triceps: v})}
                testId="dobra-triceps"
              />
              <CircunferenciaInput 
                label="Subescapular" 
                id="subescapular" 
                value={dobrasCutaneas.subescapular}
                onChange={(v) => setDobrasCutaneas({...dobrasCutaneas, subescapular: v})}
                testId="dobra-subescapular"
              />
              <CircunferenciaInput 
                label="Bíceps" 
                id="biceps" 
                value={dobrasCutaneas.biceps}
                onChange={(v) => setDobrasCutaneas({...dobrasCutaneas, biceps: v})}
                testId="dobra-biceps"
              />
              <CircunferenciaInput 
                label="Supraíliaca" 
                id="suprailiaca" 
                value={dobrasCutaneas.suprailiaca}
                onChange={(v) => setDobrasCutaneas({...dobrasCutaneas, suprailiaca: v})}
                testId="dobra-suprailiaca"
              />
              <CircunferenciaInput 
                label="Abdominal" 
                id="abdominal" 
                value={dobrasCutaneas.abdominal}
                onChange={(v) => setDobrasCutaneas({...dobrasCutaneas, abdominal: v})}
                testId="dobra-abdominal"
              />
              <CircunferenciaInput 
                label="Coxa" 
                id="coxa" 
                value={dobrasCutaneas.coxa}
                onChange={(v) => setDobrasCutaneas({...dobrasCutaneas, coxa: v})}
                testId="dobra-coxa"
              />
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <CardTitle>Fotos de Progresso</CardTitle>
            <CardDescription>Adicione até 6 fotos (frente, costas, lado)</CardDescription>
          </CardHeader>
          <CardContent>
            <FotoUploader fotos={fotos} setFotos={setFotos} />
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações e Objetivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                data-testid="input-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre a avaliação..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="objetivos">Objetivos do Aluno</Label>
              <Textarea
                id="objetivos"
                data-testid="input-objetivos"
                value={formData.objetivos}
                onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                placeholder="Objetivos e metas..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/avaliacoes')}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={salvando}
            data-testid="salvar-avaliacao-btn"
          >
            <Save className="mr-2 h-4 w-4" />
            {salvando ? 'Salvando...' : 'Salvar Avaliação'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovaAvaliacao;
