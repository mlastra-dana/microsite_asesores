import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Download, ExternalLink, User, Mail, Phone, Briefcase } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { provisionAdvisor, type ProvisionResponse } from '../utils/api';

type ActivationState = 'loading' | 'no_param' | 'success' | 'error';

export default function ActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ActivationState>('loading');
  const [provisionData, setProvisionData] = useState<ProvisionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDownloadToast, setShowDownloadToast] = useState(false);

  const danaparam = searchParams.get('danaparam');

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

  const handleDownloadCard = () => {
    setShowDownloadToast(true);
    setTimeout(() => setShowDownloadToast(false), 5000);
  };

  const handleBackToDemo = () => {
    navigate('/asesor/2377');
  };

  const handleBackToHome = () => {
    navigate('/');
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
  const micrositeUrl = provisionData?.micrositeUrl;
  const advisorId = provisionData?.advisorId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6EDF5] via-white to-white">
      <header className="bg-[#002B55] px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <BrandLogo inverse />
        </div>
      </header>
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Toast para descarga */}
        {showDownloadToast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in rounded-lg bg-green-50 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium text-green-800">
                Próximamente podrás descargar tu carnet digital para Apple Wallet y Android.
              </p>
            </div>
          </div>
        )}

        {/* Encabezado success */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-[#111827] md:text-4xl">
            Tu perfil digital está listo
          </h1>
          
          <p className="mt-3 text-lg text-[#6B7280]">
            Generamos tu microsite personalizado y tu carnet digital como asesor de Mercantil Seguros.
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
              <h2 className="mb-4 text-xl font-bold text-[#111827]">Acciones disponibles</h2>
              
              <div className="space-y-4">
                <Link
                  to={micrositeUrl?.replace(window.location.origin, '') || `/asesor/${advisorId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00478D] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#00376E]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver mi microsite
                </Link>

                {advisorId && (
                  <Link
                    to={`/asesor/${advisorId}/actualizar`}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[#00478D] px-5 py-3 text-sm font-extrabold text-[#00478D] transition hover:bg-[#00478D] hover:text-white"
                  >
                    <User className="h-4 w-4" />
                    Actualizar mis datos
                  </Link>
                )}

                <button
                  onClick={handleDownloadCard}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E6EDF5] px-5 py-3 text-sm font-extrabold text-[#00478D] transition hover:bg-[#E5E7EB]"
                >
                  <Download className="h-4 w-4" />
                  Descargar carnet digital
                </button>
              </div>
            </div>

            {/* Bloque explicativo */}
            <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6">
              <h3 className="mb-3 font-bold text-[#111827]">Tu microsite te permite:</h3>
              
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Compartir tu perfil profesional con clientes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Facilitar el contacto por WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Recibir solicitudes de cotización.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Revisar y actualizar tus datos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00478D]"></div>
                  <span className="text-sm text-[#6B7280]">Activar tu carnet digital para compartir tu perfil rápidamente.</span>
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
