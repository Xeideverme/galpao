import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Trophy, Award, Star, Calendar, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * MinhasConquistas - Lista de Conquistas Desbloqueadas pelo Usuário
 */
const MinhasConquistas = () => {
    const [conquistas, setConquistas] = useState([]);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadDados();
    }, []);

    const loadDados = async () => {
        try {
            if (user?.id) {
                const [conquistasRes, perfilRes] = await Promise.all([
                    api.get(`/gamificacao/aluno/${user.id}/conquistas`),
                    api.get(`/gamificacao/aluno/${user.id}`)
                ]);
                setConquistas(conquistasRes.data);
                setPerfil(perfilRes.data);
            }
        } catch (error) {
            console.error('Erro ao carregar conquistas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRaridadeColor = (raridade) => {
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
                <Sparkles className="h-12 w-12 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Minhas Conquistas
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {conquistas.length} conquistas desbloqueadas
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/conquistas')} variant="outline">
                        Ver Todas Disponíveis
                    </Button>
                    <Button onClick={() => navigate('/gamificacao')} variant="outline">
                        ← Voltar
                    </Button>
                </div>
            </div>

            {/* Resumo */}
            {perfil && (
                <Card className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white">
                    <CardContent className="py-6">
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-4xl font-bold">{perfil.conquistas_total}</div>
                                <div className="text-sm opacity-80">Total Desbloqueadas</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold">{perfil.conquistas_mes}</div>
                                <div className="text-sm opacity-80">Este Mês</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold">{perfil.pontos_totais?.toLocaleString()}</div>
                                <div className="text-sm opacity-80">Pontos Totais</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold">Nível {perfil.nivel}</div>
                                <div className="text-sm opacity-80">Seu Nível</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lista de Conquistas */}
            {conquistas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {conquistas.map((conquista, index) => (
                        <Card
                            key={conquista.id}
                            className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-5xl">{conquista.conquista_icone}</div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {conquista.conquista_nome}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className="bg-yellow-500 text-white">
                                                +{conquista.pontos_ganhos} pts
                                            </Badge>
                                            {conquista.xp_ganhos > 0 && (
                                                <Badge variant="outline" className="text-purple-600">
                                                    +{conquista.xp_ganhos} XP
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-3 text-sm text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(conquista.data_desbloqueio).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium text-gray-600 mb-2">
                            Nenhuma conquista desbloqueada ainda
                        </h3>
                        <p className="text-gray-400 mb-4">
                            Continue treinando para desbloquear suas primeiras conquistas!
                        </p>
                        <Button onClick={() => navigate('/conquistas')}>
                            Ver Conquistas Disponíveis
                        </Button>
                    </CardContent>
                </Card>
            )}


            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
        </div >
    );
};

export default MinhasConquistas;
