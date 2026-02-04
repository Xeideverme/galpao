import React from 'react';
import { Dumbbell, Play, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';

const dificuldadeColors = {
  iniciante: 'bg-green-100 text-green-800',
  intermediario: 'bg-yellow-100 text-yellow-800',
  avancado: 'bg-red-100 text-red-800'
};

const grupoIcons = {
  peito: '💪',
  costas: '🔙',
  pernas: '🦵',
  ombros: '🏋️',
  biceps: '💪',
  triceps: '💪',
  abdomen: '🎯',
  cardio: '❤️',
  gluteos: '🍑'
};

const ExercicioCard = ({ exercicio, onEdit, onDelete, onView }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onView && onView(exercicio)}
      data-testid={`exercicio-card-${exercicio.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
            {grupoIcons[exercicio.grupo_muscular] || <Dumbbell className="text-blue-600" size={24} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {exercicio.nome}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{exercicio.grupo_muscular}</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit && onEdit(exercicio); }}>
              <Edit size={14} className="mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(exercicio); }}
              className="text-red-600"
            >
              <Trash2 size={14} className="mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs capitalize">
          {exercicio.equipamento.replace('_', ' ')}
        </Badge>
        <Badge className={`text-xs ${dificuldadeColors[exercicio.dificuldade]}`}>
          {exercicio.dificuldade}
        </Badge>
        {exercicio.video_url && (
          <Badge variant="secondary" className="text-xs">
            <Play size={10} className="mr-1" /> Vídeo
          </Badge>
        )}
      </div>
      
      {exercicio.descricao && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{exercicio.descricao}</p>
      )}
    </div>
  );
};

export default ExercicioCard;
