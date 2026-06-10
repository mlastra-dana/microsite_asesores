import { useState } from 'react';
import { Apple, Smartphone } from 'lucide-react';
import type { Advisor } from '../data/advisors';
import { createQrSeed } from '../utils/qr';
import { sendMicrositeEvent } from '../utils/api';
import logoWhite from '../assets/brand/Marca_example/logos/svg/example_insurance_white.svg';

type DigitalWalletCardProps = {
  advisor: Advisor;
  micrositeUrl: string;
};

export default function DigitalWalletCard({ advisor, micrositeUrl }: DigitalWalletCardProps) {
  const seed = createQrSeed(micrositeUrl);
  const cells = Array.from({ length: 49 }, (_, index) => (index * 17 + seed) % 5 !== 0);
  const [walletStatus, setWalletStatus] = useState('');

  async function requestPass(platform: 'apple' | 'android') {
    setWalletStatus('Preparando carnet digital...');
    const result = await sendMicrositeEvent({
      type: 'pass_request',
      advisorId: advisor.id,
      advisorEmail: advisor.email,
      platform,
      micrositeUrl,
    });

    setWalletStatus(
      result.ok
        ? platform === 'apple'
          ? 'Solicitud registrada. En producción se generaría el archivo .pkpass para Apple Wallet.'
          : 'Solicitud registrada. En producción se generaría el pase compatible con Android Wallet.'
        : result.message,
    );
  }

  return (
    <section className="bg-white py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="rounded-[28px] bg-example-navy p-5 text-white shadow-soft">
          <div className="rounded-[22px] border border-white/20 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <img src={logoWhite} alt={advisor.company} className="h-11 w-auto max-w-[190px]" />
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-example-violet">{advisor.advisorCode}</span>
            </div>
            <div className="mt-8 flex items-end gap-4">
              <img src={advisor.photoUrl} alt={advisor.name} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white/20" />
              <div>
                <h3 className="text-2xl font-extrabold">{advisor.name}</h3>
                <p className="font-semibold text-white/78">{advisor.role}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1 text-sm text-white/85">
                <p>{advisor.email}</p>
                <p>{advisor.phone}</p>
              </div>
              <div className="grid h-28 w-28 grid-cols-7 gap-1 rounded-2xl bg-white p-3">
                {cells.map((filled, index) => (
                  <span key={index} className={filled ? 'rounded-[2px] bg-example-navy' : 'rounded-[2px] bg-white'} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-extrabold uppercase tracking-wide text-example-violet">Carnet digital inteligente</p>
          <h2 className="mt-3 text-3xl font-extrabold text-dana-ink sm:text-4xl">
            Contacto, perfil profesional y acceso rápido desde el celular.
          </h2>
          <p className="mt-4 text-lg leading-8 text-dana-muted">
            El carnet digital apunta al microsite del asesor para que cada cliente pueda guardar el contacto,
            revisar productos y solicitar una cotizacion desde cualquier dispositivo.
          </p>
          <p className="mt-5 break-all rounded-2xl bg-dana-cloud p-4 text-sm font-semibold text-dana-muted">{micrositeUrl}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => requestPass('apple')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-example-navy px-5 py-3 text-sm font-extrabold text-white transition hover:bg-example-violet"
            >
              <Apple size={18} />
              Descargar pkpass
            </button>
            <button
              type="button"
              onClick={() => requestPass('android')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-example-violet px-5 py-3 text-sm font-extrabold text-example-violet transition hover:bg-example-lavender"
            >
              <Smartphone size={18} />
              Pase Android
            </button>
          </div>
          {walletStatus && (
            <p className="mt-4 rounded-2xl bg-example-lavender px-4 py-3 text-sm font-bold text-example-violet">
              {walletStatus}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
