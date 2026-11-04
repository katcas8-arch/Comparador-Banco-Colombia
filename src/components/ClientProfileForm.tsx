import React from 'react';
import { User, Car, Banknote, ShieldAlert, Sparkles, CreditCard, CheckSquare, Square } from 'lucide-react';
import { ClientProfile, MANDATORY_COVERAGE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../types';

interface ClientProfileFormProps {
  profile: ClientProfile;
  onChange: (profile: ClientProfile) => void;
  disabled?: boolean;
}

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({
  profile,
  onChange,
  disabled = false,
}) => {
  const handleInputChange = (field: keyof ClientProfile, value: any) => {
    onChange({
      ...profile,
      [field]: value,
    });
  };

  const toggleCoverage = (coverageId: string) => {
    if (disabled) return;
    const current = profile.mandatoryCoverages;
    const updated = current.includes(coverageId)
      ? current.filter((id) => id !== coverageId)
      : [...current, coverageId];
    handleInputChange('mandatoryCoverages', updated);
  };

  const formattedBudget = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(profile.maxAnnualBudget || 0);

  return (
    <section className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 transition-all">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0A2540] text-white text-sm font-bold">
          2
        </span>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Perfil del Cliente
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Define los requerimientos y condiciones del asegurado para contrastar con las cotizaciones.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nombre del Cliente */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-700" />
            <span>Nombre</span>
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={disabled}
            placeholder="Ej. Carlos Alvarado Méndez"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
          />
        </div>

        {/* Vehículo y uso */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-sky-700" />
            <span>Vehículo y uso</span>
          </label>
          <input
            type="text"
            value={profile.vehicleAndUse}
            onChange={(e) => handleInputChange('vehicleAndUse', e.target.value)}
            disabled={disabled}
            placeholder="Ej. Toyota RAV4 2022 - Uso particular y traslados laborales"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
          />
        </div>

        {/* Presupuesto máximo anual (colones) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-700" />
              <span>Presupuesto máximo anual (colones)</span>
            </label>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {formattedBudget}
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
              ₡
            </div>
            <input
              type="number"
              step="10000"
              min="0"
              value={profile.maxAnnualBudget || ''}
              onChange={(e) =>
                handleInputChange(
                  'maxAnnualBudget',
                  e.target.value === '' ? 0 : Math.max(0, Number(e.target.value))
                )
              }
              disabled={disabled}
              placeholder="650000"
              className="w-full pl-8 pr-3.5 py-2.5 text-sm font-medium bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Forma de pago preferida */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-sky-700" />
            <span>Forma de pago preferida</span>
          </label>
          <div className="relative">
            <select
              value={profile.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50 appearance-none cursor-pointer"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Coberturas obligatorias (casillas) */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-700" />
              <span>Coberturas obligatorias</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              (La propuesta debe incluir todas en la prima base sin costo adicional)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {MANDATORY_COVERAGE_OPTIONS.map((cov) => {
              const isChecked = profile.mandatoryCoverages.includes(cov.id);
              return (
                <button
                  type="button"
                  key={cov.id}
                  onClick={() => toggleCoverage(cov.id)}
                  disabled={disabled}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all ${
                    isChecked
                      ? 'bg-sky-50 border-sky-600 text-sky-950 font-semibold shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-sky-700 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{cov.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prioridades (área de texto) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Prioridades del cliente</span>
          </label>
          <textarea
            rows={2}
            value={profile.priorities}
            onChange={(e) => handleInputChange('priorities', e.target.value)}
            disabled={disabled}
            placeholder="Ej. Busca el menor deducible ante colisión, rapidez en asistencia en carretera y buen respaldo de talleres autorizados."
            className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
          />
        </div>
      </div>
    </section>
  );
};
