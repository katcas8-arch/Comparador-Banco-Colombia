import React from 'react';
import {
  AnalyzedProposal,
} from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  HelpCircle,
} from 'lucide-react';

interface ComparisonTableProps {
  proposals: AnalyzedProposal[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ proposals }) => {
  if (!proposals || proposals.length === 0) {
    return null;
  }

  // Row definition mapping each of the exact 14 requested rows
  const rows: {
    id: string;
    label: string;
    getValue: (p: AnalyzedProposal) => string;
    render?: (p: AnalyzedProposal) => React.ReactNode;
    isHighlight?: boolean;
  }[] = [
    {
      id: 'annualPremium',
      label: 'Prima anual',
      getValue: (p) => p.annualPremium,
      render: (p) => (
        <span className="font-bold text-slate-900 text-sm sm:text-base">
          {p.annualPremium}
        </span>
      ),
      isHighlight: true,
    },
    {
      id: 'fitsBudget',
      label: 'Cabe en presupuesto',
      getValue: (p) => p.fitsBudget,
      render: (p) => {
        const val = (p.fitsBudget || '').toLowerCase();
        const fits = val.startsWith('sí') || val.startsWith('si') || val === 'true';
        return (
          <div className="flex items-center gap-1.5">
            {fits ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sí (en presupuesto)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                No (supera presupuesto)
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'collisionDeductible',
      label: 'Deducible colisión',
      getValue: (p) => p.collisionDeductible,
    },
    {
      id: 'theftDeductible',
      label: 'Deducible robo',
      getValue: (p) => p.theftDeductible,
    },
    {
      id: 'thirdPartyDamageRC',
      label: 'RC daños a terceros',
      getValue: (p) => p.thirdPartyDamageRC,
    },
    {
      id: 'injuriesRC',
      label: 'RC lesiones',
      getValue: (p) => p.injuriesRC,
    },
    {
      id: 'roadsideAssistance24_7',
      label: 'Asistencia vial 24/7',
      getValue: (p) => p.roadsideAssistance24_7,
    },
    {
      id: 'towing',
      label: 'Grúa',
      getValue: (p) => p.towing,
    },
    {
      id: 'replacementVehicle',
      label: 'Vehículo sustituto',
      getValue: (p) => p.replacementVehicle,
    },
    {
      id: 'naturalPhenomena',
      label: 'Fenómenos naturales',
      getValue: (p) => p.naturalPhenomena,
    },
    {
      id: 'glassBreakage',
      label: 'Rotura de cristales',
      getValue: (p) => p.glassBreakage,
    },
    {
      id: 'highlightedExclusions',
      label: 'Exclusiones destacadas',
      getValue: (p) => p.highlightedExclusions,
    },
    {
      id: 'meetsMandatory',
      label: 'Cumple obligatorias',
      getValue: (p) => p.meetsMandatory,
      render: (p) => {
        const val = (p.meetsMandatory || '').toLowerCase();
        const meets = val.startsWith('sí') || val.startsWith('si') || val === 'true';
        return (
          <div className="flex items-center gap-1.5">
            {meets ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sí (100% incluidas)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                No (incompletas u opcionales)
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'trafficLight',
      label: 'Semáforo',
      getValue: (p) => p.trafficLight,
      render: (p) => {
        const color = (p.trafficLight || '').toLowerCase();
        if (color.includes('verde') || color === 'green') {
          return (
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                VERDE (Cabe y Cumple)
              </span>
              {p.trafficLightReason && (
                <span className="text-[11px] text-slate-500 italic mt-0.5">
                  {p.trafficLightReason}
                </span>
              )}
            </div>
          );
        } else if (color.includes('amarillo') || color === 'yellow') {
          return (
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                AMARILLO (Cumple, excede presupuesto)
              </span>
              {p.trafficLightReason && (
                <span className="text-[11px] text-slate-500 italic mt-0.5">
                  {p.trafficLightReason}
                </span>
              )}
            </div>
          );
        } else {
          return (
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                ROJO (No cumple obligatorias)
              </span>
              {p.trafficLightReason && (
                <span className="text-[11px] text-slate-500 italic mt-0.5">
                  {p.trafficLightReason}
                </span>
              )}
            </div>
          );
        }
      },
      isHighlight: true,
    },
  ];

  return (
    <div className="w-full">
      {/* Table container with horizontal scroll for mobile responsiveness */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          {/* Table Header: Insurer & Proposal Title */}
          <thead>
            <tr className="bg-[#0A2540] text-white">
              <th className="p-4 sm:p-5 w-48 sm:w-60 font-bold text-white text-xs uppercase tracking-wider border-r border-[#143d63] sticky left-0 z-10 bg-[#0A2540]">
                Concepto / Condición
              </th>
              {proposals.map((prop, index) => (
                <th
                  key={index}
                  className="p-4 sm:p-5 min-w-[240px] sm:min-w-[280px] border-r border-[#143d63] last:border-r-0 align-top"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-white/10 rounded-lg shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-1">
                        Aseguradora {index + 1}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                        {prop.insurerName}
                      </h3>
                      {prop.planName && prop.planName !== 'no indicado' && (
                        <p className="text-xs text-slate-300 mt-0.5 font-normal">
                          {prop.planName}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 truncate max-w-[220px] mt-1 font-mono">
                        {prop.fileName}
                      </p>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body: 14 Rows with Alternating Colors */}
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, rIdx) => {
              const isEven = rIdx % 2 === 0;
              const isLastRow = rIdx === rows.length - 1;
              return (
                <tr
                  key={row.id}
                  className={`${
                    row.isHighlight
                      ? isEven
                        ? 'bg-sky-50/60 hover:bg-sky-50'
                        : 'bg-sky-50/40 hover:bg-sky-50'
                      : isEven
                      ? 'bg-white hover:bg-slate-50/80'
                      : 'bg-slate-50/70 hover:bg-slate-100/70'
                  } transition-colors`}
                >
                  {/* Row Label (Sticky Left Column) */}
                  <td
                    className={`p-3.5 sm:p-4 font-semibold text-slate-800 border-r border-slate-200 sticky left-0 z-10 ${
                      row.isHighlight
                        ? isEven
                          ? 'bg-sky-50/90'
                          : 'bg-sky-50/80'
                        : isEven
                        ? 'bg-white'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400 font-normal">
                        {rIdx + 1}.
                      </span>
                      <span>{row.label}</span>
                    </div>
                  </td>

                  {/* Proposal Columns */}
                  {proposals.map((prop, pIdx) => {
                    const rawVal = row.getValue(prop);
                    const isNoIndicado =
                      !rawVal ||
                      rawVal.toLowerCase().trim() === 'no indicado' ||
                      rawVal.trim() === '';

                    return (
                      <td
                        key={pIdx}
                        className={`p-3.5 sm:p-4 border-r border-slate-200 last:border-r-0 align-middle ${
                          isLastRow ? 'py-4' : ''
                        }`}
                      >
                        {row.render ? (
                          row.render(prop)
                        ) : isNoIndicado ? (
                          <span className="inline-flex items-center gap-1 text-slate-400 italic text-xs">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
                            no indicado
                          </span>
                        ) : (
                          <span className="text-slate-800 text-xs sm:text-sm leading-relaxed">
                            {rawVal}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend / Helper for traffic lights */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-700">Reglas de Semáforo:</span>
          <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Verde: Cabe en presupuesto y cumple obligatorias
          </span>
          <span className="inline-flex items-center gap-1 text-amber-800 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Amarillo: Cumple pero no cabe
          </span>
          <span className="inline-flex items-center gap-1 text-rose-800 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Rojo: No cumple obligatorias
          </span>
        </div>
        <span className="italic text-[11px]">
          * Desliza horizontalmente en pantallas pequeñas para comparar todas las columnas.
        </span>
      </div>
    </div>
  );
};
