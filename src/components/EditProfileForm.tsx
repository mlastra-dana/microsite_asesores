import { FormEvent, useState } from 'react';
import { Save } from 'lucide-react';
import type { Advisor } from '../data/advisors';
import { sendMicrositeEvent } from '../utils/api';

type EditProfileFormProps = {
  advisor: Advisor;
};

export default function EditProfileForm({ advisor }: EditProfileFormProps) {
  const [form, setForm] = useState({
    name: advisor.name,
    phone: advisor.phone,
    email: advisor.email,
    city: advisor.city,
    website: advisor.website ?? '',
    contactUrl: advisor.contactUrl ?? '',
    bio: advisor.bio,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.city) {
      setStatus('error');
      setFeedback('Completa nombre, email, telefono y ciudad para enviar la actualizacion.');
      return;
    }

    setStatus('loading');
    const result = await sendMicrositeEvent({
      type: 'advisor_update',
      advisorId: advisor.id,
      ...form,
    });

    setStatus(result.ok ? 'success' : 'error');
    setFeedback(
      result.ok
        ? 'Solicitud recibida. El equipo de la aseguradora validará los cambios y actualizará DANAconnect.'
        : result.message,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-5 shadow-soft sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Field label="Telefono" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <Field label="Ciudad" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
        <Field label="Sitio web" value={form.website} onChange={(value) => setForm({ ...form, website: value })} />
      </div>
      <Field label="Formulario o enlace de contacto" value={form.contactUrl} onChange={(value) => setForm({ ...form, contactUrl: value })} className="mt-4" />
      <label className="mt-4 block">
        <span className="text-sm font-bold text-dana-ink">Descripción corta</span>
        <textarea
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-mercantil-blue focus:ring-4 focus:ring-mercantil-blue/10"
        />
      </label>
      {feedback && (
        <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {feedback}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mercantil-blue px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-mercantil-blue/20 transition hover:bg-mercantil-blueDark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Save size={18} />
        {status === 'loading' ? 'Enviando...' : 'Enviar actualización'}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
};

function Field({ label, value, onChange, type = 'text', className = '' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-dana-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-mercantil-blue focus:ring-4 focus:ring-mercantil-blue/10"
      />
    </label>
  );
}
