import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Calendar, User, TrendingUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AvaliacaoCard = ({ avaliacao }) => {
  const navigate = useNavigate();

  const formatarData = (dataStr) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  };

  const getStatusIMC = (imc) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', cor: 'bg-yellow-100 text-yellow-800' };
    if (imc < 25) return { label: 'Peso normal', cor: 'bg-green-100 text-green-800' };
    if (imc < 30) return { label: 'Sobrepeso', cor: 'bg-orange-100 text-orange-800' };
    return { label: 'Obesidade', cor: 'bg-red-100 text-red-800' };
  };

  const statusIMC = getStatusIMC(avaliacao.imc);

  return (
    <Card data-testid={`avaliacao-card-${avaliacao.id}`} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{avaliacao.aluno_nome}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatarData(avaliacao.data_avaliacao)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Peso</p>
            <p className="text-lg font-bold text-gray-900">{avaliacao.peso} kg</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">IMC</p>
            <p className="text-lg font-bold text-gray-900">{avaliacao.imc}</p>
          </div>
        </div>
        
        <div>
          <Badge className={statusIMC.cor}>{statusIMC.label}</Badge>
        </div>

        {avaliacao.percentual_gordura && (
          <div className="border-t pt-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Gordura: {avaliacao.percentual_gordura}%
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
          <User className="h-3 w-3" />
          <span>Prof. {avaliacao.professor_nome}</span>
        </div>

        <Button 
          className="w-full mt-2" 
          variant="outline"
          onClick={() => navigate(`/avaliacoes/${avaliacao.id}`)}
          data-testid={`ver-avaliacao-${avaliacao.id}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

export default AvaliacaoCard;