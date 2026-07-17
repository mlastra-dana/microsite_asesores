export type Advisor = {
  advisorId: string;
  internalAdvisorId?: string;
  company?: string;
  name: string;
  email: string;
  website?: string;
  contactUrl?: string;
  phone: string;
  whatsapp?: string;
  city?: string;
  advisorCode?: string;
  role?: string;
  photoUrl?: string;
  bio?: string;
  products?: string[];
};

export type ProvisionResponse = {
  ok: boolean;
  message?: string;
  type?: string;
  advisorId?: string;
  danaparam?: string;
  slug?: string;
  micrositeUrl?: string;
  advisor?: Advisor;
  persistence?: {
    saved: boolean;
    table: string;
  };
};

export async function fetchAdvisorById(advisorId: string): Promise<ProvisionResponse | null> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    return null;
  }

  const response = await fetch(`${apiUrl}?advisorId=${encodeURIComponent(advisorId)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Respuesta no válida de la API (${response.status}): ${text.substring(0, 100)}`);
  }

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || `No se pudo consultar el asesor ${advisorId}`);
  }

  return data as ProvisionResponse;
}

/**
 * Llama a la Lambda de provisionamiento con el danaparam recibido en el email de DANAconnect
 * @param danaparam Identificador interno de DANAconnect para la Data Retrieval API
 * @returns Respuesta de la Lambda con la información del asesor provisionado
 */
export async function provisionAdvisor(danaparam: string): Promise<ProvisionResponse> {
  // Validar que la variable de entorno esté configurada
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    throw new Error('VITE_API_URL no está configurada en las variables de entorno.');
  }

  try {
    const response = await fetch(`${apiUrl}?dana=${encodeURIComponent(danaparam)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Validar si la respuesta es JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Intentar leer el cuerpo como texto para dar mejor error
      const text = await response.text();
      throw new Error(`Respuesta no válida de la API (${response.status}): ${text.substring(0, 100)}`);
    }

    const data = await response.json();

    // Validar la estructura básica de la respuesta
    if (typeof data !== 'object' || data === null) {
      throw new Error('Respuesta de la API no es un objeto JSON válido');
    }

    // Si la respuesta HTTP no es OK, usar el mensaje de error si está disponible
    if (!response.ok) {
      const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data as ProvisionResponse;
  } catch (error) {
    // Mejorar el mensaje de error para casos de red
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servicio de activación. Verifica tu conexión o contacta al administrador.');
    }
    
    // Re-lanzar el error para manejo específico en el componente
    throw error;
  }
}

export async function activateAdvisorMicrosite(danaparam: string): Promise<ProvisionResponse> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    throw new Error('VITE_API_URL no está configurada en las variables de entorno.');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'microsite_activate',
      dana: danaparam,
    }),
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Respuesta no válida de la API (${response.status}): ${text.substring(0, 100)}`);
  }

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
  }

  return data as ProvisionResponse;
}

/**
 * Función de compatibilidad para mantener el código existente.
 * Envía un evento simple a la Lambda (quote_request, advisor_update, pass_request).
 */
export async function sendMicrositeEvent(payload: {
  type: 'quote_request' | 'advisor_update' | 'pass_request';
  advisorId: string;
  [key: string]: any;
}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    return {
      ok: false,
      message: 'VITE_API_URL no está configurada',
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        ok: false,
        message: `Respuesta no válida: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending microsite event:', error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Función de compatibilidad para mantener ProvisionPage.tsx
 * @deprecated Use provisionAdvisor instead
 */
export async function provisionMicrosite(danaparam: string) {
  return provisionAdvisor(danaparam);
}
