import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const GraficoMacros = ({ proteinas, carboidratos, gorduras, calorias }) => {
  const data = [
    { name: 'Proteínas', value: proteinas, cal: proteinas * 4 },
    { name: 'Carboidratos', value: carboidratos, cal: carboidratos * 4 },
    { name: 'Gorduras', value: gorduras, cal: gorduras * 9 },
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <h3 className="font-semibold text-gray-800 mb-2">Distribuição de Macros</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="cal" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip formatter={(v, n, p) => [`${p.payload.value}g (${v} kcal)`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 text-sm">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span>P: {proteinas}g</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>C: {carboidratos}g</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>G: {gorduras}g</span>
      </div>
      {calorias && <p className="text-center mt-2 font-medium">{calorias} kcal</p>}
    </div>
  );
};

export default GraficoMacros;
