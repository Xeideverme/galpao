import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

const Planos = () => {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor_mensal: '',
    modalidades: [],
    duracao_meses: 1
  });

  const modalidadesOptions = React.useMemo(() => [
    { id: 'crossfit', label: 'CrossFit' },
    { id: 'musculacao', label: 'Musculação' },
    { id: 'profissional', label: 'Treinamento Profissional' },
    { id: 'funcional', label: 'Funcional' },
    { id: 'yoga', label: 'Yoga' },
  ], []);

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      const response = await api.get('/planos');
      setPlanos(response.data);
    } catch (error) {
      console.error('Error loading planos:', error);
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = {
        ...formData,
        valor_mensal: parseFloat(formData.valor_mensal)
      };
      await api.post('/planos', data);
      setSuccess('Plano cadastrado com sucesso!');
      await loadPlanos();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao salvar plano');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      await api.delete(`/planos/${id}`);
      setSuccess('Plano excluído com sucesso!');
      await loadPlanos();
    } catch (error) {
      setError('Erro ao excluir plano');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      valor_mensal: '',
      modalidades: [],
      duracao_meses: 1
    });
  };

  const handleModalidadeToggle = (modalidadeId) => {
    setFormData(prev => ({
      ...prev,
      modalidades: prev.modalidades.includes(modalidadeId)
        ? prev.modalidades.filter(m => m !== modalidadeId)
        : [...prev.modalidades, modalidadeId]
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="planos-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos</h1>
          <p className="text-gray-500 mt-1">Gerencie os planos oferecidos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-plano-btn">
              <Plus className="mr-2 h-4 w-4" /> Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Plano</DialogTitle>
              <DialogDescription>Cadastre um novo plano no sistema</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome do Plano *</Label>
                  <Input
                    id="nome"
                    data-testid="plano-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Plano Mensal CrossFit"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    data-testid="plano-descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do plano"
                  />
                </div>
                <div>
                  <Label htmlFor="valor_mensal">Valor Mensal (R$) *</Label>
                  <Input
                    id="valor_mensal"
                    data-testid="plano-valor"
                    type="number"
                    step="0.01"
                    value={formData.valor_mensal}
                    onChange={(e) => setFormData({ ...formData, valor_mensal: e.target.value })}
                    placeholder="199.90"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duracao_meses">Duração (meses)</Label>
                  <Input
                    id="duracao_meses"
                    data-testid="plano-duracao"
                    type="number"
                    min="1"
                    value={formData.duracao_meses}
                    onChange={(e) => setFormData({ ...formData, duracao_meses: parseInt(e.target.value) })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Modalidades Incluídas</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {modalidadesOptions.map(modalidade => (
                      <div key={modalidade.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={modalidade.id}
                          data-testid={`modalidade-${modalidade.id}`}
                          checked={formData.modalidades.includes(modalidade.id)}
                          onCheckedChange={() => handleModalidadeToggle(modalidade.id)}
                        />
                        <label htmlFor={modalidade.id} className="text-sm cursor-pointer">
                          {modalidade.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" data-testid="plano-submit-btn">Cadastrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert data-testid="success-alert">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Planos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <Card key={plano.id} data-testid={`plano-card-${plano.id}`} className="relative hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{plano.nome}</CardTitle>
                    <CardDescription>{plano.descricao}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  R$ {plano.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600 mt-1">por mês</p>
              </div>
              
              {plano.modalidades && plano.modalidades.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Modalidades:</p>
                  <div className="flex flex-wrap gap-2">
                    {plano.modalidades.map((modalidade, index) => (
                      <Badge key={index} variant="secondary">
                        {modalidade}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDelete(plano.id)}
                  data-testid={`delete-plano-${plano.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {planos.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Nenhum plano cadastrado
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Planos;
