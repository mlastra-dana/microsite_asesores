export type MicrositeEventPayload = {
  type: 'quote_request' | 'advisor_update' | 'pass_request' | 'landing_provision' | 'otp_request' | 'otp_verify';
  advisorId: string;
  [key: string]: unknown;
};

export type ApiResult = {
  ok: boolean;
  message: string;
};

export async function sendMicrositeEvent(payload: MicrositeEventPayload): Promise<ApiResult> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    const key = `microsite_events_${payload.type}`;
    const current = JSON.parse(localStorage.getItem(key) ?? '[]') as MicrositeEventPayload[];
    localStorage.setItem(key, JSON.stringify([...current, { ...payload, createdAt: new Date().toISOString() }]));
    return { ok: true, message: 'Solicitud guardada localmente para la demo.' };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as Partial<ApiResult>;

    if (!response.ok) {
      return {
        ok: false,
        message: data.message ?? 'No pudimos enviar la solicitud. Intenta nuevamente.',
      };
    }

    return {
      ok: data.ok ?? true,
      message: data.message ?? 'Solicitud recibida correctamente.',
    };
  } catch {
    return {
      ok: false,
      message: 'No pudimos conectar con el servicio. Intenta nuevamente.',
    };
  }
}
