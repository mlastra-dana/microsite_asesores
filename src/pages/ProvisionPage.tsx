import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logoColor from '../assets/brand/Marca_example/logos/svg/example_insurance_color.svg';
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
        setMessage(result.message);
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
    <main className="flex min-h-screen items-center justify-center bg-example-lavender px-4">
      <section className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-soft">
        <img src={logoColor} alt="Example Insurance" className="mx-auto h-14 w-auto" />
        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-example-lavender">
          {status === 'loading' ? (
            <span className="h-7 w-7 animate-spin rounded-full border-4 border-example-lilac border-t-example-violet" />
          ) : (
            <span className="text-2xl font-extrabold text-example-violet">{status === 'success' ? '✓' : '!'}</span>
          )}
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-example-navy">Microsite personalizado</h1>
        <p className="mt-3 text-sm leading-6 text-dana-muted">{message}</p>
        {status === 'error' && (
          <Link
            to="/asesor/laura-lepage"
            className="mt-6 inline-flex rounded-full bg-example-violet px-5 py-3 text-sm font-extrabold text-white"
          >
            Ver demo
          </Link>
        )}
      </section>
    </main>
  );
}
