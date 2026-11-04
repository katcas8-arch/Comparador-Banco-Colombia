import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Send,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface RecommendationBoxesProps {
  preliminaryRecommendation: string;
  whatsappMessage: string;
  onNewComparison: () => void;
}

export const RecommendationBoxes: React.FC<RecommendationBoxesProps> = ({
  preliminaryRecommendation,
  whatsappMessage,
  onNewComparison,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Recomendación preliminar (borrador) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 sm:p-6 flex-1">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-[#0A2540] rounded-lg border border-sky-100">
                  <Sparkles className="w-4 h-4 text-sky-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Recomendación preliminar (borrador)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Criterio técnico actuarial según prioridades y montos
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                Uso interno asesor
              </span>
            </div>

            <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-200/80">
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {preliminaryRecommendation ||
                  'No se pudo generar la recomendación preliminar.'}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>
                Máximo 5 líneas con montos reales. Si recomienda una propuesta amarilla, cuantifica el adicional.
              </span>
            </div>
          </div>
        </div>

        {/* Box 2: Mensaje sugerido para el cliente (WhatsApp) */}
        <div className="bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden flex flex-col justify-between ring-1 ring-emerald-500/10">
          <div className="p-5 sm:p-6 flex-1">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Mensaje sugerido para el cliente (WhatsApp)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tono cordial, sin tecnicismos, recomendación, 2 razones y alternativa
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Listo para enviar
              </span>
            </div>

            {/* Simulated WhatsApp message bubble */}
            <div className="bg-[#E7F6EC] border border-emerald-200/70 rounded-2xl rounded-tl-xs p-4 text-sm text-slate-800 shadow-2xs font-sans">
              <p className="whitespace-pre-line leading-relaxed">
                {whatsappMessage || 'No se pudo generar el texto para WhatsApp.'}
              </p>
              <div className="mt-2 text-right text-[10px] text-emerald-700/80 font-medium flex items-center justify-end gap-1">
                <span>WhatsApp</span>
                <Clock className="w-3 h-3" />
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
              <span>Máximo 8 líneas. Sin promesas de plazos.</span>
            </div>
          </div>

          <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-2xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Mensaje copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar mensaje</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir WhatsApp Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onNewComparison}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-2xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Nueva comparación</span>
        </button>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>El asesor siempre tiene la última palabra sobre las pólizas.</span>
        </div>
      </div>
    </div>
  );
};
