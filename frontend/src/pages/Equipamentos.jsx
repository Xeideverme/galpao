import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Dumbbell, Trash2, Wrench } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Equipamentos = () => {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    quantidade: 1,
    status: 'bom',
    ultima_manutencao: '',
    proxima_manutencao: ''
  });

  const categorias = [
    { value: 'cardio', label: 'Cardio' },
    { value: 'forca', label: 'Força' },
    { value: 'funcional', label: 'Funcional' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'acessorios', label: 'Acessórios' },
  ];

  const statusOptions = [
    { value: 'bom', label: 'Bom', color: 'bg-green-100 text-green-800' },
    { value: 'manutencao', label: 'Manutenção', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'quebrado', label: 'Quebrado', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    loadEquipamentos();
  }, []);

  const loadEquipamentos = async () => {
    try {
      const response = await api.get('/equipamentos');
      setEquipamentos(response.data);
    } catch (error) {
      console.error('Error loading equipamentos:', error);
      setError('Erro ao carregar equipamentos');
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
        quantidade: parseInt(formData.quantidade)
      };
      await api.post('/equipamentos', data);
      setSuccess('Equipamento cadastrado com sucesso!');
      await loadEquipamentos();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao cadastrar equipamento');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento?')) return;

    try {
      await api.delete(`/equipamentos/${id}`);
      setSuccess('Equipamento excluído com sucesso!');
      await loadEquipamentos();
    } catch (error) {
      setError('Erro ao excluir equipamento');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      quantidade: 1,
      status: 'bom',
      ultima_manutencao: '',
      proxima_manutencao: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return statusInfo || statusOptions[0];
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="equipamentos-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-gray-500 mt-1">Gerencie os equipamentos do CT</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-equipamento-btn">
              <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Equipamento</DialogTitle>
              <DialogDescription>Cadastre um novo equipamento</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  data-testid="equipamento-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Barra Olímpica"
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                  <SelectTrigger data-testid="equipamento-categoria">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  data-testid="equipamento-quantidade"
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger data-testid="equipamento-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ultima_manutencao">Última Manutenção</Label>
                <Input
                  id="ultima_manutencao"
                  data-testid="equipamento-ultima-manutencao"
                  type="date"
                  value={formData.ultima_manutencao}
                  onChange={(e) => setFormData({ ...formData, ultima_manutencao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="proxima_manutencao">Próxima Manutenção</Label>
                <Input
                  id="proxima_manutencao"
                  data-testid="equipamento-proxima-manutencao"
                  type="date"
                  value={formData.proxima_manutencao}
                  onChange={(e) => setFormData({ ...formData, proxima_manutencao: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" data-testid="equipamento-submit-btn">Cadastrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert data-testid="success-alert"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipamentos.map((equipamento) => {
          const statusBadge = getStatusBadge(equipamento.status);
          return (
            <Card key={equipamento.id} data-testid={`equipamento-card-${equipamento.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Dumbbell className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{equipamento.nome}</CardTitle>
                      <Badge variant="outline" className="mt-1">{equipamento.categoria}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantidade:</span>
                  <span className="font-medium">{equipamento.quantidade}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                </div>
                {equipamento.proxima_manutencao && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Wrench className="h-4 w-4" />
                      <span>Próx. Manutenção: {equipamento.proxima_manutencao}</span>
                    </div>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => handleDelete(equipamento.id)}
                  data-testid={`delete-equipamento-${equipamento.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {equipamentos.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Nenhum equipamento cadastrado
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Equipamentos;
