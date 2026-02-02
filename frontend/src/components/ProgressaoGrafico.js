import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProgressaoGrafico = ({ data, exercicioNome }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Nenhum dado de progressão disponível</p>
      </div>
    );
  }
  
  // Formatar dados para o gráfico
  const chartData = data.map(item => ({
    ...item,
    data: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="font-semibold text-gray-800 mb-4">
        Progressão de Carga - {exercicioNome}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="data" 
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Carga (kg)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => {
              const labels = {
                carga_media: 'Carga Média',
                carga_maxima: 'Carga Máxima'
              };
              return [`${value} kg`, labels[name] || name];
            }}
          />
          <Legend 
            formatter={(value) => {
              const labels = {
                carga_media: 'Carga Média',
                carga_maxima: 'Carga Máxima'
              };
              return labels[value] || value;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="carga_media" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="carga_maxima" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressaoGrafico;
