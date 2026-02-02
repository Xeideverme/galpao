import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, GraduationCap, Mail, Phone, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

const Professores = () => {
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidades: []
  });

  useEffect(() => {
    loadProfessores();
  }, []);

  const loadProfessores = async () => {
    try {
      const response = await api.get('/professores');
      setProfessores(response.data);
    } catch (error) {
      console.error('Error loading professores:', error);
      setError('Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/professores', formData);
      setSuccess('Professor cadastrado com sucesso!');
      await loadProfessores();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao cadastrar professor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este professor?')) return;

    try {
      await api.delete(`/professores/${id}`);
      setSuccess('Professor excluído com sucesso!');
      await loadProfessores();
    } catch (error) {
      setError('Erro ao excluir professor');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      especialidades: []
    });
  };

  const handleEspecialidadeToggle = (especialidadeId) => {
    const newEspecialidades = formData.especialidades.includes(especialidadeId)
      ? formData.especialidades.filter(e => e !== especialidadeId)
      : [...formData.especialidades, especialidadeId];
    
    setFormData({ ...formData, especialidades: newEspecialidades });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="professores-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Professores</h1>
          <p className="text-gray-500 mt-1">Gerencie os instrutores do CT</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-professor-btn">
              <Plus className="mr-2 h-4 w-4" /> Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Professor</DialogTitle>
              <DialogDescription>Cadastre um novo instrutor</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  data-testid="professor-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="professor-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  data-testid="professor-telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div>
                <Label>Especialidades</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="esp-crossfit"
                      data-testid="especialidade-crossfit"
                      checked={formData.especialidades.includes('crossfit')}
                      onCheckedChange={() => handleEspecialidadeToggle('crossfit')}
                    />
                    <label htmlFor="esp-crossfit" className="text-sm cursor-pointer">CrossFit</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="esp-musculacao"
                      data-testid="especialidade-musculacao"
                      checked={formData.especialidades.includes('musculacao')}
                      onCheckedChange={() => handleEspecialidadeToggle('musculacao')}
                    />
                    <label htmlFor="esp-musculacao" className="text-sm cursor-pointer">Musculação</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="esp-profissional"
                      data-testid="especialidade-profissional"
                      checked={formData.especialidades.includes('profissional')}
                      onCheckedChange={() => handleEspecialidadeToggle('profissional')}
                    />
                    <label htmlFor="esp-profissional" className="text-sm cursor-pointer">Treinamento Profissional</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="esp-funcional"
                      data-testid="especialidade-funcional"
                      checked={formData.especialidades.includes('funcional')}
                      onCheckedChange={() => handleEspecialidadeToggle('funcional')}
                    />
                    <label htmlFor="esp-funcional" className="text-sm cursor-pointer">Funcional</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="esp-yoga"
                      data-testid="especialidade-yoga"
                      checked={formData.especialidades.includes('yoga')}
                      onCheckedChange={() => handleEspecialidadeToggle('yoga')}
                    />
                    <label htmlFor="esp-yoga" className="text-sm cursor-pointer">Yoga</label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" data-testid="professor-submit-btn">Cadastrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert data-testid="success-alert"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professores.map((professor) => (
          <Card key={professor.id} data-testid={`professor-card-${professor.id}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{professor.nome}</CardTitle>
                  <Badge variant={professor.ativo ? 'default' : 'secondary'}>
                    {professor.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{professor.telefone}</span>
              </div>
              {professor.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{professor.email}</span>
                </div>
              )}
              {professor.especialidades && professor.especialidades.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Especialidades:</p>
                  <div className="flex flex-wrap gap-2">
                    {professor.especialidades.map((esp, index) => (
                      <Badge key={index} variant="secondary">{esp}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-3"
                onClick={() => handleDelete(professor.id)}
                data-testid={`delete-professor-${professor.id}`}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {professores.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Nenhum professor cadastrado
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Professores;
