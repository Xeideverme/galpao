import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AssinaturaCanvas from '@/components/AssinaturaCanvas';
import {
    ArrowLeft,
    FileText,
    CheckCircle,
    AlertTriangle,
    User,
    Scroll,
    PenTool
} from 'lucide-react';

const AssinarContrato = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contrato, setContrato] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: Leitura, 2: Assinatura, 3: Confirmação
    const [aceitoTermos, setAceitoTermos] = useState(false);
    const [assinaturaAluno, setAssinaturaAluno] = useState(null);
    const [assinaturaResponsavel, setAssinaturaResponsavel] = useState(null);
    const [precisaResponsavel, setPrecisaResponsavel] = useState(false);

    const sigCanvasAluno = useRef(null);
    const sigCanvasResp = useRef(null);

    useEffect(() => {
        loadContrato();
    }, [id]);

    const loadContrato = async () => {
        try {
            const response = await api.get(`/contratos/${id}`);

            if (response.data.status !== 'pendente') {
                alert('Este contrato já foi assinado ou não está disponível para assinatura.');
                navigate(`/contratos/${id}`);
                return;
            }

            setContrato(response.data);
        } catch (error) {
            console.error('Erro ao carregar contrato:', error);
            alert('Contrato não encontrado');
            navigate('/contratos');
        } finally {
            setLoading(false);
        }
    };

    const handleAvancarParaAssinatura = () => {
        if (!aceitoTermos) {
            alert('Você precisa aceitar os termos para continuar.');
            return;
        }
        setStep(2);
    };

    const handleAssinar = async () => {
        // Validate signatures
        if (sigCanvasAluno.current?.isEmpty()) {
            alert('Por favor, faça sua assinatura no campo indicado.');
            return;
        }

        if (precisaResponsavel && sigCanvasResp.current?.isEmpty()) {
            alert('Por favor, adicione a assinatura do responsável.');
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                assinatura_aluno: sigCanvasAluno.current.getDataURL(),
                assinatura_responsavel: precisaResponsavel ? sigCanvasResp.current?.getDataURL() : null,
                ip_address: await getIPAddress()
            };

            await api.post(`/contratos/${id}/assinar`, payload);
            setStep(3);

            // Redirect after delay
            setTimeout(() => {
                navigate(`/contratos/${id}`);
            }, 3000);
        } catch (error) {
            console.error('Erro ao assinar contrato:', error);
            alert('Erro ao assinar contrato: ' + (error.response?.data?.detail || error.message));
            setSubmitting(false);
        }
    };

    const getIPAddress = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
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
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/contratos')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assinar Contrato</h1>
                    <p className="text-gray-500 mt-1">{contrato.numero_contrato}</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4">
                {[
                    { num: 1, label: 'Leitura', icon: Scroll },
                    { num: 2, label: 'Assinatura', icon: PenTool },
                    { num: 3, label: 'Confirmação', icon: CheckCircle }
                ].map((s, i) => (
                    <React.Fragment key={s.num}>
                        <div className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step > s.num ? 'bg-blue-600 text-white' :
                                    step === s.num ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
                                        'bg-gray-100'
                                }`}>
                                <s.icon className="h-5 w-5" />
                            </div>
                            <span className="hidden md:inline font-medium">{s.label}</span>
                        </div>
                        {i < 2 && <div className={`w-16 h-1 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Contract Summary */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <div>
                                <p className="text-gray-500">Aluno</p>
                                <p className="font-medium">{contrato.aluno_nome}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-500">Valor Mensal</p>
                            <p className="font-medium text-green-600">{formatCurrency(contrato.valor_mensal)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Vigência</p>
                            <p className="font-medium">{contrato.duracao_meses} meses</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Período</p>
                            <p className="font-medium">{formatDate(contrato.data_inicio)} - {formatDate(contrato.data_fim)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 1: Read Contract */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scroll className="h-5 w-5" />
                            Leia o Contrato
                        </CardTitle>
                        <CardDescription>
                            Por favor, leia atentamente todos os termos antes de assinar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Contract Content */}
                        <div
                            className="border rounded-lg p-6 bg-white max-h-[500px] overflow-auto mb-6"
                            dangerouslySetInnerHTML={{ __html: contrato.conteudo_gerado }}
                        />

                        {/* Accept Terms */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-yellow-800">Atenção</p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Ao assinar este contrato, você concorda com todos os termos e condições descritos acima.
                                        A assinatura digital tem validade jurídica conforme a legislação brasileira.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <input
                                type="checkbox"
                                id="aceito"
                                checked={aceitoTermos}
                                onChange={(e) => setAceitoTermos(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="aceito" className="cursor-pointer text-sm">
                                Li e aceito todos os termos e condições deste contrato
                            </label>
                        </div>

                        {/* Responsável Toggle */}
                        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="responsavel"
                                checked={precisaResponsavel}
                                onChange={(e) => setPrecisaResponsavel(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="responsavel" className="cursor-pointer text-sm">
                                O aluno é menor de idade e precisa da assinatura de um responsável
                            </label>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleAvancarParaAssinatura}
                                disabled={!aceitoTermos}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Continuar para Assinatura
                                <PenTool className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Signature */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PenTool className="h-5 w-5" />
                            Assinatura Digital
                        </CardTitle>
                        <CardDescription>
                            Use o mouse ou dedo para assinar nos campos abaixo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Student Signature */}
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <AssinaturaCanvas
                                ref={sigCanvasAluno}
                                label={`Assinatura do Aluno (${contrato.aluno_nome})`}
                                width={500}
                                height={150}
                                required={true}
                                showControls={true}
                            />
                        </div>

                        {/* Responsible Signature */}
                        {precisaResponsavel && (
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <AssinaturaCanvas
                                    ref={sigCanvasResp}
                                    label="Assinatura do Responsável Legal"
                                    width={500}
                                    height={150}
                                    required={true}
                                    showControls={true}
                                />
                            </div>
                        )}

                        {/* Legal Notice */}
                        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                            <p>
                                Esta assinatura digital é válida juridicamente conforme a Medida Provisória 2.200-2/2001.
                                Ao clicar em "Assinar Contrato", você confirma que:
                            </p>
                            <ul className="list-disc ml-4 mt-2">
                                <li>A assinatura acima representa sua assinatura verdadeira</li>
                                <li>Você leu e concorda com todos os termos do contrato</li>
                                <li>Você autoriza o armazenamento desta assinatura digital</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Button>
                            <Button
                                onClick={handleAssinar}
                                disabled={submitting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Assinar Contrato
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="py-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-800 mb-2">
                            Contrato Assinado com Sucesso!
                        </h3>
                        <p className="text-green-700 mb-4">
                            Seu contrato foi assinado digitalmente e já está válido.
                        </p>
                        <div className="bg-white rounded-lg p-4 inline-block mb-6">
                            <p className="text-sm text-gray-500">Número do Contrato</p>
                            <p className="text-lg font-bold text-gray-900">{contrato.numero_contrato}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                            Redirecionando para os detalhes do contrato...
                        </p>
                        <div className="animate-pulse flex justify-center mt-4">
                            <div className="h-2 w-32 bg-green-300 rounded"></div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AssinarContrato;
