import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, Apple, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7777';

const categorias = [
  { value: 'proteina', label: 'Proteínas' },
  { value: 'carboidrato', label: 'Carboidratos' },
  { value: 'gordura', label: 'Gorduras' },
  { value: 'vegetal', label: 'Vegetais' },
  { value: 'fruta', label: 'Frutas' },
  { value: 'laticinios', label: 'Laticínios' },
];

const Alimentos = () => {
  const { token } = useAuth();
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nome: '', categoria: '', porcao_padrao: 100, calorias_por_100g: 0, proteinas_por_100g: 0, carboidratos_por_100g: 0, gorduras_por_100g: 0 });

  useEffect(() => { fetchAlimentos(); }, []);

  const fetchAlimentos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/alimentos`, { headers: { Authorization: `Bearer ${token}` } });
      setAlimentos(res.data);
    } catch (e) { toast.error('Erro ao carregar alimentos'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/alimentos`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Alimento criado!');
      setShowModal(false);
      setFormData({ nome: '', categoria: '', porcao_padrao: 100, calorias_por_100g: 0, proteinas_por_100g: 0, carboidratos_por_100g: 0, gorduras_por_100g: 0 });
      fetchAlimentos();
    } catch (e) { toast.error(e.response?.data?.detail || 'Erro'); }
  };

  const filtered = alimentos.filter(a => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = !filtroCategoria || filtroCategoria === 'all' || a.categoria === filtroCategoria;
    return matchSearch && matchCategoria;
  });

  const grouped = filtered.reduce((acc, a) => { acc[a.categoria] = acc[a.categoria] || []; acc[a.categoria].push(a); return acc; }, {});

  return (
    <div className="space-y-6" data-testid="alimentos-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alimentos</h1>
          <p className="text-gray-500">{alimentos.length} alimentos cadastrados</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={20} className="mr-2" /> Novo Alimento</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-4"><Filter size={18} className="text-gray-500" /><span className="font-medium">Filtros</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input placeholder="Buscar alimento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort().map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-lg font-semibold text-gray-800 capitalize mb-3">{categorias.find(c => c.value === cat)?.label || cat}</h2>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Alimento</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">Calorias</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">P</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">C</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(a => (
                      <tr key={a.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{a.nome}</td>
                        <td className="px-4 py-2 text-sm">{a.calorias_por_100g} kcal</td>
                        <td className="px-4 py-2 text-sm text-blue-600">{a.proteinas_por_100g}g</td>
                        <td className="px-4 py-2 text-sm text-green-600">{a.carboidratos_por_100g}g</td>
                        <td className="px-4 py-2 text-sm text-yellow-600">{a.gorduras_por_100g}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Alimento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nome *</Label><Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required /></div>
            <div><Label>Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Calorias/100g *</Label><Input type="number" value={formData.calorias_por_100g} onChange={(e) => setFormData({...formData, calorias_por_100g: parseFloat(e.target.value)})} required /></div>
              <div><Label>Proteínas/100g *</Label><Input type="number" step="0.1" value={formData.proteinas_por_100g} onChange={(e) => setFormData({...formData, proteinas_por_100g: parseFloat(e.target.value)})} required /></div>
              <div><Label>Carboidratos/100g *</Label><Input type="number" step="0.1" value={formData.carboidratos_por_100g} onChange={(e) => setFormData({...formData, carboidratos_por_100g: parseFloat(e.target.value)})} required /></div>
              <div><Label>Gorduras/100g *</Label><Input type="number" step="0.1" value={formData.gorduras_por_100g} onChange={(e) => setFormData({...formData, gorduras_por_100g: parseFloat(e.target.value)})} required /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button><Button type="submit">Criar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Alimentos;
