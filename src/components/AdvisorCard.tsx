import { Download, Globe2, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Advisor } from '../data/advisors';
import { downloadVCard } from '../utils/vcard';

type AdvisorCardProps = {
  advisor: Advisor;
};

export default function AdvisorCard({ advisor }: AdvisorCardProps) {
  const whatsappUrl = `https://wa.me/${advisor.whatsapp}?text=Hola%20quiero%20informaci%C3%B3n%20sobre%20seguros`;
  const isCompanyProfile = Boolean(advisor.website);

  return (
    <section id="inicio" className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:py-16">
      <div className="text-dana-ink">
        <p className="mb-5 text-lg font-medium text-mercantil-blue">
          Asesor digital autorizado
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
          Tu asesor de seguros, siempre disponible
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-dana-muted">
          Un microsite personalizado para centralizar contacto, productos, cotizaciones y perfil profesional del corredor.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-mercantil-blue px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-mercantil-blueDark"
          >
            <MessageCircle size={19} />
            Escríbeme por WhatsApp
          </a>
          <button
            type="button"
            onClick={() => downloadVCard(advisor)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#5488BC] bg-white px-6 py-3 text-sm font-extrabold text-mercantil-blueDark transition hover:bg-mercantil-bluePale"
          >
            <Download size={19} />
            Descargar mi contacto
          </button>
        </div>
      </div>

      <article className="relative rounded-2xl border-t-8 border-mercantil-blue bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className={`flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md ${
            isCompanyProfile ? 'bg-[#F4F7FB] p-3 ring-1 ring-[#E6EDF5]' : ''
          }`}>
            <img
              src={advisor.photoUrl}
              alt={advisor.name}
              className={isCompanyProfile ? 'w-full object-contain' : 'h-full w-full object-cover'}
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-mercantil-blue">
              {isCompanyProfile ? 'Tu seguro, más simple' : 'Tu bienestar, nuestra prioridad'}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-dana-ink">{advisor.name}</h2>
            <p className="text-base font-semibold text-mercantil-blueDark">{advisor.role}</p>
            <p className="mt-3 text-sm leading-6 text-dana-muted">{advisor.bio}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Info icon={Phone} label="Telefono" value={advisor.phone} />
          {advisor.website ? (
            <Info icon={Globe2} label="Sitio web" value={advisor.website} href={`https://${advisor.website}`} />
          ) : (
            <Info icon={Globe2} label="Email" value={advisor.email} />
          )}
          <Info icon={MapPin} label="Ciudad" value={advisor.city} />
          <Info icon={Download} label="Autorizacion" value={advisor.advisorCode} />
        </div>
      </article>
    </section>
  );
}

type InfoProps = {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
};

function Info({ icon: Icon, label, value, href }: InfoProps) {
  return (
    <div className="rounded-xl bg-dana-cloud p-4 ring-1 ring-[#E6EDF5]">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-dana-muted">
        <Icon size={15} />
        {label}
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="break-words text-sm font-bold text-mercantil-blue hover:text-mercantil-blueDark">
          {value}
        </a>
      ) : (
        <p className="break-words text-sm font-bold text-dana-ink">{value}</p>
      )}
    </div>
  );
}
