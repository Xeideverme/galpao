import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle as CardTitleUI } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Trophy, Crown, Medal, Star, TrendingUp, Users, Calendar, Flame
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Ranking - Leaderboard de Alunos por Pontuação
 */
const Ranking = () => {
    const [rankingGeral, setRankingGeral] = useState([]);
    const [rankingMensal, setRankingMensal] = useState([]);
    const [rankingSemanal, setRankingSemanal] = useState([]);
    const [periodo, setPeriodo] = useState('mensal');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadRankings();
    }, []);

    const loadRankings = async () => {
        try {
            const [geralRes, mensalRes, semanalRes] = await Promise.all([
                api.get('/gamificacao/ranking?periodo=geral&limite=100'),
                api.get('/gamificacao/ranking?periodo=mensal&limite=100'),
                api.get('/gamificacao/ranking?periodo=semanal&limite=100')
            ]);
            setRankingGeral(geralRes.data.ranking || []);
            setRankingMensal(mensalRes.data.ranking || []);
            setRankingSemanal(semanalRes.data.ranking || []);
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRanking = () => {
        switch (periodo) {
            case 'geral': return rankingGeral;
            case 'semanal': return rankingSemanal;
            default: return rankingMensal;
        }
    };

    const ranking = getRanking();

    const getPosicaoStyle = (posicao) => {
        switch (posicao) {
            case 1:
                return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-300';
            case 2:
                return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
            case 3:
                return 'bg-gradient-to-r from-orange-400 to-orange-700 text-white';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getPosicaoIcon = (posicao) => {
        switch (posicao) {
            case 1: return <Crown className="h-6 w-6" />;
            case 2: return <Medal className="h-5 w-5" />;
            case 3: return <Medal className="h-5 w-5" />;
            default: return posicao;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <TrendingUp className="h-12 w-12 animate-bounce text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        Ranking
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Compare-se com outros alunos e suba no ranking!
                    </p>
                </div>
                <Button onClick={() => navigate('/gamificacao')} variant="outline">
                    ← Voltar ao Hub
                </Button>
            </div>

            {/* Tabs de Período */}
            <Tabs value={periodo} onValueChange={setPeriodo}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="semanal" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Semanal
                    </TabsTrigger>
                    <TabsTrigger value="mensal" className="flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        Mensal
                    </TabsTrigger>
                    <TabsTrigger value="geral" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Geral
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Top 3 Destaque */}
            {ranking.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* 2º Lugar */}
                    <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 transform hover:-translate-y-2 transition-transform">
                        <CardContent className="pt-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mx-auto mb-3 text-white">
                                <Medal className="h-8 w-8" />
                            </div>
                            <div className="text-silver text-5xl font-bold text-gray-400">2º</div>
                            <h3 className="font-bold text-lg mt-2 truncate">{ranking[1]?.aluno_nome}</h3>
                            <div className="text-2xl font-bold text-gray-700 mt-1">
                                {ranking[1]?.pontos?.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">pontos</div>
                            <Badge variant="outline" className="mt-2">
                                Nível {ranking[1]?.nivel}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* 1º Lugar */}
                    <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 border-2 transform hover:-translate-y-3 transition-transform shadow-xl shadow-yellow-200">
                        <CardContent className="pt-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
                                <Crown className="h-10 w-10" />
                            </div>
                            <div className="text-5xl font-bold text-yellow-600">1º</div>
                            <h3 className="font-bold text-xl mt-2 truncate">{ranking[0]?.aluno_nome}</h3>
                            <div className="text-3xl font-bold text-yellow-700 mt-1">
                                {ranking[0]?.pontos?.toLocaleString()}
                            </div>
                            <div className="text-sm text-yellow-600">pontos</div>
                            <Badge className="mt-2 bg-yellow-500">
                                Nível {ranking[0]?.nivel}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* 3º Lugar */}
                    <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 transform hover:-translate-y-2 transition-transform">
                        <CardContent className="pt-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center mx-auto mb-3 text-white">
                                <Medal className="h-8 w-8" />
                            </div>
                            <div className="text-5xl font-bold text-orange-400">3º</div>
                            <h3 className="font-bold text-lg mt-2 truncate">{ranking[2]?.aluno_nome}</h3>
                            <div className="text-2xl font-bold text-orange-700 mt-1">
                                {ranking[2]?.pontos?.toLocaleString()}
                            </div>
                            <div className="text-sm text-orange-500">pontos</div>
                            <Badge variant="outline" className="mt-2 border-orange-400 text-orange-600">
                                Nível {ranking[2]?.nivel}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Lista Completa */}
            <Card>
                <CardHeader>
                    <CardTitleUI className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Ranking Completo - {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                    </CardTitleUI>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {ranking.map((item, index) => {
                            const isCurrentUser = item.aluno_id === user?.id;

                            return (
                                <div
                                    key={item.aluno_id}
                                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${isCurrentUser
                                        ? 'bg-blue-50 border-2 border-blue-300'
                                        : index < 3
                                            ? 'bg-yellow-50'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    {/* Posição */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${getPosicaoStyle(item.posicao)}`}>
                                        {getPosicaoIcon(item.posicao)}
                                    </div>

                                    {/* Avatar/Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900 truncate">
                                                {item.aluno_nome}
                                            </span>
                                            {isCurrentUser && (
                                                <Badge className="bg-blue-500 text-white text-xs">Você</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3" />
                                                Nível {item.nivel}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Trophy className="h-3 w-3" />
                                                {item.conquistas_total} conquistas
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pontos */}
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {item.pontos?.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-500">pontos</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {ranking.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-600">
                                Ranking vazio para este período
                            </h3>
                            <p className="text-gray-400">
                                Seja o primeiro a pontuar!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Ranking;
