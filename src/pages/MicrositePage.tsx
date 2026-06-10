import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import AdvisorCard from '../components/AdvisorCard';
import DigitalWalletCard from '../components/DigitalWalletCard';
import Footer from '../components/Footer';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import QuoteForm from '../components/QuoteForm';
import { getAdvisorById } from '../data/advisors';
import { products } from '../data/products';
import { getMicrositeUrl } from '../utils/qr';

const ecosystemBullets = [
  'Ordenar la información comercial.',
  'Automatizar tareas repetitivas.',
  'Facilitar el contacto con clientes.',
  'Dar seguimiento a renovaciones, cobranzas y siniestros.',
  'Centralizar el perfil digital del asesor.',
  'Activar comunicaciones personalizadas desde una sola plataforma.',
];

export default function MicrositePage() {
  const { advisorId } = useParams();
  const location = useLocation();
  const advisor = getAdvisorById(advisorId);
  const quoteRef = useRef<HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState(products[0].title);
  const micrositeUrl = useMemo(() => getMicrositeUrl(location.pathname), [location.pathname]);

  function handleRequest(product: string) {
    setSelectedProduct(product);
    quoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-dana-cloud">
      <Header advisor={advisor} />
      <main>
        <div className="bg-[radial-gradient(circle_at_16%_12%,rgba(167,121,255,0.34),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(243,237,255,0.18),transparent_24%),linear-gradient(135deg,#0F0F1F_0%,#4B16B6_58%,#6D28E0_100%)]">
          <AdvisorCard advisor={advisor} />
        </div>

        <DigitalWalletCard advisor={advisor} micrositeUrl={micrositeUrl} />

        <section className="bg-dana-cloud py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-wide text-example-violet">Ecosistema digital para corredores</p>
              <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">
                Un sistema simple para activar presencia digital y seguimiento comercial.
              </h2>
              <p className="mt-4 text-lg leading-8 text-dana-muted">
                Un ecosistema digital permite ordenar la información comercial, automatizar tareas repetitivas,
                facilitar el contacto con clientes y dar seguimiento a renovaciones, cobranzas y siniestros.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ecosystemBullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-example-violet" size={20} />
                  <p className="text-sm font-bold leading-6 text-dana-ink">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="productos" className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-wide text-example-violet">Catálogo</p>
                <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">Productos disponibles</h2>
              </div>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product.title} product={product} onRequest={handleRequest} />
              ))}
            </div>
          </div>
        </section>

        <section id="postventa" ref={quoteRef} className="bg-gradient-to-br from-example-lavender via-white to-white py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-sm font-extrabold uppercase tracking-wide text-example-violet">Post-Venta</p>
              <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">Servicios para asegurados</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-dana-muted">
                Accede a los servicios de post-venta y gestión de tu póliza con {advisor.name}
              </p>
            </div>
            
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-example-lavender">
                  <svg className="h-7 w-7 text-example-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Gestión del asegurado</h3>
                <p className="mt-2 text-sm text-dana-muted">Actualización de datos personales y contacto</p>
                <button
                  type="button"
                  onClick={() => window.open(`mailto:${advisor.email}?subject=Gestión del asegurado&body=Hola ${advisor.name}, necesito ayuda con:`)}
                  className="mt-4 w-full rounded-full bg-example-navy px-4 py-3 text-sm font-extrabold text-white transition hover:bg-example-violet"
                >
                  Solicitar gestión
                </button>
              </div>
              
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-example-lavender">
                  <svg className="h-7 w-7 text-example-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Gestión de reembolsos</h3>
                <p className="mt-2 text-sm text-dana-muted">Solicitud y seguimiento de reembolsos</p>
                <button
                  type="button"
                  onClick={() => window.open(`mailto:${advisor.email}?subject=Gestión de reembolsos&body=Hola ${advisor.name}, necesito ayuda con:`)}
                  className="mt-4 w-full rounded-full bg-example-navy px-4 py-3 text-sm font-extrabold text-white transition hover:bg-example-violet"
                >
                  Solicitar reembolso
                </button>
              </div>
              
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-example-lavender">
                  <svg className="h-7 w-7 text-example-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Reportar emergencia</h3>
                <p className="mt-2 text-sm text-dana-muted">Atención inmediata para situaciones urgentes</p>
                <button
                  type="button"
                  onClick={() => window.open(`tel:${advisor.phone.replace(/\D/g, '')}`)}
                  className="mt-4 w-full rounded-full bg-red-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-red-700"
                >
                  Llamar emergencia
                </button>
              </div>
              
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-example-lavender">
                  <svg className="h-7 w-7 text-example-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-dana-ink">Cambios en mi póliza</h3>
                <p className="mt-2 text-sm text-dana-muted">Modificaciones, actualizaciones y renovaciones</p>
                <button
                  type="button"
                  onClick={() => window.open(`mailto:${advisor.email}?subject=Cambios en mi póliza&body=Hola ${advisor.name}, necesito ayuda con:`)}
                  className="mt-4 w-full rounded-full bg-example-navy px-4 py-3 text-sm font-extrabold text-white transition hover:bg-example-violet"
                >
                  Solicitar cambio
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-dana-muted">
                También puedes contactar directamente:{" "}
                <a href={`mailto:${advisor.email}`} className="font-semibold text-example-violet hover:text-example-purple">{advisor.email}</a>{" "}
                o{" "}
                <a href={`tel:${advisor.phone.replace(/\D/g, '')}`} className="font-semibold text-example-violet hover:text-example-purple">{advisor.phone}</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
