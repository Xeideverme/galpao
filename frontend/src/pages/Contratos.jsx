import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ContratoCard from '@/components/ContratoCard';
import {
    FileText,
    Plus,
    Search,
    AlertTriangle,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle
} from 'lucide-react';

const Contratos = () => {
    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [contratosVencendo, setContratosVencendo] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadContratos();
        loadContratosVencendo();
    }, []);

    const loadContratos = async () => {
        try {
            const response = await api.get('/contratos');
            setContratos(response.data);
        } catch (error) {
            console.error('Erro ao carregar contratos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadContratosVencendo = async () => {
        try {
            const response = await api.get('/contratos/vencendo/30');
            setContratosVencendo(response.data);
        } catch (error) {
            console.error('Erro ao carregar contratos vencendo:', error);
        }
    };

    const handleEnviarEmail = async (contratoId) => {
        try {
            await api.post(`/contratos/${contratoId}/enviar-email`);
            alert('Email enviado com sucesso!');
            loadContratos();
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            alert('Erro ao enviar email');
        }
    };

    const handleDownloadPDF = async (contrato) => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            // Create temporary container
            const container = document.createElement('div');
            container.innerHTML = contrato.conteudo_gerado;
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.width = '800px';
            document.body.appendChild(container);

            const canvas = await html2canvas(container, { scale: 2 });
            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${contrato.numero_contrato}.pdf`);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF');
        }
    };

    // Filter contracts
    const filteredContratos = contratos.filter(c => {
        const matchesStatus = filtroStatus === 'todos' || c.status === filtroStatus;
        const matchesSearch = !searchTerm ||
            c.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.numero_contrato.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Stats
    const stats = {
        total: contratos.length,
        pendentes: contratos.filter(c => c.status === 'pendente').length,
        assinados: contratos.filter(c => c.status === 'assinado').length,
        ativos: contratos.filter(c => c.status === 'ativo').length,
        vencidos: contratos.filter(c => c.status === 'vencido').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Contratos Digitais</h1>
                    <p className="text-gray-500 mt-1">Gerencie os contratos dos alunos com assinatura digital</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/contratos/templates')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Templates
                    </Button>
                    <Button onClick={() => navigate('/contratos/novo')} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Contrato
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-700">Pendentes</p>
                                <p className="text-2xl font-bold text-yellow-800">{stats.pendentes}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700">Assinados</p>
                                <p className="text-2xl font-bold text-green-800">{stats.assinados}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700">Ativos</p>
                                <p className="text-2xl font-bold text-blue-800">{stats.ativos}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700">Vencidos</p>
                                <p className="text-2xl font-bold text-red-800">{stats.vencidos}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert for expiring contracts */}
            {contratosVencendo.length > 0 && (
                <Card className="border-orange-300 bg-orange-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-orange-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Contratos Vencendo em 30 dias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {contratosVencendo.map(c => (
                                <Badge
                                    key={c.id}
                                    variant="outline"
                                    className="bg-white cursor-pointer hover:bg-orange-100"
                                    onClick={() => navigate(`/contratos/${c.id}`)}
                                >
                                    {c.aluno_nome} - Vence em {new Date(c.data_fim).toLocaleDateString('pt-BR')}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nome ou número do contrato..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['todos', 'pendente', 'assinado', 'ativo', 'vencido', 'cancelado'].map((status) => (
                        <Button
                            key={status}
                            variant={filtroStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFiltroStatus(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Contracts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContratos.map((contrato) => (
                    <ContratoCard
                        key={contrato.id}
                        contrato={contrato}
                        onEnviarEmail={handleEnviarEmail}
                        onDownloadPDF={handleDownloadPDF}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredContratos.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm || filtroStatus !== 'todos'
                                ? 'Nenhum contrato encontrado'
                                : 'Nenhum contrato cadastrado'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || filtroStatus !== 'todos'
                                ? 'Tente ajustar os filtros de busca'
                                : 'Comece criando seu primeiro contrato'}
                        </p>
                        <Button onClick={() => navigate('/contratos/novo')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Primeiro Contrato
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Contratos;
