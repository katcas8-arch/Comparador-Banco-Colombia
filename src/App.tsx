import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ProposalUploader } from './components/ProposalUploader';
import { ClientProfileForm } from './components/ClientProfileForm';
import { ComparisonTable } from './components/ComparisonTable';
import { RecommendationBoxes } from './components/RecommendationBoxes';
import { Footer } from './components/Footer';
import { LoginScreen } from './components/LoginScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import {
  ClientProfile,
  ProposalFile,
  ComparisonResult,
  Usuario,
} from './types';
import {
  Scale,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const INITIAL_PROFILE: ClientProfile = {
  name: 'Carlos Alvarado Méndez',
  vehicleAndUse: 'Toyota RAV4 2022 - Uso particular y laboral',
  maxAnnualBudget: 650000,
  mandatoryCoverages: [
    'colision',
    'robo',
    'asistencia_vial',
    'fenomenos_naturales',
    'vehiculo_sustituto',
  ],
  priorities:
    'Menor deducible ante colisión, cobertura ágil de asistencia vial 24/7 y que incluya vehículo sustituto sin costo extra.',
  paymentMethod: 'Mensual sin intereses (12 cuotas)',
};

export default function App() {
  // Authentication state
  const [user, setUser] = useState<Usuario | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Comparator state
  const [proposals, setProposals] = useState<ProposalFile[]>([]);
  const [clientProfile, setClientProfile] = useState<ClientProfile>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Check current session on mount (GET /api/yo)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/yo');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Error verificando sesión activa:', err);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    } finally {
      setUser(null);
      setResult(null);
      setProposals([]);
    }
  };

  const handleCompare = async () => {
    if (proposals.length === 0) {
      setError('Debes subir al menos 1 propuesta en PDF (máximo 3) para realizar la comparación.');
      return;
    }

    if (proposals.length > 3) {
      setError('Solo se permite comparar hasta 3 propuestas a la vez.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingStep('Preparando documentos PDF para Gemini...');

    try {
      // Animated steps to show clear progress to the advisor
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Gemini está leyendo los PDFs y extrayendo primas y deducibles...');
      }, 1400);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Evaluando reglas de negocio, semáforos y coberturas obligatorias...');
      }, 3500);

      const stepTimer3 = setTimeout(() => {
        setLoadingStep('Redactando recomendación técnica y mensaje para WhatsApp...');
      }, 5500);

      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientProfile,
          proposals: proposals.map((p) => ({
            fileName: p.fileName,
            base64Data: p.base64Data,
          })),
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (response.status === 401) {
        setUser(null);
        throw new Error('Su sesión ha expirado o no es válida. Por favor inicie sesión nuevamente.');
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Ocurrió un error al procesar las propuestas con Gemini.'
        );
      }

      setResult(data.data);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      console.error('Error during comparison:', err);
      setError(
        err.message ||
          'No se pudo completar la comparación. Por favor verifica que los archivos PDF sean válidos e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleNewComparison = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Initial loading screen while checking session
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0A2540] animate-spin" />
          <p className="text-sm font-semibold text-slate-700">
            Cargando Comparador de Propuestas Banco de Colombia...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user: Show Login Screen (Rule 6)
  if (!user) {
    return <LoginScreen onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // 3. User authenticated but must change temporary password (Rule 7)
  if (user.debeCambiarClave) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Header user={user} onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center p-4">
          <ChangePasswordModal
            user={user}
            isForced={true}
            onPasswordChanged={(updatedUser) => {
              setUser(updatedUser);
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // 4. Fully authenticated user: Main Application
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-sky-200">
      {/* Header with user details and logout button (Rule 8) */}
      <Header
        user={user}
        onLogout={handleLogout}
        onChangePasswordClick={() => setShowPasswordModal(true)}
      />

      {/* Optional Password change modal when opened manually from header */}
      {showPasswordModal && (
        <ChangePasswordModal
          user={user}
          isForced={false}
          onPasswordChanged={(updatedUser) => {
            setUser(updatedUser);
            setShowPasswordModal(false);
          }}
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro banner */}
        <div className="bg-gradient-to-r from-[#0A2540] to-[#16426d] rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold">
                Plataforma de Asesoría de Seguros Automotriz
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Sube las cotizaciones en PDF de aseguradoras como el INS, Quálitas o ASSA. Nuestra IA extrae las coberturas, valida el presupuesto en colones, calcula el semáforo y genera un borrador listo para el cliente.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Costa Rica (₡ Colones)</span>
          </div>
        </div>

        {/* Section 1: Propuestas */}
        <ProposalUploader
          proposals={proposals}
          onProposalsChange={setProposals}
          disabled={loading}
        />

        {/* Section 2: Perfil del cliente */}
        <ClientProfileForm
          profile={clientProfile}
          onChange={setClientProfile}
          disabled={loading}
        />

        {/* Big Action Button: Comparar propuestas */}
        <div className="flex flex-col items-center justify-center pt-2">
          {error && (
            <div className="w-full max-w-2xl mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Atención requerida:</p>
                <p className="text-xs sm:text-sm mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCompare}
            disabled={loading || proposals.length === 0}
            className={`w-full sm:w-auto min-w-[320px] px-8 py-4 rounded-xl text-base sm:text-lg font-bold text-white shadow-lg flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
              loading || proposals.length === 0
                ? 'bg-slate-400 cursor-not-allowed shadow-none'
                : 'bg-[#0A2540] hover:bg-[#071d33] active:scale-[0.99] shadow-sky-950/20 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                <span>Analizando propuestas...</span>
              </>
            ) : (
              <>
                <Scale className="w-6 h-6 text-sky-400" />
                <span>Comparar propuestas</span>
                <ArrowRight className="w-5 h-5 text-slate-300" />
              </>
            )}
          </button>

          {/* Loading indicator with stages */}
          {loading && (
            <div className="mt-4 flex flex-col items-center text-center animate-pulse">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-200 text-xs sm:text-sm font-semibold text-[#0A2540]">
                <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
                <span>{loadingStep || 'Analizando propuestas...'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Gemini está procesando los documentos PDF directamente mediante visión e inteligencia artificial.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Resultado */}
        {result && (
          <div ref={resultsRef} className="pt-6 space-y-6 scroll-mt-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0A2540] text-white text-base font-bold shadow-xs">
                3
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Resultado de la Comparación
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Cuadro comparativo de las propuestas analizadas contra el perfil del cliente ({proposals.length} cotizaciones).
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <ComparisonTable proposals={result.proposals} />

            {/* Recommendation & WhatsApp Boxes */}
            <RecommendationBoxes
              preliminaryRecommendation={result.preliminaryRecommendation}
              whatsappMessage={result.whatsappMessage}
              onNewComparison={handleNewComparison}
            />
          </div>
        )}
      </main>

      {/* Mandatory fixed footer */}
      <Footer />
    </div>
  );
}
