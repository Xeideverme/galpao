import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Calendar, User, Target, MoreVertical, Copy, Archive, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';

const objetivoColors = {
  hipertrofia: 'bg-purple-100 text-purple-800',
  forca: 'bg-red-100 text-red-800',
  emagrecimento: 'bg-green-100 text-green-800',
  condicionamento: 'bg-blue-100 text-blue-800'
};

const FichaCard = ({ ficha, onDuplicate, onArchive, onDelete }) => {
  const navigate = useNavigate();
  
  const hoje = new Date().toISOString().split('T')[0];
  const isExpirada = ficha.data_fim && ficha.data_fim < hoje;
  const isAtiva = ficha.ativo && !isExpirada;
  
  const getStatusBadge = () => {
    if (!ficha.ativo) {
      return <Badge variant="secondary">ARQUIVADA</Badge>;
    }
    if (isExpirada) {
      return <Badge variant="destructive">EXPIRADA</Badge>;
    }
    return <Badge className="bg-green-500">ATIVA</Badge>;
  };
  
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all"
      data-testid={`ficha-card-${ficha.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isAtiva ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <ClipboardList className={isAtiva ? 'text-blue-600' : 'text-gray-400'} size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{ficha.nome}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User size={14} />
              <span>{ficha.aluno_nome}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/fichas/${ficha.id}`)}>
                <Eye size={14} className="mr-2" /> Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate && onDuplicate(ficha)}>
                <Copy size={14} className="mr-2" /> Duplicar
              </DropdownMenuItem>
              {ficha.ativo && (
                <DropdownMenuItem onClick={() => onArchive && onArchive(ficha)}>
                  <Archive size={14} className="mr-2" /> Arquivar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete && onDelete(ficha)}
                className="text-red-600"
              >
                <Trash2 size={14} className="mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Target size={14} />
          <span className="capitalize">{ficha.objetivo}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="font-medium">Tipo:</span>
          <span>{ficha.tipo}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="font-medium">Divisão:</span>
          <Badge variant="outline">{ficha.divisao}</Badge>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="font-medium">Exercícios:</span>
          <span>{ficha.exercicios?.length || 0}</span>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>Início: {new Date(ficha.data_inicio).toLocaleDateString('pt-BR')}</span>
        </div>
        {ficha.data_fim && (
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Fim: {new Date(ficha.data_fim).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => navigate(`/fichas/${ficha.id}`)}
        >
          Ver Detalhes
        </Button>
        {isAtiva && (
          <Button 
            size="sm" 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => navigate(`/treinos/registrar?ficha=${ficha.id}&aluno=${ficha.aluno_id}`)}
          >
            Registrar Treino
          </Button>
        )}
      </div>
    </div>
  );
};

export default FichaCard;
