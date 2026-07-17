import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import EditProfileForm from '../components/EditProfileForm';
import Header from '../components/Header';
import { getAdvisorById, hasAdvisorById, type Advisor } from '../data/advisors';
import { fetchAdvisorById, type Advisor as ApiAdvisor } from '../utils/api';

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

export default function AdvisorEditPage() {
  const { advisorId } = useParams();
  const fallbackAdvisor = useMemo(
    () => hasAdvisorById(advisorId) ? getAdvisorById(advisorId) : emptyAdvisor(advisorId),
    [advisorId],
  );
  const [advisor, setAdvisor] = useState<Advisor>(fallbackAdvisor);
  const [isLoading, setIsLoading] = useState(Boolean(advisorId));
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAdvisor() {
      if (!advisorId) {
        setIsLoading(false);
        setError('No encontramos el identificador del asesor.');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const result = await fetchAdvisorById(advisorId);

        if (isMounted && result?.advisor) {
          setAdvisor(toPageAdvisor(result.advisor, fallbackAdvisor));
        }
      } catch (loadError) {
        console.warn('No se pudo cargar el asesor para actualizar datos.', loadError);
        if (isMounted) {
          setError('No pudimos actualizar los datos desde el servicio. Puedes revisar la información cargada y enviar la solicitud.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAdvisor();

    return () => {
      isMounted = false;
    };
  }, [advisorId, fallbackAdvisor]);

  return (
    <div className="min-h-screen bg-dana-cloud">
      <Header advisor={advisor} />
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <section className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-mercantil-blue">
                Revisión de perfil
              </p>
              <h1 className="mt-2 text-3xl font-extrabold text-dana-ink sm:text-4xl">
                Solicitar actualización de datos
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-dana-muted">
                Envía los cambios para que el equipo valide y actualice la información oficial en DANAconnect.
              </p>
            </div>
            <Link
              to={`/asesor/${advisor.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-mercantil-blue shadow-sm transition hover:border-mercantil-blue/30 hover:bg-mercantil-bluePale"
            >
              <ArrowLeft size={18} />
              Volver al microsite
            </Link>
          </section>

          {error && (
            <div className="mb-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              <Info size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-extrabold text-dana-ink">Datos actuales</p>
              <div className="mt-4 space-y-3 text-sm text-dana-muted">
                <p><span className="font-bold text-dana-ink">Asesor:</span> {advisor.name || 'Sin nombre'}</p>
                <p><span className="font-bold text-dana-ink">Código:</span> {advisor.advisorCode || 'No disponible'}</p>
                <p><span className="font-bold text-dana-ink">Ciudad:</span> {advisor.city || 'No disponible'}</p>
                <p><span className="font-bold text-dana-ink">Cotizadores:</span> {advisor.products.length ? advisor.products.join(', ') : 'No disponibles'}</p>
              </div>
              {isLoading && (
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-dana-muted">
                  Cargando datos vigentes...
                </p>
              )}
            </aside>
            <EditProfileForm advisor={advisor} />
          </div>
        </div>
      </main>
    </div>
  );
}
