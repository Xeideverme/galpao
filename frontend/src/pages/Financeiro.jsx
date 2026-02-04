import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Financeiro = () => {
  const [pagamentos, setPagamentos] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogPagOpen, setDialogPagOpen] = useState(false);
  const [dialogDespOpen, setDialogDespOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pagamentoForm, setPagamentoForm] = useState({
    aluno_id: '',
    valor: '',
    data_vencimento: '',
    referencia: ''
  });

  const [despesaForm, setDespesaForm] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    data: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagRes, despRes, alunosRes] = await Promise.all([
        api.get('/pagamentos'),
        api.get('/despesas'),
        api.get('/alunos')
      ]);
      setPagamentos(pagRes.data);
      setDespesas(despRes.data);
      setAlunos(alunosRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handlePagamentoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = {
        ...pagamentoForm,
        valor: parseFloat(pagamentoForm.valor)
      };
      await api.post('/pagamentos', data);
      setSuccess('Pagamento cadastrado com sucesso!');
      await loadData();
      setDialogPagOpen(false);
      setPagamentoForm({ aluno_id: '', valor: '', data_vencimento: '', referencia: '' });
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao cadastrar pagamento');
    }
  };

  const handleDespesaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = {
        ...despesaForm,
        valor: parseFloat(despesaForm.valor)
      };
      await api.post('/despesas', data);
      setSuccess('Despesa cadastrada com sucesso!');
      await loadData();
      setDialogDespOpen(false);
      setDespesaForm({ descricao: '', valor: '', categoria: '', data: '' });
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro ao cadastrar despesa');
    }
  };

  const handleMarcarPago = async (pagamentoId) => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      await api.put(`/pagamentos/${pagamentoId}`, {
        status: 'pago',
        data_pagamento: hoje,
        metodo_pagamento: 'dinheiro'
      });
      setSuccess('Pagamento marcado como pago!');
      await loadData();
    } catch (error) {
      setError('Erro ao atualizar pagamento');
    }
  };

  const totalReceitas = pagamentos.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0);
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6" data-testid="financeiro-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-500 mt-1">Gerencie pagamentos e despesas</p>
      </div>

      {success && <Alert data-testid="success-alert"><AlertDescription>{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pagamentos" className="w-full">
        <TabsList>
          <TabsTrigger value="pagamentos" data-testid="tab-pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="despesas" data-testid="tab-despesas">Despesas</TabsTrigger>
        </TabsList>

        {/* Pagamentos Tab */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogPagOpen} onOpenChange={setDialogPagOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-pagamento-btn">
                  <Plus className="mr-2 h-4 w-4" /> Novo Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Pagamento</DialogTitle>
                  <DialogDescription>Cadastre um novo pagamento</DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePagamentoSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="aluno_id">Aluno *</Label>
                    <Select value={pagamentoForm.aluno_id} onValueChange={(value) => setPagamentoForm({ ...pagamentoForm, aluno_id: value })}>
                      <SelectTrigger data-testid="pagamento-aluno">
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
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input
                      id="valor"
                      data-testid="pagamento-valor"
                      type="number"
                      step="0.01"
                      value={pagamentoForm.valor}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, valor: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_vencimento">Data Vencimento *</Label>
                    <Input
                      id="data_vencimento"
                      data-testid="pagamento-vencimento"
                      type="date"
                      value={pagamentoForm.data_vencimento}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, data_vencimento: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="referencia">Referência *</Label>
                    <Input
                      id="referencia"
                      data-testid="pagamento-referencia"
                      value={pagamentoForm.referencia}
                      onChange={(e) => setPagamentoForm({ ...pagamentoForm, referencia: e.target.value })}
                      placeholder="Ex: Mensalidade Jan/2025"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogPagOpen(false)}>Cancelar</Button>
                    <Button type="submit" data-testid="pagamento-submit-btn">Cadastrar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {pagamentos.map((pagamento) => (
              <Card key={pagamento.id} data-testid={`pagamento-card-${pagamento.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{pagamento.aluno_nome}</p>
                      <p className="text-sm text-gray-500">{pagamento.referencia}</p>
                      <p className="text-xs text-gray-400">Vencimento: {pagamento.data_vencimento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={pagamento.status === 'pago' ? 'default' : pagamento.status === 'pendente' ? 'secondary' : 'destructive'}>
                        {pagamento.status}
                      </Badge>
                    </div>
                    {pagamento.status === 'pendente' && (
                      <Button size="sm" onClick={() => handleMarcarPago(pagamento.id)} data-testid={`marcar-pago-${pagamento.id}`}>
                        Marcar Pago
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {pagamentos.length === 0 && (
              <Card><CardContent className="py-8 text-center text-gray-500">Nenhum pagamento cadastrado</CardContent></Card>
            )}
          </div>
        </TabsContent>

        {/* Despesas Tab */}
        <TabsContent value="despesas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogDespOpen} onOpenChange={setDialogDespOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-despesa-btn">
                  <Plus className="mr-2 h-4 w-4" /> Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Despesa</DialogTitle>
                  <DialogDescription>Cadastre uma nova despesa</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleDespesaSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      data-testid="despesa-descricao"
                      value={despesaForm.descricao}
                      onChange={(e) => setDespesaForm({ ...despesaForm, descricao: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor_desp">Valor (R$) *</Label>
                    <Input
                      id="valor_desp"
                      data-testid="despesa-valor"
                      type="number"
                      step="0.01"
                      value={despesaForm.valor}
                      onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select value={despesaForm.categoria} onValueChange={(value) => setDespesaForm({ ...despesaForm, categoria: value })}>
                      <SelectTrigger data-testid="despesa-categoria">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="energia">Energia</SelectItem>
                        <SelectItem value="agua">Água</SelectItem>
                        <SelectItem value="equipamento">Equipamento</SelectItem>
                        <SelectItem value="salario">Salário</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      data-testid="despesa-data"
                      type="date"
                      value={despesaForm.data}
                      onChange={(e) => setDespesaForm({ ...despesaForm, data: e.target.value })}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogDespOpen(false)}>Cancelar</Button>
                    <Button type="submit" data-testid="despesa-submit-btn">Cadastrar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {despesas.map((despesa) => (
              <Card key={despesa.id} data-testid={`despesa-card-${despesa.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{despesa.descricao}</p>
                      <p className="text-sm text-gray-500">
                        <Badge variant="outline">{despesa.categoria}</Badge>
                      </p>
                      <p className="text-xs text-gray-400">Data: {despesa.data}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {despesas.length === 0 && (
              <Card><CardContent className="py-8 text-center text-gray-500">Nenhuma despesa cadastrada</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;
