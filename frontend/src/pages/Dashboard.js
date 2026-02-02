import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const saldoMensal = (stats?.receita_mensal || 0) - (stats?.despesa_mensal || 0);

  // Mock data for charts
  const receitaData = [
    { mes: 'Jan', valor: 45000 },
    { mes: 'Fev', valor: 52000 },
    { mes: 'Mar', valor: 48000 },
    { mes: 'Abr', valor: 61000 },
    { mes: 'Mai', valor: 55000 },
    { mes: 'Jun', valor: stats?.receita_mensal || 58000 },
  ];

  const checkinData = [
    { dia: 'Seg', checkins: 45 },
    { dia: 'Ter', checkins: 52 },
    { dia: 'Qua', checkins: 48 },
    { dia: 'Qui', checkins: 61 },
    { dia: 'Sex', checkins: 55 },
    { dia: 'Sáb', checkins: 38 },
    { dia: 'Dom', checkins: stats?.checkins_hoje || 25 },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do seu centro de treinamento</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-alunos">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_alunos || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600 font-medium">{stats?.alunos_ativos || 0} ativos</span>
              {' • '}
              <span className="text-gray-400">{stats?.alunos_inativos || 0} inativos</span>
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-receita">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(stats?.receita_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Mês atual</p>
          </CardContent>
        </Card>

        <Card data-testid="card-despesas">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Despesas Mensais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {(stats?.despesa_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Saldo: <span className={saldoMensal >= 0 ? 'text-green-600' : 'text-red-600'}>
                R$ {saldoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-checkins">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Check-ins Hoje</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.checkins_hoje || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Taxa de ocupação: {stats?.taxa_ocupacao || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pendencias */}
      {(stats?.pagamentos_pendentes || 0) > 0 && (
        <Card className="border-orange-200 bg-orange-50" data-testid="card-pendencias">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <CardTitle className="text-orange-900">Atenção Necessária</CardTitle>
              <CardDescription className="text-orange-700">
                Você tem {stats.pagamentos_pendentes} pagamento(s) pendente(s)
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="chart-receita">
          <CardHeader>
            <CardTitle>Receita Mensal</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={receitaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={2} name="Receita" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="chart-checkins">
          <CardHeader>
            <CardTitle>Check-ins Semanais</CardTitle>
            <CardDescription>Última semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={checkinData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="checkins" fill="#8b5cf6" name="Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
