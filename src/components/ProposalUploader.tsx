import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  FileCheck2,
  Sparkles,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import { ProposalFile } from '../types';
import { createPredefinedProposals } from '../utils/samplePdfGenerator';

interface ProposalUploaderProps {
  proposals: ProposalFile[];
  onProposalsChange: (proposals: ProposalFile[]) => void;
  disabled?: boolean;
}

export const ProposalUploader: React.FC<ProposalUploaderProps> = ({
  proposals,
  onProposalsChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const pdfFiles = Array.from(files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      setErrorMessage('Por favor seleccione únicamente archivos en formato PDF.');
      return;
    }

    if (proposals.length + pdfFiles.length > 3) {
      setErrorMessage(
        `Solo puede cargar hasta 3 propuestas (actualmente tiene ${proposals.length} y seleccionó ${pdfFiles.length}).`
      );
      return;
    }

    try {
      const newProposals: ProposalFile[] = [];
      for (const file of pdfFiles) {
        const base64Data = await fileToBase64(file);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const fileSizeStr =
          file.size < 1024 * 1024
            ? `${Math.round(file.size / 1024)} KB`
            : `${fileSizeMB} MB`;

        newProposals.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          file,
          fileName: file.name,
          fileSize: fileSizeStr,
          base64Data,
        });
      }

      onProposalsChange([...proposals, ...newProposals]);
    } catch (err) {
      console.error('Error al procesar archivos PDF:', err);
      setErrorMessage('Error al leer uno de los archivos PDF.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input value to allow re-uploading the same file name if deleted
      e.target.value = '';
    }
  };

  const removeProposal = (indexToRemove: number) => {
    if (disabled) return;
    onProposalsChange(proposals.filter((_, idx) => idx !== indexToRemove));
    setErrorMessage(null);
  };

  const handleLoadSamples = async () => {
    try {
      setLoadingSamples(true);
      setErrorMessage(null);
      const samples = await createPredefinedProposals();
      const sampleProposals: ProposalFile[] = samples.map((sample) => ({
        id: `sample-${sample.fileName}`,
        fileName: sample.fileName,
        fileSize: '~35 KB (Generado PDF)',
        base64Data: `data:application/pdf;base64,${sample.base64}`,
        insurerHint: sample.insurerName,
      }));
      onProposalsChange(sampleProposals);
    } catch (err) {
      console.error('Error generando ejemplos:', err);
      setErrorMessage('No se pudieron cargar los PDFs de prueba.');
    } finally {
      setLoadingSamples(false);
    }
  };

  const openPdfPreview = (proposal: ProposalFile) => {
    let pdfUrl = proposal.base64Data;
    if (!pdfUrl.startsWith('data:application/pdf;base64,')) {
      pdfUrl = `data:application/pdf;base64,${pdfUrl}`;
    }
    const win = window.open();
    if (win) {
      win.document.write(
        `<html><head><title>${proposal.fileName}</title></head><body style="margin:0;padding:0;"><iframe src="${pdfUrl}" width="100%" height="100%" style="border:none;"></iframe></body></html>`
      );
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0A2540] text-white text-sm font-bold">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Propuestas de Aseguradoras
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Sube de 1 a 3 cotizaciones en PDF (una propuesta por aseguradora para comparar).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSamples}
            disabled={disabled || loadingSamples}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#0A2540] bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 transition-colors disabled:opacity-50"
            title="Carga 3 PDFs de cotización de aseguradoras de Costa Rica (INS, Quálitas y ASSA)"
          >
            {loadingSamples ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            )}
            <span>Cargar 3 cotizaciones de prueba (INS, Quálitas, ASSA)</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      {proposals.length < 3 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-sky-500 bg-sky-50/50 scale-[1.005]'
              : 'border-slate-300 hover:border-[#0A2540]/60 bg-slate-50/60 hover:bg-slate-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#0A2540] mb-3">
              <UploadCloud className="w-6 h-6 text-[#0A2540]" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Arrastra aquí tus archivos PDF o{' '}
              <span className="text-sky-700 underline font-bold">explora en tu equipo</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Documentos PDF de cotizaciones (hasta 3 archivos, máx 25 MB por archivo)
            </p>
          </div>
        </div>
      )}

      {/* Loaded Proposals List */}
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
          <span>ARCHIVOS CARGADOS ({proposals.length} de 3)</span>
          {proposals.length === 3 && (
            <span className="text-emerald-700 flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5" /> Límite máximo alcanzado
            </span>
          )}
        </div>

        {proposals.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50 text-xs text-slate-400">
            Aún no has agregado propuestas. Arrastra archivos PDF o haz clic en "Cargar 3 cotizaciones de prueba".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {proposals.map((prop, idx) => (
              <div
                key={prop.id}
                className="relative flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#0A2540]/40 hover:shadow-xs transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-lg shrink-0 border border-red-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0A2540] text-white">
                        Propuesta #{idx + 1}
                      </span>
                      {prop.insurerHint && (
                        <span className="text-[10px] text-slate-500 font-medium truncate">
                          {prop.insurerHint}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs font-semibold text-slate-800 truncate mt-1"
                      title={prop.fileName}
                    >
                      {prop.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {prop.fileSize || 'PDF cargado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => openPdfPreview(prop)}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0A2540] text-[11px] font-medium"
                    title="Ver vista preliminar del PDF"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeProposal(idx)}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 text-[11px] font-medium disabled:opacity-50"
                    title="Quitar este archivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
