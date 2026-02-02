import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ComparacaoMedidas = ({ primeira, ultima }) => {
  if (!primeira || !ultima) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Necessário pelo menos 2 avaliações para comparar
        </CardContent>
      </Card>
    );
  }

  const calcularDiferenca = (campo) => {
    const valorPrimeira = primeira[campo];
    const valorUltima = ultima[campo];
    
    if (!valorPrimeira || !valorUltima) return null;
    
    const diferenca = valorUltima - valorPrimeira;
    return {
      valor: Math.abs(diferenca).toFixed(2),
      tipo: diferenca > 0 ? 'aumento' : diferenca < 0 ? 'reducao' : 'manteve'
    };
  };

  const medidas = [
    { nome: 'Peso', campo: 'peso', unidade: 'kg' },
    { nome: 'IMC', campo: 'imc', unidade: '' },
    { nome: '% Gordura', campo: 'percentual_gordura', unidade: '%' },
    { nome: 'Massa Magra', campo: 'massa_magra', unidade: 'kg' },
  ];

  const getIcone = (tipo) => {
    if (tipo === 'aumento') return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (tipo === 'reducao') return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getCorTexto = (tipo) => {
    if (tipo === 'aumento') return 'text-red-600';
    if (tipo === 'reducao') return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <Card data-testid="comparacao-medidas">
      <CardHeader>
        <CardTitle>Comparação de Medidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {medidas.map((medida) => {
            const diff = calcularDiferenca(medida.campo);
            if (!diff) return null;

            return (
              <div key={medida.campo} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{medida.nome}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-500">
                      De: {primeira[medida.campo]?.toFixed(2)} {medida.unidade}
                    </span>
                    <span className="text-sm text-gray-500">
                      Para: {ultima[medida.campo]?.toFixed(2)} {medida.unidade}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getIcone(diff.tipo)}
                  <span className={`font-bold ${getCorTexto(diff.tipo)}`}>
                    {diff.valor} {medida.unidade}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparacaoMedidas;