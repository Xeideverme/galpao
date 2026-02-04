import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Trophy, Target, Award, Lock, Unlock, Search,
    Sparkles, Gift, Star, Crown, Flame
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Conquistas - Galeria de Todas as Conquistas Disponíveis
 */
const Conquistas = () => {
    const [conquistas, setConquistas] = useState([]);
    const [conquistasAluno, setConquistasAluno] = useState([]);
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroRaridade, setFiltroRaridade] = useState('todos');
    const [busca, setBusca] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        loadDados();
    }, []);

    const loadDados = async () => {
        try {
            // Carregar todas as conquistas
            const conquistasRes = await api.get('/gamificacao/conquistas?visiveis_apenas=true');
            setConquistas(conquistasRes.data);

            // Carregar conquistas do aluno atual
            if (user?.id) {
                const alunoConquistasRes = await api.get(`/gamificacao/aluno/${user.id}/conquistas`);
                setConquistasAluno(alunoConquistasRes.data);
            }
        } catch (error) {
            console.error('Erro ao carregar conquistas:', error);
        } finally {
            setLoading(false);
        }
    };

    const conquistasDesbloqueadasIds = new Set(
        conquistasAluno.map(c => c.conquista_id)
    );

    const getRaridadeConfig = (raridade) => {
        const config = {
            comum: {
                bg: 'bg-gray-100',
                text: 'text-gray-700',
                border: 'border-gray-300',
                badge: 'bg-gray-500',
                glow: ''
            },
            incomum: {
                bg: 'bg-green-50',
                text: 'text-green-700',
                border: 'border-green-300',
                badge: 'bg-green-500',
                glow: ''
            },
            raro: {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-300',
                badge: 'bg-blue-500',
                glow: ''
            },
            epico: {
                bg: 'bg-purple-50',
                text: 'text-purple-700',
                border: 'border-purple-300',
                badge: 'bg-purple-500',
                glow: 'shadow-purple-200 shadow-lg'
            },
            lendario: {
                bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
                text: 'text-yellow-700',
                border: 'border-yellow-400',
                badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
                glow: 'shadow-yellow-300 shadow-xl'
            }
        };
        return config[raridade] || config.comum;
    };

    const getTipoIcon = (tipo) => {
        const icons = {
            checkin: '📍',
            treino: '💪',
            pagamento: '💰',
            permanencia: '🌳',
            social: '🤝',
            especial: '🎁'
        };
        return icons[tipo] || '🏆';
    };

    const filteredConquistas = conquistas.filter(c => {
        const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
        const matchRaridade = filtroRaridade === 'todos' || c.raridade === filtroRaridade;
        const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) ||
            c.descricao.toLowerCase().includes(busca.toLowerCase());
        return matchTipo && matchRaridade && matchBusca;
    });

    const tipos = ['todos', 'checkin', 'treino', 'pagamento', 'permanencia', 'social', 'especial'];
    const raridades = ['todos', 'comum', 'incomum', 'raro', 'epico', 'lendario'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Sparkles className="h-12 w-12 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Target className="h-8 w-8 text-blue-500" />
                        Todas as Conquistas
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {conquistas.length} conquistas disponíveis • {conquistasAluno.length} desbloqueadas
                    </p>
                </div>
                <Button onClick={() => navigate('/gamificacao')} variant="outline">
                    ← Voltar ao Hub
                </Button>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Busca */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar conquistas..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filtro por Tipo */}
                        <div className="flex gap-1 flex-wrap">
                            {tipos.map(tipo => (
                                <Button
                                    key={tipo}
                                    variant={filtroTipo === tipo ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFiltroTipo(tipo)}
                                    className="capitalize"
                                >
                                    {tipo === 'todos' ? 'Todos' : getTipoIcon(tipo) + ' ' + tipo}
                                </Button>
                            ))}
                        </div>

                        {/* Filtro por Raridade */}
                        <div className="flex gap-1 flex-wrap">
                            {raridades.map(raridade => (
                                <Button
                                    key={raridade}
                                    variant={filtroRaridade === raridade ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFiltroRaridade(raridade)}
                                    className={`capitalize ${filtroRaridade === raridade ? getRaridadeConfig(raridade).badge : ''}`}
                                >
                                    {raridade}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grid de Conquistas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConquistas.map(conquista => {
                    const desbloqueada = conquistasDesbloqueadasIds.has(conquista.id);
                    const config = getRaridadeConfig(conquista.raridade);

                    return (
                        <Card
                            key={conquista.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 
                  ${desbloqueada ? config.bg : 'bg-gray-50 opacity-75'} 
                  ${config.border} border-2 ${config.glow}`}
                        >
                            {/* Badge de Status */}
                            <div className="absolute top-3 right-3">
                                {desbloqueada ? (
                                    <div className="bg-green-500 text-white p-1 rounded-full">
                                        <Unlock className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <div className="bg-gray-400 text-white p-1 rounded-full">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                )}
                            </div>

                            <CardContent className="pt-6">
                                {/* Ícone */}
                                <div className={`text-5xl mb-4 ${!desbloqueada && 'grayscale opacity-50'}`}>
                                    {conquista.icone}
                                </div>

                                {/* Nome e Descrição */}
                                <h3 className={`font-bold text-lg mb-1 ${desbloqueada ? config.text : 'text-gray-500'}`}>
                                    {conquista.nome}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                    {conquista.descricao}
                                </p>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge className={config.badge + ' text-white capitalize'}>
                                        {conquista.raridade}
                                    </Badge>
                                    <Badge variant="outline" className="capitalize">
                                        {getTipoIcon(conquista.tipo)} {conquista.tipo}
                                    </Badge>
                                </div>

                                {/* Pontos e Recompensas */}
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <div className="flex items-center gap-1 text-yellow-600">
                                        <Star className="h-4 w-4" />
                                        <span className="font-bold">{conquista.pontos} pts</span>
                                    </div>
                                    {conquista.xp_bonus > 0 && (
                                        <div className="text-sm text-purple-600">
                                            +{conquista.xp_bonus} XP
                                        </div>
                                    )}
                                </div>

                                {/* Recompensas Especiais */}
                                {(conquista.recompensa_desconto || conquista.recompensa_item) && (
                                    <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                                            <Gift className="h-4 w-4" />
                                            {conquista.recompensa_desconto && (
                                                <span>{conquista.recompensa_desconto}% desconto</span>
                                            )}
                                            {conquista.recompensa_item && (
                                                <span>{conquista.recompensa_item}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Nível Mínimo */}
                                {conquista.nivel_minimo > 1 && (
                                    <div className="mt-2 text-xs text-gray-400">
                                        Nível mínimo: {conquista.nivel_minimo}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredConquistas.length === 0 && (
                <div className="text-center py-12">
                    <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600">Nenhuma conquista encontrada</h3>
                    <p className="text-gray-400">Tente ajustar os filtros</p>
                </div>
            )}
        </div>
    );
};

export default Conquistas;
