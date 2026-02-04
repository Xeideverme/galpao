import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CircunferenciaInput = ({ label, id, value, onChange, testId }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          data-testid={testId}
          type="number"
          step="0.1"
          min="0"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="pr-10"
          placeholder="0.0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">cm</span>
      </div>
    </div>
  );
};

export default CircunferenciaInput;