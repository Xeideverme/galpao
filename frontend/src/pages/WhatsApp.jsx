import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, MessageSquare, Send, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const WhatsApp = () => {
  const [alunos, setAlunos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    destinatarios: [],
    mensagem: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alunosRes, historicoRes] = await Promise.all([
        api.get('/alunos'),
        api.get('/whatsapp/historico')
      ]);
      setAlunos(alunosRes.data.filter(a => a.status === 'ativo' && a.telefone));
      setHistorico(historicoRes.data);
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
    setSending(true);

    if (formData.destinatarios.length === 0) {
      setError('Selecione pelo menos um aluno');
      setSending(false);
      return;
    }

    try {
      await api.post('/whatsapp/enviar', formData);
      setSuccess(`Mensagem enviada para ${formData.destinatarios.length} aluno(s)!`);
      await loadData();
      setDialogOpen(false);
      setFormData({ destinatarios: [], mensagem: '' });
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleAlunoToggle = (alunoId) => {
    setFormData(prev => ({
      ...prev,
      destinatarios: prev.destinatarios.includes(alunoId)
        ? prev.destinatarios.filter(id => id !== alunoId)
        : [...prev.destinatarios, alunoId]
    }));
  };

  const handleSelectAll = () => {
    if (formData.destinatarios.length === alunos.length) {
      setFormData({ ...formData, destinatarios: [] });
    } else {
      setFormData({ ...formData, destinatarios: alunos.map(a => a.id) });
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

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="whatsapp-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-500 mt-1">Envie mensagens para os alunos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setFormData({ destinatarios: [], mensagem: '' });
        }}>
          <DialogTrigger asChild>
            <Button data-testid="send-whatsapp-btn">
              <Plus className="mr-2 h-4 w-4" /> Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enviar Mensagem WhatsApp</DialogTitle>
              <DialogDescription>Selecione os alunos e escreva a mensagem</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Destinatários ({formData.destinatarios.length} selecionado(s))</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} data-testid="select-all-btn">
                    {formData.destinatarios.length === alunos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </Button>
                </div>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {alunos.map(aluno => (
                    <div key={aluno.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`aluno-${aluno.id}`}
                        data-testid={`aluno-checkbox-${aluno.id}`}
                        checked={formData.destinatarios.includes(aluno.id)}
                        onCheckedChange={() => handleAlunoToggle(aluno.id)}
                      />
                      <label htmlFor={`aluno-${aluno.id}`} className="text-sm cursor-pointer flex-1">
                        <span className="font-medium">{aluno.nome}</span>
                        <span className="text-gray-500 ml-2">({aluno.telefone})</span>
                      </label>
                    </div>
                  ))}
                  {alunos.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      Nenhum aluno com telefone cadastrado
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  data-testid="whatsapp-mensagem"
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  placeholder="Digite sua mensagem aqui..."
                  rows={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.mensagem.length} caracteres
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Nota:</strong> As mensagens serão enviadas via Twilio WhatsApp API. 
                  Certifique-se de que suas credenciais estão configuradas corretamente no backend.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={sending} data-testid="whatsapp-submit-btn">
                  {sending ? 'Enviando...' : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert data-testid="success-alert"><AlertDescription>{success}</AlertDescription></Alert>}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
          <CardDescription>Mensagens enviadas recentemente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historico.map((msg) => (
              <div key={msg.id} className="border rounded-lg p-4" data-testid={`historico-msg-${msg.id}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{msg.destinatarios.length} destinatário(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatDateTime(msg.enviado_em)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3 mt-2">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.mensagem}</p>
                </div>
              </div>
            ))}
            {historico.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Nenhuma mensagem enviada ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsApp;
