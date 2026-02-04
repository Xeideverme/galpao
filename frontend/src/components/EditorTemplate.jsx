import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Code, Info } from 'lucide-react';

const PLACEHOLDERS = [
    { key: '{{aluno_nome}}', description: 'Nome completo do aluno' },
    { key: '{{aluno_cpf}}', description: 'CPF do aluno' },
    { key: '{{aluno_email}}', description: 'Email do aluno' },
    { key: '{{aluno_telefone}}', description: 'Telefone do aluno' },
    { key: '{{numero_contrato}}', description: 'Número do contrato (auto-gerado)' },
    { key: '{{valor_total}}', description: 'Valor total do contrato' },
    { key: '{{valor_mensal}}', description: 'Valor mensal' },
    { key: '{{data_inicio}}', description: 'Data de início do contrato' },
    { key: '{{data_fim}}', description: 'Data de término do contrato' },
    { key: '{{duracao_meses}}', description: 'Duração em meses' },
    { key: '{{plano_nome}}', description: 'Nome do plano contratado' },
    { key: '{{dia_vencimento}}', description: 'Dia do vencimento mensal' },
    { key: '{{data_atual}}', description: 'Data atual (geração do contrato)' },
];

const DEFAULT_TEMPLATE = `<div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #2563eb; margin-bottom: 10px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
    <p style="font-size: 14px; color: #666;">Contrato Nº {{numero_contrato}}</p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">CONTRATANTE:</h3>
    <p><strong>Nome:</strong> {{aluno_nome}}</p>
    <p><strong>CPF:</strong> {{aluno_cpf}}</p>
    <p><strong>Email:</strong> {{aluno_email}}</p>
    <p><strong>Telefone:</strong> {{aluno_telefone}}</p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">CONTRATADA:</h3>
    <p><strong>NextFit Centro de Treinamento</strong></p>
    <p>CNPJ: XX.XXX.XXX/0001-XX</p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">CLÁUSULA 1ª - OBJETO DO CONTRATO</h3>
    <p>O presente contrato tem como objeto a prestação de serviços de <strong>{{plano_nome}}</strong> pelo período de <strong>{{duracao_meses}} meses</strong>.</p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">CLÁUSULA 2ª - VALOR E PAGAMENTO</h3>
    <p><strong>Valor mensal:</strong> {{valor_mensal}}</p>
    <p><strong>Valor total:</strong> {{valor_total}}</p>
    <p><strong>Vencimento:</strong> Todo dia {{dia_vencimento}} de cada mês</p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">CLÁUSULA 3ª - VIGÊNCIA</h3>
    <p><strong>Data de início:</strong> {{data_inicio}}</p>
    <p><strong>Data de término:</strong> {{data_fim}}</p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">CLÁUSULA 4ª - CANCELAMENTO</h3>
    <p>O cancelamento deverá ser solicitado com 30 dias de antecedência, sob pena de pagamento de multa proporcional.</p>
  </div>
  
  <div style="margin-bottom: 30px;">
    <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">CLÁUSULA 5ª - DISPOSIÇÕES GERAIS</h3>
    <p>O presente contrato obedece às normas do Código de Defesa do Consumidor e legislação aplicável.</p>
  </div>
  
  <p style="margin-top: 60px;"><strong>Data:</strong> {{data_atual}}</p>
  
  <div style="margin-top: 80px; text-align: center;">
    <div style="display: inline-block; border-top: 1px solid #000; width: 300px; padding-top: 10px;">
      <p>Assinatura do Contratante</p>
    </div>
  </div>
</div>`;

const EditorTemplate = ({
    value,
    onChange,
    showPreview = true,
    showPlaceholders = true
}) => {
    const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview' | 'split'

    const insertPlaceholder = (placeholder) => {
        const textarea = document.getElementById('template-editor');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = value.substring(0, start) + placeholder + value.substring(end);
            onChange(newValue);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
            }, 0);
        }
    };

    const loadDefaultTemplate = () => {
        if (window.confirm('Isso substituirá o conteúdo atual. Deseja continuar?')) {
            onChange(DEFAULT_TEMPLATE);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'editor' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('editor')}
                    >
                        <Code className="h-4 w-4 mr-1" />
                        Editor
                    </Button>
                    <Button
                        variant={viewMode === 'preview' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                    </Button>
                    <Button
                        variant={viewMode === 'split' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('split')}
                    >
                        Split
                    </Button>
                </div>
                <Button variant="outline" size="sm" onClick={loadDefaultTemplate}>
                    Carregar Template Padrão
                </Button>
            </div>

            {/* Placeholders Reference */}
            {showPlaceholders && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Placeholders Disponíveis (clique para inserir)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        <div className="flex flex-wrap gap-2">
                            {PLACEHOLDERS.map((p) => (
                                <Badge
                                    key={p.key}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                                    onClick={() => insertPlaceholder(p.key)}
                                    title={p.description}
                                >
                                    {p.key}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Editor / Preview */}
            <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {(viewMode === 'editor' || viewMode === 'split') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Conteúdo HTML
                        </label>
                        <textarea
                            id="template-editor"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-[500px] font-mono text-sm p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Digite o HTML do template aqui..."
                        />
                    </div>
                )}

                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preview
                        </label>
                        <div
                            className="w-full h-[500px] border rounded-lg bg-white overflow-auto p-4"
                            dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">Preview do template aparecerá aqui...</p>' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorTemplate;
