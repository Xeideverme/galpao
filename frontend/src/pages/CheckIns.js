import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle, Clock, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CheckIns = () => {
  const [checkins, setCheckins] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    aluno_id: '',
    tipo: 'entrada'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [checkinsRes, alunosRes] = await Promise.all([
        api.get('/checkins'),
        api.get('/alunos')
      ]);
      setCheckins(checkinsRes.data);
      setAlunos(alunosRes.data.filter(a => a.status === 'ativo'));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/checkins', formData);
      setSuccess('Check-in registrado com sucesso!');
      await loadData();
      setDialogOpen(false);
      setFormData({ aluno_id: '', tipo: 'entrada' });
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao registrar check-in');
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const checkinsHoje = checkins.filter(c => {
    const hoje = new Date().toISOString().split('T')[0];
    return c.data_hora.startsWith(hoje);
  });

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="checkins-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-ins</h1>
          <p className="text-gray-500 mt-1">Registre a entrada dos alunos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-checkin-btn">
              <Plus className="mr-2 h-4 w-4" /> Novo Check-in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Check-in</DialogTitle>
              <DialogDescription>Registre a entrada de um aluno</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div>
                <Label htmlFor="aluno_id">Aluno *</Label>
                <Select value={formData.aluno_id} onValueChange={(value) => setFormData({ ...formData, aluno_id: value })}>
                  <SelectTrigger data-testid="checkin-aluno">
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
                <Label htmlFor="tipo">Tipo de Check-in *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger data-testid="checkin-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="aula">Aula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" data-testid="checkin-submit-btn">Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert data-testid="success-alert"><AlertDescription>{success}</AlertDescription></Alert>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Check-ins Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{checkinsHoje.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total de Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{checkins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Alunos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{alunos.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Check-ins List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checkins.slice(0, 50).map((checkin) => (
              <div key={checkin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`checkin-item-${checkin.id}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{checkin.aluno_nome}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(checkin.data_hora)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 capitalize">{checkin.tipo}</span>
                </div>
              </div>
            ))}
            {checkins.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Nenhum check-in registrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckIns;
