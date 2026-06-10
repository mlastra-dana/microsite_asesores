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
              <p className="max-w-xl text-sm leading-6 text-dana-muted">
                Perfil del corredor, WhatsApp, catálogo y solicitud de cotización en un solo microsite.
              </p>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {products.map((product) => (
                <ProductCard key={product.title} product={product} onRequest={handleRequest} />
              ))}
            </div>
          </div>
        </section>

        <section id="cotizar" ref={quoteRef} className="bg-gradient-to-br from-example-lavender via-white to-white py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-example-violet">Cotización</p>
              <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">Solicita información con {advisor.name}</h2>
              <p className="mt-4 text-lg leading-8 text-dana-muted">
                Comparte tus datos y el producto de interes. La demo funciona con Lambda si configuras
                VITE_API_URL o guarda la solicitud en localStorage para presentaciones comerciales.
              </p>
              <Link
                to={`/asesor/${advisor.id}/actualizar`}
                className="mt-6 inline-flex rounded-full border border-example-violet px-5 py-3 text-sm font-extrabold text-example-violet transition hover:bg-example-violet hover:text-white"
              >
                Soy asesor y quiero actualizar mis datos
              </Link>
            </div>
            <QuoteForm advisor={advisor} selectedProduct={selectedProduct} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
