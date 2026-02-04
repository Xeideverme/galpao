import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EditorTemplate from '@/components/EditorTemplate';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    ArrowLeft,
    Save,
    X,
    Eye
} from 'lucide-react';

const ContratoTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'mensal',
        conteudo_html: '',
        clausulas: []
    });
    const [novaClausula, setNovaClausula] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const response = await api.get('/contratos/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nome || !formData.conteudo_html) {
            alert('Preencha o nome e o conteúdo do template');
            return;
        }

        try {
            if (editingTemplate) {
                await api.put(`/contratos/templates/${editingTemplate.id}`, formData);
            } else {
                await api.post('/contratos/templates', formData);
            }

            setShowForm(false);
            setEditingTemplate(null);
            resetForm();
            loadTemplates();
        } catch (error) {
            console.error('Erro ao salvar template:', error);
            alert('Erro ao salvar template');
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            nome: template.nome,
            tipo: template.tipo,
            conteudo_html: template.conteudo_html,
            clausulas: template.clausulas || []
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja desativar este template?')) {
            return;
        }

        try {
            await api.delete(`/contratos/templates/${id}`);
            loadTemplates();
        } catch (error) {
            console.error('Erro ao deletar template:', error);
            alert('Erro ao deletar template');
        }
    };

    const handleAddClausula = () => {
        if (novaClausula.trim()) {
            setFormData(prev => ({
                ...prev,
                clausulas: [...prev.clausulas, novaClausula.trim()]
            }));
            setNovaClausula('');
        }
    };

    const handleRemoveClausula = (index) => {
        setFormData(prev => ({
            ...prev,
            clausulas: prev.clausulas.filter((_, i) => i !== index)
        }));
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            tipo: 'mensal',
            conteudo_html: '',
            clausulas: []
        });
        setNovaClausula('');
    };

    const getTipoBadge = (tipo) => {
        const colors = {
            mensal: 'bg-blue-100 text-blue-800',
            trimestral: 'bg-green-100 text-green-800',
            semestral: 'bg-purple-100 text-purple-800',
            anual: 'bg-orange-100 text-orange-800'
        };
        return <Badge className={colors[tipo] || 'bg-gray-100'}>{tipo}</Badge>;
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
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/contratos')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Templates de Contrato</h1>
                        <p className="text-gray-500 mt-1">Gerencie os modelos de contrato</p>
                    </div>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Template
                    </Button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingTemplate ? 'Editar Template' : 'Novo Template'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="nome">Nome do Template *</Label>
                                    <Input
                                        id="nome"
                                        value={formData.nome}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                                        placeholder="Ex: Contrato Mensal Padrão"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tipo">Tipo de Contrato</Label>
                                    <select
                                        id="tipo"
                                        value={formData.tipo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="mensal">Mensal</option>
                                        <option value="trimestral">Trimestral</option>
                                        <option value="semestral">Semestral</option>
                                        <option value="anual">Anual</option>
                                    </select>
                                </div>
                            </div>

                            {/* Clausulas */}
                            <div>
                                <Label>Cláusulas Principais</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={novaClausula}
                                        onChange={(e) => setNovaClausula(e.target.value)}
                                        placeholder="Digite uma cláusula..."
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddClausula())}
                                    />
                                    <Button type="button" onClick={handleAddClausula} variant="outline">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.clausulas.map((clausula, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="flex items-center gap-1 py-1 px-2"
                                        >
                                            {clausula}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveClausula(index)}
                                                className="ml-1 hover:text-red-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Editor */}
                            <div>
                                <Label>Conteúdo do Contrato (HTML) *</Label>
                                <EditorTemplate
                                    value={formData.conteudo_html}
                                    onChange={(value) => setFormData(prev => ({ ...prev, conteudo_html: value }))}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingTemplate(null);
                                        resetForm();
                                    }}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="h-4 w-4 mr-2" />
                                    Salvar Template
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Templates List */}
            {!showForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.filter(t => t.ativo !== false).map((template) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{template.nome}</CardTitle>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getTipoBadge(template.tipo)}
                                            <span className="text-xs text-gray-500">v{template.versao || 1}</span>
                                        </div>
                                    </div>
                                    <FileText className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {template.clausulas && template.clausulas.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Cláusulas:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {template.clausulas.slice(0, 3).map((c, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {c.length > 30 ? c.substring(0, 30) + '...' : c}
                                                </Badge>
                                            ))}
                                            {template.clausulas.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{template.clausulas.length - 3} mais
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleEdit(template)}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(template.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {templates.filter(t => t.ativo !== false).length === 0 && (
                        <Card className="col-span-full">
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Nenhum template cadastrado
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Crie seu primeiro template de contrato para começar
                                </p>
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Template
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContratoTemplates;
