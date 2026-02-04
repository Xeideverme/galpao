import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

const AssinaturaCanvas = forwardRef(({ 
  onSave,
  width = 500,
  height = 200,
  penColor = '#000000',
  backgroundColor = '#ffffff',
  label = 'Assinatura',
  showControls = true,
  required = true
}, ref) => {
  const sigCanvas = useRef(null);

  useImperativeHandle(ref, () => ({
    clear: () => sigCanvas.current?.clear(),
    isEmpty: () => sigCanvas.current?.isEmpty(),
    getDataURL: () => sigCanvas.current?.toDataURL('image/png'),
    getCanvas: () => sigCanvas.current
  }));

  const handleClear = () => {
    sigCanvas.current?.clear();
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Por favor, faça sua assinatura antes de continuar.');
      return;
    }
    const dataURL = sigCanvas.current.toDataURL('image/png');
    onSave?.(dataURL);
  };

  const isValid = () => {
    return !sigCanvas.current?.isEmpty();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white"
        style={{ width: width, maxWidth: '100%' }}
      >
        <SignatureCanvas
          ref={sigCanvas}
          penColor={penColor}
          backgroundColor={backgroundColor}
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas',
            style: { width: '100%', height: height }
          }}
        />
      </div>
      
      <p className="text-xs text-gray-500">
        Use o mouse ou dedo para assinar no campo acima
      </p>

      {showControls && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          {onSave && (
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Assinatura
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

AssinaturaCanvas.displayName = 'AssinaturaCanvas';

export default AssinaturaCanvas;
