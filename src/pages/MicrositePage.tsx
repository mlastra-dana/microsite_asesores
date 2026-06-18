import { useParams } from 'react-router-dom';
import AdvisorCard from '../components/AdvisorCard';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { getAdvisorById } from '../data/advisors';
import { products } from '../data/products';

export default function MicrositePage() {
  const { advisorId } = useParams();
  const advisor = getAdvisorById(advisorId);

  function openAdvisorContact(subject: string) {
    if (advisor.contactUrl) {
      window.open(advisor.contactUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    window.open(`mailto:${advisor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hola ${advisor.name}, necesito ayuda con:`)}`);
  }

  return (
    <div className="min-h-screen bg-dana-cloud">
      <Header advisor={advisor} />
      <main>
        <div className="border-b border-slate-200 bg-white">
          <AdvisorCard advisor={advisor} />
        </div>

        <section id="productos" className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wide text-mercantil-blue">Catálogo</p>
                <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">Cotizadores disponibles</h2>
              </div>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
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
                  className="mt-4 w-full rounded-lg bg-mercantil-blue px-4 py-3 text-sm font-extrabold text-white transition hover:bg-mercantil-blueDark"
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
                  className="mt-4 w-full rounded-lg bg-mercantil-blue px-4 py-3 text-sm font-extrabold text-white transition hover:bg-mercantil-blueDark"
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
                  className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-red-700"
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
                  className="mt-4 w-full rounded-lg bg-mercantil-blue px-4 py-3 text-sm font-extrabold text-white transition hover:bg-mercantil-blueDark"
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
      </main>
    </div>
  );
}
