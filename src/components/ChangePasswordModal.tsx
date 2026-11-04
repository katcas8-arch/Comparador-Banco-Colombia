import React, { useState } from 'react';
import { KeyRound, Check, X, AlertCircle, Loader2, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { Usuario } from '../types';

interface ChangePasswordModalProps {
  user: Usuario;
  isForced: boolean;
  onPasswordChanged: (updatedUser: Usuario) => void;
  onClose?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  isForced,
  onPasswordChanged,
  onClose,
}) => {
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Requirements checks
  const hasMinLength = nuevaClave.length >= 8;
  const hasNumber = /\d/.test(nuevaClave);
  const passwordsMatch = nuevaClave.length > 0 && nuevaClave === confirmarClave;
  const isValid = hasMinLength && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength || !hasNumber) {
      setErrorMessage(
        'La nueva contraseña debe tener al menos 8 caracteres y contener al menos un número.'
      );
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/cambiar-clave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevaClave,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'No se pudo actualizar la contraseña.');
        return;
      }

      onPasswordChanged(data.user);
    } catch (err: any) {
      console.error('Error al cambiar contraseña:', err);
      setErrorMessage('Ocurrió un error de conexión al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {isForced ? 'Cambio Obligatorio de Contraseña' : 'Cambiar Contraseña'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isForced
                ? 'Por seguridad corporativa, debe definir una nueva contraseña personal antes de ingresar.'
                : 'Defina su nueva contraseña de acceso para esta plataforma.'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0A2540]" />
              <span>Nueva Contraseña</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={nuevaClave}
                onChange={(e) => setNuevaClave(e.target.value)}
                placeholder="Mínimo 8 caracteres y 1 número"
                disabled={loading}
                className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0A2540]" />
              <span>Confirmar Nueva Contraseña</span>
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={confirmarClave}
              onChange={(e) => setConfirmarClave(e.target.value)}
              placeholder="Repita la nueva contraseña"
              disabled={loading}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
            />
          </div>

          {/* Validation Checklist */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
              Requisitos de la contraseña:
            </span>
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className={hasMinLength ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                Al menos 8 caracteres
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumber ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className={hasNumber ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                Al menos un número (0-9)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {passwordsMatch ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className={passwordsMatch ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                Las contraseñas coinciden
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            {!isForced && onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0A2540] hover:bg-[#071d33] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Actualizando contraseña...</span>
                </>
              ) : (
                <span>Guardar nueva contraseña y continuar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
