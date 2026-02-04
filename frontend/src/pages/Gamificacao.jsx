import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Trophy, Target, Award, TrendingUp, Users,
    Zap, Star, Crown, Flame, Gift, Medal, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Gamificacao - Hub Central do Sistema de Gamificação
 * 
 * Exibe visão geral do perfil do usuário, conquistas recentes,
 * ranking e estatísticas de gamificação.
 */
const Gamificacao = () => {
    const [perfil, setPerfil] = useState(null);
    const [conquistasRecentes, setConquistasRecentes] = useState([]);
    const [ranking, setRanking] = useState([]);
    const [estatisticas, setEstatisticas] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadDados();
    }, []);

    const loadDados = async () => {
        try {
            // Buscar perfil do usuário atual
            const userId = user?.id;

            if (userId) {
                // Carregar perfil de gamificação
                const perfilResponse = await api.get(`/gamificacao/aluno/${userId}`);
                setPerfil(perfilResponse.data);

                // Carregar últimas conquistas
                const conquistasResponse = await api.get(`/gamificacao/aluno/${userId}/conquistas`);
                setConquistasRecentes(conquistasResponse.data.slice(0, 5));
            }

            // Carregar ranking
            const rankingResponse = await api.get('/gamificacao/ranking?periodo=mensal&limite=10');
            setRanking(rankingResponse.data.ranking || []);

            // Carregar estatísticas
            const estatisticasResponse = await api.get('/gamificacao/estatisticas');
            setEstatisticas(estatisticasResponse.data);

        } catch (error) {
            console.error('Erro ao carregar gamificação:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNivelIcon = (nivel) => {
        if (nivel >= 50) return <Crown className="h-6 w-6 text-yellow-500" />;
        if (nivel >= 25) return <Star className="h-6 w-6 text-purple-500" />;
        if (nivel >= 10) return <Award className="h-6 w-6 text-blue-500" />;
        return <Trophy className="h-6 w-6 text-gray-400" />;
    };

    const getRaridadeColor = (raridade) => {
        const cores = {
            comum: 'bg-gray-100 text-gray-700 border-gray-300',
            incomum: 'bg-green-100 text-green-700 border-green-300',
            raro: 'bg-blue-100 text-blue-700 border-blue-300',
            epico: 'bg-purple-100 text-purple-700 border-purple-300',
            lendario: 'bg-yellow-100 text-yellow-700 border-yellow-300'
        };
        return cores[raridade] || cores.comum;
    };

    const getRaridadeBadgeColor = (raridade) => {
        const cores = {
            comum: 'bg-gray-500',
            incomum: 'bg-green-500',
            raro: 'bg-blue-500',
            epico: 'bg-purple-500',
            lendario: 'bg-gradient-to-r from-yellow-400 to-orange-500'
        };
        return cores[raridade] || cores.comum;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Zap className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
                    <p className="text-gray-500">Carregando seu perfil de gamificação...</p>
                </div>
            </div>
        );
    }

    // Se não tiver perfil, criar um padrão
    const perfilData = perfil || {
        nivel: 1,
        pontos_totais: 0,
        pontos_mes_atual: 0,
        xp_atual: 0,
        xp_proximo_nivel: 100,
        progresso_nivel_percent: 0,
        conquistas_total: 0,
        sequencia_dias_atual: 0,
        total_checkins: 0
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Gamificação
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Ganhe pontos, desbloqueie conquistas e suba no ranking!
                    </p>
                </div>
                <Button onClick={() => navigate('/conquistas')} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                    <Target className="h-4 w-4 mr-2" />
                    Ver Todas Conquistas
                </Button>
            </div>

            {/* Perfil do Usuário - Card Principal */}
            <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden relative">
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>

                <CardHeader>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-full">
                                {getNivelIcon(perfilData.nivel)}
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-white flex items-center gap-2">
                                    Nível {perfilData.nivel}
                                    <Sparkles className="h-5 w-5 text-yellow-300" />
                                </CardTitle>
                                <CardDescription className="text-blue-100">
                                    {perfilData.pontos_totais?.toLocaleString()} pontos totais
                                </CardDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold">{perfilData.conquistas_total}</div>
                            <div className="text-sm text-blue-100">Conquistas</div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10">
                    {/* Barra de Progresso XP */}
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-1">
                                <Zap className="h-4 w-4 text-yellow-300" />
                                Progresso para Nível {perfilData.nivel + 1}
                            </span>
                            <span className="font-mono">{perfilData.xp_atual} / {perfilData.xp_proximo_nivel} XP</span>
                        </div>
                        <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                                style={{ width: `${perfilData.progresso_nivel_percent || 0}%` }}
                            />
                        </div>
                        <div className="text-xs text-blue-100">
                            {(perfilData.progresso_nivel_percent || 0).toFixed(1)}% completo
                        </div>
                    </div>

                    {/* Estatísticas Rápidas */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">{perfilData.pontos_mes_atual || 0}</div>
                            <div className="text-xs text-blue-100">Pontos este mês</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold flex items-center justify-center gap-1">
                                <Flame className="h-5 w-5 text-orange-400" />
                                {perfilData.sequencia_dias_atual || 0}
                            </div>
                            <div className="text-xs text-blue-100">Dias consecutivos</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">{perfilData.total_checkins || 0}</div>
                            <div className="text-xs text-blue-100">Check-ins totais</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold">{perfilData.ranking_mensal || '-'}</div>
                            <div className="text-xs text-blue-100">Posição ranking</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conquistas Recentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Conquistas Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {conquistasRecentes.length > 0 ? (
                            <div className="space-y-3">
                                {conquistasRecentes.map((conquista) => (
                                    <div
                                        key={conquista.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                        onClick={() => navigate('/minhas-conquistas')}
                                    >
                                        <div className="text-3xl">{conquista.conquista_icone}</div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900">
                                                {conquista.conquista_nome}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(conquista.data_desbloqueio).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                                            +{conquista.pontos_ganhos} pts
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p>Nenhuma conquista desbloqueada ainda</p>
                                <Button
                                    variant="outline"
                                    className="mt-3"
                                    onClick={() => navigate('/conquistas')}
                                >
                                    Ver Conquistas Disponíveis
                                </Button>
                            </div>
                        )}
                        {conquistasRecentes.length > 0 && (
                            <Button
                                variant="ghost"
                                className="w-full mt-4"
                                onClick={() => navigate('/minhas-conquistas')}
                            >
                                Ver Todas Minhas Conquistas
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Ranking Mensal */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Ranking Mensal
                        </CardTitle>
                        <CardDescription>Top 10 alunos do mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ranking.length > 0 ? (
                            <div className="space-y-2">
                                {ranking.map((item, index) => (
                                    <div
                                        key={item.aluno_id}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${index < 3
                                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' :
                                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' :
                                                    'bg-gray-200 text-gray-600'
                                            }`}>
                                            {index === 0 && <Crown className="h-4 w-4" />}
                                            {index === 1 && <Medal className="h-4 w-4" />}
                                            {index === 2 && <Medal className="h-4 w-4" />}
                                            {index > 2 && item.posicao}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {item.aluno_nome}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span>Nível {item.nivel}</span>
                                                <span>•</span>
                                                <span>{item.conquistas_total} conquistas</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">
                                                {item.pontos?.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">pontos</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p>Ranking ainda não disponível</p>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => navigate('/ranking')}
                        >
                            Ver Ranking Completo
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Cards de Ações Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                    onClick={() => navigate('/minhas-conquistas')}
                >
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trophy className="h-8 w-8 text-yellow-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Minhas Conquistas</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {perfilData.conquistas_total} desbloqueadas
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
                    onClick={() => navigate('/conquistas')}
                >
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Target className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Todas Conquistas</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {estatisticas?.total_conquistas || 0} disponíveis
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                    onClick={() => navigate('/ranking')}
                >
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Ranking</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {estatisticas?.alunos_participando || 0} participantes
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
                    onClick={() => navigate('/perfil-gamificacao/' + user?.id)}
                >
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Gift className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Meu Perfil</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Histórico completo
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Estatísticas Gerais */}
            {estatisticas && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Estatísticas do Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-purple-600">
                                    {estatisticas.total_conquistas}
                                </div>
                                <div className="text-sm text-gray-500">Conquistas Disponíveis</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-green-600">
                                    {estatisticas.total_desbloqueadas}
                                </div>
                                <div className="text-sm text-gray-500">Total Desbloqueadas</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-blue-600">
                                    {estatisticas.alunos_participando}
                                </div>
                                <div className="text-sm text-gray-500">Alunos Participando</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-orange-600">
                                    {estatisticas.media_pontos_por_aluno?.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">Média de Pontos</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Gamificacao;
