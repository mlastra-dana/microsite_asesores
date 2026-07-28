import { Download, Globe2, Mail, MapPin, MessageCircle, Phone, UserRound } from 'lucide-react';
import type { Advisor } from '../data/advisors';
import { downloadVCard } from '../utils/vcard';

type AdvisorCardProps = {
  advisor: Advisor;
};

export default function AdvisorCard({ advisor }: AdvisorCardProps) {
  const contactPhone = advisor.whatsapp || advisor.phone;
  const cleanWhatsapp = contactPhone.replace(/\D/g, '');
  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=Hola%20quiero%20informaci%C3%B3n%20sobre%20seguros`
    : '';
  const isCompanyProfile = Boolean(advisor.website);
  const websiteHref = advisor.website
    ? advisor.website.startsWith('http')
      ? advisor.website
      : `https://${advisor.website}`
    : '';
  const contactItems = [
    advisor.phone ? { icon: Phone, label: 'Telefono', value: advisor.phone } : null,
    advisor.website ? { icon: Globe2, label: 'Sitio web', value: advisor.website, href: websiteHref } : null,
    !advisor.website && advisor.email ? { icon: Mail, label: 'Email', value: advisor.email, href: `mailto:${advisor.email}` } : null,
    advisor.city ? { icon: MapPin, label: 'Ciudad', value: advisor.city } : null,
  ].filter(Boolean) as InfoProps[];

  return (
    <section id="inicio" className="mx-auto grid min-h-[620px] max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:py-20">
      <div className="text-dana-ink">
        <p className="mb-5 text-base font-semibold text-demo-blue">
          Asesor digital autorizado
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-[#101828] sm:text-5xl lg:text-[56px]">
          Tu asesor de seguros, siempre disponible
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[#344054]">
          Un microsite personalizado para centralizar contacto, productos, cotizaciones y perfil profesional del corredor.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00478D] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
            >
              <MessageCircle size={19} />
              Escríbeme por WhatsApp
            </a>
          )}
          {(advisor.name || advisor.phone || advisor.email) && (
            <button
              type="button"
              onClick={() => downloadVCard(advisor)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00478D] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#00376E]"
            >
              <Download size={19} />
              Descargar mi contacto
            </button>
          )}
        </div>
      </div>

      <article className="relative rounded-2xl border border-[#D0D5DD] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className={`flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
            isCompanyProfile ? 'bg-white p-3 ring-1 ring-[#EAECF0]' : 'bg-[#F2F4F7] ring-1 ring-[#EAECF0]'
          }`}>
            {advisor.photoUrl ? (
              <img
                src={advisor.photoUrl}
                alt={advisor.name || 'Asesor de Seguros'}
                className={isCompanyProfile ? 'w-full object-contain' : 'h-full w-full object-cover'}
              />
            ) : (
              <UserRound className="h-14 w-14 text-[#667085]" strokeWidth={1.7} />
            )}
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-demo-blue">
              {isCompanyProfile ? 'Tu seguro, más simple' : 'Tu bienestar, nuestra prioridad'}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-dana-ink">
              {advisor.name || 'Asesor de Seguros'}
            </h2>
            {advisor.role && (
              <p className="text-base font-semibold text-demo-blueDark">{advisor.role}</p>
            )}
            {advisor.bio && (
              <p className="mt-3 text-sm leading-6 text-dana-muted">{advisor.bio}</p>
            )}
          </div>
        </div>
        {contactItems.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => (
              <Info
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                href={item.href}
              />
            ))}
          </div>
        )}
        {contactItems.length === 0 && (
          <div className="mt-6 rounded-xl bg-[#F9FAFB] p-4 text-sm font-semibold text-dana-muted ring-1 ring-[#EAECF0]">
            Información de contacto en actualización.
          </div>
        )}
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
    <div className="rounded-xl bg-[#F9FAFB] p-4 ring-1 ring-[#EAECF0]">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-dana-muted">
        <Icon size={15} />
        {label}
      </div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="break-words text-sm font-bold text-demo-blue hover:text-demo-blueDark">
          {value}
        </a>
      ) : (
        <p className="break-words text-sm font-bold text-dana-ink">{value}</p>
      )}
    </div>
  );
}
