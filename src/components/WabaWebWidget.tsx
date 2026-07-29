import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Minus, Send, X } from 'lucide-react';
import type { Advisor } from '../data/advisors';

type WidgetMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  text: string;
  createdAt: string;
};

type WabaWebWidgetProps = {
  advisor: Advisor;
};

function getStoredSessionId() {
  const storageKey = 'wabaWidgetSessionId';
  const current = window.localStorage.getItem(storageKey);
  if (current) {
    return current;
  }

  const next = `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(storageKey, next);
  return next;
}

function formatWidgetTime(value: string) {
  return new Intl.DateTimeFormat('es-VE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function normalizeBackendMessage(message: any): WidgetMessage | null {
  const text = String(message?.message || '').trim();
  const timestamp = String(message?.timestamp || '').trim();
  if (!text || !timestamp) {
    return null;
  }

  return {
    id: String(message?.timestamp || message?.client_message_id || Math.random()),
    direction: message?.direction === 'outbound' ? 'outbound' : 'inbound',
    text,
    createdAt: timestamp,
  };
}

export default function WabaWebWidget({ advisor }: WabaWebWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>(() => [
    {
      id: 'welcome',
      direction: 'outbound',
      text: 'Hola, soy el canal web de WABA Center. Cuéntanos en qué podemos ayudarte.',
      createdAt: new Date().toISOString(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sessionId = useMemo(() => getStoredSessionId(), []);
  const apiUrl = import.meta.env.VITE_WABA_WIDGET_API_URL as string | undefined;

  useEffect(() => {
    if (!apiUrl || !isOpen) {
      return;
    }

    let isMounted = true;
    const cleanApiUrl = apiUrl.replace(/\/$/, '');

    async function loadMessages() {
      try {
        const response = await fetch(`${cleanApiUrl}/web-chat/messages?session_id=${encodeURIComponent(sessionId)}`, {
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        const backendMessages = Array.isArray(data?.messages)
          ? data.messages.map(normalizeBackendMessage).filter(Boolean)
          : [];
        if (isMounted && backendMessages.length) {
          setMessages(backendMessages);
        }
      } catch (error) {
        console.warn('No se pudo consultar el chat web.', error);
      }
    }

    loadMessages();
    const intervalId = window.setInterval(loadMessages, 3500);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [apiUrl, isOpen, sessionId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isOpen, messages]);

  async function sendToBackend(text: string) {
    if (!apiUrl) {
      return;
    }

    await fetch(`${apiUrl.replace(/\/$/, '')}/web-chat/messages`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: 'web',
        site_id: 'microsite-asesores-demo',
        session_id: sessionId,
        advisor_id: advisor.id,
        advisor_name: advisor.name,
        page_url: window.location.href,
        message: text,
      }),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) {
      return;
    }

    const now = new Date().toISOString();
    setDraft('');
    setMessages((current) => [
      ...current,
      {
        id: `inbound-${Date.now()}`,
        direction: 'inbound',
        text,
        createdAt: now,
      },
    ]);

    setIsSending(true);
    try {
      await sendToBackend(text);
      if (!apiUrl) {
        window.setTimeout(() => {
          setMessages((current) => [
            ...current,
            {
              id: `demo-reply-${Date.now()}`,
              direction: 'outbound',
              text: 'Recibido. Un asesor continuará la conversación desde WABA Center.',
              createdAt: new Date().toISOString(),
            },
          ]);
        }, 500);
      }
    } catch (error) {
      console.warn('No se pudo enviar el mensaje del widget web.', error);
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          direction: 'outbound',
          text: 'No pudimos enviar el mensaje. Intenta de nuevo en unos segundos.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <header className="flex items-center justify-between bg-demo-blue px-4 py-4 text-white">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-white/80">WABA Center</p>
              <h2 className="text-lg font-extrabold leading-tight">Chat web</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/15"
                aria-label="Minimizar chat"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setMessages((current) => current.slice(0, 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/15"
                aria-label="Limpiar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="max-h-[420px] min-h-[320px] space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.direction === 'inbound'
                      ? 'rounded-br-md bg-demo-blue text-white'
                      : 'rounded-bl-md bg-white text-dana-ink ring-1 ring-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold leading-5">{message.text}</p>
                  <p className={`mt-1 text-[11px] font-bold ${message.direction === 'inbound' ? 'text-white/75' : 'text-dana-muted'}`}>
                    {formatWidgetTime(message.createdAt)}
                  </p>
                </div>
              </article>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe tu mensaje"
              className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-dana-ink outline-none transition focus:border-demo-blue focus:ring-4 focus:ring-purple-100"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-demo-blue text-white shadow-sm transition hover:bg-demo-blueDark disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Enviar mensaje"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-demo-blue text-white shadow-2xl shadow-purple-500/30 transition hover:-translate-y-0.5 hover:bg-demo-blueDark focus:outline-none focus:ring-4 focus:ring-purple-200"
        aria-label={isOpen ? 'Cerrar chat web' : 'Abrir chat web'}
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  );
}
