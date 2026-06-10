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

- `/asesor/laura-lepage`
- `/asesor/carlos-mendoza`
- `/asesor/valentina-rojas`
- `/asesor/laura-lepage/actualizar`

Si el `advisorId` no existe, la app muestra los datos demo de Laura Lepage.

## AWS Amplify

Configuracion de build:

- Build command: `npm run build`
- Output directory: `dist`

Variable opcional:

```bash
VITE_API_URL=https://xxxxx.lambda-url.region.on.aws/
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
