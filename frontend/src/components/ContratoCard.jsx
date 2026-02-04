import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Send, Download, Calendar, DollarSign, User } from 'lucide-react';

const ContratoCard = ({ contrato, onEnviarEmail, onDownloadPDF }) => {
    const navigate = useNavigate();

    const getStatusBadge = (status) => {
        const variants = {
            pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            assinado: 'bg-green-100 text-green-800 border-green-200',
            ativo: 'bg-blue-100 text-blue-800 border-blue-200',
            vencido: 'bg-red-100 text-red-800 border-red-200',
            cancelado: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return (
            <Badge className={`${variants[status]} border`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    return (
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold text-gray-900">
                            {contrato.numero_contrato}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{contrato.aluno_nome}</span>
                        </div>
                    </div>
                    {getStatusBadge(contrato.status)}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{contrato.template_nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{formatCurrency(contrato.valor_mensal)}/mês</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Início: {formatDate(contrato.data_inicio)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Fim: {formatDate(contrato.data_fim)}</span>
                    </div>
                </div>

                {/* Duration Badge */}
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {contrato.duracao_meses} {contrato.duracao_meses === 1 ? 'mês' : 'meses'}
                    </span>
                    {contrato.renovacao_automatica && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Renovação Automática
                        </span>
                    )}
                    {contrato.email_enviado && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Email Enviado
                        </span>
                    )}
                </div>

                {/* Signature Info */}
                {contrato.status === 'assinado' && contrato.data_assinatura && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                        Assinado em: {new Date(contrato.data_assinatura).toLocaleString('pt-BR')}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/contratos/${contrato.id}`)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                    </Button>

                    {contrato.status === 'pendente' && (
                        <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => navigate(`/contratos/${contrato.id}/assinar`)}
                        >
                            <FileText className="h-4 w-4 mr-1" />
                            Assinar
                        </Button>
                    )}

                    {contrato.status === 'assinado' && !contrato.email_enviado && onEnviarEmail && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEnviarEmail(contrato.id)}
                        >
                            <Send className="h-4 w-4 mr-1" />
                            Email
                        </Button>
                    )}

                    {contrato.status === 'assinado' && onDownloadPDF && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDownloadPDF(contrato)}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ContratoCard;
