import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContratoPreview from '@/components/ContratoPreview';
import {
    ArrowLeft,
    FileText,
    Send,
    Download,
    Edit,
    User,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Mail,
    RefreshCw,
    Trash2
} from 'lucide-react';

const DetalhesContrato = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contrato, setContrato] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadContrato();
    }, [id]);

    const loadContrato = async () => {
        try {
            const response = await api.get(`/contratos/${id}`);
            setContrato(response.data);
        } catch (error) {
            console.error('Erro ao carregar contrato:', error);
            alert('Contrato não encontrado');
            navigate('/contratos');
        } finally {
            setLoading(false);
        }
    };

    const handleEnviarEmail = async () => {
        setActionLoading(true);
        try {
            await api.post(`/contratos/${id}/enviar-email`);
            alert('Email enviado com sucesso!');
            loadContrato();
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            alert('Erro ao enviar email');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAtivar = async () => {
        setActionLoading(true);
        try {
            await api.put(`/contratos/${id}/status?novo_status=ativo`);
            alert('Contrato ativado com sucesso!');
            loadContrato();
        } catch (error) {
            console.error('Erro ao ativar contrato:', error);
            alert('Erro ao ativar contrato');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelar = async () => {
        if (!window.confirm('Tem certeza que deseja cancelar este contrato?')) {
            return;
        }

        setActionLoading(true);
        try {
            await api.delete(`/contratos/${id}`);
            alert('Contrato cancelado com sucesso!');
            navigate('/contratos');
        } catch (error) {
            console.error('Erro ao cancelar contrato:', error);
            alert('Erro ao cancelar contrato');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            pendente: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
            assinado: { className: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
            ativo: { className: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
            vencido: { className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
            cancelado: { className: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle },
        };
        const { className, icon: Icon } = config[status] || config.pendente;
        return (
            <Badge className={`${className} border text-sm py-1 px-3 flex items-center gap-1`}>
                <Icon className="h-4 w-4" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!contrato) {
        return null;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/contratos')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">{contrato.numero_contrato}</h1>
                            {getStatusBadge(contrato.status)}
                        </div>
                        <p className="text-gray-500 mt-1">Contrato de {contrato.aluno_nome}</p>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {contrato.status === 'pendente' && (
                        <Button
                            onClick={() => navigate(`/contratos/${id}/assinar`)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Assinar Contrato
                        </Button>
                    )}

                    {contrato.status === 'assinado' && (
                        <Button
                            onClick={handleAtivar}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Ativar
                        </Button>
                    )}

                    {!contrato.email_enviado && contrato.status !== 'cancelado' && (
                        <Button
                            variant="outline"
                            onClick={handleEnviarEmail}
                            disabled={actionLoading}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Email
                        </Button>
                    )}

                    {contrato.status !== 'cancelado' && (
                        <Button
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={handleCancelar}
                            disabled={actionLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Aluno Info */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Aluno
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">{contrato.aluno_nome}</p>
                        {contrato.plano_nome && (
                            <p className="text-sm text-gray-500">Plano: {contrato.plano_nome}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Values */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Valores
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(contrato.valor_mensal)}/mês
                        </p>
                        <p className="text-sm text-gray-500">
                            Total: {formatCurrency(contrato.valor_total)}
                        </p>
                    </CardContent>
                </Card>

                {/* Dates */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Vigência
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {contrato.duracao_meses} {contrato.duracao_meses === 1 ? 'mês' : 'meses'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {formatDate(contrato.data_inicio)} até {formatDate(contrato.data_fim)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações do Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Template</p>
                            <p className="font-medium">{contrato.template_nome}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Vencimento</p>
                            <p className="font-medium">Todo dia {contrato.dia_vencimento}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Renovação Automática</p>
                            <p className="font-medium">
                                {contrato.renovacao_automatica ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <RefreshCw className="h-4 w-4" /> Sim
                                    </span>
                                ) : (
                                    <span className="text-gray-500">Não</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">
                                {contrato.email_enviado ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <Mail className="h-4 w-4" /> Enviado em {formatDateTime(contrato.data_email)}
                                    </span>
                                ) : (
                                    <span className="text-gray-500">Não enviado</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Signature Info */}
                    {contrato.assinatura_aluno && (
                        <div className="mt-6 pt-4 border-t">
                            <h4 className="font-medium mb-3">Assinatura Digital</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Data da Assinatura</p>
                                    <p className="font-medium">{formatDateTime(contrato.data_assinatura)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">IP</p>
                                    <p className="font-medium">{contrato.ip_assinatura || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contract Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Documento do Contrato</CardTitle>
                    <CardDescription>Visualize e baixe o contrato completo</CardDescription>
                </CardHeader>
                <CardContent>
                    <ContratoPreview
                        htmlContent={contrato.conteudo_gerado}
                        assinaturaAluno={contrato.assinatura_aluno}
                        assinaturaResponsavel={contrato.assinatura_responsavel}
                        dataAssinatura={contrato.data_assinatura}
                    />
                </CardContent>
            </Card>

            {/* Timestamps */}
            <div className="text-sm text-gray-500 text-center">
                Criado em: {formatDateTime(contrato.criado_em)} |
                Atualizado em: {formatDateTime(contrato.atualizado_em)}
            </div>
        </div>
    );
};

export default DetalhesContrato;
