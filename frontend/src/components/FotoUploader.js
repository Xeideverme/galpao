import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FotoUploader = ({ fotos, setFotos, maxFotos = 6 }) => {
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setError('');

    if (fotos.length + files.length > maxFotos) {
      setError(`Máximo de ${maxFotos} fotos permitidas`);
      return;
    }

    files.forEach(file => {
      // Validar tipo
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setError('Apenas arquivos JPG e PNG são permitidos');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Tamanho máximo de 5MB por foto');
        return;
      }

      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removerFoto = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4" data-testid="foto-uploader">
      <div>
        <label className="text-sm font-medium">Fotos de Progresso</label>
        <p className="text-xs text-gray-500 mt-1">
          Máximo de {maxFotos} fotos (JPG/PNG, até 5MB cada)
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        {fotos.map((foto, index) => (
          <div key={index} className="relative group">
            <img
              src={foto}
              alt={`Foto ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={() => removerFoto(index)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`remover-foto-${index}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {fotos.length < maxFotos && (
          <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Camera className="h-8 w-8 text-gray-400" />
            <span className="text-xs text-gray-500 mt-2">Adicionar Foto</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              multiple
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-foto"
            />
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {fotos.length} de {maxFotos} fotos adicionadas
      </p>
    </div>
  );
};

export default FotoUploader;
