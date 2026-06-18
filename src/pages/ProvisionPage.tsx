import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { provisionMicrosite } from '../utils/api';

export default function ProvisionPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Preparando tu microsite personalizado...');
  const danaparam = searchParams.get('danaparam') ?? searchParams.get('danaParam') ?? '';

  useEffect(() => {
    async function runProvision() {
      if (!danaparam) {
        setStatus('error');
        setMessage('Falta el parámetro de DANAconnect para crear el microsite.');
        return;
      }

      const result = await provisionMicrosite(danaparam);
      if (!result.ok) {
        setStatus('error');
        setMessage(result.message || 'Error desconocido en la provisión');
        return;
      }

      setStatus('success');
      setMessage('Microsite creado. Redirigiendo...');

      const targetUrl = result.micrositeUrl
        ? new URL(result.micrositeUrl).pathname
        : `/asesor/${result.advisorId}`;

      window.location.assign(targetUrl);
    }

    runProvision();
  }, [danaparam]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-mercantil-bluePale px-4">
      <section className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-soft">
        <BrandLogo />
        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-mercantil-bluePale">
          {status === 'loading' ? (
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-mercantil-sky border-t-mercantil-blue" />
          ) : (
            <span className="text-2xl font-extrabold text-mercantil-blue">{status === 'success' ? '✓' : '!'}</span>
          )}
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-mercantil-navy">Microsite personalizado</h1>
        <p className="mt-3 text-sm leading-6 text-dana-muted">{message}</p>
        {status === 'error' && (
          <Link
            to="/asesor/laura-lepage"
            className="mt-6 inline-flex rounded-full bg-mercantil-blue px-5 py-3 text-sm font-extrabold text-white"
          >
            Ver demo
          </Link>
        )}
      </section>
    </main>
  );
}
