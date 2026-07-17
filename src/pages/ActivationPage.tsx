import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, ExternalLink, User, Mail, Phone, Briefcase } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { activateAdvisorMicrosite, provisionAdvisor, type ProvisionResponse } from '../utils/api';

type ActivationState = 'loading' | 'no_param' | 'success' | 'error';

export default function ActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ActivationState>('loading');
  const [provisionData, setProvisionData] = useState<ProvisionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isActivating, setIsActivating] = useState(false);

  const danaparam = searchParams.get('dana') ?? searchParams.get('danaparam');

  useEffect(() => {
    const activateMicrosite = async () => {
      if (!danaparam) {
        setState('no_param');
        return;
      }

      if (/[{}$]/.test(danaparam)) {
        setErrorMessage('El enlace no fue personalizado por DANA. El parámetro danaparam llegó como plantilla y no como valor real.');
        setState('error');
        return;
      }

      try {
        setState('loading');
        const data = await provisionAdvisor(danaparam);
        
        if (data.ok) {
          setProvisionData(data);
          setState('success');
        } else {
          setErrorMessage(data.message || 'Error desconocido en la activación');
          setState('error');
        }
      } catch (error) {
        console.error('Error en la activación:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Error desconocido en la activación');
        setState('error');
      }
    };

    activateMicrosite();
  }, [danaparam]);

  const handleBackToDemo = () => {
    navigate('/asesor/2377');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleActivateMicrosite = async () => {
    if (!danaparam) {
      return;
    }

    try {
      setIsActivating(true);
      setErrorMessage('');
      const result = await activateAdvisorMicrosite(danaparam);
      const targetUrl = result.micrositeUrl
        ? new URL(result.micrositeUrl).pathname
        : `/asesor/${result.advisorId}`;

      navigate(`${targetUrl}?dana=${encodeURIComponent(danaparam)}`);
    } catch (error) {
      console.error('Error activando microsite:', error);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo activar el microsite.');
    } finally {
      setIsActivating(false);
    }
  };

  // Estado: Sin parámetro danaparam
  if (state === 'no_param') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6EDF5] via-white to-white">
        <header className="bg-[#002B55] px-4 py-4">
          <div className="mx-auto max-w-6xl">
            <BrandLogo inverse />
          </div>
        </header>
        
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-soft">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-[#111827]">
              No pudimos activar tu microsite
            </h1>
            
            <p className="mt-3 text-[#6B7280]">
              El enlace no contiene la información necesaria para preparar tu perfil digital.
            </p>
            
            <button
              onClick={handleBackToDemo}
              className="mt-6 w-full rounded-lg bg-[#00478D] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#00376E]"
            >
              Volver al microsite demo
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Estado: Loading
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6EDF5] via-white to-white">
        <header className="bg-[#002B55] px-4 py-4">
          <div className="mx-auto max-w-6xl">
            <BrandLogo inverse />
          </div>
        </header>
        
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-soft">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6EDF5]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00478D] border-t-transparent"></div>
            </div>
            
            <h1 className="text-2xl font-extrabold text-[#111827]">
              Estamos preparando tu perfil digital
            </h1>
            
            <p className="mt-3 text-[#6B7280]">
              Estamos consultando la información de tu registro para generar tu microsite y tu carnet digital.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Estado: Error
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E6EDF5] via-white to-white">
        <header className="bg-[#002B55] px-4 py-4">
          <div className="mx-auto max-w-6xl">
            <BrandLogo inverse />
          </div>
        </header>
        
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-soft">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-[#111827]">
              No pudimos preparar tu microsite
            </h1>
            
            <p className="mt-3 text-[#6B7280]">
              Ocurrió un problema consultando la información de tu registro. Intenta abrir nuevamente el enlace recibido por correo.
            </p>
            
            {errorMessage && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{errorMessage}</p>
              </div>
            )}
            
            <button
              onClick={handleBackToHome}
              className="mt-6 w-full rounded-lg bg-[#00478D] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#00376E]"
            >
              Volver al inicio
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Estado: Success
  const advisor = provisionData?.advisor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6EDF5] via-white to-white">
      <header className="bg-[#002B55] px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <BrandLogo inverse />
        </div>
      </header>
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Encabezado success */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-[#111827] md:text-4xl">
            Activa tu perfil digital
          </h1>
          
          <p className="mt-3 text-lg text-[#6B7280]">
            Revisa tu información y activa tu microsite para generar tu enlace permanente.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Card del asesor */}
          <div className="rounded-[28px] bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-xl font-bold text-[#111827]">Tu información</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                  {advisor?.photoUrl ? (
                    <img 
                      src={advisor.photoUrl} 
                      alt={advisor.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img 
                      src="https://images.email-platform.com/venturestars/Gemini_Generated_Image_8p7yke8p7yke8p7y.png" 
                      alt="Foto del asesor" 
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#111827]">{advisor?.name}</h3>
                  <p className="text-sm text-[#6B7280]">{advisor?.role || 'Asesor de Seguros'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {advisor?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#00478D]" />
                    <span className="text-sm text-[#6B7280]">{advisor.email}</span>
                  </div>
                )}

                {advisor?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#00478D]" />
                    <span className="text-sm text-[#6B7280]">{advisor.phone}</span>
                  </div>
                )}

                {advisor?.advisorCode && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#00478D]" />
                    <span className="text-sm text-[#6B7280]">Código: {advisor.advisorCode}</span>
                  </div>
                )}

                {advisor?.city && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#00478D]" />
                    <span className="text-sm text-[#6B7280]">{advisor.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-6">
            <div className="rounded-[28px] bg-white p-6 shadow-soft">
              <h2 className="mb-4 text-xl font-bold text-[#111827]">Activación</h2>
              
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleActivateMicrosite}
                  disabled={isActivating}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00478D] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#00376E] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ExternalLink className="h-4 w-4" />
                  {isActivating ? 'Activando...' : 'Activar mi microsite'}
                </button>

                {errorMessage && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Bloque explicativo */}
            <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6">
              <h3 className="mb-3 font-bold text-[#111827]">Al activar:</h3>
              
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Generaremos tu enlace permanente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Recibirás un correo para guardarlo en tu teléfono.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Entrarás directamente a tu microsite.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .shadow-soft {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
}
