import { Link, useParams } from 'react-router-dom';
import EditProfileForm from '../components/EditProfileForm';
import Header from '../components/Header';
import { getAdvisorById } from '../data/advisors';

export default function AdvisorEditPage() {
  const { advisorId } = useParams();
  const advisor = getAdvisorById(advisorId);

  return (
    <div className="min-h-screen bg-dana-cloud">
      <Header advisor={advisor} />
      <main className="bg-[radial-gradient(circle_at_12%_8%,rgba(0,159,218,0.24),transparent_28%),linear-gradient(135deg,#002B55_0%,#00478D_58%,#009FDA_100%)] px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <section className="text-white">
            <p className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold ring-1 ring-white/20 sm:inline-flex">
              Revisión de perfil profesional
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
              Actualiza los datos de tu microsite.
            </h1>
            <Link
              to={`/asesor/${advisor.id}`}
              className="mt-8 inline-flex rounded-full bg-white px-5 py-3 text-sm font-extrabold text-mercantil-blue shadow-soft"
            >
              Volver al microsite
            </Link>
          </section>
          <EditProfileForm advisor={advisor} />
        </div>
      </main>
    </div>
  );
}
