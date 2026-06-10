# Microsite para asesores de seguros

Demo comercial en React + TailwindCSS para generar microsites personalizados de asesores/corredores de seguros. Incluye perfil profesional, WhatsApp, descarga vCard, carnet digital con QR visual, catalogo de productos, solicitud de cotizacion y formulario para actualizacion de datos del asesor.

La direccion tecnica del producto esta documentada en `docs/architecture.md`: Amplify conectado a DANAconnect/Data Retrieval API, Lambda en Python, DynamoDB, URL limpia, pass wallet/pkpass y acceso del asesor por OTP.

## Instalar y correr

```bash
npm install
npm run dev
npm run build
```

## Rutas demo

- `/provisionar?danaparam=abc123-def456-ghi789`
- `/asesor/laura-lepage`
- `/asesor/carlos-mendoza`
- `/asesor/valentina-rojas`
- `/asesor/laura-lepage/actualizar`

Si el `advisorId` no existe, la app muestra los datos demo de Laura Lepage.

La ruta `/provisionar` es la URL inicial para usar desde DANAconnect. Recibe `danaparam`, llama la Lambda y redirige al microsite limpio que devuelve el backend.

## AWS Amplify

Configuracion de build:

- Build command: `npm run build`
- Output directory: `dist`

Variable opcional:

```bash
VITE_API_URL=https://cgqoxs2wgjcadbdm2xv7rkbevi0dqyfr.lambda-url.us-east-1.on.aws/
```

Si `VITE_API_URL` no esta configurada, las solicitudes de cotizacion y actualizacion se guardan en `localStorage` para mantener la demo funcional sin backend.

## Lambda incluida

El backend simulado esta en `lambda/index.py`. Puedes crear una Lambda en AWS con runtime Python 3.12, copiar ese codigo y exponerla con Function URL o API Gateway. El README especifico esta en `lambda/README.md`.

La Lambda soporta:

- `quote_request`
- `advisor_update`
- `pass_request`
- `landing_provision`
- `otp_request`
- `otp_verify`

Por ahora imprime el evento en logs y devuelve una respuesta exitosa. En un entorno real, ahi se podria guardar en DynamoDB, disparar una automatizacion o enviar el evento a DANAconnect.


## Flujo de activación DANAconnect

### 1. Link en correo de DANAconnect
DANAconnect envía un correo al asesor con un botón que contiene el siguiente link:

```
https://main.d1w0srn8uz6n.amplifyapp.com/activar?danaparam=$f{dana}
```

Cuando el asesor hace click, DANAconnect reemplaza `$f{dana}` por un identificador interno real (danaparam), que es el identificador usado para la Data Retrieval API.

### 2. Variable de entorno necesaria
La aplicación necesita la siguiente variable de entorno configurada en AWS Amplify:

```
VITE_API_URL=https://URL-DE-LAMBDA-FUNCTION-URL
```

### 3. Flujo de la ruta `/activar`

1. **Lectura del parámetro**: La ruta `/activar` lee el query parameter `danaparam` de la URL.
2. **Validación**: Si no existe `danaparam`, muestra una pantalla de error amigable.
3. **Consulta a Lambda**: Si existe `danaparam`, muestra un estado de carga y llama a la Lambda mediante:
   ```
   GET ${VITE_API_URL}?danaparam=${encodeURIComponent(danaparam)}
   ```
4. **Respuesta de Lambda**: La Lambda debe responder con un JSON que contiene:
   - `ok`: true/false
   - `message`: Mensaje descriptivo
   - `advisorId`: ID real del asesor
   - `micrositeUrl`: URL completa del microsite del asesor
   - `advisor`: Objeto con datos del asesor (nombre, email, teléfono, etc.)
5. **Landing de activación**: Si la respuesta es exitosa, muestra una landing con:
   - Card del asesor con su información
   - Botón "Ver mi microsite" (navega a `/asesor/{advisorId}`)
   - Botón "Actualizar mis datos" (navega a `/asesor/{advisorId}/actualizar`)
   - Botón "Descargar carnet digital" (muestra mensaje informativo)
   - Bloque explicativo de funcionalidades del microsite

### 4. Notas importantes

- **Seguridad**: La app frontend solo conoce `VITE_API_URL`. Las credenciales de DANAconnect (`DANA_CLIENT_ID`, `DANA_CLIENT_SECRET`) deben estar solo en la Lambda.
- **Identificadores**: El `danaparam` NO es el AdvisorId, NO es cédula, NO es código del asesor. Es el identificador interno que usa DANAconnect.
- **URL de correo**: Usar formato `/activar?danaparam=$f{dana}` sin slash antes del query.
- **Rutas existentes**: Las rutas existentes (`/asesor/:advisorId`, `/asesor/:advisorId/actualizar`) continúan funcionando normalmente.

### 5. Ejemplo de uso

Al entrar a:
```
https://main.d1w0srn8uz6n.amplifyapp.com/activar?danaparam=abc123
```

La app mostrará:
1. Estado de carga mientras consulta a la Lambda
2. Landing de activación con los datos del asesor
3. Acciones para ver el microsite y actualizar datos