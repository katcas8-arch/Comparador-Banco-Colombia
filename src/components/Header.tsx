import React from 'react';
import { ShieldCheck, Sparkles, User, LogOut, KeyRound } from 'lucide-react';
import { Usuario } from '../types';

interface HeaderProps {
  user?: Usuario | null;
  onLogout?: () => void;
  onChangePasswordClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onChangePasswordClick,
}) => {
  return (
    <header className="bg-[#0A2540] text-white border-b border-[#143d63] shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          {/* Logo & App title */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-2 sm:p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/15 shadow-inner shrink-0">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Comparador de Propuestas Banco de Colombia
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Banco de Colombia • Seguros
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                Compara propuestas de seguro de automóvil en minutos. La IA prepara, el asesor decide.
              </p>
            </div>
          </div>

          {/* User Profile & Logout section (Rule 8) */}
          {user && (
            <div className="flex items-center flex-wrap gap-2.5 self-start md:self-auto bg-white/10 border border-white/15 px-3 py-1.5 sm:py-2 rounded-xl backdrop-blur-xs">
              <div className="flex items-center gap-2 pr-1 border-r border-white/20">
                <div className="w-8 h-8 rounded-full bg-sky-600/30 border border-sky-400/40 flex items-center justify-center text-sky-200">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user.nombre}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-sky-300 font-mono">
                      @{user.usuario}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                        user.rol === 'administrador'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      }`}
                    >
                      {user.rol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Change Password quick button */}
              {onChangePasswordClick && (
                <button
                  type="button"
                  onClick={onChangePasswordClick}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cambiar contraseña personal"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}

              {/* Botón Cerrar Sesión (Rule 8) */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600/80 hover:bg-rose-600 border border-rose-500/40 shadow-xs transition-all cursor-pointer"
                  title="Cerrar sesión de usuario"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
