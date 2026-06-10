import { Link, useParams } from 'react-router-dom';
import EditProfileForm from '../components/EditProfileForm';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { getAdvisorById } from '../data/advisors';

export default function AdvisorEditPage() {
  const { advisorId } = useParams();
  const advisor = getAdvisorById(advisorId);

  return (
    <div className="min-h-screen bg-dana-cloud">
      <Header advisor={advisor} />
      <main className="bg-[radial-gradient(circle_at_12%_8%,rgba(167,121,255,0.32),transparent_26%),linear-gradient(135deg,#0F0F1F_0%,#4B16B6_58%,#6D28E0_100%)] px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <section className="text-white">
            <p className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold ring-1 ring-white/20 sm:inline-flex">
              Revisión de perfil profesional
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
              Actualiza los datos de tu microsite.
            </h1>
            <p className="mt-4 text-lg leading-8 text-white/86">
              Para esta demo no hay login. El asesor puede revisar su información y enviar una solicitud de
              actualización para validación de la aseguradora.
            </p>
            <Link
              to={`/asesor/${advisor.id}`}
              className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-extrabold text-example-violet shadow-soft"
            >
              Volver al microsite
            </Link>
          </section>
          <EditProfileForm advisor={advisor} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
