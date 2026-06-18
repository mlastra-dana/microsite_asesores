import { FormEvent, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import type { Advisor } from '../data/advisors';
import { products } from '../data/products';
import { sendMicrositeEvent } from '../utils/api';

type QuoteFormProps = {
  advisor: Advisor;
  selectedProduct: string;
};

export default function QuoteForm({ advisor, selectedProduct }: QuoteFormProps) {
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    product: selectedProduct || products[0].title,
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (selectedProduct) {
      setForm((current) => ({ ...current, product: selectedProduct }));
    }
  }, [selectedProduct]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.customerName || !form.customerEmail || !form.customerPhone || !form.product) {
      setStatus('error');
      setFeedback('Completa nombre, email, telefono y producto para solicitar la cotizacion.');
      return;
    }

    setStatus('loading');
    const result = await sendMicrositeEvent({
      type: 'quote_request',
      advisorId: advisor.id,
      advisorEmail: advisor.email,
      ...form,
    });

    setStatus(result.ok ? 'success' : 'error');
    setFeedback(
      result.ok
        ? 'Solicitud enviada correctamente. El asesor recibirá tus datos para contactarte.'
        : result.message,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-5 shadow-soft sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre del cliente"
          value={form.customerName}
          onChange={(value) => setForm({ ...form, customerName: value })}
          placeholder="Nombre y apellido"
        />
        <Field
          label="Email"
          type="email"
          value={form.customerEmail}
          onChange={(value) => setForm({ ...form, customerEmail: value })}
          placeholder="cliente@email.com"
        />
        <Field
          label="Telefono"
          value={form.customerPhone}
          onChange={(value) => setForm({ ...form, customerPhone: value })}
          placeholder="+1 123 456 789"
        />
        <label className="block">
          <span className="text-sm font-bold text-dana-ink">Producto de interes</span>
          <select
            value={form.product}
            onChange={(event) => setForm({ ...form, product: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-mercantil-blue focus:ring-4 focus:ring-mercantil-blue/10"
          >
            {products.map((product) => (
              <option key={product.title} value={product.title}>{product.title}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-bold text-dana-ink">Mensaje</span>
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          rows={4}
          placeholder="Cuéntanos qué cobertura necesitas."
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
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mercantil-blue px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-mercantil-blue/20 transition hover:bg-mercantil-blueDark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Send size={18} />
        {status === 'loading' ? 'Enviando...' : 'Solicitar cotización'}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
};

function Field({ label, value, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-dana-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-mercantil-blue focus:ring-4 focus:ring-mercantil-blue/10"
      />
    </label>
  );
}
