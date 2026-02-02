import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Clock, Trash2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Aulas = () => {
  const [aulas, setAulas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    modalidade: '',
    professor_id: '',
    dia_semana: '',
    horario: '',
    capacidade_maxima: 15
  });

  const diasSemana = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' },
  ];

  const modalidades = [
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'musculacao', label: 'Musculação' },
    { value: 'profissional', label: 'Treinamento Profissional' },
    { value: 'funcional', label: 'Funcional' },
    { value: 'yoga', label: 'Yoga' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [aulasRes, profsRes] = await Promise.all([
        api.get('/aulas'),
        api.get('/professores')
      ]);
      setAulas(aulasRes.data);
      setProfessores(profsRes.data);
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
      const data = {
        ...formData,
        capacidade_maxima: parseInt(formData.capacidade_maxima)
      };
      await api.post('/aulas', data);
      setSuccess('Aula cadastrada com sucesso!');
      await loadData();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao cadastrar aula');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta aula?')) return;

    try {
      await api.delete(`/aulas/${id}`);
      setSuccess('Aula excluída com sucesso!');
      await loadData();
    } catch (error) {
      setError('Erro ao excluir aula');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      modalidade: '',
      professor_id: '',
      dia_semana: '',
      horario: '',
      capacidade_maxima: 15
    });
  };

  const groupByDay = () => {
    const grouped = {};
    diasSemana.forEach(dia => {
      grouped[dia.value] = aulas.filter(aula => aula.dia_semana === dia.value);
    });
    return grouped;
  };

  const aulasPorDia = groupByDay();

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="aulas-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aulas</h1>
          <p className="text-gray-500 mt-1">Gerencie a grade de horários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-aula-btn">
              <Plus className="mr-2 h-4 w-4" /> Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Aula</DialogTitle>
              <DialogDescription>Cadastre uma nova aula na grade</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div>
                <Label htmlFor="nome">Nome da Aula *</Label>
                <Input
                  id="nome"
                  data-testid="aula-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: CrossFit Iniciante"
                  required
                />
              </div>
              <div>
                <Label htmlFor="modalidade">Modalidade *</Label>
                <Select value={formData.modalidade} onValueChange={(value) => setFormData({ ...formData, modalidade: value })}>
                  <SelectTrigger data-testid="aula-modalidade">
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalidades.map(mod => (
                      <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="professor_id">Professor *</Label>
                <Select value={formData.professor_id} onValueChange={(value) => setFormData({ ...formData, professor_id: value })}>
                  <SelectTrigger data-testid="aula-professor">
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
                <Label htmlFor="dia_semana">Dia da Semana *</Label>
                <Select value={formData.dia_semana} onValueChange={(value) => setFormData({ ...formData, dia_semana: value })}>
                  <SelectTrigger data-testid="aula-dia">
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map(dia => (
                      <SelectItem key={dia.value} value={dia.value}>{dia.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="horario">Horário *</Label>
                <Input
                  id="horario"
                  data-testid="aula-horario"
                  type="time"
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacidade_maxima">Capacidade Máxima *</Label>
                <Input
                  id="capacidade_maxima"
                  data-testid="aula-capacidade"
                  type="number"
                  min="1"
                  value={formData.capacidade_maxima}
                  onChange={(e) => setFormData({ ...formData, capacidade_maxima: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" data-testid="aula-submit-btn">Cadastrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert data-testid="success-alert"><AlertDescription>{success}</AlertDescription></Alert>}

      {/* Grade de Horários */}
      <div className="space-y-6">
        {diasSemana.map(dia => (
          <div key={dia.value}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              {dia.label}
            </h3>
            {aulasPorDia[dia.value].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aulasPorDia[dia.value].map((aula) => (
                  <Card key={aula.id} data-testid={`aula-card-${aula.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{aula.nome}</CardTitle>
                          <Badge variant="outline" className="mt-1">{aula.modalidade}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{aula.horario}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Cap: {aula.capacidade_maxima} alunos</span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">
                          Professor: <span className="font-medium">{aula.professor_nome}</span>
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleDelete(aula.id)}
                        data-testid={`delete-aula-${aula.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-gray-500">
                  Nenhuma aula cadastrada para este dia
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Aulas;
