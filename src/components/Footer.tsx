import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 bg-slate-100 border-t border-slate-200 py-6 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-slate-700 font-medium text-center sm:text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <p>
              Borrador generado con IA. Debe ser validado por un asesor contra las condiciones reales de la póliza. No suba datos reales de clientes.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A2540]" />
            <span>Comparador de Propuestas Banco de Colombia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
