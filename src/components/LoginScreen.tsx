import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Usuario } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usuario.trim().toLowerCase();
    if (!cleanUser || !contrasena) {
      setErrorMessage('usuario o contraseña incorrectos');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: cleanUser,
          contrasena,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Specific error messages as requested by prompt
        if (res.status === 403 || data.error?.includes('suspendido')) {
          setErrorMessage('usuario suspendido, contacte al administrador');
        } else {
          setErrorMessage('usuario o contraseña incorrectos');
        }
        return;
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setErrorMessage('usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased selection:bg-sky-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Shield Logo */}
        <div className="inline-flex p-3.5 bg-[#0A2540] rounded-2xl shadow-md border border-[#143d63] mb-4 text-white">
          <ShieldCheck className="w-10 h-10 text-sky-400" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Comparador de Propuestas Banco de Colombia
        </h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Corredora de Seguros • Banco de Colombia
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-[#0A2540] border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Acceso Privado para Asesores</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-slate-200">
          <div className="pb-5 mb-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingrese su nombre de usuario asignado y contraseña para acceder al comparador.
            </p>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Usuario */}
            <div>
              <label
                htmlFor="usuario"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#0A2540]" />
                <span>Usuario</span>
              </label>
              <div className="relative">
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  autoComplete="username"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="ej. admin"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 text-sm font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                htmlFor="contrasena"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#0A2540]" />
                <span>Contraseña</span>
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  name="contrasena"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón Entrar */}
            <div>
              <button
                type="submit"
                disabled={loading || !usuario.trim() || !contrasena}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#0A2540] hover:bg-[#071d33] active:scale-[0.99] shadow-md shadow-slate-900/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </div>
          </form>

          {/* Informative credentials note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 leading-normal">
              Acceso restringido. Los usuarios son creados exclusivamente por el administrador.
            </p>
            <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 inline-block">
              <span className="font-semibold text-slate-700">Administrador inicial:</span>{' '}
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">admin</span> /{' '}
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Fundepos2026*</span>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Comparador de Propuestas Banco de Colombia • Sesión protegida contra condiciones de póliza reales
        </p>
      </div>
    </div>
  );
};
