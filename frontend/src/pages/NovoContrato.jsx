import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Save,
    User,
    FileText,
    Calendar,
    DollarSign,
    Eye,
    CheckCircle
} from 'lucide-react';

const NovoContrato = () => {
    const [alunos, setAlunos] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: Dados, 2: Preview, 3: Confirmação
    const [previewHtml, setPreviewHtml] = useState('');

    const [formData, setFormData] = useState({
        aluno_id: '',
        template_id: '',
        plano_id: '',
        valor_total: '',
        valor_mensal: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
        duracao_meses: 12,
        renovacao_automatica: false,
        dia_vencimento: 5
    });

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Auto-calculate data_fim when duracao_meses changes
        if (formData.data_inicio && formData.duracao_meses) {
            const inicio = new Date(formData.data_inicio);
            const fim = new Date(inicio);
            fim.setMonth(fim.getMonth() + parseInt(formData.duracao_meses));
            setFormData(prev => ({
                ...prev,
                data_fim: fim.toISOString().split('T')[0]
            }));
        }
    }, [formData.data_inicio, formData.duracao_meses]);

    useEffect(() => {
        // Auto-calculate valor_total when valor_mensal or duracao_meses changes
        if (formData.valor_mensal && formData.duracao_meses) {
            const total = parseFloat(formData.valor_mensal) * parseInt(formData.duracao_meses);
            setFormData(prev => ({
                ...prev,
                valor_total: total.toFixed(2)
            }));
        }
    }, [formData.valor_mensal, formData.duracao_meses]);

    useEffect(() => {
        // Auto-fill valor_mensal from selected plano
        if (formData.plano_id) {
            const plano = planos.find(p => p.id === formData.plano_id);
            if (plano) {
                setFormData(prev => ({
                    ...prev,
                    valor_mensal: plano.valor_mensal.toString()
                }));
            }
        }
    }, [formData.plano_id, planos]);

    const loadData = async () => {
        try {
            const [alunosRes, templatesRes, planosRes] = await Promise.all([
                api.get('/alunos'),
                api.get('/contratos/templates'),
                api.get('/planos')
            ]);

            setAlunos(alunosRes.data.filter(a => a.status === 'ativo'));
            setTemplates(templatesRes.data.filter(t => t.ativo !== false));
            setPlanos(planosRes.data.filter(p => p.ativo !== false));
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        // Validate required fields
        if (!formData.aluno_id || !formData.template_id || !formData.valor_mensal) {
            alert('Preencha os campos obrigatórios: Aluno, Template e Valor Mensal');
            return;
        }

        try {
            const template = templates.find(t => t.id === formData.template_id);
            const aluno = alunos.find(a => a.id === formData.aluno_id);
            const plano = planos.find(p => p.id === formData.plano_id);

            if (!template || !aluno) {
                alert('Selecione um aluno e um template válidos');
                return;
            }

            // Generate preview HTML with replacements
            let html = template.conteudo_html;
            const replacements = {
                '{{aluno_nome}}': aluno.nome,
                '{{aluno_cpf}}': aluno.cpf || 'N/A',
                '{{aluno_email}}': aluno.email || 'N/A',
                '{{aluno_telefone}}': aluno.telefone || 'N/A',
                '{{numero_contrato}}': 'CTRT-XXXX-XXXX (Gerado automaticamente)',
                '{{valor_total}}': `R$ ${parseFloat(formData.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                '{{valor_mensal}}': `R$ ${parseFloat(formData.valor_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                '{{data_inicio}}': formData.data_inicio,
                '{{data_fim}}': formData.data_fim,
                '{{duracao_meses}}': formData.duracao_meses.toString(),
                '{{plano_nome}}': plano?.nome || 'N/A',
                '{{dia_vencimento}}': formData.dia_vencimento.toString(),
                '{{data_atual}}': new Date().toLocaleDateString('pt-BR'),
            };

            for (const [key, value] of Object.entries(replacements)) {
                html = html.replace(new RegExp(key, 'g'), value);
            }

            setPreviewHtml(html);
            setStep(2);
        } catch (error) {
            console.error('Erro ao gerar preview:', error);
            alert('Erro ao gerar preview');
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        try {
            const payload = {
                aluno_id: formData.aluno_id,
                template_id: formData.template_id,
                plano_id: formData.plano_id || null,
                valor_total: parseFloat(formData.valor_total),
                valor_mensal: parseFloat(formData.valor_mensal),
                data_inicio: formData.data_inicio,
                data_fim: formData.data_fim,
                duracao_meses: parseInt(formData.duracao_meses),
                renovacao_automatica: formData.renovacao_automatica,
                dia_vencimento: parseInt(formData.dia_vencimento)
            };

            const response = await api.post('/contratos', payload);
            setStep(3);

            // Navigate after short delay
            setTimeout(() => {
                navigate(`/contratos/${response.data.id}`);
            }, 2000);
        } catch (error) {
            console.error('Erro ao criar contrato:', error);
            alert('Erro ao criar contrato: ' + (error.response?.data?.detail || error.message));
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/contratos')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Novo Contrato</h1>
                    <p className="text-gray-500 mt-1">Criar um novo contrato digital</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4">
                {[
                    { num: 1, label: 'Dados' },
                    { num: 2, label: 'Preview' },
                    { num: 3, label: 'Confirmação' }
                ].map((s, i) => (
                    <React.Fragment key={s.num}>
                        <div className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > s.num ? 'bg-blue-600 text-white' :
                                    step === s.num ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
                                        'bg-gray-100'
                                }`}>
                                {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                            </div>
                            <span className="hidden md:inline font-medium">{s.label}</span>
                        </div>
                        {i < 2 && <div className={`w-12 h-1 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Form */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Contrato</CardTitle>
                        <CardDescription>Preencha as informações para gerar o contrato</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Aluno Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="aluno" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Aluno *
                                </Label>
                                <select
                                    id="aluno"
                                    value={formData.aluno_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, aluno_id: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Selecione um aluno...</option>
                                    {alunos.map(aluno => (
                                        <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="template" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Template *
                                </Label>
                                <select
                                    id="template"
                                    value={formData.template_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, template_id: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Selecione um template...</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.nome} ({template.tipo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Plano and Values */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="plano">Plano (opcional)</Label>
                                <select
                                    id="plano"
                                    value={formData.plano_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, plano_id: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione um plano...</option>
                                    {planos.map(plano => (
                                        <option key={plano.id} value={plano.id}>
                                            {plano.nome} - R$ {plano.valor_mensal}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="valor_mensal" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Valor Mensal *
                                </Label>
                                <Input
                                    id="valor_mensal"
                                    type="number"
                                    step="0.01"
                                    value={formData.valor_mensal}
                                    onChange={(e) => setFormData(prev => ({ ...prev, valor_mensal: e.target.value }))}
                                    placeholder="0.00"
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="valor_total">Valor Total (calculado)</Label>
                                <Input
                                    id="valor_total"
                                    type="number"
                                    step="0.01"
                                    value={formData.valor_total}
                                    onChange={(e) => setFormData(prev => ({ ...prev, valor_total: e.target.value }))}
                                    placeholder="0.00"
                                    className="mt-1 bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Dates and Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="data_inicio" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Data Início *
                                </Label>
                                <Input
                                    id="data_inicio"
                                    type="date"
                                    value={formData.data_inicio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="duracao_meses">Duração (meses) *</Label>
                                <select
                                    id="duracao_meses"
                                    value={formData.duracao_meses}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duracao_meses: parseInt(e.target.value) }))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {[1, 3, 6, 12, 24].map(m => (
                                        <option key={m} value={m}>{m} {m === 1 ? 'mês' : 'meses'}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="data_fim">Data Fim (calculado)</Label>
                                <Input
                                    id="data_fim"
                                    type="date"
                                    value={formData.data_fim}
                                    onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
                                    className="mt-1 bg-gray-50"
                                />
                            </div>

                            <div>
                                <Label htmlFor="dia_vencimento">Dia Vencimento</Label>
                                <select
                                    id="dia_vencimento"
                                    value={formData.dia_vencimento}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dia_vencimento: parseInt(e.target.value) }))}
                                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {[1, 5, 10, 15, 20, 25].map(d => (
                                        <option key={d} value={d}>Dia {d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Renovação */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="renovacao"
                                checked={formData.renovacao_automatica}
                                onChange={(e) => setFormData(prev => ({ ...prev, renovacao_automatica: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <Label htmlFor="renovacao" className="cursor-pointer">
                                Renovação automática ao término do contrato
                            </Label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => navigate('/contratos')}>
                                Cancelar
                            </Button>
                            <Button onClick={handlePreview} className="bg-blue-600 hover:bg-blue-700">
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar Contrato
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Preview do Contrato</CardTitle>
                        <CardDescription>Revise o contrato antes de criar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="border rounded-lg p-6 bg-white max-h-[600px] overflow-auto"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />

                        <div className="flex justify-between gap-2 pt-6 border-t mt-6">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar e Editar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Criar Contrato
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="py-12 text-center">
                        <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                        <h3 className="text-2xl font-bold text-green-800 mb-2">
                            Contrato Criado com Sucesso!
                        </h3>
                        <p className="text-green-700 mb-4">
                            Redirecionando para os detalhes do contrato...
                        </p>
                        <div className="animate-pulse flex justify-center">
                            <div className="h-2 w-24 bg-green-300 rounded"></div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default NovoContrato;
