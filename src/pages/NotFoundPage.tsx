import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-dana-cloud px-4">
      <section className="max-w-md rounded-[28px] bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-extrabold uppercase tracking-wide text-mercantil-blue">404</p>
        <h1 className="mt-3 text-3xl font-extrabold text-dana-ink">Microsite no encontrado</h1>
        <p className="mt-3 text-dana-muted">Puedes volver a la demo principal de Laura Lepage.</p>
        <Link
          to="/asesor/laura-lepage"
          className="mt-6 inline-flex rounded-full bg-mercantil-blue px-5 py-3 text-sm font-extrabold text-white"
        >
          Ir al microsite demo
        </Link>
      </section>
    </main>
  );
}
