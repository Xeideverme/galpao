import React, { useEffect, useState } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

/**
 * ConquistaNotificacao - Componente de Notificação de Conquistas
 * 
 * Exibe uma notificação toast quando o aluno desbloqueia uma nova conquista.
 * Busca periodicamente por conquistas não visualizadas e as exibe em destaque.
 */
const ConquistaNotificacao = () => {
    const [conquistas, setConquistas] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            checkConquistas();
            // Verificar a cada 30 segundos
            const interval = setInterval(checkConquistas, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const checkConquistas = async () => {
        try {
            const response = await api.get(`/gamificacao/aluno/${user.id}/conquistas-pendentes`);
            if (response.data && response.data.length > 0) {
                setConquistas(response.data);
                setIsVisible(true);
            }
        } catch (error) {
            // Silenciar erros - feature opcional
        }
    };

    const handleDismiss = async () => {
        // Marcar como visualizada
        try {
            if (conquistas[currentIndex]) {
                await api.post(`/gamificacao/aluno/${user.id}/marcar-notificacao-vista`, [
                    conquistas[currentIndex].conquista_id
                ]);
            }
        } catch (error) {
            // Silenciar
        }

        // Próxima conquista ou fechar
        if (currentIndex < conquistas.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsVisible(false);
            setConquistas([]);
            setCurrentIndex(0);
        }
    };

    if (!isVisible || conquistas.length === 0) return null;

    const conquista = conquistas[currentIndex];

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slideIn">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-500 p-1 rounded-2xl shadow-2xl">
                <div className="bg-white rounded-xl p-6 min-w-[320px] max-w-[400px]">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-yellow-100 p-2 rounded-full">
                                <Trophy className="h-5 w-5 text-yellow-600" />
                            </div>
                            <span className="text-sm font-medium text-yellow-600">
                                Conquista Desbloqueada!
                            </span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Conteúdo */}
                    <div className="text-center py-4">
                        <div className="text-6xl mb-3 animate-bounce">
                            {conquista.conquista_icone}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {conquista.conquista_nome}
                        </h3>
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                                +{conquista.pontos_ganhos} pontos
                            </span>
                            {conquista.xp_ganhos > 0 && (
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    +{conquista.xp_ganhos} XP
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Footer com contador */}
                    {conquistas.length > 1 && (
                        <div className="text-center text-sm text-gray-500 pt-2 border-t">
                            {currentIndex + 1} de {conquistas.length} conquistas
                        </div>
                    )}

                    {/* Botão de continuar */}
                    <button
                        onClick={handleDismiss}
                        className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2 rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all"
                    >
                        {currentIndex < conquistas.length - 1 ? 'Próxima Conquista →' : 'Fechar'}
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
        </div>
    );
};

export default ConquistaNotificacao;
