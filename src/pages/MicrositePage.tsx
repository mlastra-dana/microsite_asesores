import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdvisorCard from '../components/AdvisorCard';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { getAdvisorById, hasAdvisorById, type Advisor } from '../data/advisors';
import { products } from '../data/products';
import { fetchAdvisorById, provisionAdvisor, type Advisor as ApiAdvisor } from '../utils/api';

function emptyAdvisor(id?: string): Advisor {
  return {
    id: id || '',
    company: 'Mercantil Seguros',
    name: '',
    role: 'Asesor de Seguros',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    advisorCode: '',
    photoUrl: '',
    bio: '',
    products: [],
  };
}

function toPageAdvisor(apiAdvisor: ApiAdvisor, fallback: Advisor): Advisor {
  return {
    ...fallback,
    id: apiAdvisor.advisorId || fallback.id,
    company: apiAdvisor.company || fallback.company,
    name: apiAdvisor.name || fallback.name,
    role: apiAdvisor.role || fallback.role,
    email: apiAdvisor.email || fallback.email,
    website: apiAdvisor.website || fallback.website,
    contactUrl: apiAdvisor.contactUrl || fallback.contactUrl,
    phone: apiAdvisor.phone || fallback.phone,
    whatsapp: apiAdvisor.whatsapp || apiAdvisor.phone || fallback.whatsapp,
    city: apiAdvisor.city || fallback.city,
    advisorCode: apiAdvisor.advisorCode || fallback.advisorCode,
    photoUrl: apiAdvisor.photoUrl || fallback.photoUrl,
    bio: apiAdvisor.bio || fallback.bio,
    products: apiAdvisor.products?.length ? apiAdvisor.products : fallback.products,
  };
}

function cacheProvision(advisorId: string | undefined, data: { advisor?: ApiAdvisor } | null) {
  if (!advisorId || !data?.advisor) {
    return;
  }

  window.localStorage.setItem(`micrositeAdvisor:${advisorId}`, JSON.stringify(data));
}

function clearCachedProvision(advisorId: string | undefined) {
  if (!advisorId) {
    return;
  }

  window.localStorage.removeItem(`micrositeAdvisor:${advisorId}`);
}

export default function MicrositePage() {
  const { advisorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dataRef = searchParams.get('ref');
  const hasLocalAdvisor = useMemo(() => hasAdvisorById(advisorId), [advisorId]);
  const fallbackAdvisor = useMemo(
    () => hasLocalAdvisor ? getAdvisorById(advisorId) : emptyAdvisor(advisorId),
    [advisorId, hasLocalAdvisor],
  );
  const [advisor, setAdvisor] = useState<Advisor | null>(hasLocalAdvisor ? fallbackAdvisor : null);
  const [isLoadingAdvisor, setIsLoadingAdvisor] = useState(false);
  const [advisorError, setAdvisorError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAdvisor() {
      if (dataRef && /[{}$]/.test(dataRef)) {
        setAdvisor(null);
        setIsLoadingAdvisor(false);
        setAdvisorError('El enlace no fue personalizado por DANA. La referencia llego como plantilla y no como valor real.');
        return;
      }

      if (!advisorId && !dataRef) {
        setAdvisor(null);
        setIsLoadingAdvisor(false);
        setAdvisorError('El enlace no contiene la referencia necesaria para consultar DANAconnect.');
        return;
      }

      if (advisorId && hasLocalAdvisor) {
        setAdvisor(fallbackAdvisor);
      } else {
        setAdvisor(null);
      }

      setIsLoadingAdvisor(true);
      setAdvisorError('');

      try {
        const result = dataRef
          ? await provisionAdvisor(dataRef)
          : await fetchAdvisorById(advisorId || '');

        if (isMounted && result?.advisor) {
          const nextAdvisor = toPageAdvisor(result.advisor, fallbackAdvisor);
          setAdvisor(nextAdvisor);
          setAdvisorError('');
          cacheProvision(result.advisorId || nextAdvisor.id, result);

          if (!advisorId && result.advisorId) {
            navigate(`/asesor/${result.advisorId}?ref=${encodeURIComponent(dataRef || '')}`, {
              replace: true,
            });
          }
        }

      } catch (error) {
        console.warn('No se pudo cargar el asesor desde DANA.', error);
        if (isMounted) {
          clearCachedProvision(advisorId);
          setAdvisor(null);
          setAdvisorError(error instanceof Error ? error.message : 'No se pudo cargar el asesor desde DANA.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingAdvisor(false);
        }
      }
    }

    loadAdvisor();

    return () => {
      isMounted = false;
    };
  }, [advisorId, dataRef, fallbackAdvisor, hasLocalAdvisor, navigate]);

  const visibleProducts = useMemo(() => {
    if (!advisor || !advisor.products.length) {
      return products;
    }

    const selectedProducts = products.filter((product) => advisor.products.includes(product.title));

    return selectedProducts.length ? selectedProducts : products;
  }, [advisor]);

  function openAdvisorContact(subject: string) {
    if (!advisor) {
      return;
    }

    if (advisor.contactUrl) {
      window.open(advisor.contactUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    window.open(`mailto:${advisor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hola ${advisor.name}, necesito ayuda con:`)}`);
  }

  return (
    <div className="min-h-screen bg-dana-cloud">
      {advisor && <Header advisor={advisor} />}
      <main>
        {!advisor && isLoadingAdvisor && (
          <section className="flex min-h-screen items-center justify-center px-4 py-16">
            <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-mercantil-blue" />
              <h1 className="mt-5 text-2xl font-extrabold text-dana-ink">
                Cargando microsite
              </h1>
              <p className="mt-3 text-dana-muted">
                Estamos preparando la información del asesor.
              </p>
            </div>
          </section>
        )}
        {!advisor && !isLoadingAdvisor && (
          <section className="flex min-h-screen items-center justify-center px-4 py-16">
            <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-500">
                !
              </div>
              <h1 className="mt-5 text-2xl font-extrabold text-dana-ink">
                No pudimos cargar este microsite
              </h1>
              <p className="mt-3 text-dana-muted">
                {advisorError || 'No encontramos informacion vigente para este enlace.'}
              </p>
            </div>
          </section>
        )}
        {advisor && (
          <>
        <div id="inicio" className="border-b border-slate-200 bg-white">
          <AdvisorCard advisor={advisor} />
        </div>

        <section id="productos" className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wide text-mercantil-blue">Catálogo</p>
                <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">Cotizadores disponibles</h2>
              </div>
              {isLoadingAdvisor && (
                <p className="text-sm font-bold text-dana-muted">Actualizando datos desde DANA...</p>
              )}
            </div>
            {advisorError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {advisorError}
              </div>
            )}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.title} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section id="postventa" className="bg-[#F4F7FB] py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-sm font-extrabold uppercase tracking-wide text-mercantil-blue">Post-Venta</p>
              <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">Servicios para asegurados</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-dana-muted">
                Accede a los servicios de post-venta y gestión de tu póliza con {advisor.name}
              </p>
            </div>
            
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-mercantil-bluePale">
                  <svg className="h-7 w-7 text-mercantil-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Gestión del asegurado</h3>
                <p className="mt-2 text-sm text-dana-muted">Actualización de datos personales y contacto</p>
                <button
                  type="button"
                  onClick={() => openAdvisorContact('Gestión del asegurado')}
                  className="mt-4 w-full rounded-lg bg-[#00478D] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
                >
                  Solicitar gestión
                </button>
              </div>
              
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-mercantil-bluePale">
                  <svg className="h-7 w-7 text-mercantil-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Gestión de reembolsos</h3>
                <p className="mt-2 text-sm text-dana-muted">Solicitud y seguimiento de reembolsos</p>
                <button
                  type="button"
                  onClick={() => openAdvisorContact('Gestión de reembolsos')}
                  className="mt-4 w-full rounded-lg bg-[#00478D] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
                >
                  Solicitar reembolso
                </button>
              </div>
              
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-mercantil-bluePale">
                  <svg className="h-7 w-7 text-mercantil-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Reportar emergencia</h3>
                <p className="mt-2 text-sm text-dana-muted">Atención inmediata para situaciones urgentes</p>
                <button
                  type="button"
                  onClick={() => window.open(`tel:${advisor.phone.replace(/\D/g, '')}`)}
                  className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-red-700"
                >
                  Llamar emergencia
                </button>
              </div>
              
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-mercantil-bluePale">
                  <svg className="h-7 w-7 text-mercantil-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Cambios en mi póliza</h3>
                <p className="mt-2 text-sm text-dana-muted">Modificaciones, actualizaciones y renovaciones</p>
                <button
                  type="button"
                  onClick={() => openAdvisorContact('Cambios en mi póliza')}
                  className="mt-4 w-full rounded-lg bg-[#00478D] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
                >
                  Solicitar cambio
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-dana-muted">
                También puedes contactar directamente:{" "}
                {advisor.contactUrl ? (
                  <a href={advisor.contactUrl} target="_blank" rel="noreferrer" className="font-semibold text-mercantil-blue hover:text-mercantil-blueDark">
                    {advisor.website ?? 'Formulario de contacto'}
                  </a>
                ) : (
                  <a href={`mailto:${advisor.email}`} className="font-semibold text-mercantil-blue hover:text-mercantil-blueDark">{advisor.email}</a>
                )}{" "}
                o{" "}
                <a href={`tel:${advisor.phone.replace(/\D/g, '')}`} className="font-semibold text-mercantil-blue hover:text-mercantil-blueDark">{advisor.phone}</a>
              </p>
            </div>
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}
