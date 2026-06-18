import { Download, Globe2, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Advisor } from '../data/advisors';
import { downloadVCard } from '../utils/vcard';
import logoWhite from '../assets/brand/Marca_example/logos/svg/example_insurance_white.svg';

type AdvisorCardProps = {
  advisor: Advisor;
};

export default function AdvisorCard({ advisor }: AdvisorCardProps) {
  const whatsappUrl = `https://wa.me/${advisor.whatsapp}?text=Hola%20quiero%20informaci%C3%B3n%20sobre%20seguros`;
  const isCompanyProfile = Boolean(advisor.website);

  return (
    <section id="inicio" className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:py-16">
      <div className="text-white">
        <img src={logoWhite} alt={advisor.company} className="mb-9 h-16 w-auto max-w-[280px]" />
        <p className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/15">
          Microsite personalizado para corredores
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
          Tu asesor de seguros, siempre disponible
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/88">
          Un microsite personalizado para centralizar contacto, productos, cotizaciones y perfil profesional del corredor.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-example-violet shadow-soft"
          >
            <MessageCircle size={19} />
            Escríbeme por WhatsApp
          </a>
          <button
            type="button"
            onClick={() => downloadVCard(advisor)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-example-purple px-6 py-3 text-sm font-extrabold text-white ring-1 ring-white/20"
          >
            <Download size={19} />
            Descargar mi contacto
          </button>
        </div>
      </div>

      <article className="rounded-[28px] bg-white p-5 shadow-soft ring-1 ring-white/70">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className={`flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl shadow-lg ${
            isCompanyProfile ? 'bg-sky-50 p-3 ring-1 ring-sky-100' : ''
          }`}>
            <img
              src={advisor.photoUrl}
              alt={advisor.name}
              className={isCompanyProfile ? 'w-full object-contain' : 'h-full w-full object-cover'}
            />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-example-violet">
              {isCompanyProfile ? 'Tu seguro, más simple' : 'Tu bienestar, nuestra prioridad'}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-dana-ink">{advisor.name}</h2>
            <p className="text-base font-semibold text-example-purple">{advisor.role}</p>
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
    <div className="rounded-2xl bg-dana-cloud p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-dana-muted">
        <Icon size={15} />
        {label}
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="break-words text-sm font-bold text-example-violet hover:text-example-purple">
          {value}
        </a>
      ) : (
        <p className="break-words text-sm font-bold text-dana-ink">{value}</p>
      )}
    </div>
  );
}
